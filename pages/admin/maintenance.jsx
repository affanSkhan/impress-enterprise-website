import { useState } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import useAdminAuth from '@/hooks/useAdminAuth'
import BackupButton from '@/components/BackupButton'

/**
 * System Maintenance Page
 * Admin-only page for system maintenance tasks
 */
export default function SystemMaintenance() {
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
        <title>System Maintenance - Impress Enterprise</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-gray-600 via-slate-500 to-gray-700 bg-clip-text text-transparent">System Maintenance</h1>

        <div className="max-w-4xl">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Manage system-level operations including data backups, system health checks, and maintenance tasks.
            </p>
          </div>

          <BackupButton />
        </div>
      </div>
    </AdminLayout>
  )
}