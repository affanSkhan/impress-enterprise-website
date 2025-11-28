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
    totalOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  async function fetchStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    
    // Fetch dashboard statistics
    const [
      productsRes, 
      categoriesRes, 
      activeRes, 
      invoicesRes,
      ordersRes,
      pendingOrdersRes,
      customersRes,
      revenueRes,
      recentOrdersRes
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('total').gte('created_at', startOfMonth),
      supabase.from('orders').select('*, customer:customers(name)').order('created_at', { ascending: false }).limit(5)
    ])

    const monthlyRevenue = revenueRes.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0

    setStats({
      totalProducts: productsRes.count || 0,
      totalCategories: categoriesRes.count || 0,
      activeProducts: activeRes.count || 0,
      recentInvoices: invoicesRes.count || 0,
      totalOrders: ordersRes.count || 0,
      pendingOrders: pendingOrdersRes.count || 0,
      totalCustomers: customersRes.count || 0,
      monthlyRevenue: monthlyRevenue,
    })
    
    setRecentOrders(recentOrdersRes.data || [])
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

        {/* Stats Cards - Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Link href="/admin/orders" className="card bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs sm:text-sm mb-1">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/admin/orders?status=pending" className="card bg-gradient-to-br from-red-500 via-pink-500 to-rose-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs sm:text-sm mb-1">Pending Orders</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.pendingOrders}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Link>

          <div className="card bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs sm:text-sm mb-1">Total Customers</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalCustomers}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs sm:text-sm mb-1">Monthly Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link href="/admin/products" className="card bg-gradient-to-br from-slate-500 via-slate-600 to-gray-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs sm:text-sm mb-1">Total Products</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalProducts}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </Link>

          <div className="card bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs sm:text-sm mb-1">Active Products</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.activeProducts}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <Link href="/admin/categories" className="card bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs sm:text-sm mb-1">Categories</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalCategories}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/admin/invoices" className="card bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs sm:text-sm mb-1">Recent Invoices (30d)</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.recentInvoices}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="card mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link href="/admin/orders" className="flex items-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl hover:from-orange-100 hover:to-amber-100 transition-all border border-orange-200 hover:shadow-lg transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-orange-600 to-amber-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0 shadow-md">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base">View Orders</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Manage customer orders</p>
              </div>
            </Link>

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
                <p className="font-semibold text-sm sm:text-base">Categories</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Manage categories</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="card mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                View All →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.order_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{order.customer?.name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'invoiced' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        ₹{(order.admin_total || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Welcome Message */}
        <div className="card bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 border-l-4 border-purple-600 shadow-xl">
          <h3 className="text-base sm:text-lg font-semibold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Welcome to the Admin Dashboard</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-2">
            Complete management system for Empire Spare Parts with full e-commerce functionality.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Products & Categories
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Customer Orders
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Invoice Generation
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Public Invoice Sharing
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ WhatsApp Integration
            </span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
