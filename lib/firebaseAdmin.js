// Firebase Admin SDK for server-side FCM notifications
import admin from 'firebase-admin';

// Initialize Firebase Admin (singleton pattern)
let app;

export function getFirebaseAdmin() {
  if (!app) {
    // Check if FIREBASE_SERVICE_ACCOUNT_KEY is set
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccount) {
      console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY not configured - FCM push will not work for native apps');
      return null;
    }

    try {
      const serviceAccountObj = JSON.parse(serviceAccount);
      
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountObj),
        projectId: serviceAccountObj.project_id
      });

      console.log('[Firebase Admin] Initialized successfully');
    } catch (error) {
      console.error('[Firebase Admin] Initialization failed:', error.message);
      return null;
    }
  }

  return app;
}

/**
 * Send FCM notification to native app
 */
export async function sendFCMNotification(fcmToken, { title, body, url, data = {} }) {
  const app = getFirebaseAdmin();
  
  if (!app) {
    throw new Error('Firebase Admin not initialized');
  }

  const message = {
    token: fcmToken,
    notification: {
      title: title || 'Impress Enterprise',
      body: body || 'You have a new notification',
    },
    data: {
      url: url || '/admin',
      ...data,
      timestamp: Date.now().toString()
    },
    android: {
      priority: 'high', // Wake device from doze
      notification: {
        sound: 'default',
        icon: 'ic_notification',
        color: '#0f172a',
        channelId: 'empire_orders' // Must match channel created in native app
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('[FCM] Successfully sent message:', response);
    return { success: true, response };
  } catch (error) {
    console.error('[FCM] Error sending message:', error);
    throw error;
  }
}
