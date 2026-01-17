import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import AdminLayout from '../../../components/AdminLayout'
import { supabase } from '../../../lib/supabaseClient'
import { useAdminBusiness } from '@/context/AdminBusinessContext'

export default function AdminDeliveries() {
  const router = useRouter()
  const { businessType, getThemeColor } = useAdminBusiness()
  const theme = getThemeColor() // 'blue', 'amber', 'green'
  
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('board') // 'board' or 'list'

  useEffect(() => {
    fetchDeliveries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, businessType])

  async function fetchDeliveries() {
    setLoading(true)
    try {
      let query = supabase
        .from('delivery_tracking')
        .select(`
          *,
          orders:order_id (
            id,
            order_number,
            customer_name,
            customer_phone,
            payment_status
          )
        `)
        .order('created_at', { ascending: false })

      if (businessType !== 'all') {
        query = query.eq('business_type', businessType)
      }

      if (filterStatus !== 'all') {
        query = query.eq('current_status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setDeliveries(data || [])
    } catch (error) {
      console.error('Error fetching deliveries:', error)
      alert('Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  const filteredDeliveries = deliveries.filter(delivery => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      delivery.tracking_number?.toLowerCase().includes(search) ||
      delivery.orders?.order_number?.toLowerCase().includes(search) ||
      delivery.orders?.customer_name?.toLowerCase().includes(search) ||
      delivery.driver_name?.toLowerCase().includes(search)
    )
  })

  // Status columns with fixed semantic colors for states
  const statusColumns = [
    { status: 'packing', label: 'Packing', icon: '📦', color: 'yellow' },
    { status: 'packed', label: 'Ready', icon: '✅', color: 'green' },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚', color: 'blue' },
    { status: 'nearby', label: 'Nearby', icon: '📍', color: 'purple' },
    { status: 'delivered', label: 'Delivered', icon: '🎉', color: 'emerald' }
  ]

  const getStatusColor = (status) => {
    const colors = {
      order_placed: 'gray',
      packing: 'yellow',
      packed: 'green',
      out_for_delivery: 'blue',
      in_transit: 'indigo',
      nearby: 'purple',
      delivered: 'emerald',
      failed: 'red',
      returned: 'orange'
    }
    return colors[status] || 'gray'
  }

  const getDeliveriesByStatus = (status) => {
    return filteredDeliveries.filter(d => d.current_status === status)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${theme}-600 mx-auto mb-4`}></div>
            <p className="text-gray-600">Loading deliveries...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Delivery Board - Admin</title>
      </Head>

      <div className={`p-6 min-h-screen bg-gradient-to-br from-${theme}-50 via-white to-orange-50 space-y-6`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Board</h1>
            <p className="text-gray-600 mt-1">Track and manage all deliveries in real-time</p>
          </div>
          {businessType !== 'all' && (
             <div className={`px-4 py-2 rounded-lg bg-${theme}-100 text-${theme}-800 font-bold uppercase`}>
               {businessType} Logistics
             </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {statusColumns.map(col => {
            const count = getDeliveriesByStatus(col.status).length
            return (
              <div key={col.status} className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderColor: `var(--color-${col.color}-500)` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600">{col.label}</p>
                  </div>
                  <span className="text-3xl">{col.icon}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tracking number, order, customer, or driver..."
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${theme}-500`}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('board')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'board'
                    ? `bg-${theme}-600 text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'list'
                    ? `bg-${theme}-600 text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📋 List
              </button>
            </div>

            {/* Status Filter (for list view) */}
            {viewMode === 'list' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${theme}-500`}
              >
                <option value="all">All Status</option>
                <option value="order_placed">Order Placed</option>
                <option value="packing">Packing</option>
                <option value="packed">Packed</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="in_transit">In Transit</option>
                <option value="nearby">Nearby</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            )}
          </div>
        </div>

        {/* Board View */}
        {viewMode === 'board' && (
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4 min-w-max">
              {statusColumns.map(column => (
                <div key={column.status} className="flex-shrink-0 w-80">
                  {/* Column Header */}
                  <div className={`bg-${column.color}-100 border-2 border-${column.color}-300 rounded-lg p-3 mb-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{column.icon}</span>
                        <h3 className="font-semibold text-gray-900">{column.label}</h3>
                      </div>
                      <span className={`bg-${column.color}-600 text-white px-2 py-1 rounded-full text-sm font-bold`}>
                        {getDeliveriesByStatus(column.status).length}
                      </span>
                    </div>
                  </div>

                  {/* Column Cards */}
                  <div className="space-y-3">
                    {getDeliveriesByStatus(column.status).map(delivery => (
                      <div
                        key={delivery.id}
                        onClick={() => router.push(`/admin/deliveries/${delivery.id}`)}
                        className={`bg-white rounded-lg shadow hover:shadow-md transition-all cursor-pointer p-4 hover:ring-2 hover:ring-${theme}-300`}
                      >
                        {/* Tracking Number */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-gray-500">Tracking #</p>
                            <p className="font-mono text-sm font-semibold text-gray-900">
                              {delivery.tracking_number || 'N/A'}
                            </p>
                          </div>
                          {delivery.delivery_type === 'white_glove' && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                              🌟 White Glove
                            </span>
                          )}
                           {businessType === 'all' && delivery.business_type && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs capitalize ml-2">
                                {delivery.business_type}
                              </span>
                           )}
                        </div>

                        {/* Order Info */}
                        <div className="border-t border-gray-100 pt-2 mb-2">
                          <p className="text-xs text-gray-500">Order</p>
                          <p className="text-sm font-medium text-gray-900">
                            {delivery.orders?.order_number}
                          </p>
                        </div>

                        {/* Customer */}
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="text-sm text-gray-900">{delivery.orders?.customer_name}</p>
                        </div>

                        {/* Driver (if assigned) */}
                        {delivery.driver_name && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500">Driver</p>
                            <p className="text-sm text-gray-900 flex items-center gap-1">
                              🚗 {delivery.driver_name}
                            </p>
                          </div>
                        )}

                        {/* Delivery Date */}
                        {delivery.estimated_delivery_date && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500">Est. Delivery</p>
                            <p className="text-sm text-gray-900">
                              {new Date(delivery.estimated_delivery_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {/* Location */}
                        {delivery.current_location && (
                          <div className="bg-gray-50 rounded p-2 text-xs text-gray-600">
                            📍 {delivery.current_location}
                          </div>
                        )}

                        {/* Special Services */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {delivery.requires_measurement && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                              📏 Measure
                            </span>
                          )}
                          {delivery.requires_installation && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                              🔧 Install
                            </span>
                          )}
                          {delivery.requires_old_item_removal && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">
                              ♻️ Remove Old
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {getDeliveriesByStatus(column.status).length === 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm border-2 border-dashed border-gray-200">
                        No deliveries
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tracking #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Est. Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeliveries.map(delivery => (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900 block">
                          {delivery.tracking_number || 'N/A'}
                        </span>
                        {businessType === 'all' && delivery.business_type && (
                          <span className="text-xs text-gray-500 capitalize">
                            {delivery.business_type}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {delivery.orders?.order_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-gray-900">{delivery.orders?.customer_name}</p>
                          <p className="text-xs text-gray-500">{delivery.orders?.customer_phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(delivery.current_status)}-100 text-${getStatusColor(delivery.current_status)}-700`}>
                          {delivery.current_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.driver_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.estimated_delivery_date 
                          ? new Date(delivery.estimated_delivery_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => router.push(`/admin/deliveries/${delivery.id}`)}
                          className={`text-${theme}-600 hover:text-${theme}-800 font-medium`}
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDeliveries.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                     {businessType !== 'all' 
                      ? `No ${businessType} deliveries found` 
                      : 'No deliveries found'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
