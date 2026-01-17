import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import NotificationSettings from '@/components/NotificationSettings'
import useAdminAuth from '@/hooks/useAdminAuth'

/**
 * Admin Notifications Settings Page
 * Configure push notifications for orders and alerts
 */
export default function AdminNotificationsPage() {
  const { user, loading: authLoading } = useAdminAuth()

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Notification Settings - Impress Enterprise Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-700 bg-clip-text text-transparent">
            Notification Settings
          </h1>
          <p className="text-gray-600">
            Configure how you receive alerts about orders, payments, and customer activities.
          </p>
        </div>

        <NotificationSettings userId={user?.id} />

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Instant Alerts</h3>
                <p className="text-sm text-gray-700">
                  Get notified immediately when customers place orders, make payments, or when order status changes.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="bg-green-600 p-2 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mobile Friendly</h3>
                <p className="text-sm text-gray-700">
                  Works perfectly on mobile devices. Install the PWA app for the best experience with sound and vibration.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="bg-purple-600 p-2 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure & Private</h3>
                <p className="text-sm text-gray-700">
                  Your notification preferences are stored securely. You can enable or disable notifications anytime.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="bg-orange-600 p-2 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Real-time Updates</h3>
                <p className="text-sm text-gray-700">
                  No delays. Notifications are delivered instantly via push technology, keeping you always up-to-date.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Tips for Best Experience
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Mobile:</strong> Add this app to your home screen for instant notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Desktop:</strong> Keep the browser open in background for continuous notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Test it:</strong> Use the "Send Test Notification" button to verify everything works</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Permissions:</strong> If blocked, clear browser notification settings and enable again</span>
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
