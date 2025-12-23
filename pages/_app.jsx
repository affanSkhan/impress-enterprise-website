import '@/styles/globals.css'
import { useEffect } from 'react'
import { isNativeApp, initNativePush } from '@/utils/nativePushNotifications'

/**
 * Main App Component
 * This wraps all pages in the application
 */
export default function App({ Component, pageProps }) {
  // Register service worker OR native push based on platform
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running as native app
    if (isNativeApp()) {
      console.log('[App] Running as NATIVE app - using FCM');
      initNativePush();
    } else if ('serviceWorker' in navigator) {
      console.log('[App] Running as WEB app - using Service Worker');
      
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('[App] Service Worker registered:', registration.scope);

          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          setInterval(() => {
            registration.update().catch(err => console.warn('[App] SW update failed:', err));
          }, 60000);

          const subscription = await registration.pushManager.getSubscription();
          console.log('[App] Push subscription active:', !!subscription);

        } catch (error) {
          console.error('[App] Service Worker registration failed:', error);
        }
      };

      registerServiceWorker();

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'PUSH_RECEIVED') {
          console.log('[App] Push notification received:', event.data.notification);
        }
      });
    }
  }, []);

  return <Component {...pageProps} />
}
