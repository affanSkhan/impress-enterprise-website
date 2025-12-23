// Native Push Notifications for Capacitor
// This file handles push notifications when running as a native app

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Check if running as native app
 */
export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

/**
 * Initialize native push notifications (Android only)
 */
export async function initNativePush() {
  if (!isNativeApp()) {
    console.log('[Native Push] Not running as native app, skipping');
    return null;
  }

  console.log('[Native Push] Initializing native push notifications...');

  try {
    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    
    if (permResult.receive !== 'granted') {
      console.error('[Native Push] Permission denied');
      throw new Error('Push notification permission denied');
    }

    console.log('[Native Push] Permission granted');

    // Register with FCM
    await PushNotifications.register();

    // Listen for registration
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[Native Push] FCM Token:', token.value);
      
      // Save token to backend
      try {
        // Get user from Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error('[Native Push] No user logged in');
          return;
        }

        // Save FCM token to backend
        const response = await fetch('/api/push/subscribe-native', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fcmToken: token.value,
            userId: user.id,
            platform: 'android'
          })
        });

        if (response.ok) {
          console.log('[Native Push] Token saved to backend');
        } else {
          console.error('[Native Push] Failed to save token');
        }
      } catch (error) {
        console.error('[Native Push] Error saving token:', error);
      }
    });

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[Native Push] Registration error:', error);
    });

    // Listen for push notifications received
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Native Push] Notification received:', notification);
      // Notification is automatically shown by the system
    });

    // Listen for notification taps
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('[Native Push] Notification tapped:', notification);
      const data = notification.notification.data;
      
      // Navigate to the URL specified in the notification
      if (data.url) {
        window.location.href = data.url;
      }
    });

    console.log('[Native Push] Native push initialized successfully');
    return true;

  } catch (error) {
    console.error('[Native Push] Initialization error:', error);
    return null;
  }
}

/**
 * Get FCM token (for native app)
 */
export async function getNativeFCMToken() {
  if (!isNativeApp()) {
    return null;
  }

  try {
    // The token is received in the registration listener
    // This is just a helper to check if we're registered
    const status = await PushNotifications.checkPermissions();
    return status.receive === 'granted';
  } catch (error) {
    console.error('[Native Push] Error getting token:', error);
    return null;
  }
}
