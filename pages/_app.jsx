import '@/styles/globals.css'
import { useEffect } from 'react'

/**
 * Main App Component
 * This wraps all pages in the application
 */
export default function App({ Component, pageProps }) {
  // Register service worker on app load for background push notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          // Register the main SW with root scope
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('[App] Service Worker registered:', registration.scope);

          // Ensure the service worker is activated
          if (registration.waiting) {
            console.log('[App] SW waiting, sending skip waiting message');
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // Check for updates periodically
          setInterval(() => {
            registration.update().catch(err => console.warn('[App] SW update check failed:', err));
          }, 60000);

          // Log active subscription status
          const subscription = await registration.pushManager.getSubscription();
          console.log('[App] Push subscription active:', !!subscription);
          if (subscription) {
            console.log('[App] Endpoint:', subscription.endpoint.substring(0, 50) + '...');
          }

        } catch (error) {
          console.error('[App] Service Worker registration failed:', error);
        }
      };

      registerServiceWorker();

      // Listen for push messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'PUSH_RECEIVED') {
          console.log('[App] Push notification received:', event.data.notification);
        }
      });
    }
  }, []);

  return <Component {...pageProps} />
}
