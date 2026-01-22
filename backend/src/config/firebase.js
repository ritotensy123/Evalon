const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

let firebaseApp = null;

const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (firebaseApp) {
      logger.info('🔥 Firebase Admin SDK already initialized');
      return firebaseApp;
    }

    // Initialize Firebase Admin SDK
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Use service account key from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    } else {
      // Try to use the service account key file if it exists
      const path = require('path');
      const fs = require('fs');
      const serviceAccountPath = path.join(__dirname, '../../evalon-app-firebase-adminsdk-fbsvc-6160ee1433.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
      } else {
        // No Firebase credentials - use mock for development
        logger.warn('⚠️ Firebase credentials file not found. Using mock Firebase for development.');
        throw new Error('Firebase credentials not found - using mock');
      }
    }

    logger.info('🔥 Firebase Admin SDK initialized successfully');
    return firebaseApp;

  } catch (error) {
    logger.error('❌ Firebase initialization error', { error: error.message, stack: error.stack });
    
    // Return mock Firebase app for development
    firebaseApp = {
      auth: () => ({
        verifyIdToken: async (token) => {
          return {
            uid: 'mock-uid',
            email: 'mock@example.com',
            email_verified: true
          };
        }
      })
    };
    
    return firebaseApp;
  }
};

const getFirebaseApp = () => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};

module.exports = {
  initializeFirebase,
  getFirebaseApp
};
