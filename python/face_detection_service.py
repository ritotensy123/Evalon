"""
AI Face Detection Service for Evalon Exam Proctoring
This service provides AI-based face detection capabilities for pre-exam webcam checks.

Features:
- Single face detection
- Multiple face detection
- Face presence validation
- Webcam frame analysis
"""

import cv2
import numpy as np
import base64
import os
from typing import Dict, List, Tuple, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging - Set to INFO for better visibility of detection results
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

# Try to import scikit-learn for ML models
try:
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.naive_bayes import GaussianNB
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.svm import SVC
    from sklearn.ensemble import VotingClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not available - ML ensemble models will be disabled")

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize OpenCV's DNN face detector (more reliable than Haar Cascades)
class FaceDetector:
    """Face detection using OpenCV DNN"""
    
    def __init__(self):
        """Initialize face detector"""
        # Load pre-trained face detection model
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'face_detection_model.pb')
        config_path = os.path.join(os.path.dirname(__file__), 'models', 'face_detection_config.pbtxt')
        
        # If models don't exist, use built-in OpenCV detector
        if os.path.exists(model_path) and os.path.exists(config_path):
            self.net = cv2.dnn.readNetFromTensorflow(model_path, config_path)
            logger.info("Loaded custom face detection model")
        else:
            # Use Haar Cascade as fallback
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            self.net = None
            logger.info("Using Haar Cascade face detector")
    
    def _non_max_suppression(self, boxes: List[Tuple[int, int, int, int]], overlap_threshold: float = 0.15) -> List[Tuple[int, int, int, int]]:
        """
        Apply Non-Maximum Suppression to remove overlapping boxes
        OPTIMIZED: Very low threshold (0.15) to preserve multiple close faces
        
        Args:
            boxes: List of bounding boxes (x, y, w, h)
            overlap_threshold: IOU threshold for suppression (lower = preserves more faces)
            
        Returns:
            Filtered list of bounding boxes
        """
        if len(boxes) == 0:
            return []
        
        if len(boxes) == 1:
            return boxes
        
        # Convert to (x1, y1, x2, y2) format and calculate areas
        boxes_array = []
        areas = []
        for x, y, w, h in boxes:
            x1, y1 = x, y
            x2, y2 = x + w, y + h
            boxes_array.append([x1, y1, x2, y2])
            areas.append(w * h)
        
        boxes_array = np.array(boxes_array, dtype=np.float32)
        areas = np.array(areas, dtype=np.float32)
        
        # Sort by area (largest first)
        indices = np.argsort(areas)[::-1]
        keep = []
        
        logger.debug(f"   NMS: Processing {len(boxes)} boxes with threshold {overlap_threshold}")
        
        while len(indices) > 0:
            # Keep the box with largest area
            current = indices[0]
            keep.append(current)
            
            if len(indices) == 1:
                break
            
            # Calculate IOU with remaining boxes
            current_box = boxes_array[current]
            remaining_indices = indices[1:]
            remaining_boxes = boxes_array[remaining_indices]
            
            # Calculate intersection
            x1 = np.maximum(current_box[0], remaining_boxes[:, 0])
            y1 = np.maximum(current_box[1], remaining_boxes[:, 1])
            x2 = np.minimum(current_box[2], remaining_boxes[:, 2])
            y2 = np.minimum(current_box[3], remaining_boxes[:, 3])
            
            w = np.maximum(0, x2 - x1)
            h = np.maximum(0, y2 - y1)
            intersection = w * h
            
            # Calculate union
            current_area = areas[current]
            remaining_areas = areas[remaining_indices]
            union = current_area + remaining_areas - intersection
            
            # Calculate IOU
            iou = intersection / (union + 1e-6)
            
            # Keep boxes with IOU below threshold (lower threshold = keep more boxes)
            # This means boxes must overlap by MORE than threshold to be removed
            keep_mask = iou < overlap_threshold
            indices = remaining_indices[keep_mask]
            
            if len(indices) < len(remaining_indices):
                removed = len(remaining_indices) - len(indices)
                logger.debug(f"   NMS: Removed {removed} overlapping boxes (IOU >= {overlap_threshold})")
        
        logger.debug(f"   NMS: Kept {len(keep)} boxes out of {len(boxes)}")
        
        # Convert back to (x, y, w, h) format
        result = []
        for idx in keep:
            x1, y1, x2, y2 = boxes_array[idx]
            result.append((int(x1), int(y1), int(x2 - x1), int(y2 - y1)))
        
        return result
    
    def _preprocess_frame(self, frame: np.ndarray) -> List[np.ndarray]:
        """
        Preprocess frame with multiple enhancement techniques for better detection
        
        Args:
            frame: Original frame
            
        Returns:
            List of preprocessed frames (original, equalized, CLAHE, denoised)
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        preprocessed = [gray]
        
        # Histogram equalization
        gray_eq = cv2.equalizeHist(gray)
        preprocessed.append(gray_eq)
        
        # CLAHE (Contrast Limited Adaptive Histogram Equalization) - better for varying lighting
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray_clahe = clahe.apply(gray)
        preprocessed.append(gray_clahe)
        
        # Denoised version
        gray_denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        preprocessed.append(gray_denoised)
        
        return preprocessed
    
    def detect_faces(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in a frame - OPTIMIZED for multiple face detection
        
        Args:
            frame: Image frame as numpy array
            
        Returns:
            List of bounding boxes (x, y, w, h)
        """
        try:
            all_detections = []
            
            if self.net is not None:
                # Use DNN face detection - OPTIMIZED
                h, w = frame.shape[:2]
                
                # Try multiple scales for better detection - MORE AGGRESSIVE
                scales = [1.0, 1.2, 0.8, 0.6, 1.4]  # More scales for comprehensive detection
                confidences = [0.25, 0.28, 0.3, 0.32, 0.35]  # Lower thresholds for multiple faces
                
                for scale, conf_threshold in zip(scales, confidences):
                    blob_scale = int(300 * scale)
                    blob = cv2.dnn.blobFromImage(frame, 1.0, (blob_scale, blob_scale), [104, 117, 123])
                    self.net.setInput(blob)
                    detections = self.net.forward()
                    
                    for i in range(detections.shape[2]):
                        confidence = detections[0, 0, i, 2]
                        if confidence > conf_threshold:
                            x1 = int(detections[0, 0, i, 3] * w)
                            y1 = int(detections[0, 0, i, 4] * h)
                            x2 = int(detections[0, 0, i, 5] * w)
                            y2 = int(detections[0, 0, i, 6] * h)
                            
                            # Ensure valid bounding box
                            x1 = max(0, min(x1, w))
                            y1 = max(0, min(y1, h))
                            x2 = max(0, min(x2, w))
                            y2 = max(0, min(y2, h))
                            
                            if x2 > x1 and y2 > y1:
                                all_detections.append((x1, y1, x2 - x1, y2 - y1))
                
                # Apply NMS to remove duplicates - VERY LOW threshold to preserve close faces
                faces = self._non_max_suppression(all_detections, overlap_threshold=0.15)
                
            else:
                # Use Haar Cascade - COMPLETELY OPTIMIZED for multiple face detection
                preprocessed_frames = self._preprocess_frame(frame)
                
                # Multiple detection passes with different parameters - AGGRESSIVE for multiple faces
                detection_configs = [
                    # Ultra-sensitive detection - catches small/partial faces
                    {'scaleFactor': 1.05, 'minNeighbors': 2, 'minSize': (20, 20)},
                    # Sensitive detection - catches smaller faces
                    {'scaleFactor': 1.08, 'minNeighbors': 3, 'minSize': (25, 25)},
                    # Standard detection - balanced
                    {'scaleFactor': 1.1, 'minNeighbors': 4, 'minSize': (30, 30)},
                    # Standard-sensitive - catches medium faces
                    {'scaleFactor': 1.12, 'minNeighbors': 3, 'minSize': (30, 30)},
                    # Conservative detection - catches clear faces
                    {'scaleFactor': 1.15, 'minNeighbors': 4, 'minSize': (35, 35)},
                ]
                
                # Detect faces with multiple configurations and preprocessing
                for preprocessed in preprocessed_frames:
                    for config in detection_configs:
                        detected = self.face_cascade.detectMultiScale(
                            preprocessed,
                            scaleFactor=config['scaleFactor'],
                            minNeighbors=config['minNeighbors'],
                            minSize=config['minSize'],
                            flags=cv2.CASCADE_SCALE_IMAGE
                            # Removed maxSize to allow larger faces
                        )
                        all_detections.extend(list(detected))
                
                # Filter out invalid detections - VERY LENIENT
                valid_detections = []
                h, w = frame.shape[:2]
                for x, y, w_box, h_box in all_detections:
                    # Skip if too small (likely noise) - lowered threshold
                    if w_box < 20 or h_box < 20:
                        continue
                    # Skip if outside frame bounds (with small buffer)
                    if x < -10 or y < -10 or x + w_box > w + 10 or y + h_box > h + 10:
                        continue
                    # Skip if extremely large (likely false positive)
                    if w_box > w * 0.9 or h_box > h * 0.9:
                        continue
                    valid_detections.append((x, y, w_box, h_box))
                
                logger.info(f"🔍 Total detections before NMS: {len(valid_detections)}")
                if len(valid_detections) > 0:
                    logger.info(f"   Detection details: {[(w, h) for x, y, w, h in valid_detections[:10]]}")  # Show first 10
                
                # Apply Non-Maximum Suppression with VERY LOW threshold
                # Very low threshold (0.15) allows faces that are very close but separate
                faces = self._non_max_suppression(valid_detections, overlap_threshold=0.15)
                
                logger.info(f"🔍 Faces after NMS: {len(faces)}")
                if len(faces) > 1:
                    logger.info(f"   Multiple faces detected! Face sizes: {[(w, h) for x, y, w, h in faces]}")
                
                # MINIMAL validation - only remove extremely obvious false positives
                # Don't filter based on size ratio when multiple faces detected - trust the detection
                if len(faces) > 1:
                    # Only remove faces that are clearly outside bounds or extremely tiny
                    validated_faces = []
                    h, w = frame.shape[:2]
                    for face in faces:
                        x, y, w_box, h_box = face
                        # Only filter if completely outside frame or extremely small
                        if (x + w_box < 5 or y + h_box < 5 or 
                            x > w - 5 or y > h - 5 or
                            w_box < 15 or h_box < 15):
                            logger.debug(f"   ⚠️  Filtered edge/too-small face: {w_box}x{h_box} at ({x}, {y})")
                            continue
                        validated_faces.append(face)
                    
                    # Keep all validated faces - no area ratio filtering
                    faces = validated_faces if len(validated_faces) > 0 else faces  # Keep all if validation removed everything
                    logger.info(f"✅ Final multiple faces: {len(faces)}")
            
            # Log detected faces for debugging - ALWAYS log at INFO level for visibility
            if len(faces) > 1:
                logger.info(f"✅✅✅ MULTIPLE FACES DETECTED: {len(faces)} faces ✅✅✅")
                for idx, (x, y, w_box, h_box) in enumerate(faces, 1):
                    area = w_box * h_box
                    logger.info(f"   Face {idx}: {w_box}x{h_box} (area={area}) at ({x}, {y})")
            elif len(faces) == 1:
                logger.info(f"✅ Single face detected: {faces[0][2]}x{faces[0][3]} at ({faces[0][0]}, {faces[0][1]})")
            else:
                logger.warning(f"⚠️ No faces detected - may need more aggressive detection")
            
            return faces
            
        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []
    
    def analyze_frame(self, frame: np.ndarray) -> Dict:
        """
        Analyze a frame and return detection results
        
        Args:
            frame: Image frame as numpy array
            
        Returns:
            Dictionary with detection results
        """
        faces = self.detect_faces(frame)
        face_count = len(faces)
        
        # Ensure multiple faces is detected correctly
        multiple_faces = face_count > 1
        
        return {
            'face_count': int(face_count),
            'faces_detected': face_count > 0,
            'multiple_faces': face_count > 1,
            'bboxes': [tuple(int(x) for x in bbox) for bbox in faces],
            'status': 'valid' if face_count == 1 else ('multiple' if face_count > 1 else 'no_face')
        }


# Initialize face detector
detector = FaceDetector()

# Initialize behavior classification model
behavior_model = None
if TENSORFLOW_AVAILABLE:
    try:
        model_path = os.path.join(os.path.dirname(__file__), 'suspicious_activity_model.h5')
        if os.path.exists(model_path):
            # Try multiple loading strategies for compatibility
            try:
                import tensorflow as tf
                from tensorflow.keras.layers import InputLayer
                from tensorflow.keras import backend as K
                
                # Strategy 1: Try with custom objects for DTypePolicy and InputLayer
                class CompatibleInputLayer(InputLayer):
                    def __init__(self, *args, **kwargs):
                        if 'batch_shape' in kwargs:
                            batch_shape = kwargs.pop('batch_shape')
                            if batch_shape and len(batch_shape) > 1:
                                kwargs['input_shape'] = batch_shape[1:]
                        super().__init__(*args, **kwargs)
                
                # Handle DTypePolicy compatibility
                class CompatibleDTypePolicy(tf.keras.mixed_precision.Policy):
                    def __init__(self, name='float32'):
                        super().__init__(name)
                
                custom_objects = {
                    'InputLayer': CompatibleInputLayer,
                    'DTypePolicy': CompatibleDTypePolicy,
                    'Policy': CompatibleDTypePolicy,
                    'keras': tf.keras
                }
                
                behavior_model = load_model(model_path, custom_objects=custom_objects, compile=False)
                behavior_model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
                logger.info("Loaded suspicious activity classification model (with compatibility fix)")
            except Exception as e1:
                # Strategy 2: Try loading without custom objects but with compile=False
                try:
                    behavior_model = load_model(model_path, compile=False)
                    behavior_model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
                    logger.info("Loaded suspicious activity classification model")
                except Exception as e2:
                    # Strategy 3: Use safe_mode=False for TensorFlow 2.13+
                    try:
                        behavior_model = load_model(model_path, compile=False, safe_mode=False)
                        behavior_model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
                        logger.info("Loaded suspicious activity classification model (safe_mode=False)")
                    except Exception as e3:
                        logger.warning(f"Model loading failed with all strategies. Will use rule-based classification.")
                        logger.warning(f"Error 1: {str(e1)[:200]}")
                        logger.warning(f"Error 2: {str(e2)[:200]}")
                        logger.warning(f"Error 3: {str(e3)[:200]}")
                        behavior_model = None
        else:
            logger.warning(f"Behavior model not found at {model_path}")
    except Exception as e:
        logger.warning(f"TensorFlow available but model loading failed: {str(e)[:200]}")
        behavior_model = None


# ==================== ML Ensemble Models ====================
# Frame buffer for multi-frame analysis (improves accuracy)
FRAME_BUFFER_SIZE = 5  # Analyze last 5 frames for better normal detection
frame_buffer = []  # Stores feature vectors from recent frames
behavior_history = []  # Stores behavior patterns for KNN matching

# ML Models for ensemble classification
ml_models = {}
scaler = None

def extract_features(frame, face_result, head_pose, phone_prob, no_face_duration, is_idle, audio_level):
    """
    Extract features from frame and behavior data for ML models
    Returns a feature vector
    """
    features = []
    
    # Face features
    features.append(float(face_result['face_count']))
    features.append(float(1 if face_result['faces_detected'] else 0))
    features.append(float(1 if face_result['multiple_faces'] else 0))
    
    # Head pose (one-hot encoded)
    pose_map = {'center': 0, 'left': 1, 'right': 2, 'up': 3, 'down': 4, 'away': 5, 'unknown': 6}
    pose_features = [0.0] * 7
    if head_pose in pose_map:
        pose_features[pose_map[head_pose]] = 1.0
    features.extend(pose_features)
    
    # Phone detection
    features.append(float(phone_prob))
    
    # Activity features
    features.append(float(1 if is_idle else 0))
    features.append(float(audio_level))
    features.append(float(min(no_face_duration / 10.0, 1.0)))  # Normalized to 0-1
    
    # Frame statistics (if face detected)
    if face_result['faces_detected'] and len(face_result['bboxes']) > 0:
        bbox = face_result['bboxes'][0]
        h, w = frame.shape[:2]
        # Face size relative to frame
        face_area = (bbox[2] * bbox[3]) / (w * h)
        features.append(float(face_area))
        # Face position (normalized)
        features.append(float(bbox[0] / w))  # x position
        features.append(float(bbox[1] / h))  # y position
    else:
        features.extend([0.0, 0.0, 0.0])
    
    return np.array(features)

def initialize_ml_models():
    """Initialize ML ensemble models"""
    global ml_models, scaler
    
    if not SKLEARN_AVAILABLE:
        logger.warning("scikit-learn not available - ML models will use default settings")
        return
    
    try:
        # Initialize scaler for feature normalization (assign to global)
        global scaler
        scaler = StandardScaler()
        
        # Initialize individual models
        ml_models = {
            'knn': KNeighborsClassifier(n_neighbors=5, weights='distance'),
            'naive_bayes': GaussianNB(),
            'decision_tree': DecisionTreeClassifier(max_depth=10, random_state=42),
            'svm': SVC(kernel='rbf', probability=True, random_state=42),
        }
        
        # Create ensemble with voting classifier
        ml_models['ensemble'] = VotingClassifier(
            estimators=[
                ('knn', ml_models['knn']),
                ('nb', ml_models['naive_bayes']),
                ('dt', ml_models['decision_tree']),
                ('svm', ml_models['svm']),
            ],
            voting='soft'  # Use probability voting
        )
        
        logger.info("ML ensemble models initialized successfully")
        
        # Train on synthetic data for initial state (will improve with real data)
        train_initial_models()
        
    except Exception as e:
        logger.error(f"Failed to initialize ML models: {str(e)}")
        ml_models = {}
        scaler = None

def train_initial_models():
    """Train models on synthetic baseline data"""
    global ml_models, scaler
    
    if not ml_models or scaler is None:
        return
    
    try:
        # Generate synthetic training data based on expected patterns
        n_samples = 100
        X = []
        y = []
        
        # Normal class examples (1 face, center pose, low phone prob, no idle, low audio)
        for _ in range(n_samples // 2):
            features = [
                1.0,  # face_count
                1.0,  # faces_detected
                0.0,  # multiple_faces
                1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,  # center pose
                0.1 + np.random.random() * 0.2,  # phone_prob (low)
                0.0,  # not idle
                0.0 + np.random.random() * 0.3,  # low audio
                0.0,  # no face duration
                0.1 + np.random.random() * 0.1,  # face area
                0.4 + np.random.random() * 0.2,  # x position (center)
                0.4 + np.random.random() * 0.2,  # y position (center)
            ]
            X.append(features)
            y.append(0)  # normal
        
        # Suspicious class examples
        for _ in range(n_samples // 4):
            features = [
                1.0,  # face_count
                1.0,  # faces_detected
                0.0,  # multiple_faces
                0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0,  # left pose (gaze away)
                0.3 + np.random.random() * 0.3,  # medium phone_prob
                1.0 if np.random.random() > 0.5 else 0.0,  # sometimes idle
                0.4 + np.random.random() * 0.3,  # medium audio
                0.2 + np.random.random() * 0.3,  # some no face duration
                0.08 + np.random.random() * 0.08,  # face area
                0.2 + np.random.random() * 0.3,  # x position (left)
                0.3 + np.random.random() * 0.3,  # y position
            ]
            X.append(features)
            y.append(1)  # suspicious
        
        # Very suspicious class examples
        for _ in range(n_samples // 4):
            # Multiple faces or no face or high phone
            if np.random.random() > 0.5:
                features = [
                    2.0,  # multiple faces
                    1.0,
                    1.0,  # multiple_faces
                    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                    0.2,
                    0.0,
                    0.2,
                    0.1,
                    0.1,
                    0.3,
                    0.3,
                ]
            else:
                features = [
                    1.0,
                    1.0,
                    0.0,
                    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                    0.6 + np.random.random() * 0.3,  # high phone_prob
                    0.0,
                    0.5 + np.random.random() * 0.4,  # high audio
                    0.5 + np.random.random() * 0.4,  # high no face duration
                    0.08,
                    0.3,
                    0.3,
                ]
            X.append(features)
            y.append(2)  # very_suspicious
        
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        X_scaled = scaler.fit_transform(X)
        
        # Train all models
        for name, model in ml_models.items():
            try:
                model.fit(X_scaled, y)
                logger.info(f"Trained {name} model on synthetic data")
            except Exception as e:
                logger.warning(f"Failed to train {name}: {str(e)}")
        
    except Exception as e:
        logger.warning(f"Failed to train initial models: {str(e)}")

def classify_with_ensemble(features):
    """
    Classify behavior using ensemble of ML models with multi-frame averaging
    Returns: (classification, confidence, probabilities, individual_predictions)
    where individual_predictions is a dict with each model's prediction
    """
    global ml_models, scaler, frame_buffer
    
    if not ml_models or scaler is None:
        return None, None, None, None
    
    try:
        # Add to frame buffer
        frame_buffer.append(features)
        if len(frame_buffer) > FRAME_BUFFER_SIZE:
            frame_buffer.pop(0)
        
        # Average features over last N frames for stability (especially for normal detection)
        # Require at least 3 frames for averaging to reduce false positives
        if len(frame_buffer) >= 3:
            # Weight recent frames more heavily
            weights = np.linspace(0.5, 1.0, len(frame_buffer[-3:]))
            weights = weights / weights.sum()
            avg_features = np.average(frame_buffer[-3:], axis=0, weights=weights)
        else:
            # Not enough frames yet, use current
            avg_features = features
        
        # Scale features
        features_scaled = scaler.transform([avg_features])[0]
        features_scaled = features_scaled.reshape(1, -1)
        
        # Get predictions from ensemble
        class_names = ['normal', 'suspicious', 'very_suspicious']
        
        # Collect individual model predictions
        individual_predictions = {}
        individual_probs = []
        
        # Get predictions from each individual model
        for name, model in ml_models.items():
            if name != 'ensemble':
                try:
                    pred_probs = model.predict_proba(features_scaled)[0]
                    pred_class_idx = int(np.argmax(pred_probs))
                    pred_class = class_names[pred_class_idx]
                    pred_confidence = float(pred_probs[pred_class_idx])
                    
                    individual_predictions[name] = {
                        'classification': pred_class,
                        'confidence': pred_confidence,
                        'probabilities': {
                            class_names[i]: float(pred_probs[i])
                            for i in range(len(class_names))
                        }
                    }
                    individual_probs.append(pred_probs)
                except Exception as e:
                    logger.warning(f"Failed to get prediction from {name}: {str(e)}")
        
        # Use ensemble for final prediction
        if 'ensemble' in ml_models:
            ensemble_probs = ml_models['ensemble'].predict_proba(features_scaled)[0]
            
            # Weighted average: ensemble gets 60%, individual models get 40%
            if individual_probs:
                individual_avg = np.mean(individual_probs, axis=0)
                final_probs = 0.6 * ensemble_probs + 0.4 * individual_avg
            else:
                final_probs = ensemble_probs
            
            # Boost normal class probability if features are consistently normal
            # BUT only if no critical conditions exist (multiple faces, phone, no face)
            if len(frame_buffer) >= 3:
                # Check if last 3 frames all suggest normal behavior
                normal_votes = 0
                for feat in frame_buffer[-3:]:
                    feat_scaled = scaler.transform([feat])[0].reshape(1, -1)
                    try:
                        pred = ml_models['ensemble'].predict(feat_scaled)[0]
                        if pred == 0:  # normal
                            normal_votes += 1
                    except:
                        pass
                
                # If 3 out of 3 frames suggest normal AND no critical flags, boost normal probability
                # Only boost if we have strong consensus (all 3 frames)
                if normal_votes == 3:
                    final_probs[0] = min(1.0, final_probs[0] * 1.20)  # Slightly stronger boost for normal
                    # Normalize probabilities
                    final_probs = final_probs / final_probs.sum()
            
            probabilities = {
                class_names[i]: float(final_probs[i])
                for i in range(len(class_names))
            }
            
            predicted_class = int(np.argmax(final_probs))
            classification = class_names[predicted_class]
            confidence = float(final_probs[predicted_class])
            
            # Add ensemble prediction to individual_predictions
            individual_predictions['ensemble'] = {
                'classification': classification,
                'confidence': confidence,
                'probabilities': probabilities
            }
            
            return classification, confidence, probabilities, individual_predictions
        
    except Exception as e:
        logger.warning(f"Ensemble classification failed: {str(e)}")
    
    return None, None, None, None

# Initialize ML models on startup
initialize_ml_models()


def decode_base64_image(image_str: str) -> Optional[np.ndarray]:
    """
    Decode base64 encoded image
    
    Args:
        image_str: Base64 encoded image string
        
    Returns:
        Image as numpy array or None if decoding fails
    """
    try:
        # Remove data URL prefix if present
        if ',' in image_str:
            image_str = image_str.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_str)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode image
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return frame
        
    except Exception as e:
        logger.error(f"Error decoding image: {str(e)}")
        return None


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'face-detection-service',
        'version': '1.0.0'
    })


@app.route('/api/detect-faces', methods=['POST'])
def detect_faces_endpoint():
    """
    Main endpoint for face detection
    
    Expected JSON:
    {
        "image": "base64_encoded_image_string",
        "min_confidence": 0.5  // optional
    }
    
    Returns:
    {
        "success": true,
        "face_count": 1,
        "faces_detected": true,
        "multiple_faces": false,
        "status": "valid|multiple|no_face",
        "message": "Face detection successful"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing image data'
            }), 400
        
        # Decode image
        frame = decode_base64_image(data['image'])
        
        if frame is None:
            return jsonify({
                'success': False,
                'error': 'Failed to decode image'
            }), 400
        
        # Analyze frame
        result = detector.analyze_frame(frame)
        
        # Determine message based on status
        if result['status'] == 'valid':
            message = 'Face detected and validated successfully'
        elif result['status'] == 'multiple':
            message = 'Multiple faces detected - suspicious activity'
        else:
            message = 'No face detected - please ensure your face is visible in frame'
        
        return jsonify({
            'success': True,
            'face_count': int(result['face_count']),
            'faces_detected': bool(result['faces_detected']),
            'multiple_faces': bool(result['multiple_faces']),
            'status': str(result['status']),
            'message': str(message),
            'bboxes': [[int(x) for x in bbox] for bbox in result['bboxes']]
        })
        
    except Exception as e:
        logger.error(f"Error in detect_faces_endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/validate-setup', methods=['POST'])
def validate_setup():
    """
    Validate webcam setup by checking for face presence over time
    
    Expected JSON:
    {
        "images": ["base64_image_1", "base64_image_2", ...],  // array of frames
        "duration_seconds": 5  // optional, default 3
    }
    
    Returns:
    {
        "success": true,
        "valid": true/false,
        "face_consistency": 0.95,  // percentage of frames with exactly 1 face
        "multiple_face_instances": 0,  // number of frames with multiple faces
        "no_face_instances": 0,  // number of frames with no face
        "message": "Setup validated successfully"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'images' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing images data'
            }), 400
        
        images = data['images']
        if not isinstance(images, list) or len(images) == 0:
            return jsonify({
                'success': False,
                'error': 'Invalid images data'
            }), 400
        
        # Analyze each frame
        results = []
        valid_count = 0
        multiple_count = 0
        no_face_count = 0
        
        for image_str in images:
            frame = decode_base64_image(image_str)
            if frame is not None:
                result = detector.analyze_frame(frame)
                results.append(result)
                
                if result['status'] == 'valid':
                    valid_count += 1
                elif result['status'] == 'multiple':
                    multiple_count += 1
                else:
                    no_face_count += 1
        
        # Calculate consistency
        total_frames = len(results)
        face_consistency = valid_count / total_frames if total_frames > 0 else 0
        
        # Determine if setup is valid
        # Valid if: face_consistency >= 0.8, multiple_face_instances == 0
        is_valid = face_consistency >= 0.8 and multiple_count == 0
        
        if is_valid:
            message = 'Webcam setup validated successfully - face detected consistently'
        elif multiple_count > 0:
            message = f'Validation failed - multiple faces detected in {multiple_count} frame(s)'
        elif no_face_count > 0:
            message = f'Validation failed - no face detected in {no_face_count} frame(s)'
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
            'message': str(message)
        })
        
    except Exception as e:
        logger.error(f"Error in validate_setup: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/classify-behavior', methods=['POST'])
def classify_behavior():
    """
    Classify behavior using the trained CNN model
    
    Expected JSON:
    {
        "image": "base64_encoded_image_string"
    }
    
    Returns:
    {
        "success": true,
        "classification": "normal|suspicious|very_suspicious",
        "confidence": 0.85,
        "probabilities": {
            "normal": 0.70,
            "suspicious": 0.15,
            "very_suspicious": 0.15
        },
        "face_count": 1,
        "multiple_faces": false
    }
    """
    try:
        if not TENSORFLOW_AVAILABLE or behavior_model is None:
            return jsonify({
                'success': False,
                'error': 'Behavior classification model not available'
            }), 503
        
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing image data'
            }), 400
        
        # Decode image
        frame = decode_base64_image(data['image'])
        
        if frame is None:
            return jsonify({
                'success': False,
                'error': 'Failed to decode image'
            }), 400
        
        # First detect faces for additional context
        face_result = detector.analyze_frame(frame)
        
        # Preprocess image for model (224x224x3)
        resized = cv2.resize(frame, (224, 224))
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        # Normalize to [0, 1]
        normalized = rgb_frame.astype(np.float32) / 255.0
        # Add batch dimension
        input_array = np.expand_dims(normalized, axis=0)
        
        # Predict
        predictions = behavior_model.predict(input_array, verbose=0)
        
        # Get class probabilities
        class_names = ['normal', 'suspicious', 'very_suspicious']
        probabilities = {
            class_names[i]: float(predictions[0][i])
            for i in range(len(class_names))
        }
        
        # Get predicted class
        predicted_class_idx = np.argmax(predictions[0])
        predicted_class = class_names[predicted_class_idx]
        confidence = float(predictions[0][predicted_class_idx])
        
        # Adjust classification based on face count
        if face_result['multiple_faces']:
            predicted_class = 'very_suspicious'
            confidence = max(confidence, 0.9)
        elif not face_result['faces_detected']:
            predicted_class = 'suspicious'
            confidence = max(confidence, 0.7)
        
        return jsonify({
            'success': True,
            'classification': predicted_class,
            'confidence': round(confidence, 3),
            'probabilities': probabilities,
            'face_count': face_result['face_count'],
            'multiple_faces': face_result['multiple_faces'],
            'faces_detected': face_result['faces_detected']
        })
        
    except Exception as e:
        logger.error(f"Error in classify_behavior: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def estimate_head_pose(face_bbox, frame):
    """
    Simple head pose estimation based on face position
    Returns: 'center', 'left', 'right', 'up', 'down', 'away'
    """
    try:
        h, w = frame.shape[:2]
        fx, fy, fw, fh = face_bbox
        face_center_x = fx + fw // 2
        face_center_y = fy + fh // 2
        
        # Calculate position relative to frame center
        frame_center_x = w // 2
        frame_center_y = h // 2
        
        # More sensitive thresholds (15% of frame size instead of 20%)
        threshold_x = w * 0.15
        threshold_y = h * 0.15
        
        # Determine direction
        offset_x = face_center_x - frame_center_x
        offset_y = face_center_y - frame_center_y
        
        if abs(offset_x) < threshold_x and abs(offset_y) < threshold_y:
            return 'center'
        elif abs(offset_x) > abs(offset_y):
            # Horizontal movement dominates
            if offset_x < -threshold_x:
                return 'left'
            elif offset_x > threshold_x:
                return 'right'
            else:
                return 'center'
        else:
            # Vertical movement dominates
            if offset_y < -threshold_y:
                return 'up'
            elif offset_y > threshold_y:
                return 'down'
            else:
                return 'center'
    except Exception as e:
        logger.warning(f"Error in head pose estimation: {str(e)}")
        return 'unknown'


def detect_phone_usage(frame, face_bbox):
    """
    Simple phone detection based on hand position and face interaction
    Returns probability of phone usage (0-1)
    """
    try:
        # Simple heuristic: if face is looking down and hands are near face
        # This is a simplified version - real implementation would use object detection
        h, w = frame.shape[:2]
        fx, fy, fw, fh = face_bbox
        
        # Look for small rectangular objects near face (simplified)
        face_region = frame[max(0, fy-50):min(h, fy+fh+50), max(0, fx-50):min(w, fx+fw+50)]
        
        # Convert to grayscale
        gray_region = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        
        # Detect edges (phones typically have strong edges)
        edges = cv2.Canny(gray_region, 50, 150)
        edge_density = np.sum(edges > 0) / (gray_region.shape[0] * gray_region.shape[1]) if gray_region.size > 0 else 0
        
        # If high edge density in face region, might be phone
        phone_probability = min(edge_density * 2, 1.0)  # Scale to 0-1
        
        return phone_probability
    except:
        return 0.0


def apply_decision_tree_rules(face_result, no_face_duration, is_idle, audio_level, phone_prob, head_pose):
    """
    Decision Tree for conditional logic-based decision automation
    Returns action recommendations based on multiple conditions
    """
    result = {
        'escalate': False,
        'pause_recommended': False,
        'reason': ''
    }
    
    # Decision Tree Logic:
    # Rule 1: Multiple faces + No face for long + High audio = ESCALATE
    if (face_result['multiple_faces'] and no_face_duration > 2 and audio_level > 0.6):
        result['escalate'] = True
        result['reason'] = 'Critical: Multiple faces detected with prolonged no-face periods and high audio activity'
        return result
    
    # Rule 2: No face > 10s + Idle > 60s + Phone detected = PAUSE
    if (no_face_duration > 10 and is_idle and phone_prob > 0.5):
        result['pause_recommended'] = True
        result['reason'] = 'Recommend pausing exam: No face detected for extended period, user idle, and phone usage detected'
        return result
    
    # Rule 3: Multiple faces + Phone = ESCALATE
    if (face_result['multiple_faces'] and phone_prob > 0.4):
        result['escalate'] = True
        result['reason'] = 'Critical: Multiple faces detected with potential phone usage'
        return result
    
    # Rule 4: Gaze away > 30s + High audio = SUSPICIOUS
    # (This is handled in main logic)
    
    # Rule 5: No face > 15s + High audio = ESCALATE
    if (no_face_duration > 15 and audio_level > 0.7):
        result['escalate'] = True
        result['reason'] = 'Critical: No face detected for extended period with high audio activity (possible collaboration)'
        return result
    
    # Rule 6: Idle > 30s + No face > 5s = PAUSE
    if (is_idle and no_face_duration > 5):
        result['pause_recommended'] = True
        result['reason'] = 'Recommend pausing: User idle for extended period with no face detected'
        return result
    
    return result


def rule_based_classification(face_result, head_pose, phone_prob, no_face_duration=0):
    """
    Rule-based behavior classification as fallback when model isn't available
    """
    classification = 'normal'
    confidence = 0.5
    
    # Multiple faces = very suspicious
    if face_result['multiple_faces']:
        classification = 'very_suspicious'
        confidence = 0.9
    # No face for > 10 seconds = suspicious
    elif no_face_duration > 10:
        classification = 'very_suspicious'
        confidence = 0.8
    # No face for > 5 seconds = suspicious
    elif no_face_duration > 5:
        classification = 'suspicious'
        confidence = 0.7
    # Phone detection
    elif phone_prob > 0.6:
        classification = 'very_suspicious'
        confidence = 0.75
    elif phone_prob > 0.4:
        classification = 'suspicious'
        confidence = 0.65
    # Head pose away from center
    elif head_pose in ['left', 'right', 'away']:
        classification = 'suspicious'
        confidence = 0.6
    # Normal case
    else:
        classification = 'normal'
        confidence = 0.7
    
    return classification, confidence


@app.route('/api/comprehensive-proctoring', methods=['POST'])
def comprehensive_proctoring():
    """
    Comprehensive proctoring endpoint that combines all features
    
    Expected JSON:
    {
        "image": "base64_encoded_image_string",
        "no_face_duration": 0,  // seconds
        "is_idle": false,  // keyboard/mouse inactivity
        "audio_level": 0.0  // optional, 0-1 normalized audio level
    }
    
    Returns:
    {
        "success": true,
        "classification": "normal|suspicious|very_suspicious",
        "confidence": 0.85,
        "face_detection": {
            "face_count": 1,
            "faces_detected": true,
            "multiple_faces": false,
            "no_face_duration": 0
        },
        "head_pose": {
            "direction": "center",
            "gaze_away": false
        },
        "phone_detection": {
            "detected": false,
            "probability": 0.2
        },
        "idle_detection": {
            "is_idle": false
        },
        "audio_monitoring": {
            "noise_detected": false,
            "level": 0.0
        },
        "probabilities": {
            "normal": 0.70,
            "suspicious": 0.15,
            "very_suspicious": 0.15
        },
        "events": [],  // List of flagged events
        "credibility_score_delta": 1.0
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            logger.error("No data received in comprehensive_proctoring request")
            return jsonify({
                'success': False,
                'error': 'No data received'
            }), 400
        
        if 'image' not in data:
            logger.error("Missing image data in comprehensive_proctoring request")
            return jsonify({
                'success': False,
                'error': 'Missing image data'
            }), 400
        
        # Decode image
        logger.info(f"Processing comprehensive proctoring request - image length: {len(data.get('image', ''))}")
        frame = decode_base64_image(data['image'])
        if frame is None:
            logger.error("Failed to decode image in comprehensive_proctoring")
            return jsonify({
                'success': False,
                'error': 'Failed to decode image'
            }), 400
        
        logger.info(f"Image decoded successfully - shape: {frame.shape if frame is not None else 'None'}")
        
        # Extract parameters
        no_face_duration = data.get('no_face_duration', 0)
        is_idle = data.get('is_idle', False)
        audio_level = data.get('audio_level', 0.0)
        
        # 1. Face Detection
        face_result = detector.analyze_frame(frame)
        face_bboxes = face_result['bboxes']
        logger.info(f"Face detection result: {face_result['face_count']} faces, multiple: {face_result['multiple_faces']}")
        
        # 2. Head Pose / Eye Gaze Estimation
        head_pose = 'unknown'
        gaze_away = False
        if face_result['faces_detected'] and len(face_bboxes) > 0:
            head_pose = estimate_head_pose(face_bboxes[0], frame)
            # More sensitive - any deviation from center is considered "away"
            gaze_away = head_pose not in ['center', 'unknown']
        
        # 3. Phone Detection
        phone_prob = 0.0
        phone_detected = False
        if face_result['faces_detected'] and len(face_bboxes) > 0:
            phone_prob = detect_phone_usage(frame, face_bboxes[0])
            phone_detected = phone_prob > 0.5
        
        # Extract features for ML models
        features = extract_features(frame, face_result, head_pose, phone_prob, no_face_duration, is_idle, audio_level)
        
        # 4. Behavior Classification (Priority: Critical Rules > Ensemble ML > CNN Model > Rule-based)
        classification = 'normal'
        confidence = 0.5
        probabilities = {'normal': 0.7, 'suspicious': 0.2, 'very_suspicious': 0.1}
        individual_model_predictions = None  # Initialize at start
        
        # Check for critical rules first, but still get ML predictions for display
        critical_rule_triggered = False
        
        # CRITICAL: Check rule-based overrides FIRST (these should never be overridden by ML)
        # Multiple faces = ALWAYS very suspicious
        if face_result['multiple_faces']:
            classification = 'very_suspicious'
            confidence = 0.95
            probabilities = {'normal': 0.05, 'suspicious': 0.05, 'very_suspicious': 0.90}
            critical_rule_triggered = True
            logger.warning(f"🚨 CRITICAL: Multiple faces detected ({face_result['face_count']} faces) - overriding ML models")
        # Phone detected = ALWAYS very suspicious
        elif phone_prob > 0.5:
            classification = 'very_suspicious'
            confidence = max(0.85, phone_prob)
            probabilities = {'normal': 0.1, 'suspicious': 0.1, 'very_suspicious': 0.8}
            critical_rule_triggered = True
            logger.warning(f"🚨 CRITICAL: Phone detected (prob: {phone_prob:.2f}) - overriding ML models")
        # No face > 10s = ALWAYS very suspicious
        elif no_face_duration > 10:
            classification = 'very_suspicious'
            confidence = 0.9
            probabilities = {'normal': 0.05, 'suspicious': 0.15, 'very_suspicious': 0.80}
            critical_rule_triggered = True
            logger.warning(f"🚨 CRITICAL: No face for {no_face_duration}s - overriding ML models")
        # No face > 5s = suspicious
        elif no_face_duration > 5:
            classification = 'suspicious'
            confidence = 0.75
            probabilities = {'normal': 0.2, 'suspicious': 0.7, 'very_suspicious': 0.1}
            critical_rule_triggered = True
            logger.warning(f"⚠️  Warning: No face for {no_face_duration}s - overriding ML models")
        
        # Always try to get ML model predictions for display (even if critical rules triggered)
        # Priority: Ensemble ML > CNN Model > Rule-based
        ensemble_result = None
        if ml_models and scaler is not None:
            try:
                ensemble_result = classify_with_ensemble(features)
                if ensemble_result[0] is not None:
                    ml_classification, ml_confidence, ml_probabilities, individual_model_predictions = ensemble_result
                    
                    # Log individual model predictions
                    if individual_model_predictions:
                        logger.info("📊 ML Model Predictions:")
                        for model_name, pred in individual_model_predictions.items():
                            logger.info(f"   {model_name.upper()}: {pred['classification']} ({pred['confidence']:.1%})")
                    
                    # Only use ML predictions if no critical rule triggered
                    if not critical_rule_triggered:
                        classification = ml_classification
                        confidence = ml_confidence
                        probabilities = ml_probabilities
                        logger.info(f"✅ Ensemble ML classification: {classification} ({confidence:.2%})")
                    else:
                        logger.info(f"📊 ML suggested: {ml_classification} ({ml_confidence:.2%}), but CRITICAL RULE takes precedence")
            except Exception as e:
                logger.warning(f"Ensemble classification failed: {str(e)[:200]}")
        
        # Fallback to CNN model if ensemble didn't provide result and no critical rule
        if not critical_rule_triggered and (ensemble_result is None or ensemble_result[0] is None):
                if behavior_model is not None:
                    try:
                        # Use AI model (CNN)
                        resized = cv2.resize(frame, (224, 224))
                        rgb_frame = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
                        normalized = rgb_frame.astype(np.float32) / 255.0
                        input_array = np.expand_dims(normalized, axis=0)
                        
                        predictions = behavior_model.predict(input_array, verbose=0)
                        class_names = ['normal', 'suspicious', 'very_suspicious']
                        cnn_probs = {
                            class_names[i]: float(predictions[0][i])
                            for i in range(len(class_names))
                        }
                        
                        predicted_class_idx = np.argmax(predictions[0])
                        cnn_classification = class_names[predicted_class_idx]
                        cnn_confidence = float(predictions[0][predicted_class_idx])
                        
                        # If ensemble provided result, combine them
                        if ensemble_result and ensemble_result[0] is not None:
                            # Weighted combination: 60% ensemble, 40% CNN (reduced from 70/30)
                            final_probs = {
                                k: 0.6 * probabilities[k] + 0.4 * cnn_probs[k]
                                for k in probabilities.keys()
                            }
                            # Renormalize
                            total = sum(final_probs.values())
                            probabilities = {k: v/total for k, v in final_probs.items()}
                            classification = max(probabilities, key=probabilities.get)
                            confidence = probabilities[classification]
                        else:
                            # Use CNN result
                            classification = cnn_classification
                            confidence = cnn_confidence
                            probabilities = cnn_probs
                    except Exception as e:
                        logger.warning(f"AI model prediction failed: {str(e)[:200]}")
                        # Fall back to rule-based
                        classification, confidence = rule_based_classification(
                            face_result, head_pose, phone_prob, no_face_duration
                        )
                else:
                    # Use rule-based classification
                    classification, confidence = rule_based_classification(
                        face_result, head_pose, phone_prob, no_face_duration
                    )
        
        # Adjust classification based on additional factors
        events = []
        
        # Always log face detection status for visibility
        if face_result['faces_detected']:
            if face_result['face_count'] == 1:
                events.append({
                    'type': 'face_detection',
                    'severity': 'info',
                    'message': f'Face detected (count: {face_result["face_count"]}, pose: {head_pose})'
                })
        
        # Decision Tree Logic for Conditional Automation
        # Apply decision tree rules (these override ML predictions for critical cases)
        decision_tree_action = apply_decision_tree_rules(
            face_result, no_face_duration, is_idle, audio_level, phone_prob, head_pose
        )
        
        if decision_tree_action['escalate']:
            # Critical situation - override to very_suspicious
            classification = 'very_suspicious'
            confidence = max(confidence, 0.95)
            events.append({
                'type': 'decision_tree_escalation',
                'severity': 'very_suspicious',
                'message': decision_tree_action['reason']
            })
        elif decision_tree_action['pause_recommended']:
            # Recommend pausing exam
            if classification != 'very_suspicious':
                classification = 'very_suspicious'
                confidence = max(confidence, 0.85)
            events.append({
                'type': 'decision_tree_pause',
                'severity': 'very_suspicious',
                'message': decision_tree_action['reason']
            })
        
        # Multiple faces override (already handled in critical rules, just log event)
        if face_result['multiple_faces']:
            events.append({
                'type': 'multiple_faces',
                'severity': 'very_suspicious',
                'message': f'Multiple faces detected ({face_result["face_count"]} faces)'
            })
        
        # No face duration logging (classification already set by critical rules)
        if no_face_duration > 10:
            events.append({
                'type': 'no_face',
                'severity': 'very_suspicious',
                'message': f'No face detected for {no_face_duration} seconds'
            })
        elif no_face_duration > 5:
            events.append({
                'type': 'no_face',
                'severity': 'suspicious',
                'message': f'No face detected for {no_face_duration} seconds'
            })
        elif not face_result['faces_detected']:
            # Log no face in current frame (warning level)
            events.append({
                'type': 'no_face',
                'severity': 'warning',
                'message': f'No face detected in current frame'
            })
        
        # Phone detection logging (classification already set by critical rules)
        if phone_prob > 0.5:
            phone_detected = True
            events.append({
                'type': 'phone_detection',
                'severity': 'very_suspicious',
                'message': f'Phone usage detected (probability: {phone_prob:.2f})'
            })
        elif phone_prob > 0.3:
            # Lower threshold for warning
            events.append({
                'type': 'phone_detection',
                'severity': 'suspicious',
                'message': f'Possible phone usage detected (probability: {phone_prob:.2f})'
            })
        
        # Gaze away (only mark suspicious if classification is still normal)
        # Don't override if already marked as suspicious/very_suspicious by critical rules
        if head_pose in ['left', 'right', 'away', 'up', 'down']:
            if classification == 'normal':
                classification = 'suspicious'
                confidence = max(confidence, 0.65)
                events.append({
                    'type': 'gaze_away',
                    'severity': 'suspicious',
                    'message': f'Gaze direction: {head_pose} (not looking at screen center)'
                })
            else:
                # Just log, don't override existing classification
                events.append({
                    'type': 'gaze_away',
                    'severity': 'info',
                    'message': f'Gaze direction: {head_pose} (not looking at screen center)'
                })
        elif head_pose == 'center' and face_result['faces_detected']:
            # Log when gaze is good (only if normal behavior)
            if classification == 'normal':
                events.append({
                    'type': 'gaze_center',
                    'severity': 'info',
                    'message': 'Gaze centered - looking at screen'
                })
        
        # Idle detection
        if is_idle:
            if classification == 'normal':
                classification = 'suspicious'
                confidence = max(confidence, 0.7)
            events.append({
                'type': 'idle',
                'severity': 'suspicious',
                'message': 'No keyboard/mouse activity detected (idle)'
            })
        
        # Audio monitoring (lower threshold)
        noise_detected = bool(audio_level > 0.5)  # Reduced from 0.7, ensure native bool
        if noise_detected:
            if classification == 'normal':
                classification = 'suspicious'
                confidence = max(confidence, 0.7)
            events.append({
                'type': 'audio_noise',
                'severity': 'suspicious',
                'message': f'High audio level detected: {audio_level:.2f}'
            })
        
        # Always add a status event for every frame (for visibility)
        # This ensures we see activity even when everything is normal
        status_severity = 'info'
        if classification == 'very_suspicious':
            status_severity = 'very_suspicious'
        elif classification == 'suspicious':
            status_severity = 'suspicious'
        
        events.append({
            'type': 'frame_analysis',
            'severity': status_severity,
            'message': f'Frame analyzed - Classification: {classification} ({confidence:.1%}), Faces: {face_result["face_count"]}, Pose: {head_pose}, Phone: {phone_prob:.1%}, Idle: {is_idle}, Audio: {audio_level:.1%}'
        })
        
        # Calculate credibility score delta
        score_delta = 0.0
        if classification == 'normal':
            score_delta = 1.0
        elif classification == 'suspicious':
            score_delta = -1.0
        else:  # very_suspicious
            score_delta = -2.0
        
        logger.info(f"Proctoring result: classification={classification}, confidence={confidence}, events={len(events)}, score_delta={score_delta}")
        
        # Convert NumPy types to native Python types for JSON serialization
        def convert_numpy_types(obj):
            """Recursively convert NumPy types to native Python types"""
            if isinstance(obj, (np.integer, np.int_)):
                return int(obj)
            elif isinstance(obj, (np.floating, np.float_)):
                return float(obj)
            elif isinstance(obj, np.bool_):
                return bool(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {key: convert_numpy_types(value) for key, value in obj.items()}
            elif isinstance(obj, (list, tuple)):
                return [convert_numpy_types(item) for item in obj]
            return obj
        
        # Ensure all values are JSON-serializable
        face_count = int(face_result['face_count'])
        faces_detected = bool(face_result['faces_detected'])
        multiple_faces = bool(face_result['multiple_faces'])
        
        # Convert probabilities dict
        probabilities_clean = {
            key: float(value) if isinstance(value, (np.floating, np.float_)) else float(value)
            for key, value in probabilities.items()
        }
        
        # Prepare individual model predictions (if available)
        model_predictions_clean = None
        if individual_model_predictions:
            model_predictions_clean = convert_numpy_types(individual_model_predictions)
        
        response = {
            'success': True,
            'classification': str(classification),
            'confidence': float(round(confidence, 3)),
            'face_detection': {
                'face_count': face_count,
                'faces_detected': faces_detected,
                'multiple_faces': multiple_faces,
                'no_face_duration': int(no_face_duration)
            },
            'head_pose': {
                'direction': str(head_pose),
                'gaze_away': bool(gaze_away)
            },
            'phone_detection': {
                'detected': bool(phone_detected),
                'probability': float(round(phone_prob, 3))
            },
            'idle_detection': {
                'is_idle': bool(is_idle)
            },
            'audio_monitoring': {
                'noise_detected': bool(noise_detected),
                'level': float(round(audio_level, 3))
            },
            'probabilities': probabilities_clean,
            'events': convert_numpy_types(events),
            'credibility_score_delta': float(score_delta)
        }
        
        # Add individual model predictions if available
        if model_predictions_clean:
            response['ml_models'] = model_predictions_clean
        
        return jsonify(response)
        
    except Exception as e:
        import traceback
        logger.error(f"Error in comprehensive_proctoring: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc() if logger.level <= logging.DEBUG else None
        }), 500


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
                if i == 0:
                    logger.warning(f"Port {start_port} is in use, searching for alternative...")
                continue
    raise RuntimeError(f"Could not find a free port after {max_attempts} attempts")

if __name__ == '__main__':
    # Get port from environment or use default
    default_port = int(os.environ.get('PORT', 5002))
    
    # Find a free port
    port = find_free_port(default_port)
    
    if port != default_port:
        logger.warning(f"Port {default_port} was in use, using port {port} instead")
    
    logger.info(f"Starting Face Detection Service on port {port}")
    logger.info(f"Service URL: http://localhost:{port}")
    
    try:
        app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
    except KeyboardInterrupt:
        logger.info("Shutting down Face Detection Service...")
