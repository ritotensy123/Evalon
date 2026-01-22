import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Button, Typography, Paper, Chip, CircularProgress, Alert, 
  Tabs, Tab, TextField, LinearProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Grid, Card, 
  CardContent, Divider, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, PlayArrow, Stop, Refresh, Delete, Visibility, Publish, SwitchLeft } from '@mui/icons-material';
import AIProctoringService from '../services/aiProctoringService';
import AIModelService from '../services/aiModelService';

/**
 * CREDIBILITY SCORE CONSTANTS
 * These match the backend for consistent scoring display
 */
const CREDIBILITY_INITIAL = 100.0;
const CREDIBILITY_MIN = 0.0;
const CREDIBILITY_MAX = 100.0;
const SCORE_HISTORY_MAX_SIZE = 30; // Sliding window size for score history

const AIModelTestPage = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [currentClassification, setCurrentClassification] = useState(null);
  // FIX: Start with proper initial credibility score
  const [credibilityScore, setCredibilityScore] = useState(CREDIBILITY_INITIAL);
  const [totalFrames, setTotalFrames] = useState(0);
  const [events, setEvents] = useState([]);
  const [serviceAvailable, setServiceAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [noFaceDuration, setNoFaceDuration] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0.0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const frameCountRef = useRef(0);
  // FIX: Score history is now managed by backend, we just display the returned score
  const scoreHistoryRef = useRef([]);
  const lastFaceDetectedRef = useRef(Date.now());
  const lastActivityRef = useRef(Date.now());
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const activityCheckRef = useRef(null);
  const isProcessingFrameRef = useRef(false); // Prevent concurrent frame processing
  const sessionIdRef = useRef(`session_${Date.now()}`); // Unique session ID
  
  // Model training state
  const [activeTab, setActiveTab] = useState(0);
  const [models, setModels] = useState([]);
  const [activeModelId, setActiveModelId] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [trainingConfig, setTrainingConfig] = useState({
    name: '',
    description: '',
    epochs: 30,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
    datasetPath: '/content/Dataset'
  });
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const trainingProgressIntervalRef = useRef(null);

  // Check service availability on mount
  useEffect(() => {
    checkServiceAvailability();
    loadModels();
  }, []);
  
  // Cleanup training progress polling
  useEffect(() => {
    return () => {
      if (trainingProgressIntervalRef.current) {
        clearInterval(trainingProgressIntervalRef.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const checkServiceAvailability = async () => {
    try {
      const available = await AIProctoringService.isAvailable();
      setServiceAvailable(available);
    } catch (error) {
      setServiceAvailable(false);
    }
  };

  const startMonitoring = async () => {
    try {
      setIsLoading(true);
      
      // Generate new session ID for this monitoring session
      sessionIdRef.current = `session_${Date.now()}`;
      
      // FIX: Reset backend session state to prevent accumulation bugs
      try {
        await fetch(`${await getAIServiceUrl()}/api/reset-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionIdRef.current })
        });
        console.log('✅ Backend session reset');
      } catch (e) {
        console.warn('Could not reset backend session:', e);
      }
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to load before starting monitoring
        await new Promise((resolve, reject) => {
          if (videoRef.current) {
            const video = videoRef.current;
            const onLoadedMetadata = () => {
              console.log('✅ Video metadata loaded:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
              });
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
              video.removeEventListener('error', onError);
              resolve();
            };
            const onError = (error) => {
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
              video.removeEventListener('error', onError);
              reject(error);
            };
            
            video.addEventListener('loadedmetadata', onLoadedMetadata);
            video.addEventListener('error', onError);
            video.play().catch(reject);
          } else {
            reject(new Error('Video ref is null'));
          }
        });
      }

      // FIX: Reset all state with proper initial values
      frameCountRef.current = 0;
      scoreHistoryRef.current = []; // Cleared, but we now use backend score
      setCredibilityScore(CREDIBILITY_INITIAL); // Start at 100, not 0
      setTotalFrames(0);
      setEvents([]);
      setCurrentClassification(null);
      setNoFaceDuration(0);
      setIsIdle(false);
      setAudioLevel(0.0);
      lastFaceDetectedRef.current = Date.now();
      lastActivityRef.current = Date.now();

      // Wait a bit for video to be ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Start classification loop (every 500ms for balanced detection)
      // FIX: 300ms was too aggressive and could cause duplicate processing
      intervalRef.current = setInterval(async () => {
        try {
          await classifyFrame();
        } catch (error) {
          console.error('❌ Error in classifyFrame:', error);
        }
      }, 500); // Changed from 300ms to 500ms for more stable processing
      
      // Classify immediately
      setTimeout(async () => {
        try {
          await classifyFrame();
        } catch (error) {
          console.error('❌ Error in initial classifyFrame:', error);
        }
      }, 200);

      setIsMonitoring(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      alert('Failed to access camera. Please ensure camera permissions are granted.');
      setIsLoading(false);
    }
  };
  
  // Helper to get AI service URL (matches AIProctoringService logic)
  const getAIServiceUrl = async () => {
    // Try to use the service URL from config
    const baseUrl = 'http://localhost';
    const ports = [5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010, 5011, 5012];
    
    for (const port of ports) {
      try {
        const response = await fetch(`${baseUrl}:${port}/health`, { method: 'GET' });
        if (response.ok) {
          return `${baseUrl}:${port}`;
        }
      } catch {
        continue;
      }
    }
    return `${baseUrl}:5002`; // Default fallback
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsMonitoring(false);
    setCurrentClassification(null);
  };

  // Track keyboard/mouse activity
  useEffect(() => {
    if (!isMonitoring) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setIsIdle(false);
    };

    const checkIdle = () => {
      const idleThreshold = 10000; // 10 seconds
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      setIsIdle(timeSinceActivity > idleThreshold);
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    // Check idle status every second
    activityCheckRef.current = setInterval(checkIdle, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (activityCheckRef.current) {
        clearInterval(activityCheckRef.current);
      }
    };
  }, [isMonitoring]);

  // Track audio levels (optional)
  useEffect(() => {
    if (!isMonitoring) return;

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
        microphoneRef.current.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;

        const checkAudio = () => {
          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average / 255.0); // Normalize to 0-1
          }
        };

        const audioInterval = setInterval(checkAudio, 500);
        
        return () => {
          clearInterval(audioInterval);
          if (audioContextRef.current) {
            audioContextRef.current.close();
          }
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (error) {
        console.warn('Audio access denied or unavailable:', error);
        // Audio monitoring is optional, continue without it
      }
    };

    initAudio();
  }, [isMonitoring]);

  const classifyFrame = async () => {
    // Prevent concurrent frame processing for faster detection
    if (isProcessingFrameRef.current) {
      return; // Skip if already processing a frame
    }

    if (!videoRef.current || !canvasRef.current || !serviceAvailable) {
      return;
    }

    // Mark as processing
    isProcessingFrameRef.current = true;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Check if video is ready
      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        isProcessingFrameRef.current = false;
        return;
      }
      
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions (only if changed for performance)
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Capture frame
      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.75); // Slightly lower quality for faster encoding
      
      if (!base64Image || base64Image.length < 100) {
        isProcessingFrameRef.current = false;
        return;
      }

      // Calculate no_face_duration
      const currentNoFaceDuration = noFaceDuration;

      // Call comprehensive proctoring using TEST endpoint (no auth required for test page)
      const result = await AIProctoringService.comprehensiveProctoring(
        base64Image,
        currentNoFaceDuration,
        isIdle,
        audioLevel,
        true  // useTestEndpoint = true for AI Model Test page
      );

      if (result.success) {
        frameCountRef.current++;
        
        const classification = result.classification;
        const confidence = result.confidence;
        const scoreDelta = result.credibility_score_delta;

        // Update no_face_duration based on face detection
        if (result.face_detection.faces_detected) {
          lastFaceDetectedRef.current = Date.now();
          setNoFaceDuration(0);
        } else {
          const duration = Math.floor((Date.now() - lastFaceDetectedRef.current) / 1000);
          setNoFaceDuration(duration);
        }

        // FIX: Use credibility score from backend (properly managed with EMA)
        // The backend handles all smoothing, clamping, and accumulation prevention
        if (result.credibility_score !== undefined) {
          setCredibilityScore(result.credibility_score);
        } else {
          // Fallback: keep local history but with sliding window
          scoreHistoryRef.current.push(scoreDelta);
          // FIX: Limit history size to prevent accumulation
          if (scoreHistoryRef.current.length > SCORE_HISTORY_MAX_SIZE) {
            scoreHistoryRef.current.shift(); // Remove oldest
          }
          // Calculate average over sliding window
          const sum = scoreHistoryRef.current.reduce((a, b) => a + b, 0);
          const avgDelta = sum / scoreHistoryRef.current.length;
          // Convert to 0-100 scale: avgDelta ranges from -2 to +1
          // Map: -2 -> 0, +1 -> 100 (linear interpolation)
          const normalizedScore = Math.max(CREDIBILITY_MIN, 
            Math.min(CREDIBILITY_MAX, ((avgDelta + 2) / 3) * 100));
          setCredibilityScore(normalizedScore);
        }
        
        setTotalFrames(frameCountRef.current);

        // Update current classification with all details
        // FIX: Include new multi_faces_confirmed field from backend
        setCurrentClassification({
          classification,
          confidence,
          faceCount: result.face_detection.face_count,
          multipleFaces: result.face_detection.multiple_faces,
          multipleFacesConfirmed: result.face_detection.multiple_faces_confirmed || false,
          probabilities: result.probabilities,
          headPose: result.head_pose,
          phoneDetected: result.phone_detection.detected,
          phoneProb: result.phone_detection.probability,
          isIdle: result.idle_detection.is_idle,
          audioLevel: result.audio_monitoring.level,
          noiseDetected: result.audio_monitoring.noise_detected,
          frameNumber: result.frame_number || frameCountRef.current,
        });

        // Add events from result - filter to avoid spam
        // FIX: Only add non-info events or limit info events
        const significantEvents = result.events.filter(event => 
          event.severity !== 'info' || event.type !== 'frame_analysis'
        );
        
        significantEvents.forEach(event => {
          const eventObj = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            type: event.type,
            classification,
            confidence,
            reason: event.message,
            severity: event.severity === 'very_suspicious' ? 'error' : 
                    event.severity === 'suspicious' ? 'warning' : 
                    event.severity === 'warning' ? 'warning' : 'info',
            scoreDelta
          };

          setEvents(prev => [eventObj, ...prev].slice(0, 50)); // Keep last 50 events
        });

        // Log multiple faces detection - differentiate between detected and confirmed
        if (result.face_detection.multiple_faces_confirmed) {
          console.warn(`🚨 MULTIPLE FACES CONFIRMED: ${result.face_detection.face_count} faces (persisted)`);
        } else if (result.face_detection.multiple_faces) {
          console.log(`⚠️ Multiple faces detected (awaiting confirmation): ${result.face_detection.face_count} faces`);
        }
      } else {
        // Add error event
        const errorEvent = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          classification: 'unknown',
          confidence: 0,
          reason: result.error || 'Unknown error in proctoring',
          severity: 'error',
          scoreDelta: 0
        };
        setEvents(prev => [errorEvent, ...prev].slice(0, 50));
      }
    } catch (error) {
      // Only log critical errors
      if (error.message && !error.message.includes('aborted')) {
        console.error('Error classifying frame:', error.message);
      }
      // Add error event
      const errorEvent = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        classification: 'unknown',
        confidence: 0,
        reason: `Error: ${error.message}`,
        severity: 'error',
        scoreDelta: 0
      };
      setEvents(prev => [errorEvent, ...prev].slice(0, 50));
    } finally {
      // Always release the processing flag for next frame
      isProcessingFrameRef.current = false;
    }
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'normal':
        return 'success';
      case 'suspicious':
        return 'warning';
      case 'very_suspicious':
        return 'error';
      default:
        return 'default';
    }
  };

  const getClassificationLabel = (classification) => {
    switch (classification) {
      case 'normal':
        return 'Normal';
      case 'suspicious':
        return 'Suspicious';
      case 'very_suspicious':
        return 'Very Suspicious';
      default:
        return 'Unknown';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      case 'info':
        return '#2196f3';
      default:
        return '#757575';
    }
  };

  // Model management functions
  const loadModels = async () => {
    try {
      const response = await AIModelService.getAllModels();
      if (response.success) {
        setModels(response.models || []);
        setActiveModelId(response.activeModelId);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const handleStartTraining = async () => {
    try {
      setIsTraining(true);
      setTrainingProgress({ status: 'pending', progress: 0 });
      
      const response = await AIModelService.startTraining({
        name: trainingConfig.name,
        description: trainingConfig.description,
        trainingConfig: {
          epochs: trainingConfig.epochs,
          batchSize: trainingConfig.batchSize,
          learningRate: trainingConfig.learningRate,
          validationSplit: trainingConfig.validationSplit,
          datasetPath: trainingConfig.datasetPath
        }
      });
      
      if (response.success) {
        setShowTrainingForm(false);
        const modelId = response.modelId;
        
        // Poll for progress
        trainingProgressIntervalRef.current = setInterval(async () => {
          try {
            const progressResponse = await AIModelService.getTrainingProgress(modelId);
            if (progressResponse.success) {
              setTrainingProgress(progressResponse.progress);
              
              if (progressResponse.status === 'completed' || progressResponse.status === 'failed') {
                clearInterval(trainingProgressIntervalRef.current);
                setIsTraining(false);
                loadModels(); // Reload models
              }
            }
          } catch (error) {
            console.error('Error fetching progress:', error);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error starting training:', error);
      setIsTraining(false);
      alert('Failed to start training: ' + error.message);
    }
  };

  const handlePublishModel = async (modelId) => {
    try {
      const response = await AIModelService.publishModel(modelId);
      if (response.success) {
        await loadModels();
        alert('Model published successfully!');
      }
    } catch (error) {
      console.error('Error publishing model:', error);
      alert('Failed to publish model: ' + error.message);
    }
  };

  const handleSwitchModel = async (modelId) => {
    try {
      const response = await AIModelService.switchModel(modelId);
      if (response.success) {
        await loadModels();
        alert('Model switched successfully!');
      }
    } catch (error) {
      console.error('Error switching model:', error);
      alert('Failed to switch model: ' + error.message);
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (!window.confirm('Are you sure you want to delete this model?')) {
      return;
    }
    
    try {
      const response = await AIModelService.deleteModel(modelId);
      if (response.success) {
        await loadModels();
        alert('Model deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Failed to delete model: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'trained':
        return 'info';
      case 'training':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        AI Model Training & Testing Console
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Test Model" />
          <Tab label="Train & Manage Models" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <Box>
          {!serviceAvailable && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              AI service is not available. Please ensure the Python service is running on port 5002-5012.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
        {/* Left Side - Video Feed */}
        <Paper sx={{ p: 2, flex: 1, minWidth: { xs: '100%', lg: '600px' } }}>
          <Typography variant="h6" gutterBottom>
            Webcam Feed
          </Typography>
          
          <Box sx={{ position: 'relative', mb: 2 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxWidth: '640px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#000'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {currentClassification && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Chip
                  label={getClassificationLabel(currentClassification.classification)}
                  color={getClassificationColor(currentClassification.classification)}
                  sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Confidence: {(currentClassification.confidence * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Faces: {currentClassification.faceCount} 
                  {currentClassification.multipleFacesConfirmed && 
                    <span style={{ color: '#f44336', fontWeight: 'bold' }}> (CONFIRMED - Multiple faces!)</span>}
                  {currentClassification.multipleFaces && !currentClassification.multipleFacesConfirmed && 
                    <span style={{ color: '#ff9800' }}> (Detected, awaiting confirmation)</span>}
                  {noFaceDuration > 0 && ` | No face: ${noFaceDuration}s`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Head Pose: {currentClassification.headPose?.direction || 'unknown'}
                  {currentClassification.headPose?.gaze_away && ' (Looking away)'}
                </Typography>
                {currentClassification.phoneDetected && (
                  <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
                    Phone Detected: {(currentClassification.phoneProb * 100).toFixed(1)}%
                  </Typography>
                )}
                {currentClassification.isIdle && (
                  <Typography variant="body2" color="warning.main">
                    Idle: No keyboard/mouse activity
                  </Typography>
                )}
                {currentClassification.noiseDetected && (
                  <Typography variant="body2" color="warning.main">
                    Audio Noise: {(currentClassification.audioLevel * 100).toFixed(1)}%
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {!isMonitoring ? (
              <Button
                variant="contained"
                color="primary"
                onClick={startMonitoring}
                disabled={isLoading || !serviceAvailable}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? 'Starting...' : 'Start Monitoring'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                onClick={stopMonitoring}
              >
                Stop Monitoring
              </Button>
            )}
          </Box>
        </Paper>

        {/* Right Side - Score and Events */}
        <Paper sx={{ p: 2, flex: 1, minWidth: { xs: '100%', lg: '400px' }, maxHeight: '80vh', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Credibility Score
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            {/* FIX: Score is now 0-100 scale from backend */}
            <Typography variant="h3" sx={{ 
              color: credibilityScore >= 70 ? '#4caf50' : credibilityScore >= 40 ? '#ff9800' : '#f44336',
              fontWeight: 'bold'
            }}>
              {credibilityScore.toFixed(1)}
            </Typography>
            {/* Visual progress bar for score */}
            <Box sx={{ 
              width: '100%', 
              height: 10, 
              bgcolor: 'grey.300', 
              borderRadius: 1,
              overflow: 'hidden',
              mb: 1
            }}>
              <Box sx={{
                width: `${Math.min(100, Math.max(0, credibilityScore))}%`,
                height: '100%',
                bgcolor: credibilityScore >= 70 ? '#4caf50' : credibilityScore >= 40 ? '#ff9800' : '#f44336',
                transition: 'width 0.3s ease-in-out, background-color 0.3s ease-in-out'
              }} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Total Frames: {totalFrames}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Score range: 0 (suspicious) to 100 (trusted)
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              • Uses EMA smoothing for stability
              • Requires sustained signals to change
            </Typography>
          </Box>

          {currentClassification && (
            <>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Ensemble Final Probabilities
                </Typography>
                {Object.entries(currentClassification.probabilities).map(([key, value]) => (
                  <Box key={key} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {key.replace('_', ' ')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {(value * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: '100%', 
                      height: 8, 
                      bgcolor: 'grey.300', 
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{
                        width: `${value * 100}%`,
                        height: '100%',
                        bgcolor: getClassificationColor(key) === 'success' ? '#4caf50' :
                                 getClassificationColor(key) === 'warning' ? '#ff9800' : '#f44336'
                      }} />
                    </Box>
                  </Box>
                ))}
              </Box>

            </>
          )}

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Recent Events ({events.length})
          </Typography>
          
          <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {events.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No events yet. Start monitoring to see classification results.
                {isMonitoring && (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                    Waiting for detection... Check browser console for logs.
                  </Typography>
                )}
              </Typography>
            ) : (
              events.map((event) => (
                <Paper
                  key={event.id}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderLeft: `4px solid ${getSeverityColor(event.severity)}`,
                    bgcolor: 'background.default'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {event.timestamp}
                    </Typography>
                    <Chip
                      label={getClassificationLabel(event.classification)}
                      color={getClassificationColor(event.classification)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {event.reason}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary">
                      Confidence: {(event.confidence * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Score: {event.scoreDelta > 0 ? '+' : ''}{event.scoreDelta}
                    </Typography>
                    {event.type && (
                      <Typography variant="caption" color="text.secondary">
                        Type: {event.type.replace('_', ' ')}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        </Paper>
        </Box>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">AI Model Management</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowTrainingForm(true)}
                disabled={isTraining}
              >
                Start New Training
              </Button>
            </Box>

            {isTraining && trainingProgress && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Training Progress: {trainingProgress.status}
                </Typography>
                {trainingProgress.progress !== undefined && (
                  <>
                    <LinearProgress
                      variant="determinate"
                      value={trainingProgress.progress * 100}
                      sx={{ mb: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(trainingProgress.progress * 100)}% Complete
                    </Typography>
                  </>
                )}
                {trainingProgress.epoch && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Epoch: {trainingProgress.epoch}/{trainingProgress.totalEpochs}
                  </Typography>
                )}
                {trainingProgress.loss !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    Loss: {trainingProgress.loss.toFixed(4)}
                  </Typography>
                )}
                {trainingProgress.val_loss !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    Validation Loss: {trainingProgress.val_loss.toFixed(4)}
                  </Typography>
                )}
              </Paper>
            )}

            <Grid container spacing={3}>
              {models.map((model) => (
                <Grid item xs={12} md={6} lg={4} key={model.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="div">
                          {model.name}
                        </Typography>
                        <Chip
                          label={model.status}
                          color={getStatusColor(model.status)}
                          size="small"
                        />
                      </Box>
                      
                      {model.status === 'published' && (
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                          sx={{ mb: 1 }}
                          icon={<SwitchLeft />}
                        />
                      )}

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {model.description || 'No description'}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="caption" color="text.secondary" display="block">
                        Created: {new Date(model.createdAt).toLocaleDateString()}
                      </Typography>
                      {model.trainedAt && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Trained: {new Date(model.trainedAt).toLocaleDateString()}
                        </Typography>
                      )}
                      {model.accuracy !== undefined && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Accuracy: {(model.accuracy * 100).toFixed(2)}%
                        </Typography>
                      )}
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {model.status === 'trained' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<Publish />}
                          onClick={() => handlePublishModel(model.id)}
                          fullWidth
                        >
                          Publish
                        </Button>
                      )}
                      {model.status === 'published' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          startIcon={<SwitchLeft />}
                          onClick={() => handleSwitchModel(model.id)}
                          disabled={activeModelId === model.id}
                          fullWidth
                        >
                          {activeModelId === model.id ? 'Currently Active' : 'Switch To'}
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteModel(model.id)}
                        disabled={model.status === 'published'}
                        fullWidth
                      >
                        Delete
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {models.length === 0 && (
              <Alert severity="info" sx={{ mt: 3 }}>
                No models found. Start a new training to create a model.
              </Alert>
            )}

            {/* Training Form Dialog */}
            <Dialog open={showTrainingForm} onClose={() => setShowTrainingForm(false)} maxWidth="md" fullWidth>
              <DialogTitle>Start Model Training</DialogTitle>
              <DialogContent>
                <TextField
                  fullWidth
                  label="Model Name"
                  value={trainingConfig.name}
                  onChange={(e) => setTrainingConfig({ ...trainingConfig, name: e.target.value })}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={trainingConfig.description}
                  onChange={(e) => setTrainingConfig({ ...trainingConfig, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={3}
                />
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Epochs"
                      type="number"
                      value={trainingConfig.epochs}
                      onChange={(e) => setTrainingConfig({ ...trainingConfig, epochs: parseInt(e.target.value) || 30 })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Batch Size"
                      type="number"
                      value={trainingConfig.batchSize}
                      onChange={(e) => setTrainingConfig({ ...trainingConfig, batchSize: parseInt(e.target.value) || 32 })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Learning Rate"
                      type="number"
                      step="0.0001"
                      value={trainingConfig.learningRate}
                      onChange={(e) => setTrainingConfig({ ...trainingConfig, learningRate: parseFloat(e.target.value) || 0.001 })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Validation Split"
                      type="number"
                      step="0.01"
                      value={trainingConfig.validationSplit}
                      onChange={(e) => setTrainingConfig({ ...trainingConfig, validationSplit: parseFloat(e.target.value) || 0.2 })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Dataset Path"
                      value={trainingConfig.datasetPath}
                      onChange={(e) => setTrainingConfig({ ...trainingConfig, datasetPath: e.target.value })}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowTrainingForm(false)}>Cancel</Button>
                <Button
                  onClick={handleStartTraining}
                  variant="contained"
                  color="primary"
                  disabled={!trainingConfig.name || isTraining}
                >
                  Start Training
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default AIModelTestPage;
