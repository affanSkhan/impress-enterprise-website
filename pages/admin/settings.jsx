import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import NotificationSettings from '@/components/NotificationSettings'
import useAdminAuth from '@/hooks/useAdminAuth'
import BackupButton from '@/components/BackupButton'

/**
 * Admin Settings Page
 */
export default function AdminSettingsPage() {
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
        <title>Settings - Impress Enterprise Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
            Settings
          </h1>
          <p className="text-gray-600">
            Manage your account and system preferences.
          </p>
        </div>

        {/* Notifications Section */}
        <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
            </h2>
            <NotificationSettings userId={user?.id} />
        </section>

        {/* Data Backup Section */}
        <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Data Backup
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 mb-4">
                  Create a full backup of the system database and storage. This creates a downloadable zip file containing all your products, orders, and customer data.
                </p>
               <BackupButton />
            </div>
        </section>
        
        {/* Additional Info Cards similar to notifications page but generalized */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About Settings</h3>
                <p className="text-sm text-gray-700">
                  More settings for business profile and account management will be added here in future updates.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
