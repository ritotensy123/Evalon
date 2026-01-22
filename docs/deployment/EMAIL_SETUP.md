# Email Service Setup

## Issue
The email verification is failing with a 400 error because the email service is not configured.

## Solution

### Option 1: Configure Email Service (Recommended for Production)

1. Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

2. Update the email configuration in `.env`:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
```

3. For Gmail, you need to:
   - Enable 2-factor authentication
   - Generate an App Password (not your regular password)
   - Use the App Password in `EMAIL_PASS`

### Option 2: Development Mode (Current Implementation)

The system now handles missing email configuration gracefully:

1. **Backend**: When email service is not configured, the OTP is logged to the console instead of being sent via email
2. **Frontend**: Shows a development mode message indicating to check the server console for the OTP

## Current Status

✅ **Fixed**: The 400 error is now handled gracefully
✅ **Development Mode**: OTP is logged to server console when email service is not configured
✅ **User Experience**: Clear messaging about development mode

## Testing the Fix

1. Start the backend server
2. Try the email verification in the FirstTimeLoginWizard
3. Check the server console for the OTP code (format: `🔐 Email verification OTP for user@example.com: 123456`)
4. Enter the OTP in the frontend form

## Production Setup

For production, configure the email service by:
1. Setting up proper email credentials in `.env`
2. The system will automatically use the email service when configured
3. Remove the development mode message from the frontend
