/**
 * AI Proctoring Service
 * Handles communication with the Python AI face detection service
 */

// Dynamic port detection - tries ports 5002-5012
let AI_SERVICE_URL = 'http://localhost:5002';

// Function to find the correct port
async function findServicePort() {
  // Try default port first
  for (let port = 5002; port <= 5012; port++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        AI_SERVICE_URL = `http://localhost:${port}`;
        console.log(`✅ AI Service found on port ${port}`);
        return port;
      }
    } catch (error) {
      // Continue to next port
    }
  }
  return null;
}

class AIProctoringService {
  static servicePort = null;
  
  /**
   * Initialize service and find correct port
   */
  static async initialize() {
    if (!this.servicePort) {
      this.servicePort = await findServicePort();
    }
    return this.servicePort !== null;
  }
  
  /**
   * Health check for AI service
   */
  static async checkHealth() {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
    } catch (error) {
      console.error('AI Service health check failed:', error);
      throw error;
    }
  }

  /**
   * Detect faces in a single image
   * @param {string} imageBase64 - Base64 encoded image
   * @returns {Promise<Object>} Detection results
   */
  static async detectFaces(imageBase64) {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/api/detect-faces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Face detection failed:', error);
      throw error;
    }
  }

  /**
   * Validate webcam setup with multiple frames
   * @param {Array<string>} images - Array of base64 encoded images
   * @param {number} durationSeconds - Duration in seconds
   * @returns {Promise<Object>} Validation results
   */
  static async validateSetup(images, durationSeconds = 3) {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/api/validate-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: images,
          duration_seconds: durationSeconds,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Setup validation failed:', error);
      throw error;
    }
  }

  /**
   * Capture frame from webcam stream
   * @param {MediaStream} stream - Webcam media stream
   * @returns {Promise<string>} Base64 encoded image
   */
  static captureFrame(stream) {
    return new Promise((resolve, reject) => {
      try {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          // Create canvas to capture frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);

          // Convert to base64
          const base64Image = canvas.toDataURL('image/jpeg', 0.8);
          
          // Cleanup
          video.pause();
          video.srcObject = null;
          
          resolve(base64Image);
        };

        video.onerror = (error) => {
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Validate webcam with face detection
   * @param {MediaStream} stream - Webcam media stream
   * @param {number} durationMs - Duration to capture frames in milliseconds
   * @param {number} intervalMs - Interval between captures in milliseconds
   * @returns {Promise<Object>} Validation results
   */
  static async validateWebcamWithFaceDetection(stream, durationMs = 3000, intervalMs = 500) {
    try {
      console.log('Starting webcam validation with AI face detection...');
      
      const frames = [];
      const startTime = Date.now();
      
      // Capture frames at intervals
      const captureInterval = setInterval(async () => {
        try {
          const frame = await this.captureFrame(stream);
          frames.push(frame);
          console.log(`Captured frame ${frames.length}`);
        } catch (error) {
          console.error('Error capturing frame:', error);
        }
      }, intervalMs);
      
      // Wait for duration
      await new Promise(resolve => setTimeout(resolve, durationMs));
      clearInterval(captureInterval);
      
      console.log(`Captured ${frames.length} frames for validation`);
      
      // Validate setup with captured frames
      const result = await this.validateSetup(frames, durationMs / 1000);
      
      return result;
    } catch (error) {
      console.error('Webcam validation failed:', error);
      throw error;
    }
  }

  /**
   * Classify behavior using trained CNN model
   * @param {string} imageBase64 - Base64 encoded image
   * @returns {Promise<Object>} Classification results
   */
  static async classifyBehavior(imageBase64) {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/api/classify-behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Behavior classification failed:', error);
      throw error;
    }
  }

  /**
   * Comprehensive proctoring analysis with all features
   * @param {string} imageBase64 - Base64 encoded image
   * @param {number} noFaceDuration - Duration in seconds with no face detected
   * @param {boolean} isIdle - Whether user is idle (no keyboard/mouse activity)
   * @param {number} audioLevel - Normalized audio level (0-1)
   * @returns {Promise<Object>} Comprehensive proctoring results
   */
  static async comprehensiveProctoring(imageBase64, noFaceDuration = 0, isIdle = false, audioLevel = 0.0) {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/api/comprehensive-proctoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          no_face_duration: noFaceDuration,
          is_idle: isIdle,
          audio_level: audioLevel,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Comprehensive proctoring failed:', error);
      throw error;
    }
  }

  /**
   * Check if AI service is available
   * @returns {Promise<boolean>}
   */
  static async isAvailable() {
    try {
      const response = await this.checkHealth();
      return response.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

export default AIProctoringService;
