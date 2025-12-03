import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabaseClient'

/**
 * Admin Orders List Page
 * Shows all customer orders with search, filter, and status overview
 */
export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    approved: 0,
    invoiced: 0,
  })

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)

      // Build query
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(count)
        `)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      // Fetch customer details for all orders
      const customerIds = [...new Set(data.map(order => order.customer_id))]
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name, phone')
        .in('id', customerIds)

      const customersMap = {}
      customersData?.forEach(customer => {
        customersMap[customer.id] = customer
      })

      setOrders(data || [])
      setCustomers(customersMap)

      // Calculate stats
      const allOrders = filter === 'all' ? data : await fetchAllOrdersForStats()
      calculateStats(allOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  async function fetchAllOrdersForStats() {
    const { data } = await supabase
      .from('orders')
      .select('status')
    return data || []
  }

  function calculateStats(ordersData) {
    const newStats = {
      total: ordersData.length,
      pending: ordersData.filter(o => o.status === 'pending').length,
      reviewed: ordersData.filter(o => o.status === 'reviewed').length,
      approved: ordersData.filter(o => o.status === 'approved').length,
      invoiced: ordersData.filter(o => o.status === 'invoiced').length,
    }
    setStats(newStats)
  }

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  function getStatusBadge(status) {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      reviewed: 'bg-blue-100 text-blue-800 border-blue-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      invoiced: 'bg-purple-100 text-purple-800 border-purple-300',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter orders by search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true
    const customer = customers[order.customer_id]
    const searchLower = searchTerm.toLowerCase()
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      customer?.name.toLowerCase().includes(searchLower) ||
      customer?.phone.includes(searchTerm)
    )
  })

  return (
    <AdminLayout>
      <Head>
        <title>Orders Management - Admin</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent mb-2">
            Orders Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Review and manage customer orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-gray-400">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Orders</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-yellow-400">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-xl sm:text-2xl font-bold text-yellow-700">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-blue-400">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Reviewed</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-700">{stats.reviewed}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-green-400">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Approved</div>
            <div className="text-xl sm:text-2xl font-bold text-green-700">{stats.approved}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-purple-400 col-span-2 sm:col-span-1">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Invoiced</div>
            <div className="text-xl sm:text-2xl font-bold text-purple-700">{stats.invoiced}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'reviewed', label: 'Reviewed' },
                { value: 'approved', label: 'Approved' },
                { value: 'invoiced', label: 'Invoiced' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg font-medium transition-colors ${
                    filter === value
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try a different search term.' : 'No orders have been placed yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const customer = customers[order.customer_id]
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-semibold text-gray-900">{order.order_number}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{customer?.name || 'Unknown'}</div>
                          <div className="text-[10px] sm:text-sm text-gray-500">{customer?.phone || 'N/A'}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                          {order.order_items?.[0]?.count || 0} item(s)
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-md"
                          >
                            <span className="hidden sm:inline">View Details</span>
                            <span className="sm:hidden">View</span>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
