const admin = require('firebase-admin');

let firebaseApp = null;

const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (firebaseApp) {
      console.log('🔥 Firebase Admin SDK already initialized');
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
      // Use the service account key file
      const serviceAccount = require('../../evalon-app-firebase-adminsdk-fbsvc-6160ee1433.json');
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }

    console.log('🔥 Firebase Admin SDK initialized successfully');
    return firebaseApp;

  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    
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
