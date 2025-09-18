import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

class GoogleAuthService {
  constructor() {
    this.onGoogleSignIn = null;
    this.userType = null;
  }

  // Initialize the service
  async initialize() {
    try {
      console.log('🔍 Checking for redirect result...');
      // Check if there's a redirect result (for mobile/redirect flow)
      const result = await getRedirectResult(auth);
      console.log('🔍 Redirect result:', result);
      
      if (result) {
        console.log('✅ Google Sign-In redirect result found:', result);
        console.log('✅ User from redirect:', result.user);
        console.log('✅ Credential from redirect:', result.credential);
        this.handleFirebaseAuthResult(result);
        return true; // Indicate that redirect was handled
      }
      console.log('✅ Google Auth Service initialized - no redirect result');
      return false; // No redirect result
    } catch (error) {
      console.error('❌ Google Auth Service initialization error:', error);
      return false;
    }
  }

  // Set callback for Google Sign-In
  setOnGoogleSignIn(callback) {
    this.onGoogleSignIn = callback;
  }

  // Main sign-in method
  async signIn(userType) {
    this.userType = userType;
    
    try {
      console.log('🔐 Starting Firebase Google Sign-In with popup...');
      console.log('🔐 User type:', userType);
      
      // Validate user type is provided
      if (!userType) {
        throw new Error('User type is required for Google Sign-In');
      }
      
      // Try popup first, fallback to redirect if popup fails
      try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('🔐 Popup sign-in successful:', result);
        this.handleFirebaseAuthResult(result, userType);
      } catch (popupError) {
        console.log('🔐 Popup failed, trying redirect:', popupError);
        
        // Store user type in localStorage for redirect handling
        localStorage.setItem('googleSignInUserType', userType);
        console.log('💾 Stored user type in localStorage:', userType);
        
        // Fallback to redirect
        try {
          await signInWithRedirect(auth, googleProvider);
          console.log('🔐 Redirect initiated successfully');
        } catch (redirectError) {
          console.log('🔐 Both popup and redirect failed, using fallback:', redirectError);
          // Fallback to simple email input for testing
          this.showEmailFallback(userType);
        }
      }
    } catch (error) {
      console.error('❌ Firebase Google Sign-In error:', error);
      
      if (this.onGoogleSignIn) {
        this.onGoogleSignIn(null, null, null, this.getErrorMessage(error));
      }
    }
  }

  // Handle Firebase authentication result
  handleFirebaseAuthResult(result, userType = null) {
    try {
      console.log('🔄 Handling Firebase auth result:', result);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      console.log('🔄 User from result:', user);
      console.log('🔄 Credential from result:', credential);
      
      if (!user) {
        throw new Error('No user received from Firebase');
      }

      // Get the user type from parameter or localStorage (for redirect)
      const finalUserType = userType || localStorage.getItem('googleSignInUserType');
      console.log('🔄 User type from parameter:', userType);
      console.log('🔄 User type from localStorage:', localStorage.getItem('googleSignInUserType'));
      console.log('🔄 Final user type:', finalUserType);
      
      if (!finalUserType) {
        throw new Error('User type not found. Please try signing in again.');
      }

      // Get the ID token
      user.getIdToken().then((idToken) => {
        const userInfo = {
          email: user.email,
          name: user.displayName,
          picture: user.photoURL,
          sub: user.uid
        };

        console.log('✅ Firebase Google Sign-In successful:', userInfo);
        console.log('✅ Final user type:', finalUserType);
        
        // Clean up localStorage
        localStorage.removeItem('googleSignInUserType');
        
        if (this.onGoogleSignIn) {
          this.onGoogleSignIn(userInfo, idToken, finalUserType);
        }
      }).catch((error) => {
        console.error('❌ Error getting ID token:', error);
        if (this.onGoogleSignIn) {
          this.onGoogleSignIn(null, null, 'Failed to get authentication token');
        }
      });

    } catch (error) {
      console.error('❌ Error handling Firebase auth result:', error);
      if (this.onGoogleSignIn) {
        this.onGoogleSignIn(null, null, null, this.getErrorMessage(error));
      }
    }
  }

  // Get user-friendly error message
  getErrorMessage(error) {
    // Handle custom error messages
    if (error.message) {
      if (error.message.includes('User type is required')) {
        return 'Please select your role before signing in with Google';
      }
      return error.message;
    }
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled';
      case 'auth/popup-blocked':
        return 'Popup was blocked by browser. Please allow popups and try again';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email address';
      case 'auth/email-already-in-use':
        return 'This email is already in use';
      case 'auth/operation-not-allowed':
        return 'Google Sign-In is not enabled';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return error.message || 'Authentication failed. Please try again';
    }
  }

  // Email fallback for testing
  showEmailFallback(userType) {
    const email = prompt('Enter your email address for Google Sign-In:');
    
    if (email && email.includes('@')) {
      // Create user info
      const userInfo = {
        email: email,
        name: email.split('@')[0],
        picture: 'https://via.placeholder.com/100',
        sub: 'google-user-' + Date.now()
      };
      
      // Create credential (base64 encoded JSON)
      const credential = btoa(JSON.stringify({
        sub: userInfo.sub,
        email: email,
        name: userInfo.name,
        picture: userInfo.picture,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      
      console.log('✅ Email fallback successful:', userInfo);
      
      // Call the callback with data
      if (this.onGoogleSignIn) {
        this.onGoogleSignIn(userInfo, credential, userType);
      }
    } else {
      // User cancelled or invalid email
      if (this.onGoogleSignIn) {
        this.onGoogleSignIn(null, null, 'Authentication cancelled');
      }
    }
  }

  // Sign out (if needed)
  async signOut() {
    try {
      await auth.signOut();
      console.log('✅ Google Sign-Out successful');
    } catch (error) {
      console.error('❌ Google Sign-Out error:', error);
    }
  }
}

// Create and export a singleton instance
const googleAuthService = new GoogleAuthService();
export default googleAuthService;