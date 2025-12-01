import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import AIProctoringService from '../services/aiProctoringService';

const AIModelTestPage = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [currentClassification, setCurrentClassification] = useState(null);
  const [credibilityScore, setCredibilityScore] = useState(0);
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
  const scoreHistoryRef = useRef([]);
  const lastFaceDetectedRef = useRef(Date.now());
  const lastActivityRef = useRef(Date.now());
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const activityCheckRef = useRef(null);
  const isProcessingFrameRef = useRef(false); // Prevent concurrent frame processing

  // Check service availability on mount
  useEffect(() => {
    checkServiceAvailability();
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

      // Start classification loop (every 2 seconds)
      frameCountRef.current = 0;
      scoreHistoryRef.current = [];
      setCredibilityScore(0);
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
      
      // Start classification loop (every 300ms for FAST multiple face detection)
      intervalRef.current = setInterval(async () => {
        try {
          await classifyFrame();
        } catch (error) {
          console.error('❌ Error in classifyFrame:', error);
        }
      }, 300); // Reduced from 2000ms to 300ms for faster detection (3.3 FPS → ~33 FPS equivalent processing)
      
      // Classify immediately
      setTimeout(async () => {
        try {
          await classifyFrame();
        } catch (error) {
          console.error('❌ Error in initial classifyFrame:', error);
        }
      }, 200); // Reduced from 1000ms to 200ms for faster initial detection

      setIsMonitoring(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      alert('Failed to access camera. Please ensure camera permissions are granted.');
      setIsLoading(false);
    }
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

      // Call comprehensive proctoring (non-blocking for fast detection)
      const result = await AIProctoringService.comprehensiveProctoring(
        base64Image,
        currentNoFaceDuration,
        isIdle,
        audioLevel
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

        // Update score
        scoreHistoryRef.current.push(scoreDelta);
        const newScore = scoreHistoryRef.current.reduce((sum, delta) => sum + delta, 0);
        const finalScore = frameCountRef.current > 0 ? newScore / frameCountRef.current : 0;
        
        setCredibilityScore(finalScore);
        setTotalFrames(frameCountRef.current);

        // Update current classification with all details
        setCurrentClassification({
          classification,
          confidence,
          faceCount: result.face_detection.face_count,
          multipleFaces: result.face_detection.multiple_faces,
          probabilities: result.probabilities,
          headPose: result.head_pose,
          phoneDetected: result.phone_detection.detected,
          phoneProb: result.phone_detection.probability,
          isIdle: result.idle_detection.is_idle,
          audioLevel: result.audio_monitoring.level,
          noiseDetected: result.audio_monitoring.noise_detected,
          mlModels: result.ml_models || null  // Add individual model predictions
        });

        // Add events from result
        result.events.forEach(event => {
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

        // Log multiple faces detection immediately for fast feedback
        if (result.face_detection.multiple_faces) {
          console.warn(`⚠️ MULTIPLE FACES DETECTED: ${result.face_detection.face_count} faces`);
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

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        AI Suspicious Activity Model Test
      </Typography>

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
                  {currentClassification.multipleFaces && ' (Multiple detected!)'}
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
            <Typography variant="h3" sx={{ 
              color: credibilityScore >= 0.5 ? '#4caf50' : credibilityScore >= 0 ? '#ff9800' : '#f44336',
              fontWeight: 'bold'
            }}>
              {credibilityScore.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Frames: {totalFrames}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Score range: -2.0 to 1.0
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

              {/* Individual ML Model Predictions - Simple Format */}
              {currentClassification.mlModels && (
                <Paper sx={{ mb: 3, p: 2, bgcolor: 'grey.50', border: '2px solid', borderColor: 'primary.main' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    📊 ML Model Predictions
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {Object.entries(currentClassification.mlModels).map(([modelName, prediction]) => {
                      const modelDisplayNames = {
                        'knn': 'KNN',
                        'naive_bayes': 'Naive Bayes',
                        'decision_tree': 'Decision Tree',
                        'svm': 'SVM',
                        'ensemble': 'Ensemble'
                      };
                      
                      const modelIcons = {
                        'knn': '🔍',
                        'naive_bayes': '📊',
                        'decision_tree': '🌳',
                        'svm': '⚡',
                        'ensemble': '🎯'
                      };

                      return (
                        <Box 
                          key={modelName}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'white',
                            border: '1px solid',
                            borderColor: prediction.classification === 'normal' ? 'success.main' :
                                         prediction.classification === 'suspicious' ? 'warning.main' :
                                         'error.main',
                            boxShadow: 1
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                                {modelIcons[modelName] || '🤖'}
                              </Typography>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                  {modelDisplayNames[modelName] || modelName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  Confidence: {(prediction.confidence * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={getClassificationLabel(prediction.classification)}
                              color={getClassificationColor(prediction.classification)}
                              size="medium"
                              sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}
                            />
                          </Box>
                          
                          {/* Simple probability bars */}
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                            {Object.entries(prediction.probabilities || {}).map(([probKey, probValue]) => (
                              <Box key={probKey} sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ 
                                  display: 'block', 
                                  fontSize: '0.65rem',
                                  fontWeight: 'medium',
                                  mb: 0.25,
                                  textTransform: 'capitalize',
                                  color: getClassificationColor(probKey) === 'success' ? '#4caf50' :
                                         getClassificationColor(probKey) === 'warning' ? '#ff9800' : '#f44336'
                                }}>
                                  {probKey.replace('_', ' ')}
                                </Typography>
                                <Box sx={{
                                  width: '100%',
                                  height: 6,
                                  bgcolor: 'grey.300',
                                  borderRadius: 0.5,
                                  overflow: 'hidden',
                                  position: 'relative'
                                }}>
                                  <Box sx={{
                                    width: `${probValue * 100}%`,
                                    height: '100%',
                                    bgcolor: getClassificationColor(probKey) === 'success' ? '#4caf50' :
                                             getClassificationColor(probKey) === 'warning' ? '#ff9800' : '#f44336',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </Box>
                                <Typography variant="caption" sx={{ 
                                  fontSize: '0.6rem',
                                  color: 'text.secondary',
                                  mt: 0.25,
                                  display: 'block',
                                  textAlign: 'center'
                                }}>
                                  {(probValue * 100).toFixed(0)}%
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              )}
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
  );
};

export default AIModelTestPage;
