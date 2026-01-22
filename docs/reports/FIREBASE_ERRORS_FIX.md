# Firebase & Google Tag Manager Network Errors - Fix Guide

## Problem Summary

You were experiencing these network errors:
- `firebase.googleapis.com/v1alpha/projects/-/apps/.../webConfig:1 Failed to load resource: net::ERR_ADDRESS_INVALID`
- `securetoken.googleapis.com/v1/token?... Failed to load resource: net::ERR_NETWORK_CHANGED`
- `www.googletagmanager.com/gtag/js?... Failed to load resource: net::ERR_NETWORK_CHANGED`

## Root Cause

Firebase Analytics was being initialized unconditionally on every page load, even in development mode. This caused:
1. Firebase Analytics to attempt loading Google Tag Manager scripts
2. Network requests to Firebase services that weren't necessary in development
3. Errors when network connectivity was unstable or services were unavailable

## Solution Implemented

### Changes Made

1. **Conditional Analytics Initialization** (`frontend/src/config/firebase.js`)
   - Analytics now only initializes in production builds by default
   - Added environment variable support for explicit control
   - Wrapped initialization in try-catch to prevent crashes
   - Added browser environment checks

2. **Error Handling**
   - All Firebase Analytics errors are now caught and logged as warnings
   - The application continues to work even if Analytics fails to initialize
   - No more blocking errors that break the app

## How It Works Now

### Default Behavior

- **Development Mode**: Analytics is disabled by default (no network requests)
- **Production Mode**: Analytics initializes automatically (if available)
- **Network Failures**: Errors are logged but don't break the app

### Environment Variables

You can control Analytics initialization using environment variables:

#### To Enable Analytics in Development
Add to your `.env` file:
```bash
VITE_ENABLE_ANALYTICS=true
```

#### To Disable Analytics Completely
Add to your `.env` file:
```bash
VITE_ENABLE_ANALYTICS=false
```

#### To Keep Default Behavior (Recommended)
Don't set the variable, or remove it:
- Development: Analytics disabled
- Production: Analytics enabled

## Verification

### Check Console Logs

After the fix, you should see one of these messages in your browser console:

**In Development (Expected):**
```
📊 Firebase Analytics: Skipping initialization in development mode
   Set VITE_ENABLE_ANALYTICS=true to enable in development
```

**In Production:**
```
✅ Firebase Analytics initialized successfully
```

**If Network Fails:**
```
⚠️ Firebase Analytics initialization failed: [error message]
   This is normal in development or when network issues occur
```

### Expected Behavior

✅ **No more network errors** in the browser console  
✅ **App works normally** even without Analytics  
✅ **Analytics still works** in production builds  
✅ **No blocking errors** that prevent app functionality  

## Additional Troubleshooting

If you still see network errors:

### 1. Clear Browser Cache
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- Or clear browser cache completely

### 2. Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 3. Check Network Connectivity
- Ensure stable internet connection
- Check if Firebase services are accessible from your network
- Verify firewall/antivirus isn't blocking requests

### 4. Verify Environment Variables
Check your `.env` file:
```bash
# Should NOT have VITE_ENABLE_ANALYTICS in development
# OR set it to false explicitly
VITE_ENABLE_ANALYTICS=false
```

### 5. Check for Other Firebase Imports
If you're importing `analytics` directly elsewhere, make sure to check for null:
```javascript
import { analytics } from '../config/firebase';

if (analytics) {
  // Use analytics
} else {
  // Analytics not available (development mode)
}
```

## Files Modified

1. `frontend/src/config/firebase.js` - Added conditional Analytics initialization

## Testing

### Test in Development
1. Start dev server: `npm run dev`
2. Open browser console
3. Should see: "📊 Firebase Analytics: Skipping initialization..."
4. **No network errors** should appear

### Test in Production
1. Build for production: `npm run build`
2. Preview build: `npm run preview` (or deploy)
3. Open browser console
4. Should see: "✅ Firebase Analytics initialized successfully"

## Benefits

1. **Faster Development** - No unnecessary network requests
2. **Better Error Handling** - App doesn't break if Firebase is unavailable
3. **Cleaner Console** - No error spam during development
4. **Flexible Configuration** - Easy to enable/disable as needed
5. **Production Ready** - Analytics still works in production builds

## Notes

- Firebase Authentication still works normally (it's separate from Analytics)
- Google Sign-In functionality is unaffected
- The fix only affects Firebase Analytics initialization
- All other Firebase services (Auth, Storage, etc.) continue to work as before


