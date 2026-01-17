import '@/styles/globals.css'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { isNativeApp, initNativePush } from '@/utils/nativePushNotifications'
import { AdminBusinessProvider } from '@/context/AdminBusinessContext'

/**
 * Error Boundary Component
 */
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleError = (event) => {
      console.error('[Global Error]:', event.error)
      setHasError(true)
      setError(event.error)
      event.preventDefault()
    }

    const handleRejection = (event) => {
      console.error('[Unhandled Rejection]:', event.reason)
      event.preventDefault()
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  if (hasError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Something went wrong</h1>
        <p>{error?.message || 'An unexpected error occurred'}</p>
        <button 
          onClick={() => {
            setHasError(false)
            setError(null)
            window.location.reload()
          }}
          style={{ 
            padding: '10px 20px', 
            marginTop: '20px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Reload App
        </button>
      </div>
    )
  }

  return children
}

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

  return (
    <ErrorBoundary>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Head>
      <AdminBusinessProvider>
        <Component {...pageProps} />
      </AdminBusinessProvider>
    </ErrorBoundary>
  )
}
