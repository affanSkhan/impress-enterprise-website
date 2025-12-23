# Firebase Service Account Setup for FCM

## Why This Is Needed
To send push notifications to the native Android app (when app is closed/killed), we need Firebase Admin SDK credentials on the server.

## Steps to Get Service Account Key

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/

### 2. Select Your Project
Click on **"Empire Admin"** (empire-admin-6c57e)

### 3. Open Project Settings
- Click the ⚙️ gear icon next to "Project Overview"
- Select **"Project settings"**

### 4. Navigate to Service Accounts
- Click the **"Service accounts"** tab
- You should see "Firebase Admin SDK"

### 5. Generate Private Key
- Click **"Generate new private key"** button
- Confirm by clicking **"Generate key"**
- A JSON file will be downloaded to your computer
  - File name will be like: `empire-admin-6c57e-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`

### 6. Convert JSON to Single Line
The downloaded JSON file is multi-line. We need to convert it to a single line for the `.env.local` file.

**Option A: Use Online Tool**
- Go to: https://www.text-utils.com/json-formatter/
- Paste the JSON content
- Select "Minify" or "Remove whitespace"
- Copy the single-line result

**Option B: Use PowerShell**
```powershell
# In your project directory
$json = Get-Content "path\to\downloaded-key.json" -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
$json | Set-Clipboard
Write-Host "JSON copied to clipboard!"
```

### 7. Add to .env.local
Open your `.env.local` file and add:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"empire-admin-6c57e",...}
```

**IMPORTANT:** 
- The entire JSON must be on ONE line
- No line breaks or extra spaces
- Keep it inside quotes if needed

### 8. Restart Development Server
After adding the environment variable:

```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

## Security Notes

⚠️ **CRITICAL SECURITY:**
- **NEVER** commit the service account JSON file to git
- **NEVER** share the key publicly
- The `.env.local` file is already in `.gitignore`
- This key has admin access to your Firebase project

## For Production Deployment (Vercel)

When deploying to Vercel:

1. Go to your project settings on Vercel
2. Navigate to **Environment Variables**
3. Add `FIREBASE_SERVICE_ACCOUNT_KEY` with the single-line JSON value
4. Make sure it's available for Production, Preview, and Development environments

## Testing

After adding the key, test FCM notifications:

1. Install the APK on your Android phone
2. Login to the app
3. Close/kill the app completely
4. From your computer, go to: https://www.empirecarac.in/admin/notification-setup
5. Click "Send Test Notification"
6. You should receive a notification even with the app killed!

## Troubleshooting

**Error: "FIREBASE_SERVICE_ACCOUNT_KEY not configured"**
- Make sure the environment variable is set in `.env.local`
- Restart your development server

**Error: "Firebase Admin initialization failed"**
- Check that the JSON is valid (use https://jsonlint.com/)
- Make sure it's on a single line with no line breaks
- Verify the JSON contains `project_id`, `private_key`, `client_email`

**Notifications work in browser but not in native app:**
- Verify the service account key is configured
- Check server logs for FCM errors
- Make sure the APK was built AFTER installing firebase-admin

## How It Works

1. **Native App Registration:**
   - When app opens, it gets an FCM token from Firebase
   - Token is saved to `push_subscriptions` table with `fcm:` prefix

2. **Sending Notifications:**
   - Server checks if subscription endpoint starts with `fcm:`
   - If yes: Uses Firebase Admin SDK to send FCM message
   - If no: Uses web-push (VAPID) for browser notifications

3. **Receiving in Native App:**
   - FCM wakes the device from doze/killed state
   - Notification appears in system tray
   - Tapping opens the app to the specified URL
