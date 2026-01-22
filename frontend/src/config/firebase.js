// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBpmIbFxb1IfEjMeWQafgpwAuu11YmKX0",
  authDomain: "evalon-app.firebaseapp.com",
  projectId: "evalon-app",
  storageBucket: "evalon-app.firebasestorage.app",
  messagingSenderId: "795807047739",
  appId: "1:795807047739:web:ebb7f7b37799dd4b1e7c1e",
  measurementId: "G-3FN4Z4XKM5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics conditionally (only in production and when available)
// This prevents network errors in development and when Analytics is unavailable
let analytics = null;

// Helper function to safely initialize Analytics
const initializeAnalytics = () => {
  // Only initialize Analytics in production or when explicitly enabled
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  const analyticsExplicitlyEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  const analyticsDisabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'false';
  
  // Skip Analytics in development unless explicitly enabled
  if (!isProduction && !analyticsExplicitlyEnabled) {
    console.log('📊 Firebase Analytics: Skipping initialization in development mode');
    console.log('   Set VITE_ENABLE_ANALYTICS=true to enable in development');
    return null;
  }
  
  // Skip if explicitly disabled
  if (analyticsDisabled) {
    console.log('📊 Firebase Analytics: Disabled via VITE_ENABLE_ANALYTICS=false');
    return null;
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log('📊 Firebase Analytics: Not available in server-side environment');
    return null;
  }

  try {
    analytics = getAnalytics(app);
    console.log('✅ Firebase Analytics initialized successfully');
    return analytics;
  } catch (error) {
    // Silently fail - Analytics is optional and shouldn't break the app
    console.warn('⚠️ Firebase Analytics initialization failed:', error.message);
    console.warn('   This is normal in development or when network issues occur');
    return null;
  }
};

// Initialize Analytics (will be null in development or if it fails)
try {
  analytics = initializeAnalytics();
} catch (error) {
  console.warn('⚠️ Analytics initialization error (non-critical):', error.message);
}

// Export analytics (may be null in development)
export { analytics };

// Export a getter function for analytics (for lazy initialization)
export const getAnalyticsInstance = () => {
  if (!analytics) {
    analytics = initializeAnalytics();
  }
  return analytics;
};

export default app;
