import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabaseClient'
import useAdminAuth from '@/hooks/useAdminAuth'

/**
 * Admin Dashboard - Main Overview Page
 * Protected route - requires authentication
 */
export default function AdminDashboard() {
  const { user, loading: authLoading } = useAdminAuth()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    activeProducts: 0,
    recentInvoices: 0,
  })

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  async function fetchStats() {
    // Fetch dashboard statistics
    const [productsRes, categoriesRes, activeRes, invoicesRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    setStats({
      totalProducts: productsRes.count || 0,
      totalCategories: categoriesRes.count || 0,
      activeProducts: activeRes.count || 0,
      recentInvoices: invoicesRes.count || 0,
    })
  }

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
        <title>Admin Dashboard - Empire Car A/C</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-700 bg-clip-text text-transparent">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm mb-1">Total Products</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalProducts}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-slate-500 via-slate-600 to-gray-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm mb-1">Active Products</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.activeProducts}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm mb-1">Categories</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalCategories}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs sm:text-sm mb-1">Recent Invoices</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.recentInvoices}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Link href="/admin/products/new" className="flex items-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl hover:from-blue-100 hover:to-cyan-100 transition-all border border-blue-200 hover:shadow-lg transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0 shadow-md">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base">Add Product</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Create new product</p>
              </div>
            </Link>

            <Link href="/admin/invoices/new" className="flex items-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all border border-green-200 hover:shadow-lg transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0 shadow-md">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base">New Invoice</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Generate invoice</p>
              </div>
            </Link>

            <Link href="/admin/categories" className="flex items-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all border border-purple-200 hover:shadow-lg transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0 shadow-md">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base">Manage Categories</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Edit categories</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="card bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 border-l-4 border-purple-600 shadow-xl">
          <h3 className="text-base sm:text-lg font-semibold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Welcome to the Admin Dashboard</h3>
          <p className="text-sm sm:text-base text-gray-700">
            This is Phase 1 of your Empire Spare Parts management system. 
            Use the navigation menu to manage products, categories, and generate invoices.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
