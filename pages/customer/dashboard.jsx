import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import CustomerLayout from '@/components/CustomerLayout'
import useSimpleAuth from '@/hooks/useSimpleAuth'
import { supabase } from '@/lib/supabaseClient'

/**
 * Customer Dashboard
 * Overview of customer account and recent activity
 */
export default function CustomerDashboard() {
  const { customer } = useSimpleAuth()
  const [stats, setStats] = useState({
    cartItems: 0,
    totalOrders: 0,
    pendingOrders: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customer) {
      fetchDashboardData()
    }
  }, [customer])

  async function fetchDashboardData() {
    try {
      // Fetch cart items count
      const { count: cartCount } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customer.id)

      // Fetch orders stats
      const { data: orders, count: totalCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })

      const pendingCount = orders?.filter(o => o.status === 'pending').length || 0

      setStats({
        cartItems: cartCount || 0,
        totalOrders: totalCount || 0,
        pendingOrders: pendingCount,
      })

      // Get recent orders with items
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(3)

      setRecentOrders(recentOrdersData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      invoiced: 'bg-purple-100 text-purple-800 border-purple-200',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  return (
    <CustomerLayout>
      <Head>
        <title>Dashboard - Impress Enterprise</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent">
          Welcome, {customer?.name}!
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Link href="/customer/cart">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Cart Items</p>
                  <p className="text-3xl font-bold">{stats.cartItems}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <div className="card bg-gradient-to-br from-slate-500 to-gray-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100 text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Pending Orders</p>
                <p className="text-3xl font-bold">{stats.pendingOrders}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/solar">
            <div className="card hover:shadow-2xl transition-all cursor-pointer border-t-4 border-amber-500">
              <div className="flex items-center">
                <div className="bg-amber-100 p-3 rounded-lg mr-4">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Solar Solutions</h3>
                  <p className="text-sm text-gray-600">Browse solar products</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/electronics">
            <div className="card hover:shadow-2xl transition-all cursor-pointer border-t-4 border-blue-500">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Electronics</h3>
                  <p className="text-sm text-gray-600">Browse electronics</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/furniture">
            <div className="card hover:shadow-2xl transition-all cursor-pointer border-t-4 border-teal-500">
              <div className="flex items-center">
                <div className="bg-teal-100 p-3 rounded-lg mr-4">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Furniture</h3>
                  <p className="text-sm text-gray-600">Browse furniture</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Additional Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/customer/orders">
            <div className="card hover:shadow-2xl transition-all cursor-pointer border-t-4 border-slate-500">
              <div className="flex items-center">
                <div className="bg-slate-100 p-3 rounded-lg mr-4">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">View All Orders</h3>
                  <p className="text-sm text-gray-600">Check your order history</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/contact">
            <div className="card hover:shadow-2xl transition-all cursor-pointer border-t-4 border-cyan-500">
              <div className="flex items-center">
                <div className="bg-cyan-100 p-3 rounded-lg mr-4">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Contact Us</h3>
                  <p className="text-sm text-gray-600">Get in touch with us</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Orders
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">You haven't placed any orders yet.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/solar" className="btn-primary inline-block">
                  Solar Solutions
                </Link>
                <Link href="/electronics" className="btn-primary inline-block">
                  Electronics
                </Link>
                <Link href="/furniture" className="btn-primary inline-block">
                  Furniture
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/customer/orders/${order.id}`}>
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{order.order_number}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{order.order_items.length} item(s)</p>
                      <p>Placed: {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Link>
              ))}

              {stats.totalOrders > 3 && (
                <Link href="/customer/orders" className="block text-center text-blue-600 hover:text-blue-700 font-semibold py-2">
                  View All Orders →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
