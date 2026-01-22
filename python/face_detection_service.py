"""
AI Face Detection Service for Evalon Exam Proctoring
This service provides AI-based face detection capabilities for pre-exam webcam checks.

REFACTORED VERSION - Fixes for:
1. Multi-face false positives (temporal tracking, IoU merging, face ID assignment)
2. Classification instability (sliding window, majority voting)
3. Credibility score bugs (EMA smoothing, clamping, proper reset)
4. Loopback/accumulation bugs (state management, frame deduplication)

Key Architecture:
- FaceTracker: Temporal face tracking with ID assignment
- ClassificationSmoother: Sliding window + majority voting
- CredibilityScoreManager: EMA-based scoring with clamping
- Clear separation between detection, tracking, classification, scoring

Author: AI/ML Engineering Team
"""

import cv2
import numpy as np
import base64
import os
import time
import hashlib
from typing import Dict, List, Tuple, Optional
from collections import deque
from dataclasses import dataclass, field
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import logging
import jwt
import threading

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import TensorFlow for behavior classification
try:
    from tensorflow.keras.models import load_model
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    logger.warning("TensorFlow not available - behavior classification will be disabled")

# Try to import MediaPipe for accurate face detection
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
    logger.info("MediaPipe available - will use for accurate face detection")
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    logger.warning("MediaPipe not available - will use Haar Cascade (less accurate)")

# Initialize Flask app
app = Flask(__name__)

# SECURITY: Configure CORS with explicit origins from environment
allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(',')
CORS(app, 
     origins=allowed_origins, 
     supports_credentials=True,
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])


# =============================================================================
# CONSTANTS - BATCH-BASED FRAME PROCESSING SYSTEM
# =============================================================================

# Face Detection Parameters (raw detection)
FACE_DETECTION_CONFIDENCE = 0.60  # Minimum confidence for face detection
FACE_MIN_SIZE = (50, 50)  # Minimum face size in pixels
FACE_MAX_RATIO = 0.8  # Maximum face size as ratio of frame

# Face Tracking Parameters (for raw per-frame tracking)
IOU_THRESHOLD_MERGE = 0.5  # IoU threshold for merging duplicate boxes (NMS)
IOU_THRESHOLD_TRACK = 0.4  # IoU threshold for tracking faces across frames
IOU_THRESHOLD_DUPLICATE_TRACK = 0.5  # IoU threshold for duplicate track suppression
FACE_PERSISTENCE_FRAMES = 3  # Frames a face must persist to be counted
FACE_DISAPPEAR_FRAMES = 2  # Frames before track is pruned
FACE_CONFIDENCE_TRACK_THRESHOLD = 0.60  # Confidence required for tracking

# =============================================================================
# TASK 1: FRAME BATCH COLLECTION
# =============================================================================
BATCH_MAX_FRAMES = 25  # Max frames per batch (20-30 range)
BATCH_MAX_DURATION_SECONDS = 2.5  # Max duration per batch (2-3 seconds)
BATCH_MIN_FRAMES = 10  # Minimum frames before processing batch

# =============================================================================
# TASK 2: BATCH ANALYSIS THRESHOLDS
# =============================================================================
FACE_COUNT_MIN_DOMINANCE = 0.30  # Ignore face counts appearing in < 30% of batch
MULTI_FACE_BATCH_THRESHOLD = 0.70  # Multi-face confirmed if >= 70% of batch
NO_FACE_BATCH_THRESHOLD = 0.60  # No-face confirmed if >= 60% of batch

# =============================================================================
# TASK 3: BATCH-BASED CLASSIFICATION
# =============================================================================
CLASSIFICATION_DOMINANCE_THRESHOLD = 0.65  # Classification must dominate >= 65% to escalate

# =============================================================================
# TASK 4: BATCH-DRIVEN CREDIBILITY SCORING
# =============================================================================
CREDIBILITY_INITIAL = 95.0  # Start at 95
CREDIBILITY_MIN = 0.0
CREDIBILITY_MAX = 100.0
CREDIBILITY_NORMAL_BATCH_INCREMENT = 0.5  # +0.5 per normal batch
CREDIBILITY_SUSPICIOUS_BATCH_DECREMENT = 1.0  # -1.0 per suspicious batch
CREDIBILITY_VERY_SUSPICIOUS_BATCH_DECREMENT = 2.0  # -2.0 per very suspicious batch
CREDIBILITY_MAX_DELTA_PER_BATCH = 3.0  # Cap change per batch

# =============================================================================
# TASK 5: STATE INERTIA
# =============================================================================
STATE_CHANGE_REQUIRED_BATCHES = 2  # Require 2 consecutive batches to change state

# Legacy constants (still used by some classes)
CLASSIFICATION_WINDOW_SIZE = 5
NORMAL_TO_SUSPICIOUS_THRESHOLD = 4
SUSPICIOUS_TO_VERY_THRESHOLD = 5
NORMAL_RECOVERY_FRAMES = 2
CREDIBILITY_NORMAL_RATE = 0.2
CREDIBILITY_SUSPICIOUS_RATE = -0.5
CREDIBILITY_VERY_SUSPICIOUS_RATE = -1.2
CREDIBILITY_TEMPORAL_GATE_SECONDS = 2.0
CREDIBILITY_MAX_DELTA_PER_SECOND = 2.0

# Debug logging
DEBUG_BATCH_PROCESSING = True  # Enable batch processing debug logs


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class TrackedFace:
    """
    Represents a face being tracked across frames.
    
    TASK 1B: Track aging & pruning
    - age: number of frames this track has existed
    - last_seen_frame: frame number when last matched
    - A track is ACTIVE only if: age >= PERSISTENCE_FRAMES AND last_seen recently
    """
    id: int
    bbox: Tuple[int, int, int, int]  # (x, y, w, h)
    confidence: float
    first_seen_frame: int
    last_seen_frame: int
    seen_count: int = 1
    center_history: List[Tuple[float, float]] = field(default_factory=list)
    first_seen_time: float = field(default_factory=time.time)  # Timestamp when first seen
    last_seen_time: float = field(default_factory=time.time)  # Timestamp when last seen
    
    @property
    def age(self) -> int:
        """Age of track in frames (how many frames since first seen)"""
        return self.last_seen_frame - self.first_seen_frame + 1
    
    def update(self, bbox: Tuple[int, int, int, int], confidence: float, frame_num: int):
        """Update face with new detection"""
        self.bbox = bbox
        self.confidence = confidence
        self.last_seen_frame = frame_num
        self.last_seen_time = time.time()
        self.seen_count += 1
        center = (bbox[0] + bbox[2] / 2, bbox[1] + bbox[3] / 2)
        self.center_history.append(center)
        # Keep only last 10 centers for movement analysis
        if len(self.center_history) > 10:
            self.center_history.pop(0)
    
    def is_active(self, current_frame: int) -> bool:
        """
        TASK 1C: A track is ACTIVE only if:
        - age >= FACE_PERSISTENCE_FRAMES (has existed long enough)
        - last_seen_frame >= current_frame - 1 (was seen recently, within 1 frame)
        """
        return (self.age >= FACE_PERSISTENCE_FRAMES and 
                current_frame - self.last_seen_frame <= 1)
    
    def is_stable(self, min_frames: int = FACE_PERSISTENCE_FRAMES) -> bool:
        """Check if face has been stable for minimum frames (legacy compatibility)"""
        return self.seen_count >= min_frames
    
    def movement_magnitude(self) -> float:
        """Calculate recent movement magnitude (for jitter detection)"""
        if len(self.center_history) < 2:
            return 0.0
        recent = self.center_history[-5:] if len(self.center_history) >= 5 else self.center_history
        if len(recent) < 2:
            return 0.0
        total_movement = 0.0
        for i in range(1, len(recent)):
            dx = recent[i][0] - recent[i-1][0]
            dy = recent[i][1] - recent[i-1][1]
            total_movement += (dx*dx + dy*dy) ** 0.5
        return total_movement / len(recent)


# =============================================================================
# BATCH-BASED FRAME PROCESSING SYSTEM
# =============================================================================

@dataclass
class FrameSample:
    """Single frame sample for batch collection"""
    timestamp: float
    face_count: int
    face_confidences: List[float]
    classification: str
    classification_confidence: float
    probabilities: Dict[str, float]
    phone_detected: bool
    frame_hash: str


@dataclass
class BatchAnalysisResult:
    """Result of analyzing a complete batch"""
    # Face count analysis
    dominant_face_count: int
    face_count_histogram: Dict[int, float]
    face_count_dominance_pct: float
    multi_face_confirmed: bool
    no_face_confirmed: bool
    
    # Classification analysis
    dominant_classification: str
    classification_histogram: Dict[str, float]
    classification_dominance_pct: float
    
    # Metadata
    total_frames: int
    batch_duration: float
    decision_reason: str


class BatchFrameProcessor:
    """
    BATCH-BASED FRAME PROCESSING
    
    TASK 1: Collect frames for 2-3 seconds OR 20-30 frames
    TASK 2: Analyze batch for face count, classification, and violations
    TASK 3: Make ONE decision per batch
    TASK 4: Update credibility ONCE per batch
    TASK 5: State inertia - require 2 consecutive batches to change state
    TASK 6: Clear buffer after processing, no frame reuse
    """
    
    def __init__(self):
        self.buffer: List[FrameSample] = []
        self.batch_start_time: Optional[float] = None
        self.last_batch_result: Optional[BatchAnalysisResult] = None
        
        # TASK 5: State inertia
        self.confirmed_state = 'normal'  # Last confirmed state
        self.pending_state = 'normal'  # State waiting for confirmation
        self.consecutive_state_batches = 0  # Batches agreeing on pending state
        
        # Credibility (TASK 4)
        self.credibility_score = CREDIBILITY_INITIAL
        
        self.lock = threading.Lock()
        self.batch_count = 0
        
        logger.info(f"BatchFrameProcessor initialized (max_frames={BATCH_MAX_FRAMES}, max_duration={BATCH_MAX_DURATION_SECONDS}s)")
    
    def reset(self):
        """Reset processor state (TASK 6: Clear buffer)"""
        with self.lock:
            self.buffer.clear()
            self.batch_start_time = None
            self.last_batch_result = None
            self.confirmed_state = 'normal'
            self.pending_state = 'normal'
            self.consecutive_state_batches = 0
            self.credibility_score = CREDIBILITY_INITIAL
            self.batch_count = 0
            logger.info("BatchFrameProcessor reset - all state cleared")
    
    def add_frame(self, sample: FrameSample) -> Optional[BatchAnalysisResult]:
        """
        TASK 1: Add frame to buffer and check if batch is ready.
        
        Returns BatchAnalysisResult if batch was processed, None otherwise.
        """
        with self.lock:
            # Initialize batch start time if needed
            if self.batch_start_time is None:
                self.batch_start_time = sample.timestamp
            
            # Add sample to buffer
            self.buffer.append(sample)
            
            # Check if batch is ready for processing
            batch_duration = sample.timestamp - self.batch_start_time
            batch_ready = (
                len(self.buffer) >= BATCH_MAX_FRAMES or
                batch_duration >= BATCH_MAX_DURATION_SECONDS
            )
            
            if batch_ready and len(self.buffer) >= BATCH_MIN_FRAMES:
                # Process batch and return result
                result = self._process_batch()
                return result
            
            return None
    
    def _process_batch(self) -> BatchAnalysisResult:
        """
        TASK 2 & 3: Analyze collected batch and make decisions.
        Called when batch is full. Returns analysis result.
        """
        self.batch_count += 1
        total_frames = len(self.buffer)
        batch_duration = self.buffer[-1].timestamp - self.buffer[0].timestamp if len(self.buffer) > 1 else 0
        
        # =====================================================================
        # TASK 2A: Face Count Analysis - Compute frequency distribution
        # =====================================================================
        face_count_freq: Dict[int, int] = {}
        for sample in self.buffer:
            count = sample.face_count
            face_count_freq[count] = face_count_freq.get(count, 0) + 1
        
        face_count_histogram = {k: v / total_frames for k, v in face_count_freq.items()}
        
        # Find dominant face count (MODE)
        # Ignore counts appearing in < 30% of batch
        valid_counts = {k: v for k, v in face_count_histogram.items() 
                       if v >= FACE_COUNT_MIN_DOMINANCE}
        
        if valid_counts:
            dominant_face_count = max(valid_counts, key=valid_counts.get)
            face_count_dominance = valid_counts[dominant_face_count]
        else:
            # No count has enough dominance, default to 1 (normal)
            dominant_face_count = 1
            face_count_dominance = 0.0
        
        # =====================================================================
        # TASK 2B: Multi-Face Confirmation
        # Confirm ONLY IF face_count >= 2 appears in >= 70% of batch
        # =====================================================================
        multi_face_pct = sum(v for k, v in face_count_histogram.items() if k >= 2)
        multi_face_confirmed = multi_face_pct >= MULTI_FACE_BATCH_THRESHOLD
        
        # =====================================================================
        # TASK 2C: No-Face Detection
        # Confirm ONLY IF face_count == 0 appears in >= 60% of batch
        # =====================================================================
        no_face_pct = face_count_histogram.get(0, 0.0)
        no_face_confirmed = no_face_pct >= NO_FACE_BATCH_THRESHOLD
        
        # =====================================================================
        # TASK 3: Classification Analysis - Majority voting
        # =====================================================================
        class_freq: Dict[str, int] = {'normal': 0, 'suspicious': 0, 'very_suspicious': 0}
        for sample in self.buffer:
            cls = sample.classification
            if cls in class_freq:
                class_freq[cls] += 1
        
        classification_histogram = {k: v / total_frames for k, v in class_freq.items()}
        
        # Find dominant classification
        dominant_classification = max(class_freq, key=class_freq.get)
        classification_dominance = classification_histogram[dominant_classification]
        
        # =====================================================================
        # Determine batch decision
        # =====================================================================
        decision_reason = ""
        batch_classification = 'normal'  # Default
        
        # Priority 1: Multi-face (if confirmed by batch)
        if multi_face_confirmed:
            batch_classification = 'very_suspicious'
            decision_reason = f"Multi-face BATCH-CONFIRMED ({multi_face_pct:.1%} of batch)"
        
        # Priority 2: No-face (if confirmed by batch)
        elif no_face_confirmed:
            batch_classification = 'suspicious'
            decision_reason = f"No-face BATCH-CONFIRMED ({no_face_pct:.1%} of batch)"
        
        # Priority 3: Classification majority (if dominates >= 65%)
        elif classification_dominance >= CLASSIFICATION_DOMINANCE_THRESHOLD:
            batch_classification = dominant_classification
            decision_reason = f"Classification '{dominant_classification}' dominates ({classification_dominance:.1%})"
        
        # Default: Stay normal
        else:
            batch_classification = 'normal'
            decision_reason = f"No dominant signal (face={dominant_face_count}, class={dominant_classification}@{classification_dominance:.1%})"
        
        # =====================================================================
        # TASK 5: State Inertia - Require 2 consecutive batches to change
        # =====================================================================
        if batch_classification == self.pending_state:
            self.consecutive_state_batches += 1
        else:
            self.pending_state = batch_classification
            self.consecutive_state_batches = 1
        
        # Confirm state change only after 2 consecutive batches agree
        state_changed = False
        if self.consecutive_state_batches >= STATE_CHANGE_REQUIRED_BATCHES:
            if self.confirmed_state != self.pending_state:
                old_state = self.confirmed_state
                self.confirmed_state = self.pending_state
                state_changed = True
                decision_reason += f" | STATE CHANGED: {old_state} -> {self.confirmed_state}"
        
        # =====================================================================
        # TASK 4: Update credibility ONCE per batch
        # =====================================================================
        credibility_delta = self._update_credibility(self.confirmed_state)
        
        # Build result
        result = BatchAnalysisResult(
            dominant_face_count=dominant_face_count,
            face_count_histogram=face_count_histogram,
            face_count_dominance_pct=face_count_dominance,
            multi_face_confirmed=multi_face_confirmed,
            no_face_confirmed=no_face_confirmed,
            dominant_classification=self.confirmed_state,  # Use CONFIRMED state
            classification_histogram=classification_histogram,
            classification_dominance_pct=classification_dominance,
            total_frames=total_frames,
            batch_duration=batch_duration,
            decision_reason=decision_reason
        )
        
        # =====================================================================
        # TASK 7: Debug Logging
        # =====================================================================
        if DEBUG_BATCH_PROCESSING:
            logger.info(f"")
            logger.info(f"{'='*70}")
            logger.info(f"[BATCH #{self.batch_count}] ANALYSIS COMPLETE")
            logger.info(f"{'='*70}")
            logger.info(f"  Frames: {total_frames} | Duration: {batch_duration:.2f}s")
            logger.info(f"  Face count distribution: {face_count_histogram}")
            logger.info(f"  Dominant face count: {dominant_face_count} ({face_count_dominance:.1%})")
            logger.info(f"  Multi-face confirmed: {multi_face_confirmed} ({multi_face_pct:.1%})")
            logger.info(f"  No-face confirmed: {no_face_confirmed} ({no_face_pct:.1%})")
            logger.info(f"  Classification distribution: {classification_histogram}")
            logger.info(f"  Dominant classification: {dominant_classification} ({classification_dominance:.1%})")
            logger.info(f"  Batch decision: {batch_classification}")
            logger.info(f"  Confirmed state: {self.confirmed_state} (consecutive batches: {self.consecutive_state_batches})")
            logger.info(f"  Credibility: {self.credibility_score:.1f} (Δ{credibility_delta:+.2f})")
            logger.info(f"  Reason: {decision_reason}")
            logger.info(f"{'='*70}")
        
        # =====================================================================
        # TASK 6: Clear buffer after processing
        # =====================================================================
        self.buffer.clear()
        self.batch_start_time = None
        self.last_batch_result = result
        
        return result
    
    def _update_credibility(self, classification: str) -> float:
        """
        TASK 4: Update credibility ONCE per batch.
        
        Rules:
        - Normal batch: +0.5
        - Suspicious batch: -1.0
        - Very Suspicious batch: -2.0
        - Cap change per batch to avoid sharp drops
        """
        if classification == 'normal':
            delta = CREDIBILITY_NORMAL_BATCH_INCREMENT
        elif classification == 'suspicious':
            delta = -CREDIBILITY_SUSPICIOUS_BATCH_DECREMENT
        elif classification == 'very_suspicious':
            delta = -CREDIBILITY_VERY_SUSPICIOUS_BATCH_DECREMENT
        else:
            delta = 0.0
        
        # Apply cap (TASK 4: Cap change per batch)
        delta = max(-CREDIBILITY_MAX_DELTA_PER_BATCH, 
                   min(CREDIBILITY_MAX_DELTA_PER_BATCH, delta))
        
        # Update score
        self.credibility_score += delta
        self.credibility_score = max(CREDIBILITY_MIN, 
                                    min(CREDIBILITY_MAX, self.credibility_score))
        
        return delta
    
    def get_current_state(self) -> Dict:
        """Get current processor state for API responses"""
        with self.lock:
            return {
                'confirmed_state': self.confirmed_state,
                'pending_state': self.pending_state,
                'consecutive_batches': self.consecutive_state_batches,
                'credibility_score': self.credibility_score,
                'buffer_size': len(self.buffer),
                'batch_count': self.batch_count,
                'last_batch': self.last_batch_result
            }
    
    def force_process(self) -> Optional[BatchAnalysisResult]:
        """Force process current buffer (even if not full)"""
        with self.lock:
            if len(self.buffer) >= 3:  # Need at least a few frames
                return self._process_batch()
            return None


@dataclass
class FrameAnalysisResult:
    """Result of analyzing a single frame"""
    face_count: int
    stable_face_count: int
    faces_detected: bool
    multiple_faces: bool
    multiple_faces_confirmed: bool  # True only if persisted for N frames
    bboxes: List[Tuple[int, int, int, int]]
    confidences: List[float]
    frame_hash: str
    timestamp: float


@dataclass
class ClassificationResult:
    """Result of behavior classification"""
    classification: str  # 'normal', 'suspicious', 'very_suspicious'
    confidence: float
    raw_probabilities: Dict[str, float]
    smoothed_probabilities: Dict[str, float]
    is_stable: bool  # True if classification has been stable


# =============================================================================
# SECURITY: JWT Authentication
# =============================================================================

def require_auth(f):
    """Authentication decorator that validates JWT tokens."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        jwt_secret = os.environ.get('JWT_SECRET')
        if not jwt_secret:
            logger.error('JWT_SECRET environment variable is not set')
            return jsonify({'success': False, 'error': 'Server misconfiguration'}), 500
        
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            logger.warning('Missing Authorization header')
            return jsonify({'success': False, 'error': 'Unauthorized - No token provided'}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            logger.warning('Invalid Authorization header format')
            return jsonify({'success': False, 'error': 'Unauthorized - Invalid token format'}), 401
        
        token = parts[1]
        
        try:
            decoded = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            request.user_id = decoded.get('userId')
            request.user_type = decoded.get('userType')
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Unauthorized - Token expired'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'success': False, 'error': 'Unauthorized - Invalid token'}), 401
        
        return f(*args, **kwargs)
    return decorated_function


# =============================================================================
# FACE TRACKER CLASS - Simple per-frame face tracking (BATCH handles certainty)
# =============================================================================

class FaceTracker:
    """
    Simple face tracking across frames.
    
    NOTE: This tracker provides RAW per-frame face counts.
    Certainty logic (multi-face confirmation, no-face confirmation) is now
    handled by BatchFrameProcessor, not by this class.
    """
    
    def __init__(self):
        self.tracked_faces: Dict[int, TrackedFace] = {}
        self.next_face_id = 0
        self.frame_count = 0
        self.lock = threading.Lock()
        
        logger.info("FaceTracker initialized (raw tracking - batch processor handles certainty)")
    
    def reset(self):
        """Reset tracker state"""
        with self.lock:
            self.tracked_faces.clear()
            self.next_face_id = 0
            self.frame_count = 0
            logger.info("FaceTracker reset")
    
    def _calculate_iou(self, box1: Tuple[int, int, int, int], 
                       box2: Tuple[int, int, int, int]) -> float:
        """Calculate Intersection over Union (IoU) between two bounding boxes."""
        x1, y1, w1, h1 = box1
        x2, y2, w2, h2 = box2
        
        box1_x2, box1_y2 = x1 + w1, y1 + h1
        box2_x2, box2_y2 = x2 + w2, y2 + h2
        
        inter_x1 = max(x1, x2)
        inter_y1 = max(y1, y2)
        inter_x2 = min(box1_x2, box2_x2)
        inter_y2 = min(box1_y2, box2_y2)
        
        if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
            return 0.0
        
        intersection = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
        area1 = w1 * h1
        area2 = w2 * h2
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def _merge_overlapping_boxes(self, boxes: List[Tuple[int, int, int, int]], 
                                  confidences: List[float]) -> Tuple[List[Tuple[int, int, int, int]], List[float]]:
        """
        Merge overlapping bounding boxes using Non-Maximum Suppression.
        TASK 1: Uses stricter IoU threshold (0.5) to merge duplicates
        """
        if len(boxes) <= 1:
            return boxes, confidences
        
        boxes_np = np.array(boxes)
        confs_np = np.array(confidences)
        
        # Sort by confidence (highest first)
        indices = np.argsort(-confs_np)
        keep = []
        
        while len(indices) > 0:
            current = indices[0]
            keep.append(current)
            
            if len(indices) == 1:
                break
            
            current_box = boxes_np[current]
            remaining_indices = indices[1:]
            remaining_boxes = boxes_np[remaining_indices]
            
            ious = np.array([self._calculate_iou(tuple(current_box), tuple(box)) 
                           for box in remaining_boxes])
            
            # Remove boxes with IoU >= threshold (they're duplicates)
            indices = remaining_indices[ious < IOU_THRESHOLD_MERGE]
        
        merged_boxes = [tuple(boxes_np[i]) for i in keep]
        merged_confs = [confs_np[i] for i in keep]
        
        return merged_boxes, merged_confs
    
    def _suppress_duplicate_tracks(self):
        """
        TASK 1D: Duplicate Track Suppression
        If two tracks overlap with IoU > 0.5, keep the OLDER track, remove newer
        """
        if len(self.tracked_faces) <= 1:
            return
        
        face_ids = list(self.tracked_faces.keys())
        to_remove = set()
        
        for i in range(len(face_ids)):
            if face_ids[i] in to_remove:
                continue
            face_i = self.tracked_faces[face_ids[i]]
            
            for j in range(i + 1, len(face_ids)):
                if face_ids[j] in to_remove:
                    continue
                face_j = self.tracked_faces[face_ids[j]]
                
                iou = self._calculate_iou(face_i.bbox, face_j.bbox)
                if iou > IOU_THRESHOLD_DUPLICATE_TRACK:
                    # Keep older track (lower first_seen_frame), remove newer
                    if face_i.first_seen_frame <= face_j.first_seen_frame:
                        to_remove.add(face_ids[j])
                        if DEBUG_FACE_TRACKING:
                            logger.debug(f"  [DUPLICATE] Removing track {face_ids[j]} (newer), keeping {face_ids[i]} (IoU={iou:.2f})")
                    else:
                        to_remove.add(face_ids[i])
                        if DEBUG_FACE_TRACKING:
                            logger.debug(f"  [DUPLICATE] Removing track {face_ids[i]} (newer), keeping {face_ids[j]} (IoU={iou:.2f})")
                        break  # face_i is removed, stop checking it
        
        for face_id in to_remove:
            del self.tracked_faces[face_id]
    
    def _match_faces(self, new_boxes: List[Tuple[int, int, int, int]], 
                     new_confidences: List[float]) -> Dict[int, int]:
        """Match new detections to existing tracked faces using IoU."""
        matches = {}
        used_face_ids = set()
        
        for i, (new_box, conf) in enumerate(zip(new_boxes, new_confidences)):
            # TASK 1A: Skip low-confidence detections for matching
            if conf < FACE_CONFIDENCE_TRACK_THRESHOLD:
                continue
                
            best_iou = 0
            best_face_id = None
            
            for face_id, tracked in self.tracked_faces.items():
                if face_id in used_face_ids:
                    continue
                    
                iou = self._calculate_iou(new_box, tracked.bbox)
                if iou > best_iou and iou >= IOU_THRESHOLD_TRACK:
                    best_iou = iou
                    best_face_id = face_id
            
            if best_face_id is not None:
                matches[i] = best_face_id
                used_face_ids.add(best_face_id)
        
        return matches
    
    def update(self, boxes: List[Tuple[int, int, int, int]], 
               confidences: List[float]) -> Tuple[List[TrackedFace], int, List[float]]:
        """
        Update tracker with new frame detections.
        
        Returns: (active_faces, face_count, face_confidences)
        
        NOTE: This returns RAW frame-based counts.
        BatchFrameProcessor handles certainty logic.
        """
        with self.lock:
            self.frame_count += 1
            current_time = time.time()
            
            # Confidence Gating - Filter out low-confidence detections
            high_conf_boxes = []
            high_conf_confs = []
            for box, conf in zip(boxes, confidences):
                if conf >= FACE_DETECTION_CONFIDENCE:
                    high_conf_boxes.append(box)
                    high_conf_confs.append(conf)
            
            # Merge overlapping boxes (NMS)
            merged_boxes, merged_confs = self._merge_overlapping_boxes(high_conf_boxes, high_conf_confs)
            
            # Match new detections to existing tracked faces
            matches = self._match_faces(merged_boxes, merged_confs)
            
            # Update matched faces
            for box_idx, face_id in matches.items():
                self.tracked_faces[face_id].update(
                    merged_boxes[box_idx],
                    merged_confs[box_idx],
                    self.frame_count
                )
            
            # Create new tracked faces for unmatched detections
            for i, (box, conf) in enumerate(zip(merged_boxes, merged_confs)):
                if i not in matches:
                    new_face = TrackedFace(
                        id=self.next_face_id,
                        bbox=box,
                        confidence=conf,
                        first_seen_frame=self.frame_count,
                        last_seen_frame=self.frame_count,
                        center_history=[(box[0] + box[2]/2, box[1] + box[3]/2)],
                        first_seen_time=current_time,
                        last_seen_time=current_time
                    )
                    self.tracked_faces[self.next_face_id] = new_face
                    self.next_face_id += 1
            
            # Prune stale tracks
            stale_ids = [
                face_id for face_id, face in self.tracked_faces.items()
                if self.frame_count - face.last_seen_frame > FACE_DISAPPEAR_FRAMES
            ]
            for face_id in stale_ids:
                del self.tracked_faces[face_id]
            
            # Suppress duplicate tracks
            self._suppress_duplicate_tracks()
            
            # Count ACTIVE faces (RAW count - batch handles certainty)
            active_faces = [f for f in self.tracked_faces.values() if f.is_active(self.frame_count)]
            face_count = len(active_faces)
            face_confidences = [f.confidence for f in active_faces]
            
            return active_faces, face_count, face_confidences


# =============================================================================
# CLASSIFICATION SMOOTHER - Prevents rapid classification jumping
# =============================================================================

class ClassificationSmoother:
    """
    Smooths classification results using sliding window and majority voting.
    
    TASK 3: Normal Behavior Strengthening
    A. Normal Gravity - Bias toward normal when single stable face
    B. Faster Recovery - 2 frames to recover vs 4 to escalate
    D. Weak Signal Suppression - Single-frame anomalies ignored
    """
    
    def __init__(self, window_size: int = CLASSIFICATION_WINDOW_SIZE):
        self.window_size = window_size
        self.history: deque = deque(maxlen=window_size)
        self.current_classification = 'normal'
        self.current_confidence = 1.0
        self.frames_in_current_state = 0
        self.lock = threading.Lock()
        
        logger.info(f"ClassificationSmoother initialized (Normal gravity enabled, fast recovery={NORMAL_RECOVERY_FRAMES} frames)")
    
    def reset(self):
        """Reset smoother state"""
        with self.lock:
            self.history.clear()
            self.current_classification = 'normal'
            self.current_confidence = 1.0
            self.frames_in_current_state = 0
            logger.info("ClassificationSmoother reset")
    
    def smooth(self, raw_classification: str, raw_confidence: float,
               probabilities: Dict[str, float],
               has_single_stable_face: bool = False,
               no_violations: bool = True) -> ClassificationResult:
        """
        Apply smoothing to raw classification result.
        
        TASK 3A: Normal Gravity
        - If single stable face + no violations, bias toward normal
        
        TASK 3B: Faster Recovery (2 frames) vs Slower Escalation (4 frames)
        
        TASK 3D: Weak Signal Suppression
        - Single-frame anomalies are ignored (require sustained signals)
        """
        with self.lock:
            # TASK 3A: Normal Gravity - Force bias toward normal if conditions met
            adjusted_classification = raw_classification
            adjusted_probs = probabilities.copy()
            
            if has_single_stable_face and no_violations:
                # Single stable face + no violations = Strong normal bias
                # Even if model says suspicious, bias toward normal
                if raw_classification in ['suspicious'] and raw_confidence < 0.8:
                    adjusted_classification = 'normal'
                    # Boost normal probability
                    adjusted_probs['normal'] = max(adjusted_probs.get('normal', 0.5), 0.7)
                    adjusted_probs['suspicious'] = min(adjusted_probs.get('suspicious', 0.3), 0.2)
                    adjusted_probs['very_suspicious'] = min(adjusted_probs.get('very_suspicious', 0.1), 0.1)
                    if DEBUG_FACE_TRACKING:
                        logger.debug(f"  [NORMAL GRAVITY] Single stable face, biasing toward normal")
            
            # Add to history
            self.history.append({
                'classification': adjusted_classification,
                'confidence': raw_confidence,
                'probabilities': adjusted_probs
            })
            
            if len(self.history) < 2:
                # TASK 3D: Not enough history = default to normal (weak signal suppression)
                return ClassificationResult(
                    classification='normal',
                    confidence=0.8,
                    raw_probabilities=probabilities,
                    smoothed_probabilities=adjusted_probs,
                    is_stable=False
                )
            
            # Count classifications in window
            counts = {'normal': 0, 'suspicious': 0, 'very_suspicious': 0}
            for item in self.history:
                counts[item['classification']] += 1
            
            # Calculate smoothed probabilities
            smoothed_probs = {'normal': 0.0, 'suspicious': 0.0, 'very_suspicious': 0.0}
            for item in self.history:
                for key in smoothed_probs:
                    smoothed_probs[key] += item['probabilities'].get(key, 0.0)
            for key in smoothed_probs:
                smoothed_probs[key] /= len(self.history)
            
            majority_class = max(counts, key=counts.get)
            majority_count = counts[majority_class]
            
            # Apply hysteresis with ASYMMETRIC thresholds (TASK 3B)
            # Escalation requires MORE frames, recovery requires FEWER
            new_classification = self.current_classification
            classification_reason = ""
            
            if majority_class != self.current_classification:
                # Escalation: normal -> suspicious (requires 4 frames)
                if (self.current_classification == 'normal' and 
                    majority_class in ['suspicious', 'very_suspicious']):
                    suspicious_count = counts['suspicious'] + counts['very_suspicious']
                    if suspicious_count >= NORMAL_TO_SUSPICIOUS_THRESHOLD:
                        new_classification = 'suspicious'
                        classification_reason = f"Escalated: normal->suspicious (count={suspicious_count}>={NORMAL_TO_SUSPICIOUS_THRESHOLD})"
                    else:
                        classification_reason = f"Staying normal (suspicious count {suspicious_count} < {NORMAL_TO_SUSPICIOUS_THRESHOLD})"
                
                # Escalation: suspicious -> very_suspicious (requires 5 frames)
                elif (self.current_classification == 'suspicious' and 
                      majority_class == 'very_suspicious'):
                    if counts['very_suspicious'] >= SUSPICIOUS_TO_VERY_THRESHOLD:
                        new_classification = 'very_suspicious'
                        classification_reason = f"Escalated: suspicious->very_suspicious (count={counts['very_suspicious']})"
                
                # De-escalation: very_suspicious -> suspicious (only 2 frames needed!)
                elif (self.current_classification == 'very_suspicious' and
                      majority_class in ['normal', 'suspicious']):
                    normal_count = counts['normal']
                    if normal_count >= NORMAL_RECOVERY_FRAMES:
                        new_classification = 'suspicious'
                        classification_reason = f"De-escalated: very_suspicious->suspicious (normal={normal_count}>={NORMAL_RECOVERY_FRAMES})"
                
                # De-escalation: suspicious -> normal (only 2 frames needed!)
                elif (self.current_classification == 'suspicious' and
                      majority_class == 'normal'):
                    if counts['normal'] >= NORMAL_RECOVERY_FRAMES:
                        new_classification = 'normal'
                        classification_reason = f"Recovered: suspicious->normal (count={counts['normal']}>={NORMAL_RECOVERY_FRAMES})"
            
            # Update state
            if new_classification != self.current_classification:
                if classification_reason:
                    logger.info(f"[CLASSIFICATION] {classification_reason}")
                self.current_classification = new_classification
                self.frames_in_current_state = 0
            else:
                self.frames_in_current_state += 1
            
            # Calculate confidence
            agreement_ratio = majority_count / len(self.history)
            smoothed_confidence = smoothed_probs[new_classification] * agreement_ratio
            self.current_confidence = smoothed_confidence
            
            # TASK 4: Debug logging
            if DEBUG_FACE_TRACKING:
                logger.debug(f"  [SMOOTH] Raw: {raw_classification}, Adjusted: {adjusted_classification}, "
                           f"Final: {new_classification}, Counts: {counts}, Frames in state: {self.frames_in_current_state}")
            
            return ClassificationResult(
                classification=new_classification,
                confidence=smoothed_confidence,
                raw_probabilities=probabilities,
                smoothed_probabilities=smoothed_probs,
                is_stable=self.frames_in_current_state >= 3
            )


# =============================================================================
# TASK 3: CREDIBILITY SCORE — TRUST MODEL (Per-second, not per-frame)
# =============================================================================

class CredibilityScoreManager:
    """
    TASK 3: Credibility as TRUST-IN-TIME
    
    Rules:
    A. Score Range: 0-100, start at 95
    B. Update Rate: per SECOND, not per frame
       - Normal: +0.2/sec (cap 100)
       - Suspicious: -0.5/sec
       - Very Suspicious: -1.2/sec
    C. Temporal Gate: State must persist >= 2 seconds before affecting score
    D. Inertia Rule: Score cannot change more than ±2 points per second
    E. Recovery Bias: Recovery rate > decay rate for short violations
    """
    
    def __init__(self):
        self.score = CREDIBILITY_INITIAL  # Start at 95
        self.last_update_time = time.time()
        self.current_state = 'normal'
        self.state_start_time = time.time()
        self.last_score_change_time = time.time()
        self.history: deque = deque(maxlen=100)
        self.frozen = False  # TASK 4: Freeze during normal gravity override
        self.lock = threading.Lock()
        
        logger.info(f"CredibilityScoreManager initialized (TRUST MODEL, start={CREDIBILITY_INITIAL}, temporal_gate={CREDIBILITY_TEMPORAL_GATE_SECONDS}s)")
    
    def reset(self):
        """Reset score to initial value"""
        with self.lock:
            self.score = CREDIBILITY_INITIAL
            self.last_update_time = time.time()
            self.current_state = 'normal'
            self.state_start_time = time.time()
            self.last_score_change_time = time.time()
            self.frozen = False
            self.history.clear()
            logger.info(f"CredibilityScoreManager reset to {self.score}")
    
    def freeze(self, frozen: bool = True):
        """TASK 4: Freeze credibility decay during normal gravity override"""
        self.frozen = frozen
    
    def update(self, classification: str, confidence: float, 
               multi_face_confirmed: bool = False) -> Tuple[float, float]:
        """
        TASK 3: TRUST MODEL - Per-second updates with temporal gating
        
        Rules:
        B. Update Rate (per second, not per frame)
           - Normal: +0.2/sec
           - Suspicious: -0.5/sec
           - Very Suspicious: -1.2/sec
        C. Temporal Gate: State must persist >= 2 seconds before affecting score
        D. Inertia Rule: Score cannot change more than ±2 points per second
        E. Recovery Bias: Built-in via rate differential
        """
        with self.lock:
            current_time = time.time()
            time_elapsed = current_time - self.last_update_time
            
            # TASK 4: If frozen (Normal Gravity override), no decay
            if self.frozen and classification != 'normal':
                classification = 'normal'  # Force normal during freeze
            
            # Track state changes for temporal gating
            if classification != self.current_state:
                self.current_state = classification
                self.state_start_time = current_time
            
            state_duration = current_time - self.state_start_time
            
            # TASK 3C: Temporal Gate - State must persist >= 2 seconds before affecting score
            # Exception: Normal always affects score immediately (recovery bias)
            gated = (classification != 'normal' and 
                    state_duration < CREDIBILITY_TEMPORAL_GATE_SECONDS)
            
            # Calculate raw delta based on classification
            rate = 0.0
            if classification == 'normal' and not multi_face_confirmed:
                rate = CREDIBILITY_NORMAL_RATE
            elif classification == 'suspicious':
                rate = 0.0 if gated else CREDIBILITY_SUSPICIOUS_RATE
            elif classification == 'very_suspicious' or multi_face_confirmed:
                rate = 0.0 if (gated and not multi_face_confirmed) else CREDIBILITY_VERY_SUSPICIOUS_RATE
            
            # Calculate delta based on time elapsed (per-second rate)
            raw_delta = rate * time_elapsed
            
            # Inertia Rule - Cannot change more than ±2 points per second
            max_delta = CREDIBILITY_MAX_DELTA_PER_SECOND * time_elapsed
            delta = max(-max_delta, min(max_delta, raw_delta))
            
            # Apply delta
            old_score = self.score
            self.score += delta
            self.score = max(CREDIBILITY_MIN, min(CREDIBILITY_MAX, self.score))
            
            # Record in history
            self.history.append({
                'timestamp': current_time,
                'classification': classification,
                'confidence': confidence,
                'delta': delta,
                'score': self.score,
                'state_duration': state_duration,
                'gated': gated
            })
            
            self.last_update_time = current_time
            
            # TASK 5: Debug logging
            if DEBUG_TIME_WINDOWS and abs(delta) > 0.001:
                gate_status = "GATED" if gated else "ACTIVE"
                logger.debug(f"  [CREDIBILITY] {classification}: delta={delta:+.3f}/s, score={self.score:.1f}, "
                           f"state_duration={state_duration:.1f}s, {gate_status}")
            
            return self.score, delta
    
    def get_normalized_score(self) -> float:
        """Get score normalized to 0-1 range"""
        return self.score / CREDIBILITY_MAX
    
    def get_state_duration(self) -> float:
        """Get how long current state has persisted"""
        return time.time() - self.state_start_time


# =============================================================================
# FACE DETECTOR CLASS - Raw face detection (single frame)
# =============================================================================

class FaceDetector:
    """
    Face detection using MediaPipe (ML-based).
    This class handles SINGLE FRAME detection only.
    Temporal tracking is handled by FaceTracker.
    """
    
    def __init__(self):
        self.face_cascade = None
        self.detection_method = None
        
        # Initialize MediaPipe
        if MEDIAPIPE_AVAILABLE:
            try:
                self.mp_face_detection = mp.solutions.face_detection
                self.face_detection = self.mp_face_detection.FaceDetection(
                    model_selection=1,  # Full-range model
                    min_detection_confidence=FACE_DETECTION_CONFIDENCE
                )
                self.detection_method = 'mediapipe'
                logger.info("✅ Using MediaPipe face detection")
            except Exception as e:
                logger.warning(f"MediaPipe init failed: {str(e)[:200]}")
        
        # Fallback to Haar Cascade
        if self.detection_method is None:
            try:
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                if not self.face_cascade.empty():
                    self.detection_method = 'haar'
                    logger.warning("⚠️ Using Haar Cascade (less accurate)")
            except Exception as e:
                logger.error(f"All detection methods failed: {str(e)[:200]}")
    
    def detect_faces_raw(self, frame: np.ndarray) -> Tuple[List[Tuple[int, int, int, int]], List[float]]:
        """
        Detect faces in a single frame (raw detection, no tracking).
        
        Returns:
            Tuple of (bounding_boxes, confidences)
        """
        h, w = frame.shape[:2]
        boxes = []
        confidences = []
        
        try:
            if self.detection_method == 'mediapipe':
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.face_detection.process(rgb_frame)
                
                if results.detections:
                    for detection in results.detections:
                        bbox = detection.location_data.relative_bounding_box
                        
                        # Convert to absolute coordinates
                        x = int(bbox.xmin * w)
                        y = int(bbox.ymin * h)
                        width = int(bbox.width * w)
                        height = int(bbox.height * h)
                        
                        # Validate bounds
                        x = max(0, min(x, w))
                        y = max(0, min(y, h))
                        width = min(width, w - x)
                        height = min(height, h - y)
                        
                        confidence = detection.score[0] if detection.score else 0.0
                        
                        # Filter by size
                        if (width >= FACE_MIN_SIZE[0] and 
                            height >= FACE_MIN_SIZE[1] and
                            width <= w * FACE_MAX_RATIO and
                            height <= h * FACE_MAX_RATIO):
                            
                            # Aspect ratio check (faces are roughly square)
                            aspect = width / height if height > 0 else 0
                            if 0.5 <= aspect <= 2.0:
                                boxes.append((x, y, width, height))
                                confidences.append(confidence)
            
            elif self.detection_method == 'haar':
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                detected = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=FACE_MIN_SIZE
                )
                for (x, y, w_box, h_box) in detected:
                    boxes.append((x, y, w_box, h_box))
                    confidences.append(0.7)  # Haar doesn't give confidence
            
        except Exception as e:
            logger.error(f"Detection error: {str(e)}")
        
        return boxes, confidences


# =============================================================================
# SESSION MANAGER - Handles per-session state
# =============================================================================

class SessionManager:
    """
    Manages session-specific state for BATCH-BASED proctoring.
    
    BATCH PROCESSING:
    - BatchFrameProcessor handles all certainty logic
    - FaceTracker provides raw per-frame detection
    - All decisions made per BATCH, not per frame
    """
    
    def __init__(self):
        self.sessions: Dict[str, Dict] = {}
        self.default_session_id = "default"
        self.lock = threading.Lock()
        
        # Create default session
        self._create_session(self.default_session_id)
        logger.info("SessionManager initialized (BATCH-BASED processing)")
    
    def _create_session(self, session_id: str) -> Dict:
        """Create a new session with fresh state"""
        session = {
            'face_tracker': FaceTracker(),
            'batch_processor': BatchFrameProcessor(),  # NEW: Batch-based processing
            'last_frame_hash': None,
            'frame_count': 0,
            'created_at': time.time(),
            'last_batch_result': None  # Cache last batch result for API responses
        }
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str = None) -> Dict:
        """Get session by ID, creating if necessary"""
        with self.lock:
            sid = session_id or self.default_session_id
            if sid not in self.sessions:
                return self._create_session(sid)
            return self.sessions[sid]
    
    def reset_session(self, session_id: str = None):
        """Reset session state (TASK 6: Clear all buffers)"""
        with self.lock:
            sid = session_id or self.default_session_id
            if sid in self.sessions:
                session = self.sessions[sid]
                session['face_tracker'].reset()
                session['batch_processor'].reset()
                session['last_frame_hash'] = None
                session['frame_count'] = 0
                session['last_batch_result'] = None
                logger.info(f"Session {sid} reset - all state cleared")
    
    def is_duplicate_frame(self, session_id: str, frame: np.ndarray) -> bool:
        """
        Check if frame is duplicate of last processed frame.
        
        FIX: Prevents processing same frame multiple times (loopback bug)
        """
        session = self.get_session(session_id)
        
        # Compute frame hash (fast, uses downsampled version)
        small = cv2.resize(frame, (64, 64))
        frame_hash = hashlib.md5(small.tobytes()).hexdigest()
        
        if session['last_frame_hash'] == frame_hash:
            return True
        
        session['last_frame_hash'] = frame_hash
        session['frame_count'] += 1
        return False


# =============================================================================
# INITIALIZE GLOBAL COMPONENTS
# =============================================================================

detector = FaceDetector()
session_manager = SessionManager()

# Load behavior model
behavior_model = None
if TENSORFLOW_AVAILABLE:
    try:
        model_path = os.path.join(os.path.dirname(__file__), 'suspicious_activity_model.h5')
        if os.path.exists(model_path):
            try:
                import tensorflow as tf
                from tensorflow.keras.layers import InputLayer
                
                class CompatibleInputLayer(InputLayer):
                    def __init__(self, *args, **kwargs):
                        if 'batch_shape' in kwargs:
                            batch_shape = kwargs.pop('batch_shape')
                            if batch_shape and len(batch_shape) > 1:
                                kwargs['input_shape'] = batch_shape[1:]
                        super().__init__(*args, **kwargs)
                
                class CompatibleDTypePolicy(tf.keras.mixed_precision.Policy):
                    def __init__(self, name='float32'):
                        super().__init__(name)
                
                custom_objects = {
                    'InputLayer': CompatibleInputLayer,
                    'DTypePolicy': CompatibleDTypePolicy,
                    'Policy': CompatibleDTypePolicy,
                }
                
                behavior_model = load_model(model_path, custom_objects=custom_objects, compile=False)
                behavior_model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
                logger.info("✅ Loaded behavior classification model")
            except Exception as e:
                logger.warning(f"Model loading failed: {str(e)[:200]}")
    except Exception as e:
        logger.warning(f"TensorFlow available but model loading failed: {str(e)[:200]}")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def decode_base64_image(image_str: str) -> Optional[np.ndarray]:
    """Decode base64 encoded image"""
    try:
        if ',' in image_str:
            image_str = image_str.split(',')[1]
        image_bytes = base64.b64decode(image_str)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        logger.error(f"Error decoding image: {str(e)}")
        return None


def estimate_head_pose(face_bbox: Tuple[int, int, int, int], 
                       frame: np.ndarray) -> str:
    """Estimate head pose based on face position"""
    try:
        h, w = frame.shape[:2]
        fx, fy, fw, fh = face_bbox
        face_center_x = fx + fw // 2
        face_center_y = fy + fh // 2
        
        frame_center_x = w // 2
        frame_center_y = h // 2
        
        threshold_x = w * 0.15
        threshold_y = h * 0.15
        
        offset_x = face_center_x - frame_center_x
        offset_y = face_center_y - frame_center_y
        
        if abs(offset_x) < threshold_x and abs(offset_y) < threshold_y:
            return 'center'
        elif abs(offset_x) > abs(offset_y):
            return 'left' if offset_x < -threshold_x else ('right' if offset_x > threshold_x else 'center')
        else:
            return 'up' if offset_y < -threshold_y else ('down' if offset_y > threshold_y else 'center')
    except:
        return 'unknown'


def detect_phone_usage(frame: np.ndarray, face_bbox: Tuple[int, int, int, int]) -> float:
    """Simple phone detection based on edge density near face"""
    try:
        h, w = frame.shape[:2]
        fx, fy, fw, fh = face_bbox
        
        face_region = frame[max(0, fy-50):min(h, fy+fh+50), max(0, fx-50):min(w, fx+fw+50)]
        if face_region.size == 0:
            return 0.0
        
        gray_region = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray_region, 50, 150)
        edge_density = np.sum(edges > 0) / (gray_region.shape[0] * gray_region.shape[1]) if gray_region.size > 0 else 0
        
        return min(edge_density * 2, 1.0)
    except:
        return 0.0


def classify_behavior_raw(frame: np.ndarray) -> Tuple[str, float, Dict[str, float]]:
    """
    Raw behavior classification from CNN model.
    Returns (classification, confidence, probabilities)
    """
    if behavior_model is None:
        return 'normal', 0.5, {'normal': 0.7, 'suspicious': 0.2, 'very_suspicious': 0.1}
    
    try:
        resized = cv2.resize(frame, (224, 224))
        rgb_frame = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        normalized = rgb_frame.astype(np.float32) / 255.0
        input_array = np.expand_dims(normalized, axis=0)
        
        predictions = behavior_model.predict(input_array, verbose=0)
        class_names = ['normal', 'suspicious', 'very_suspicious']
        
        probabilities = {
                    class_names[i]: float(predictions[0][i])
                    for i in range(len(class_names))
        }
        
        # Adjust for model bias (model over-predicts very_suspicious)
        adjusted_normal = probabilities['normal'] + probabilities['very_suspicious'] * 0.35
        adjusted_suspicious = probabilities['suspicious'] + probabilities['very_suspicious'] * 0.25
        adjusted_very_suspicious = probabilities['very_suspicious'] * 0.40
        
        total = adjusted_normal + adjusted_suspicious + adjusted_very_suspicious
        probabilities = {
                    'normal': adjusted_normal / total,
                    'suspicious': adjusted_suspicious / total,
                    'very_suspicious': adjusted_very_suspicious / total
        }
        
        predicted_class = max(probabilities, key=probabilities.get)
        confidence = probabilities[predicted_class]
        
        return predicted_class, confidence, probabilities
        
    except Exception as e:
        logger.warning(f"Classification error: {str(e)[:200]}")
        return 'normal', 0.5, {'normal': 0.7, 'suspicious': 0.2, 'very_suspicious': 0.1}


# =============================================================================
# MAIN PROCESSING FUNCTION
# =============================================================================

def process_comprehensive_proctoring(frame: np.ndarray, 
                                     no_face_duration_from_frontend: int,
                                     is_idle: bool, 
                                     audio_level: float,
                                     session_id: str = None) -> Dict:
    """
    BATCH-BASED COMPREHENSIVE PROCTORING
    
    TASK 1: Collect frames into batch (2-3 sec or 20-30 frames)
    TASK 2: Analyze batch for face count, no-face, classification
    TASK 3: Make ONE decision per batch using majority voting
    TASK 4: Update credibility ONCE per batch
    TASK 5: State inertia - require 2 consecutive batches to change
    TASK 6: Clear buffer after processing, no frame reuse
    TASK 7: Debug logging per batch
    
    NO PER-FRAME DECISIONS. Batch certainty > frame certainty.
    """
    session = session_manager.get_session(session_id)
    face_tracker = session['face_tracker']
    batch_processor = session['batch_processor']
    
    # Check for duplicate frame (loopback bug prevention)
    if session_manager.is_duplicate_frame(session_id, frame):
        # Return last batch result if available
        state = batch_processor.get_current_state()
        return {
            'success': True,
            'classification': state['confirmed_state'],
            'confidence': 0.9,
            'face_detection': {
                'face_count': 1,
                'faces_detected': True,
                'multiple_faces': False,
                'multiple_faces_confirmed': False,
                'no_face_duration': 0.0,
                'no_face_confirmed': False
            },
            'credibility_score': float(round(state['credibility_score'], 1)),
            'message': 'Duplicate frame skipped',
            'batch_pending': True
        }
    
    # =========================================================================
    # STEP 1: RAW FRAME ANALYSIS (per-frame, NO decisions)
    # =========================================================================
    current_time = time.time()
    frame_hash = hashlib.md5(frame.tobytes()[:1000]).hexdigest()[:16]
    
    # Face detection (raw, per-frame)
    boxes, confidences = detector.detect_faces_raw(frame)
    active_faces, face_count, face_confidences = face_tracker.update(boxes, confidences)
    
    # Behavior classification (raw, per-frame)
    raw_classification, raw_confidence, raw_probs = classify_behavior_raw(frame)
    
    # Phone detection (raw, per-frame)
    phone_detected = False
    if face_count > 0 and len(active_faces) > 0:
        phone_prob = detect_phone_usage(frame, active_faces[0].bbox)
        phone_detected = phone_prob > 0.5
    
    # =========================================================================
    # STEP 2: ADD FRAME TO BATCH (TASK 1: Frame Collection)
    # =========================================================================
    frame_sample = FrameSample(
        timestamp=current_time,
        face_count=face_count,
        face_confidences=face_confidences,
        classification=raw_classification,
        classification_confidence=raw_confidence,
        probabilities=raw_probs,
        phone_detected=phone_detected,
        frame_hash=frame_hash
    )
    
    # Add to batch and check if batch is ready
    batch_result = batch_processor.add_frame(frame_sample)
    
    # =========================================================================
    # STEP 3: BUILD RESPONSE
    # =========================================================================
    state = batch_processor.get_current_state()
    
    if batch_result:
        # BATCH WAS PROCESSED - Return batch decision
        session['last_batch_result'] = batch_result
        
        # Generate events based on batch result
        events = []
        
        if batch_result.multi_face_confirmed:
            events.append({
                'type': 'multiple_faces',
                'severity': 'very_suspicious',
                'message': f'Multiple faces BATCH-CONFIRMED ({batch_result.dominant_face_count} faces in {batch_result.face_count_dominance_pct:.0%} of batch)'
            })
        
        if batch_result.no_face_confirmed:
            events.append({
                'type': 'no_face',
                'severity': 'suspicious',
                'message': f'No face BATCH-CONFIRMED (in {batch_result.face_count_histogram.get(0, 0):.0%} of batch)'
            })
        
        # Batch analysis event
        events.append({
            'type': 'batch_analysis',
            'severity': 'info' if batch_result.dominant_classification == 'normal' else batch_result.dominant_classification.replace('_', ' '),
            'message': f'Batch #{state["batch_count"]}: {batch_result.total_frames} frames, {batch_result.batch_duration:.1f}s'
        })
        
        return {
            'success': True,
            'classification': batch_result.dominant_classification,
            'confidence': float(round(batch_result.classification_dominance_pct, 3)),
            'face_detection': {
                'face_count': int(batch_result.dominant_face_count),
                'faces_detected': batch_result.dominant_face_count > 0,
                'multiple_faces': batch_result.dominant_face_count > 1,
                'multiple_faces_confirmed': batch_result.multi_face_confirmed,
                'no_face_duration': 0.0,
                'no_face_confirmed': batch_result.no_face_confirmed
            },
            'head_pose': {'direction': 'unknown', 'gaze_away': False},
            'phone_detection': {'detected': phone_detected, 'probability': 0.0},
            'idle_detection': {'is_idle': is_idle},
            'audio_monitoring': {'noise_detected': audio_level > 0.5, 'level': float(round(audio_level, 3))},
            'probabilities': {k: float(round(v, 3)) for k, v in batch_result.classification_histogram.items()},
            'events': events,
            'credibility_score': float(round(state['credibility_score'], 1)),
            'credibility_score_delta': 0.0,
            'frame_number': session['frame_count'],
            'batch_processed': True,
            'batch_number': state['batch_count'],
            # TASK 7: Debug verification data
            'debug': {
                'batch': {
                    'total_frames': batch_result.total_frames,
                    'duration': float(round(batch_result.batch_duration, 2)),
                    'face_count_histogram': {str(k): float(round(v, 3)) for k, v in batch_result.face_count_histogram.items()},
                    'face_count_dominant': batch_result.dominant_face_count,
                    'face_count_dominance_pct': float(round(batch_result.face_count_dominance_pct, 3)),
                    'classification_histogram': {k: float(round(v, 3)) for k, v in batch_result.classification_histogram.items()},
                    'classification_dominant': batch_result.dominant_classification,
                    'classification_dominance_pct': float(round(batch_result.classification_dominance_pct, 3)),
                    'multi_face_confirmed': batch_result.multi_face_confirmed,
                    'no_face_confirmed': batch_result.no_face_confirmed,
                    'decision_reason': batch_result.decision_reason
                },
                'state': {
                    'confirmed_state': state['confirmed_state'],
                    'pending_state': state['pending_state'],
                    'consecutive_batches': state['consecutive_batches']
                }
            }
        }
    else:
        # BATCH PENDING - Return interim response (using last confirmed state)
        # NO DECISIONS MADE - just collecting frames
        return {
            'success': True,
            'classification': state['confirmed_state'],  # Use last confirmed state
            'confidence': 0.9,
            'face_detection': {
                'face_count': face_count,  # Raw frame count (not yet batch-confirmed)
                'faces_detected': face_count > 0,
                'multiple_faces': face_count > 1,
                'multiple_faces_confirmed': False,  # Not batch-confirmed yet
                'no_face_duration': 0.0,
                'no_face_confirmed': False
            },
            'head_pose': {'direction': 'unknown', 'gaze_away': False},
            'phone_detection': {'detected': phone_detected, 'probability': 0.0},
            'idle_detection': {'is_idle': is_idle},
            'audio_monitoring': {'noise_detected': audio_level > 0.5, 'level': float(round(audio_level, 3))},
            'probabilities': raw_probs,
            'events': [],
            'credibility_score': float(round(state['credibility_score'], 1)),
            'credibility_score_delta': 0.0,
            'frame_number': session['frame_count'],
            'batch_pending': True,
            'batch_buffer_size': state['buffer_size'],
            # TASK 7: Debug info for pending batch
            'debug': {
                'batch_pending': {
                    'buffer_size': state['buffer_size'],
                    'max_frames': BATCH_MAX_FRAMES,
                    'max_duration': BATCH_MAX_DURATION_SECONDS
                },
                'raw_frame': {
                    'face_count': face_count,
                    'classification': raw_classification,
                    'confidence': float(round(raw_confidence, 3))
                },
                'state': {
                    'confirmed_state': state['confirmed_state'],
                    'pending_state': state['pending_state'],
                    'consecutive_batches': state['consecutive_batches']
                }
            }
        }


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'face-detection-service',
        'version': '2.0.0',
        'features': {
            'temporal_tracking': True,
            'classification_smoothing': True,
            'credibility_ema': True,
            'multi_face_confirmation': True
        }
    })


@app.route('/api/reset-session', methods=['POST'])
def reset_session():
    """Reset session state (call at start of new exam)"""
    try:
        data = request.get_json() or {}
        session_id = data.get('session_id')
        session_manager.reset_session(session_id)
        return jsonify({'success': True, 'message': 'Session reset'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/detect-faces', methods=['POST'])
@require_auth
def detect_faces_endpoint():
    """Face detection endpoint (requires authentication)"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'success': False, 'error': 'Missing image data'}), 400
        
        frame = decode_base64_image(data['image'])
        if frame is None:
            return jsonify({'success': False, 'error': 'Failed to decode image'}), 400
        
        # Raw detection (no tracking)
        boxes, confidences = detector.detect_faces_raw(frame)
        
        # For single-frame detection, use tracker briefly
        session = session_manager.get_session()
        stable_faces, stable_count, _ = session['face_tracker'].update(boxes, confidences)
        
        status = 'valid' if stable_count == 1 else ('multiple' if stable_count > 1 else 'no_face')
        message = {
            'valid': 'Face detected and validated successfully',
            'multiple': 'Multiple faces detected - suspicious activity',
            'no_face': 'No face detected - please ensure your face is visible'
        }.get(status, 'Unknown status')
        
        return jsonify({
            'success': True,
            'face_count': int(stable_count),
            'faces_detected': stable_count > 0,
            'multiple_faces': stable_count > 1,
            'status': status,
            'message': message,
            'bboxes': [[int(x) for x in bbox] for bbox in [f.bbox for f in stable_faces]]
        })
        
    except Exception as e:
        logger.error(f"Error in detect_faces: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/validate-setup', methods=['POST'])
@require_auth
def validate_setup():
    """Validate webcam setup with multiple frames"""
    try:
        data = request.get_json()
        
        if not data or 'images' not in data:
            return jsonify({'success': False, 'error': 'Missing images data'}), 400
        
        images = data['images']
        if not isinstance(images, list) or len(images) == 0:
            return jsonify({'success': False, 'error': 'Invalid images data'}), 400
        
        # Reset tracker for fresh validation
        session_manager.reset_session()
        session = session_manager.get_session()
        
        valid_count = 0
        multiple_count = 0
        no_face_count = 0
        
        for image_str in images:
            frame = decode_base64_image(image_str)
            if frame is not None:
                boxes, confs = detector.detect_faces_raw(frame)
                stable_faces, stable_count, multi_confirmed = session['face_tracker'].update(boxes, confs)
                
                if stable_count == 1:
                    valid_count += 1
                elif stable_count > 1:
                    multiple_count += 1
                else:
                    no_face_count += 1
        
        total_frames = valid_count + multiple_count + no_face_count
        face_consistency = valid_count / total_frames if total_frames > 0 else 0
        
        is_valid = face_consistency >= 0.8 and multiple_count == 0
        
        if is_valid:
            message = 'Webcam setup validated successfully'
        elif multiple_count > 0:
            message = f'Validation failed - multiple faces in {multiple_count} frame(s)'
        else:
            message = f'Validation failed - face detected in only {int(face_consistency * 100)}% of frames'
        
            return jsonify({
        'success': True,
            'valid': bool(is_valid),
            'face_consistency': float(round(face_consistency, 2)),
            'multiple_face_instances': int(multiple_count),
            'no_face_instances': int(no_face_count),
            'total_frames': int(total_frames),
            'valid_frames': int(valid_count),
            'message': message
        })
        
    except Exception as e:
        logger.error(f"Error in validate_setup: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/comprehensive-proctoring', methods=['POST'])
@require_auth
def comprehensive_proctoring():
    """Comprehensive proctoring endpoint (requires authentication)"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'success': False, 'error': 'Missing image data'}), 400
        
        frame = decode_base64_image(data['image'])
        if frame is None:
            return jsonify({'success': False, 'error': 'Failed to decode image'}), 400
        
        no_face_duration = data.get('no_face_duration', 0)
        is_idle = data.get('is_idle', False)
        audio_level = data.get('audio_level', 0.0)
        session_id = data.get('session_id')
        
        response = process_comprehensive_proctoring(
            frame, no_face_duration, is_idle, audio_level, session_id
        )
        
        return jsonify(response)
        
    except Exception as e:
        import traceback
        logger.error(f"Error in comprehensive_proctoring: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/comprehensive-proctoring-test', methods=['POST', 'OPTIONS'])
def comprehensive_proctoring_test():
    """Test endpoint (no auth required)"""
    if request.method == 'OPTIONS':
        response = jsonify({'success': True})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'success': False, 'error': 'Missing image data'}), 400
        
        frame = decode_base64_image(data['image'])
        if frame is None:
            return jsonify({'success': False, 'error': 'Failed to decode image'}), 400
        
        no_face_duration = data.get('no_face_duration', 0)
        is_idle = data.get('is_idle', False)
        audio_level = data.get('audio_level', 0.0)
        
        response_data = process_comprehensive_proctoring(
            frame, no_face_duration, is_idle, audio_level, 'test'
        )
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        import traceback
        logger.error(f"Error in comprehensive_proctoring_test: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/classify-behavior', methods=['POST'])
def classify_behavior():
    """Classify behavior using CNN model"""
    try:
        if behavior_model is None:
            return jsonify({'success': False, 'error': 'Model not available'}), 503
        
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'success': False, 'error': 'Missing image data'}), 400
        
        frame = decode_base64_image(data['image'])
        if frame is None:
            return jsonify({'success': False, 'error': 'Failed to decode image'}), 400
        
        classification, confidence, probabilities = classify_behavior_raw(frame)
        
        # Also get face detection for context
        boxes, confs = detector.detect_faces_raw(frame)
        face_count = len(boxes)
        multiple_faces = face_count > 1
        
        return jsonify({
            'success': True,
            'classification': classification,
            'confidence': round(confidence, 3),
            'probabilities': probabilities,
            'face_count': face_count,
            'multiple_faces': multiple_faces,
            'faces_detected': face_count > 0
        })
        
    except Exception as e:
        logger.error(f"Error in classify_behavior: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# Model management stubs
@app.route('/api/models', methods=['GET', 'OPTIONS'])
def get_all_models():
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    return jsonify({'success': True, 'models': [], 'activeModelId': None})

@app.route('/api/models/train', methods=['POST', 'OPTIONS'])
@require_auth
def start_training():
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    return jsonify({'success': False, 'error': 'Not implemented'}), 501

@app.route('/api/models/<model_id>/progress', methods=['GET', 'OPTIONS'])
@require_auth
def get_training_progress(model_id):
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    return jsonify({'success': False, 'error': 'Not implemented'}), 501

@app.route('/api/models/<model_id>/publish', methods=['POST', 'OPTIONS'])
@require_auth
def publish_model(model_id):
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    return jsonify({'success': False, 'error': 'Not implemented'}), 501

@app.route('/api/models/<model_id>/switch', methods=['POST', 'OPTIONS'])
@require_auth
def switch_model(model_id):
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    return jsonify({'success': False, 'error': 'Not implemented'}), 501

@app.route('/api/models/<model_id>', methods=['DELETE', 'OPTIONS'])
@require_auth
def delete_model(model_id):
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    return jsonify({'success': False, 'error': 'Not implemented'}), 501


def find_free_port(start_port=5002, max_attempts=10):
    """Find a free port starting from start_port"""
    import socket
    for i in range(max_attempts):
        port = start_port + i
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    raise RuntimeError(f"Could not find free port after {max_attempts} attempts")


if __name__ == '__main__':
    default_port = int(os.environ.get('PORT', 5002))
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    port = find_free_port(default_port)
    if port != default_port:
        logger.warning(f"Port {default_port} in use, using {port}")
    
    logger.info(f"Starting Face Detection Service v2.0 on port {port}")
    logger.info(f"Features: Temporal tracking, Classification smoothing, EMA credibility")
    
    try:
        app.run(host='0.0.0.0', port=port, debug=debug_mode, use_reloader=False)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
