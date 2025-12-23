import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import useAdminAuth from '@/hooks/useAdminAuth'
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/utils/pushNotifications'

export default function NotificationSetup() {
  const { user, loading: authLoading } = useAdminAuth()
  const [status, setStatus] = useState({
    supported: false,
    permission: 'default',
    serviceWorker: 'unknown',
    subscribed: false,
    platform: 'unknown'
  })
  const [logs, setLogs] = useState([])

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { 
      message, 
      type, 
      time: new Date().toLocaleTimeString() 
    }])
  }

  useEffect(() => {
    checkStatus()
    detectPlatform()
  }, [])

  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    let platform = 'desktop'
    
    if (/android/.test(userAgent)) {
      platform = 'android'
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      platform = 'ios'
    }
    
    setStatus(prev => ({ ...prev, platform }))
    
    if (platform === 'ios') {
      addLog('⚠️ iOS detected: Background push notifications have limited support on iOS', 'warning')
      addLog('💡 For best results, use Chrome on Android or Desktop', 'info')
    } else if (platform === 'android') {
      addLog('✓ Android detected: Full push notification support available', 'success')
    } else {
      addLog('✓ Desktop detected: Full push notification support available', 'success')
    }
  }

  const checkStatus = async () => {
    addLog('Checking push notification status...', 'info')

    // Check if push is supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setStatus(prev => ({ ...prev, supported }))

    if (!supported) {
      addLog('❌ Push notifications not supported in this browser', 'error')
      return
    }
    addLog('✓ Push notifications supported', 'success')

    // Check permission
    const permission = Notification.permission
    setStatus(prev => ({ ...prev, permission }))
    
    if (permission === 'granted') {
      addLog('✓ Notification permission granted', 'success')
    } else if (permission === 'denied') {
      addLog('❌ Notification permission denied', 'error')
    } else {
      addLog('⚠️ Notification permission not yet requested', 'warning')
    }

    // Check service worker
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const swState = registration.active ? 'active' : 
                       registration.installing ? 'installing' : 
                       registration.waiting ? 'waiting' : 'unknown'
        setStatus(prev => ({ ...prev, serviceWorker: swState }))
        addLog(`✓ Service Worker: ${swState}`, 'success')

        // Check subscription
        const subscription = await registration.pushManager.getSubscription()
        setStatus(prev => ({ ...prev, subscribed: !!subscription }))
        
        if (subscription) {
          addLog('✓ Push subscription active', 'success')
          addLog(`Endpoint: ${subscription.endpoint.substring(0, 50)}...`, 'info')
        } else {
          addLog('⚠️ No active push subscription', 'warning')
        }
      } else {
        addLog('❌ Service Worker not registered', 'error')
      }
    } catch (error) {
      addLog(`❌ Error checking service worker: ${error.message}`, 'error')
    }
  }

  const enableNotifications = async () => {
    try {
      addLog('🔔 Requesting notification permission...', 'info')
      
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        addLog('❌ Permission denied. Please enable notifications in browser settings.', 'error')
        return
      }
      
      addLog('✓ Permission granted', 'success')
      addLog('📱 Subscribing to push notifications...', 'info')
      
      const subscription = await subscribeToPushNotifications()
      
      if (subscription) {
        addLog('✓ Successfully subscribed to push notifications!', 'success')
        addLog(`Endpoint: ${subscription.endpoint?.substring(0, 60)}...`, 'info')
        addLog('💡 Keep this browser/PWA open in background to receive notifications', 'info')
        
        // For mobile, show additional instructions
        if (status.platform === 'android') {
          addLog('📲 Android: Make sure battery optimization is disabled for this app', 'info')
          addLog('📲 Android: Go to Settings → Apps → [Browser] → Battery → Unrestricted', 'info')
        }
        
        await checkStatus()
      } else {
        addLog('❌ Subscription failed - check console for details', 'error')
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error')
    }
  }

  const disableNotifications = async () => {
    try {
      addLog('Unsubscribing from push notifications...', 'info')
      await unsubscribeFromPushNotifications()
      addLog('✓ Unsubscribed successfully', 'success')
      await checkStatus()
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error')
    }
  }

  const testNotification = async () => {
    try {
      addLog('🧪 Sending test notification...', 'info')
      
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'This is a test from the notification setup page',
          url: '/admin/notification-setup',
          userType: 'admin'
        })
      })

      const result = await response.json()
      
      if (result.success || result.sent) {
        addLog(`✓ Test sent to ${result.successCount}/${result.totalSubscriptions} devices`, 'success')
        addLog('💡 Check if you received the notification (even with page closed)', 'info')
      } else {
        addLog(`❌ Test failed: ${result.message}`, 'error')
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error')
    }
  }

  const updateServiceWorker = async () => {
    try {
      addLog('🔄 Updating service worker...', 'info')
      const registration = await navigator.serviceWorker.getRegistration()
      
      if (registration) {
        await registration.update()
        addLog('✓ Service worker update triggered', 'success')
        addLog('💡 Close all tabs and reopen to apply update', 'info')
        
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error')
    }
  }

  const testFullOrderFlow = async () => {
    try {
      addLog('🧪 Testing full order notification flow...', 'info')
      addLog('This simulates what happens when a customer places an order', 'info')
      
      const response = await fetch('/api/test-order-notification', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        addLog('✓ Full flow test completed successfully!', 'success')
        addLog(`  Database notification created: ${result.notification.id}`, 'success')
        addLog(`  Push sent to: ${result.pushResult.successCount}/${result.pushResult.totalSubscriptions} devices`, result.pushResult.success ? 'success' : 'error')
        
        if (result.pushResult.success) {
          addLog('💡 Check if you received the push notification', 'info')
          addLog('💡 If not, the issue is with browser/service worker setup', 'warning')
        } else {
          addLog(`❌ Push failed: ${result.pushResult.message}`, 'error')
        }
      } else {
        addLog(`❌ Test failed at step: ${result.step}`, 'error')
        addLog(`Error: ${result.error}`, 'error')
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error')
    }
  }

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Notification Setup - Empire Car A/C</title>
      </Head>

      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">Push Notification Setup</h1>
        <p className="text-gray-600 mb-6">Configure background notifications to receive alerts even when the app is closed</p>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg border-2 ${status.supported ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="text-sm text-gray-600">Browser Support</div>
            <div className="text-lg font-semibold">{status.supported ? '✓ Yes' : '✗ No'}</div>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${
            status.permission === 'granted' ? 'bg-green-50 border-green-200' : 
            status.permission === 'denied' ? 'bg-red-50 border-red-200' : 
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="text-sm text-gray-600">Permission</div>
            <div className="text-lg font-semibold capitalize">{status.permission}</div>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${
            status.serviceWorker === 'active' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="text-sm text-gray-600">Service Worker</div>
            <div className="text-lg font-semibold capitalize">{status.serviceWorker}</div>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${status.subscribed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="text-sm text-gray-600">Subscription</div>
            <div className="text-lg font-semibold">{status.subscribed ? '✓ Active' : '✗ Inactive'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={enableNotifications}
            disabled={!status.supported || status.subscribed}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Enable Push Notifications
          </button>
          
          <button
            onClick={disableNotifications}
            disabled={!status.subscribed}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Disable Notifications
          </button>
          
          <button
            onClick={testNotification}
            disabled={!status.subscribed}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Send Test
          </button>
          
          <button
            onClick={testFullOrderFlow}
            disabled={!status.subscribed}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Test Order Flow
          </button>
          
          <button
            onClick={updateServiceWorker}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            Update Service Worker
          </button>
          
          <button
            onClick={checkStatus}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
          >
            Refresh Status
          </button>
        </div>

        {/* Instructions for Mobile */}
        {status.platform === 'android' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">📱 Android Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Enable Push Notifications" above</li>
              <li>Grant notification permission when prompted</li>
              <li>Open device Settings → Apps → Chrome/Browser</li>
              <li>Go to Battery → Select "Unrestricted"</li>
              <li>Go to Notifications → Enable all notification categories</li>
              <li>Test by sending a notification, then closing the browser completely</li>
            </ol>
          </div>
        )}

        {status.platform === 'ios' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">⚠️ iOS Limitations:</h3>
            <p className="text-sm mb-2">iOS Safari and Chrome do not support background push notifications when the browser/PWA is completely closed.</p>
            <p className="text-sm"><strong>Workaround:</strong> Keep the PWA open (can be in background) or use an Android device for full push support.</p>
          </div>
        )}

        {/* Logs */}
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  'text-gray-300'
                }`}
              >
                [{log.time}] {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
