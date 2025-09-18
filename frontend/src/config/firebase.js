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

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;
