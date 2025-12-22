import { useState, useEffect } from 'react';
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications, 
  isPushSubscribed,
  requestNotificationPermission 
} from '@/utils/pushNotifications';

/**
 * Notification Settings Component
 * Allows admin to toggle push notifications (including when app is closed/background)
 */
export default function NotificationSettings({ userId }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check subscription status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      const subscribed = await isPushSubscribed();
      setIsSubscribed(subscribed);
    }
  }

  async function handleToggle() {
    setLoading(true);
    setError(null);

    try {
      if (isSubscribed) {
        // Unsubscribe
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsSubscribed(false);
        } else {
          setError('Failed to disable notifications');
        }
      } else {
        // Subscribe
        if (permission === 'denied') {
          setError('Notification permission was denied. Please enable in browser settings.');
          setLoading(false);
          return;
        }

        if (permission === 'default') {
          const granted = await requestNotificationPermission();
          if (!granted) {
            setError('Please allow notifications to receive alerts when app is closed');
            setLoading(false);
            return;
          }
          setPermission('granted');
        }

        // Check if VAPID key is available
        if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
          console.error('VAPID key missing in environment');
          setError('Configuration error: VAPID key not set. Please contact administrator.');
          setLoading(false);
          return;
        }

        const subscription = await subscribeToPushNotifications(userId);
        if (subscription) {
          setIsSubscribed(true);
        } else {
          setError('Failed to enable notifications. Check browser console for details.');
        }
      }
    } catch (err) {
      console.error('Notification toggle error:', err);
      setError(err.message || 'An error occurred. Check browser console for details.');
    } finally {
      setLoading(false);
    }
  }

  async function testNotification() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/push/test', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        alert('Test notification sent! Check your device (works even when app is closed)');
      } else {
        setError(data.error || 'Failed to send test notification');
      }
    } catch (err) {
      setError('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  }

  if (!('Notification' in window)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Background Notifications
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Receive alerts with sound and vibration even when the app is closed or in background.
            Perfect for getting instant order notifications on your mobile device.
          </p>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${
              isSubscribed ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span className="text-sm font-medium text-gray-700">
              {isSubscribed ? 'Active - Receiving notifications' : 'Inactive'}
            </span>
          </div>

          {/* Permission Status */}
          {permission === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">
                <strong>Permission Denied:</strong> Please enable notifications in your browser/device settings.
              </p>
            </div>
          )}

          {/* Features List */}
          {isSubscribed && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-green-800 mb-2">✓ You'll receive notifications for:</p>
              <ul className="text-sm text-green-700 space-y-1 ml-4">
                <li>• New customer orders</li>
                <li>• Order status updates</li>
                <li>• Payment confirmations</li>
                <li>• Even when app is closed or minimized</li>
              </ul>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Toggle Switch */}
        <div className="ml-4">
          <button
            onClick={handleToggle}
            disabled={loading || permission === 'denied'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              isSubscribed ? 'bg-green-600' : 'bg-gray-300'
            } ${loading || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isSubscribed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-3">
        {isSubscribed && (
          <button
            onClick={testNotification}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : '🔔 Send Test Notification'}
          </button>
        )}
        
        <button
          onClick={checkStatus}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
        >
          Refresh Status
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
            How it works
          </summary>
          <div className="mt-2 space-y-2 text-xs">
            <p>
              <strong>When enabled:</strong> Your device will receive push notifications with sound and vibration 
              whenever a customer places an order or an important event occurs.
            </p>
            <p>
              <strong>Background operation:</strong> Notifications work even when:
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>The app/PWA is completely closed</li>
              <li>Your phone screen is locked</li>
              <li>You're using other apps</li>
              <li>Your browser is minimized</li>
            </ul>
            <p>
              <strong>For mobile:</strong> Install this app to your home screen (Add to Home Screen) 
              for the best experience.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
