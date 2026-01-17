import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import AdminLayout from '../../../components/AdminLayout'
import { supabase } from '../../../lib/supabaseClient'

export default function DeliveryDetails() {
  const router = useRouter()
  const { id } = router.query
  const [delivery, setDelivery] = useState(null)
  const [statusHistory, setStatusHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Form states
  const [newStatus, setNewStatus] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [location, setLocation] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [estimatedDate, setEstimatedDate] = useState('')

  useEffect(() => {
    if (id) {
      fetchDeliveryDetails()
    }
  }, [id])

  async function fetchDeliveryDetails() {
    try {
      // Fetch delivery tracking
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery_tracking')
        .select(`
          *,
          orders:order_id (
            id,
            order_number,
            customer_name,
            customer_phone,
            customer_email,
            delivery_address,
            payment_status,
            order_items (
              id,
              product_name,
              quantity
            )
          )
        `)
        .eq('id', id)
        .single()

      if (deliveryError) throw deliveryError

      setDelivery(deliveryData)
      setNewStatus(deliveryData.current_status)
      setLocation(deliveryData.current_location || '')
      setDriverName(deliveryData.driver_name || '')
      setDriverPhone(deliveryData.driver_phone || '')
      setVehicleNumber(deliveryData.vehicle_number || '')
      setEstimatedDate(deliveryData.estimated_delivery_date || '')

      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from('delivery_status_history')
        .select('*')
        .eq('delivery_tracking_id', id)
        .order('created_at', { ascending: false })

      if (historyError) throw historyError
      setStatusHistory(historyData || [])

    } catch (error) {
      console.error('Error fetching delivery:', error)
      alert('Failed to load delivery details')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus() {
    if (!newStatus) {
      alert('Please select a status')
      return
    }

    setUpdating(true)
    try {
      // Update delivery tracking
      const { error: updateError } = await supabase
        .from('delivery_tracking')
        .update({
          current_status: newStatus,
          current_location: location,
          driver_name: driverName,
          driver_phone: driverPhone,
          vehicle_number: vehicleNumber,
          estimated_delivery_date: estimatedDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Send push notification to customer
      try {
        await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Delivery Status Updated',
            message: statusMessage || `Your delivery is now ${newStatus.replace('_', ' ')}`,
            url: `/customer/orders/${delivery.order_id}`,
            userType: 'customer',
            userId: delivery.orders?.customer_id
          })
        })
      } catch (pushError) {
        console.error('Push notification error:', pushError)
      }

      alert('Status updated successfully!')
      fetchDeliveryDetails()
      setStatusMessage('')

    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const statusOptions = [
    { value: 'order_placed', label: '📝 Order Placed' },
    { value: 'packing', label: '📦 Packing' },
    { value: 'packed', label: '✅ Packed' },
    { value: 'out_for_delivery', label: '🚚 Out for Delivery' },
    { value: 'in_transit', label: '🚛 In Transit' },
    { value: 'nearby', label: '📍 Nearby' },
    { value: 'delivered', label: '🎉 Delivered' },
    { value: 'failed', label: '❌ Failed' },
    { value: 'returned', label: '↩️ Returned' }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading delivery details...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!delivery) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Delivery not found</p>
          <button
            onClick={() => router.push('/admin/deliveries')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Deliveries
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Delivery Details - {delivery.tracking_number}</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/admin/deliveries')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Deliveries
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Details</h1>
          <p className="text-gray-600 mt-1">Tracking # {delivery.tracking_number}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Update Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Update Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Status</h2>
              
              <div className="space-y-4">
                {/* Status Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Message (for customer notification)
                  </label>
                  <input
                    type="text"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="e.g., Your package will arrive today"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Distribution Center, Mumbai"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Driver Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driver Name
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Driver name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driver Phone
                    </label>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="Phone number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="Vehicle #"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Estimated Delivery Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    value={estimatedDate}
                    onChange={(e) => setEstimatedDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Update Button */}
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status & Notify Customer'}
                </button>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Status History</h2>
              
              <div className="space-y-4">
                {statusHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      {index < statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-blue-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {history.status.replace('_', ' ').toUpperCase()}
                          </p>
                          {history.status_message && (
                            <p className="text-sm text-gray-600">{history.status_message}</p>
                          )}
                          {history.location && (
                            <p className="text-sm text-gray-500">📍 {history.location}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(history.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Info */}
          <div className="space-y-6">
            {/* Order Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Order Number</p>
                  <p className="font-semibold text-gray-900">{delivery.orders?.order_number}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="text-sm text-gray-900">{delivery.orders?.customer_name}</p>
                  <p className="text-xs text-gray-600">{delivery.orders?.customer_phone}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Delivery Address</p>
                  <p className="text-sm text-gray-900">{delivery.delivery_address}</p>
                </div>

                {delivery.delivery_type === 'white_glove' && (
                  <div className="bg-purple-50 rounded p-3">
                    <p className="text-sm font-semibold text-purple-900">🌟 White Glove Service</p>
                    {delivery.requires_measurement && (
                      <p className="text-xs text-purple-700 mt-1">📏 Measurement Required</p>
                    )}
                    {delivery.requires_installation && (
                      <p className="text-xs text-purple-700 mt-1">🔧 Installation Required</p>
                    )}
                    {delivery.requires_old_item_removal && (
                      <p className="text-xs text-purple-700 mt-1">♻️ Old Item Removal</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
              <div className="space-y-2">
                {delivery.orders?.order_items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-900">{item.product_name}</span>
                    <span className="text-gray-600">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
