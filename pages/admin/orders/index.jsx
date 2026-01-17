import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabaseClient'
import { getStatusColor, getStatusDisplayName } from '@/utils/enhancedOrderHelpers'
import { useAdminBusiness } from '@/context/AdminBusinessContext'

/**
 * Admin Orders List Page
 * Shows all customer orders with search, filter, and status overview
 */
export default function AdminOrders() {
  const { businessType, getThemeColor } = useAdminBusiness()
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    quotation_sent: 0,
    payment_received: 0,
    completed: 0,
    cancelled: 0,
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

      // Apply Business Context filter
      if (businessType !== 'all') {
        query = query.eq('business_type', businessType)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
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
        setCustomers(customersMap)
      } else {
        setCustomers({})
      }

      setOrders(data || [])

      // Calculate stats
      const allOrders = (filter === 'all') ? data : await fetchAllOrdersForStats()
      calculateStats(allOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, businessType])

  async function fetchAllOrdersForStats() {
    let query = supabase.from('orders').select('status, is_cancelled, business_type')
    
    if (businessType !== 'all') {
      query = query.eq('business_type', businessType)
    }

    const { data } = await query
    return data || []
  }

  function calculateStats(ordersData) {
    if (!ordersData) return;
    
    const newStats = {
      total: ordersData.length,
      pending: ordersData.filter(o => o.status === 'pending').length,
      quotation_sent: ordersData.filter(o => o.status === 'quotation_sent').length,
      payment_received: ordersData.filter(o => o.status === 'payment_received').length,
      completed: ordersData.filter(o => o.status === 'completed').length,
      cancelled: ordersData.filter(o => o.is_cancelled || o.status === 'cancelled').length,
    }
    setStats(newStats)
  }

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  function getStatusBadge(status) {
    const color = getStatusColor(status)
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border bg-${color}-100 text-${color}-800 border-${color}-300`}>
        {getStatusDisplayName(status)}
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
        <title>Orders Management - {businessType === 'all' ? 'All' : businessType}</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent mb-2 capitalize">
              {businessType === 'all' ? 'Orders Management' : `${businessType} Orders`}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Review and manage customer orders</p>
          </div>
           {businessType !== 'all' && (
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-${getThemeColor()}-100 text-${getThemeColor()}-800`}>
               {businessType} Mode
             </span>
           )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-gray-400">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Orders</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-yellow-400">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">New Orders</div>
            <div className="text-xl sm:text-2xl font-bold text-yellow-700">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-blue-400">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Quotation Sent</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-700">{stats.quotation_sent}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-green-400">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Paid</div>
            <div className="text-xl sm:text-2xl font-bold text-green-700">{stats.payment_received}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-emerald-400">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700">{stats.completed}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-red-400">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Cancelled</div>
            <div className="text-xl sm:text-2xl font-bold text-red-700">{stats.cancelled}</div>
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
                { value: 'all', label: 'All Orders' },
                { value: 'pending', label: 'New Orders' },
                { value: 'quotation_sent', label: 'Quotation Sent' },
                { value: 'payment_received', label: 'Paid' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
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
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredOrders.map((order) => {
                const customer = customers[order.customer_id]
                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-1">{order.order_number}</div>
                        <div className="text-xs text-gray-500">{formatDate(order.created_at)}</div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-gray-900">{customer?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-gray-600">{customer?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                         <span className={`mr-2 h-2 w-2 rounded-full ${
                             order.business_type === 'electronics' ? 'bg-blue-500' :
                             order.business_type === 'furniture' ? 'bg-amber-600' :
                             order.business_type === 'solar' ? 'bg-green-500' :
                             'bg-gray-400'
                         }`}></span>
                         <span className="text-xs uppercase text-gray-500 font-bold">{order.business_type || 'ALL'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span className="text-gray-600">{order.order_items?.[0]?.count || 0} item(s)</span>
                      </div>
                    </div>
                    
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-md text-sm"
                    >
                      View Details
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Order #
                      </th>
                      {businessType === 'all' && (
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                           Type
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => {
                      const customer = customers[order.customer_id]
                      return (
                        <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {order.order_number}
                          </td>
                           {businessType === 'all' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 uppercase text-xs">
                               <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                   order.business_type === 'electronics' ? 'bg-blue-100 text-blue-800' :
                                   order.business_type === 'furniture' ? 'bg-amber-100 text-amber-800' :
                                   order.business_type === 'solar' ? 'bg-green-100 text-green-800' :
                                   'bg-gray-100 text-gray-800'
                               }`}>
                                 {order.business_type || 'all'}
                               </span>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{customer?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{customer?.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.order_items?.[0]?.count || 0} item(s)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:text-blue-900 font-semibold hover:underline">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
