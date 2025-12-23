# How to Convert to a Native Android App (For 100% Reliable Notifications)

✅ **Capacitor setup is COMPLETE!** Now you just need to configure Firebase and build the APK.

---

## 📋 What Has Been Done

1. ✅ Installed Capacitor packages
2. ✅ Initialized Capacitor project (`com.empire.admin`)
3. ✅ Added Android platform (folder: `/android`)
4. ✅ Updated code to detect native vs web environment
5. ✅ Created native push notification handlers

---

## 🔥 Firebase Setup (REQUIRED - Follow These Steps)

### Step 1: Create Firebase Project
1. Go to **[Firebase Console](https://console.firebase.google.com/)**
2. Click **"Add project"**
3. Project name: `Empire Admin` (or any name)
4. Disable Google Analytics (not needed) → **Create project**

### Step 2: Add Android App
1. In your Firebase project, click the **Android icon** (⚙️ → Project settings)
2. Click **"Add app"** → Select **Android**
3. Fill in:
   - **Android package name:** `com.empire.admin` ⚠️ (MUST match exactly)
   - **App nickname:** `Empire Admin`
   - **Debug signing certificate (SHA-1):** Leave blank for now
4. Click **"Register app"**

### Step 3: Download google-services.json
1. After registering, you'll see a button: **"Download google-services.json"**
2. Click it to download the file
3. **Place the file here:**
   ```
   C:\Users\USER\Empire_spare_parts\android\app\google-services.json
   ```

### Step 4: Enable Firebase Cloud Messaging (FCM)
1. In Firebase Console, go to: **Build → Cloud Messaging**
2. Click **"Get started"** or **"Configure"**
3. You should see "Cloud Messaging API (Legacy)" - this is what Android uses
4. **That's it!** No additional configuration needed for push notifications.

---

## 📱 Build the APK

### Step 1: Sync Capacitor
```bash
cd C:\Users\USER\Empire_spare_parts
npx cap sync android
```

### Step 2: Open Android Studio
```bash
npx cap open android
```

This will launch **Android Studio** with your project.

### Step 3: Build the APK
In Android Studio:
1. Wait for Gradle sync to complete (bottom status bar)
2. Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for build to finish (~2-5 minutes first time)
4. Click **"locate"** in the notification to find your APK

**APK Location:**
```
C:\Users\USER\Empire_spare_parts\android\app\build\outputs\apk\debug\app-debug.apk
```

### Step 4: Install on Phone
1. Copy `app-debug.apk` to your Android phone
2. Open it and tap **"Install"**
3. If blocked, enable **"Install from unknown sources"** for your file manager
4. Open the app and login

---

## 🧪 Testing Native Push

### Test from your computer:
1. Install the APK on your phone
2. Open the app and login
3. Go to **`/admin/notification-setup`** in the app
4. You should see it say "Running as NATIVE app"
5. The app will automatically register for FCM push
6. **Close the app completely** (swipe kill it)
7. From your computer browser, go to `www.empirecarac.in/admin/notification-setup`
8. Click **"Send Test"**
9. **You should receive the notification on your phone even though the app is closed!** 🎉

---

## 🔧 Troubleshooting

### "google-services.json not found"
- Make sure you placed it in: `android/app/google-services.json`
- Run `npx cap sync android` again

### "FCM token not received"
- Make sure you enabled Cloud Messaging in Firebase Console
- Check Android Studio Logcat for errors

### Notifications still not working when killed
- Check if you enabled notification permissions for the app in Android Settings
- Some phones (Xiaomi, Oppo) require "Auto-start" permission

---

## ⚠️ Important Notes

1. **This APK is for testing only** (debug build). For production:
   - You need to create a signed release APK
   - Upload to Google Play Store (optional)

2. **The web version still works:**
   - Users on desktop/web will use the PWA (VAPID push)
   - Users who install the native app will use FCM

3. **Backend automatically detects:**
   - When sending push notifications, the backend will check if the subscription is web (VAPID) or native (FCM) and send accordingly

---

## 🎯 Next Steps

1. **Download google-services.json from Firebase**
2. **Place it in `android/app/` folder**
3. **Run:** `npx cap sync android`
4. **Run:** `npx cap open android`
5. **Build APK** in Android Studio
6. **Install and test!**

