import { useState } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import useAdminAuth from '@/hooks/useAdminAuth'
import { subscribeToPushNotifications, unsubscribeFromPushNotifications, isPushSubscribed } from '@/utils/pushNotifications'

/**
 * Push Notification Test Page
 * Manual testing of push notifications
 */
export default function PushTest() {
  const { user, loading: authLoading } = useAdminAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
    console.log(`[${timestamp}] ${message}`)
  }

  async function checkPermission() {
    addLog('Checking notification permission...')
    const permission = Notification.permission
    addLog(`Permission status: ${permission}`, permission === 'granted' ? 'success' : 'error')
    
    if (permission === 'default') {
      addLog('Requesting permission...')
      const result = await Notification.requestPermission()
      addLog(`Permission result: ${result}`, result === 'granted' ? 'success' : 'error')
    }
  }

  async function checkSubscription() {
    addLog('Checking push subscription...')
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        addLog('✓ Subscription exists', 'success')
        addLog(`Endpoint: ${subscription.endpoint.substring(0, 50)}...`)
        setIsSubscribed(true)
      } else {
        addLog('✗ No subscription found', 'error')
        addLog('💡 Click "Enable Push" to subscribe', 'info')
        setIsSubscribed(false)
      }
    } catch (error) {
      addLog(`Error checking subscription: ${error.message}`, 'error')
      setIsSubscribed(false)
    }
  }

  async function enablePush() {
    setLoading(true)
    addLog('Enabling push notifications...')
    try {
      if (!user?.id) {
        addLog('✗ User ID not found', 'error')
        return
      }

      const subscription = await subscribeToPushNotifications(user.id)
      
      if (subscription) {
        addLog('✓ Push notifications enabled!', 'success')
        addLog(`Endpoint: ${subscription.endpoint.substring(0, 50)}...`)
        setIsSubscribed(true)
      } else {
        addLog('✗ Failed to enable push', 'error')
      }
    } catch (error) {
      addLog(`✗ Error: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function disablePush() {
    setLoading(true)
    addLog('Disabling push notifications...')
    try {
      if (!user?.id) {
        addLog('✗ User ID not found', 'error')
        return
      }

      await unsubscribeFromPushNotifications(user.id)
      addLog('✓ Push notifications disabled', 'success')
      setIsSubscribed(false)
    } catch (error) {
      addLog(`✗ Error: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function testLocalNotification() {
    addLog('Testing local notification (no backend)...')
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification('🔔 Test Local Notification', {
        body: 'This is a local notification test. No backend involved.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'test-local',
        requireInteraction: false
      })
      addLog('✓ Local notification shown', 'success')
    } catch (error) {
      addLog(`✗ Local notification failed: ${error.message}`, 'error')
    }
  }

  async function testPushAPI() {
    setLoading(true)
    addLog('Testing push notification via API...')
    try {
      const response = await fetch('/api/push/test', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        addLog('✓ API call successful', 'success')
        addLog(`Result: ${JSON.stringify(data, null, 2)}`)
      } else {
        addLog(`✗ API call failed: ${data.error}`, 'error')
      }
    } catch (error) {
      addLog(`✗ Error calling API: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function testDirectSend() {
    setLoading(true)
    addLog('Sending direct push notification...')
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🧪 Direct Test',
          message: 'This is a direct push test',
          url: '/admin',
          userId: user?.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        addLog('✓ Direct send successful', 'success')
        addLog(`Sent to ${data.successCount}/${data.totalSubscriptions} subscriptions`)
        
        // Show detailed error info if failed
        if (data.successCount === 0 && data.results) {
          addLog('⚠️ Push send failed - checking details...', 'error')
          data.results.forEach((result, i) => {
            if (!result.success) {
              addLog(`  Error ${i + 1}: ${result.error || JSON.stringify(result)}`, 'error')
              if (result.statusCode) addLog(`  Status Code: ${result.statusCode}`, 'error')
              if (result.body) addLog(`  Body: ${JSON.stringify(result.body)}`, 'error')
            }
          })
        }
      } else {
        addLog(`✗ Direct send failed: ${data.error}`, 'error')
      }
    } catch (error) {
      addLog(`✗ Error: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function checkServiceWorker() {
    addLog('Checking service worker...')
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        addLog('✓ Service worker registered', 'success')
        addLog(`Scope: ${registration.scope}`)
        addLog(`Active: ${registration.active ? 'Yes' : 'No'}`)
      } else {
        addLog('✗ No service worker found', 'error')
      }
    } catch (error) {
      addLog(`✗ Error: ${error.message}`, 'error')
    }
  }

  async function runAllTests() {
    setLogs([])
    addLog('=== Starting comprehensive test ===', 'info')
    await checkPermission()
    await checkServiceWorker()
    await checkSubscription()
    await testLocalNotification()
    await new Promise(resolve => setTimeout(resolve, 2000))
    await testDirectSend()
    addLog('=== Tests complete ===', 'info')
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
        <title>Push Notification Test - Empire Car A/C</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Push Notification Test Suite</h1>

        {/* Enable/Disable Push Button - Prominent */}
        <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Push Notifications</h3>
              <p className="text-sm text-gray-600">
                {isSubscribed 
                  ? '✓ Enabled - This device will receive push notifications' 
                  : '✗ Disabled - Enable to receive push notifications on this device'}
              </p>
            </div>
            <button
              onClick={isSubscribed ? disablePush : enablePush}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition-all ${
                isSubscribed 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isSubscribed ? 'Disable Push' : 'Enable Push'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={checkPermission}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Check Permission
          </button>
          <button
            onClick={checkServiceWorker}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Check SW
          </button>
          <button
            onClick={checkSubscription}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Check Subscription
          </button>
          <button
            onClick={testLocalNotification}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Local Test
          </button>
          <button
            onClick={testPushAPI}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            Test API
          </button>
          <button
            onClick={testDirectSend}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Direct Send
          </button>
          <button
            onClick={runAllTests}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 col-span-2"
          >
            Run All Tests
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">Click a test button to begin...</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  'text-gray-300'
                }`}
              >
                [{log.timestamp}] {log.message}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">📋 Testing Steps:</h3>
          <ol className="list-decimal ml-5 text-sm space-y-1">
            <li><strong>Enable Push</strong> - Click the green "Enable Push" button above</li>
            <li><strong>Run Tests</strong> - Click "Run All Tests" to verify everything works</li>
            <li><strong>Test Background</strong> - Close this tab, open on another device, and click "Direct Send"</li>
            <li><strong>Verify</strong> - You should receive notification even with app closed!</li>
          </ol>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">ℹ️ What Each Test Does:</h3>
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li><strong>Check Permission:</strong> Verifies browser allows notifications</li>
            <li><strong>Check SW:</strong> Verifies service worker is registered</li>
            <li><strong>Check Subscription:</strong> Verifies this device has a push subscription</li>
            <li><strong>Local Test:</strong> Tests notification display (no backend)</li>
            <li><strong>Test API:</strong> Tests the /api/push/test endpoint</li>
            <li><strong>Direct Send:</strong> Sends push to ALL subscribed admin devices</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
