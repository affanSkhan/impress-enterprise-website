import { useState } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import useAdminAuth from '@/hooks/useAdminAuth'

/**
 * Environment Diagnostics Page
 * Check if required environment variables are set
 */
export default function EnvDiagnostics() {
  const { user, loading: authLoading } = useAdminAuth()
  const [testResult, setTestResult] = useState(null)

  const checks = [
    {
      name: 'VAPID Public Key',
      value: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      expected: 'Should be 87 characters',
      status: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length === 87
    },
    {
      name: 'Supabase URL',
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      expected: 'Should start with https://',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://')
    },
    {
      name: 'Supabase Anon Key',
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
      expected: 'Should be set',
      status: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    },
    {
      name: 'Service Worker Support',
      value: typeof window !== 'undefined' && 'serviceWorker' in navigator ? '✓ Supported' : '✗ Not Supported',
      expected: 'Should be supported',
      status: typeof window !== 'undefined' && 'serviceWorker' in navigator
    },
    {
      name: 'Push Manager Support',
      value: typeof window !== 'undefined' && 'PushManager' in window ? '✓ Supported' : '✗ Not Supported',
      expected: 'Should be supported',
      status: typeof window !== 'undefined' && 'PushManager' in window
    },
    {
      name: 'Notification Support',
      value: typeof window !== 'undefined' && 'Notification' in window ? '✓ Supported' : '✗ Not Supported',
      expected: 'Should be supported',
      status: typeof window !== 'undefined' && 'Notification' in window
    }
  ]

  async function testBackendConnection() {
    setTestResult({ loading: true })
    try {
      const response = await fetch('/api/push/test', { method: 'POST' })
      const data = await response.json()
      setTestResult({ success: response.ok, data, status: response.status })
    } catch (error) {
      setTestResult({ success: false, error: error.message })
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
        <title>Environment Diagnostics - Empire Car A/C</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Environment Diagnostics</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Environment Variables Check</h2>
          <div className="space-y-3">
            {checks.map((check, index) => (
              <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{check.name}</span>
                    <span className={`text-lg ${check.status ? 'text-green-600' : 'text-red-600'}`}>
                      {check.status ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <div>Value: <code className="bg-gray-200 px-2 py-0.5 rounded">{check.value || 'Not set'}</code></div>
                    <div>Expected: {check.expected}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Backend Connection Test</h2>
          <button
            onClick={testBackendConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Push Notification API
          </button>

          {testResult && (
            <div className={`mt-4 p-4 rounded ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testResult.loading ? (
                <p>Testing...</p>
              ) : testResult.success ? (
                <div>
                  <p className="font-semibold">✓ API Connection Successful</p>
                  <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(testResult.data, null, 2)}</pre>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">✗ API Connection Failed</p>
                  <p className="text-sm mt-1">Status: {testResult.status}</p>
                  <p className="text-sm">Error: {testResult.error || JSON.stringify(testResult.data)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ If you see errors:</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc ml-5">
            <li>VAPID key missing → Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to Vercel environment variables</li>
            <li>Service role key missing → Add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables</li>
            <li>After adding variables → Redeploy your application in Vercel</li>
            <li>Database tables missing → Run migrations 010 and 011 in Supabase SQL Editor</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
