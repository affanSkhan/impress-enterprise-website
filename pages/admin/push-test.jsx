import { useState } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import useAdminAuth from '@/hooks/useAdminAuth'

/**
 * Push Notification Test Page
 * Manual testing of push notifications
 */
export default function PushTest() {
  const { user, loading: authLoading } = useAdminAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

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
      } else {
        addLog('✗ No subscription found', 'error')
      }
    } catch (error) {
      addLog(`Error checking subscription: ${error.message}`, 'error')
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
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal ml-5 text-sm space-y-1">
            <li>Click "Run All Tests" to check everything</li>
            <li>Make sure notifications are enabled in browser settings</li>
            <li>"Local Test" should work immediately (tests service worker)</li>
            <li>"Direct Send" tests the full backend → push → notification flow</li>
            <li>Close the app/PWA and try "Direct Send" to test background notifications</li>
          </ol>
        </div>
      </div>
    </AdminLayout>
  )
}
