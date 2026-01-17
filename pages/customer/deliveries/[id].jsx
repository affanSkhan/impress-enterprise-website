import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import CustomerLayout from '@/components/CustomerLayout'
import useSimpleAuth from '@/hooks/useSimpleAuth'
import { supabase } from '@/lib/supabaseClient'
import siteConfig from '@/site.config'

/**
 * Customer Delivery Tracking Page
 * Shows real-time delivery status for a specific order
 */
export default function CustomerDeliveryTracking() {
  const router = useRouter()
  const { id } = router.query // order_id
  const { customer } = useSimpleAuth()
  
  const [delivery, setDelivery] = useState(null)
  const [statusHistory, setStatusHistory] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchDeliveryDetails() {
    if (!id || !customer) return
    
    try {
      setLoading(true)

      // Fetch delivery with order details
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery_tracking')
        .select(`
          *,
          order:orders!inner(
            id,
            order_number,
            customer_id,
            total_amount,
            created_at
          )
        `)
        .eq('order_id', id)
        .eq('order.customer_id', customer.id)
        .single()

      if (deliveryError) throw deliveryError

      setDelivery(deliveryData)

      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from('delivery_status_history')
        .select('*')
        .eq('delivery_id', deliveryData.id)
        .order('changed_at', { ascending: false })

      if (historyError) throw historyError

      setStatusHistory(historyData || [])
    } catch (error) {
      console.error('Error fetching delivery:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!id || !customer) return
    
    fetchDeliveryDetails()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`delivery:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_tracking',
          filter: `order_id=eq.${id}`
        },
        () => {
          fetchDeliveryDetails()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, customer])

  function getStatusColor(status) {
    const colors = {
      order_placed: 'blue',
      packing: 'yellow',
      packed: 'purple',
      out_for_delivery: 'indigo',
      in_transit: 'cyan',
      nearby: 'orange',
      delivered: 'green',
      failed: 'red',
      returned: 'gray'
    }
    return colors[status] || 'gray'
  }

  function getStatusLabel(status) {
    const labels = {
      order_placed: 'Order Placed',
      packing: 'Packing',
      packed: 'Packed',
      out_for_delivery: 'Out for Delivery',
      in_transit: 'In Transit',
      nearby: 'Nearby',
      delivered: 'Delivered',
      failed: 'Failed',
      returned: 'Returned'
    }
    return labels[status] || status
  }

  const statusSteps = [
    { key: 'order_placed', label: 'Order Placed', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'packing', label: 'Packing', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
    { key: 'delivered', label: 'Delivered', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
  ]

  function isStatusCompleted(statusKey) {
    if (!delivery) return false
    const currentIndex = statusSteps.findIndex(s => s.key === delivery.status)
    const stepIndex = statusSteps.findIndex(s => s.key === statusKey)
    return stepIndex <= currentIndex
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading delivery tracking...</p>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (!delivery) {
    return (
      <CustomerLayout>
        <Head>
          <title>Delivery Not Found - {siteConfig.brandName}</title>
        </Head>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center bg-white rounded-xl shadow-lg p-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Delivery Not Found</h1>
            <p className="text-gray-600 mb-6">No delivery tracking information found for this order.</p>
            <Link href="/customer/orders" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-md">
              View My Orders
            </Link>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <Head>
        <title>Track Delivery - Order {delivery.order.order_number} - {siteConfig.brandName}</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            href={`/customer/orders/${delivery.order_id}`}
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Order
          </Link>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Track Your Delivery
                </h1>
                <p className="text-gray-600">
                  Order #{delivery.order.order_number}
                </p>
                {delivery.tracking_number && (
                  <p className="text-sm text-gray-500 mt-1">
                    Tracking: <span className="font-mono font-semibold">{delivery.tracking_number}</span>
                  </p>
                )}
              </div>
              <div>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold bg-${getStatusColor(delivery.status)}-100 text-${getStatusColor(delivery.status)}-800 border border-${getStatusColor(delivery.status)}-200`}>
                  {getStatusLabel(delivery.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Progress */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Delivery Progress</h2>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-6 top-6 bottom-6 w-1 bg-gray-200"></div>
              <div 
                className="absolute left-6 top-6 w-1 bg-gradient-to-b from-purple-600 to-pink-600 transition-all duration-500"
                style={{ 
                  height: `${(statusSteps.findIndex(s => s.key === delivery.status) / (statusSteps.length - 1)) * 100}%`
                }}
              ></div>

              {/* Status Steps */}
              <div className="space-y-6">
                {statusSteps.map((step, index) => {
                  const isCompleted = isStatusCompleted(step.key)
                  const isCurrent = delivery.status === step.key
                  
                  return (
                    <div key={step.key} className="relative flex items-start">
                      {/* Circle */}
                      <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                          : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-purple-200' : ''} transition-all duration-300`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                        </svg>
                      </div>

                      {/* Content */}
                      <div className="ml-4 flex-1">
                        <h3 className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                          {step.label}
                        </h3>
                        {isCurrent && delivery.status_message && (
                          <p className="text-sm text-gray-600 mt-1">{delivery.status_message}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {delivery.current_location && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Location</p>
                  <p className="font-semibold text-gray-900">{delivery.current_location}</p>
                </div>
              )}
              
              {delivery.driver_name && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Driver</p>
                  <p className="font-semibold text-gray-900">{delivery.driver_name}</p>
                  {delivery.driver_phone && (
                    <p className="text-sm text-gray-600">{delivery.driver_phone}</p>
                  )}
                </div>
              )}
              
              {delivery.vehicle_info && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                  <p className="font-semibold text-gray-900">{delivery.vehicle_info}</p>
                </div>
              )}
              
              {delivery.estimated_delivery && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estimated Delivery</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(delivery.estimated_delivery).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* White-Glove Services */}
            {(delivery.requires_measurement || delivery.requires_installation || delivery.requires_old_item_removal) && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  White-Glove Services Included
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {delivery.requires_measurement && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      Measurement
                    </span>
                  )}
                  {delivery.requires_installation && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Installation
                    </span>
                  )}
                  {delivery.requires_old_item_removal && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Old Item Removal
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Status History</h2>
              <div className="space-y-3">
                {statusHistory.map((history) => (
                  <div key={history.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full bg-${getStatusColor(history.status)}-500 mt-2 flex-shrink-0`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">
                          {getStatusLabel(history.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(history.changed_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {history.message && (
                        <p className="text-sm text-gray-600">{history.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
