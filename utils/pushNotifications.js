// Push Notification Utility for Admin
// Handles subscription and sending push notifications

// Use the public VAPID key from environment variables
// In browser context, Next.js injects this at build time
const VAPID_PUBLIC_KEY = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY 
  : null;

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission was denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(userId) {
  try {
    console.log('Starting push notification subscription...');
    console.log('VAPID key available:', !!VAPID_PUBLIC_KEY);
    console.log('User ID provided:', userId);

    // If no userId provided, try to get it from Supabase session
    let actualUserId = userId;
    if (!actualUserId) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data: { user } } = await supabase.auth.getUser();
        actualUserId = user?.id;
        console.log('Got user ID from session:', actualUserId);
      } catch (e) {
        console.warn('Could not get user from session:', e);
      }
    }

    if (!actualUserId) {
      console.error('No user ID available - user must be logged in');
      throw new Error('You must be logged in to enable push notifications');
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported');
      throw new Error('Service Worker not supported in this browser');
    }

    // Check if push is supported
    if (!('PushManager' in window)) {
      console.error('Push notifications not supported');
      throw new Error('Push notifications not supported in this browser');
    }

    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.error('Notification permission not granted');
      throw new Error('Notification permission not granted');
    }

    // Register service worker if not already registered
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.log('Registering service worker...');
      registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered for push notifications');
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service worker ready');

    // Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Found existing push subscription');
      
      // Check if it's using the same VAPID key by comparing endpoint format
      // If subscription exists and is valid, just save it to ensure database is in sync
      try {
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: existingSubscription,
            userId
          })
        });

        if (response.ok) {
          console.log('Existing subscription verified and saved');
          return existingSubscription;
        }
      } catch (error) {
        console.log('Could not verify existing subscription, will create new one');
      }
      
      // If verification failed, unsubscribe and create new
      console.log('Unsubscribing from old push subscription...');
      await existingSubscription.unsubscribe();
    }

    // Subscribe to push notifications with VAPID key
    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID_PUBLIC_KEY is not set');
      throw new Error('VAPID public key not configured. Please add NEXT_PUBLIC_VAPID_PUBLIC_KEY to environment variables and redeploy.');
    }
    
    console.log('Subscribing to push manager...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    console.log('Push subscription created:', subscription.endpoint);

    // Save subscription to backend
    console.log('Saving subscription to backend with userId:', actualUserId);
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        userId: actualUserId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to save subscription:', response.status, errorData);
      throw new Error(`Failed to save push subscription: ${errorData.error || response.statusText}`);
    }

    console.log('Successfully subscribed to push notifications');
    return subscription;

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(userId) {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return true;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return true;
    }

    // Unsubscribe from push manager
    await subscription.unsubscribe();

    // Remove subscription from backend
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    console.log('Successfully unsubscribed from push notifications');
    return true;

  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isPushSubscribed() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push not supported in browser');
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.log('No service worker registration found');
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    const isSubscribed = subscription !== null;
    console.log('Push subscription check:', isSubscribed ? 'Subscribed' : 'Not subscribed');
    if (isSubscribed) {
      console.log('Subscription endpoint:', subscription.endpoint);
    }
    return isSubscribed;

  } catch (error) {
    console.error('Error checking push subscription:', error);
    return false;
  }
}

/**
 * Send a test notification
 */
export async function sendTestNotification() {
  try {
    const response = await fetch('/api/push/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to send test notification');
    }

    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}
