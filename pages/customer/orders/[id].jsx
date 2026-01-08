import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import CustomerLayout from '@/components/CustomerLayout'
import useSimpleAuth from '@/hooks/useSimpleAuth'
import { supabase } from '@/lib/supabaseClient'
import siteConfig from '@/site.config'

/**
 * Customer Order Detail Page - Enhanced
 * Shows detailed order information with reorder and invoice download
 */
export default function OrderDetail() {
  const router = useRouter()
  const { id } = router.query
  const { customer } = useSimpleAuth()
  
  const [order, setOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const fetchOrderDetails = useCallback(async () => {
    if (!id || !customer) return
    try {
      setLoading(true)

      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('customer_id', customer.id)
        .single()

      if (orderError || !orderData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Fetch order items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(
            id,
            name,
            slug,
            brand,
            car_model,
            product_images(image_url, is_primary)
          )
        `)
        .eq('order_id', id)
        .order('created_at', { ascending: true })

      if (itemsError) throw itemsError

      setOrder(orderData)
      setOrderItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }, [id, customer])

  useEffect(() => {
    fetchOrderDetails()
  }, [fetchOrderDetails])

  async function handleReorder() {
    if (!confirm('Add all items from this order to your cart?')) return
    
    setReordering(true)
    try {
      // Add each item to cart
      const cartPromises = orderItems.map(item => 
        supabase
          .from('cart_items')
          .upsert({
            customer_id: customer.id,
            product_id: item.product_id,
            quantity: item.quantity
          }, {
            onConflict: 'customer_id,product_id',
            ignoreDuplicates: false
          })
      )
      
      await Promise.all(cartPromises)
      
      // Trigger cart update
      window.dispatchEvent(new Event('cart-updated'))
      
      alert(`${orderItems.length} item(s) added to cart!`)
      router.push('/customer/cart')
    } catch (error) {
      console.error('Reorder error:', error)
      alert('Failed to reorder. Please try again.')
    } finally {
      setReordering(false)
    }
  }

  async function handleCancelOrder() {
    if (!confirm('Are you sure you want to cancel this order?')) return
    
    setCancelling(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', id)
      
      if (error) throw error
      
      alert('Order cancelled successfully')
      fetchOrderDetails()
    } catch (error) {
      console.error('Cancel error:', error)
      alert('Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      processing: 'bg-purple-100 text-purple-800 border-purple-300',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    }
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      processing: '⚙️',
      shipped: '🚚',
      delivered: '📦',
      cancelled: '❌',
    }
    return icons[status] || '📋'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProductImage = (item) => {
    const product = item.product
    if (!product?.product_images || product.product_images.length === 0) {
      return '/placeholder-product.png'
    }
    const primaryImage = product.product_images.find(img => img.is_primary)
    return primaryImage?.image_url || product.product_images[0]?.image_url
  }

  const statusTimeline = [
    { id: 'pending', label: 'Order Placed', icon: '📋' },
    { id: 'confirmed', label: 'Confirmed', icon: '✅' },
    { id: 'processing', label: 'Processing', icon: '⚙️' },
    { id: 'shipped', label: 'Shipped', icon: '🚚' },
    { id: 'delivered', label: 'Delivered', icon: '📦' },
  ]

  const getCurrentStatusIndex = (status) => {
    if (status === 'cancelled') return -1
    return statusTimeline.findIndex(s => s.id === status)
  }

  // Real-time order status updates
  useEffect(() => {
    if (!id) return

    console.log('Setting up real-time subscription for order:', id)

    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          console.log('Order updated in real-time:', payload)
          const newOrder = payload.new
          const oldOrder = payload.old

          // Trigger visual update animation
          setStatusUpdating(true)
          setTimeout(() => setStatusUpdating(false), 2000)

          // Update order state
          setOrder(newOrder)

          // Show toast notification if status changed
          if (oldOrder.status !== newOrder.status) {
            const statusMessages = {
              pending: 'Your order is being reviewed',
              reviewed: 'Order reviewed - pricing in progress',
              approved: 'Order approved! Invoice coming soon',
              invoiced: 'Invoice generated - check your email'
            }
            
            console.log('Status changed from', oldOrder.status, 'to', newOrder.status)
            
            setToast({
              type: 'success',
              message: `🎉 Order Status Updated: ${statusMessages[newOrder.status] || newOrder.status}`
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('Order subscription status:', status)
      })

    return () => {
      console.log('Cleaning up order subscription')
      supabase.removeChannel(channel)
    }
  }, [id])

  async function handleCancelOrder(reason) {
    try {
      setCancelling(true)

      await cancelOrder(order.id, customer.id, 'customer', reason || 'Cancelled by customer')

      setToast({
        type: 'success',
        message: '✓ Order cancelled successfully'
      })
      
      setShowCancellationModal(false)
      await fetchOrderDetails()
    } catch (error) {
      console.error('Error cancelling order:', error)
      setToast({
        type: 'error',
        message: 'Failed to cancel order: ' + error.message
      })
    } finally {
      setCancelling(false)
    }
  }

  function getStatusInfo(status) {
    const info = {
      pending: {
        color: 'yellow',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        message: 'Your order is being reviewed by our team.',
      },
      quotation_sent: {
        color: 'blue',
        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        message: 'Quotation has been sent to you via WhatsApp. Please review and confirm.',
      },
      quote_approved: {
        color: 'green',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        message: 'Quotation approved! Awaiting payment confirmation.',
      },
      payment_pending: {
        color: 'amber',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        message: 'Please make the payment to proceed with your order.',
      },
      payment_received: {
        color: 'green',
        icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
        message: 'Payment received! Your order is being processed.',
      },
      processing: {
        color: 'blue',
        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
        message: 'Your order is being processed and prepared.',
      },
      ready_for_pickup: {
        color: 'purple',
        icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
        message: 'Your order is ready for pickup!',
      },
      completed: {
        color: 'emerald',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        message: 'Order completed. Thank you for your business!',
      },
      cancelled: {
        color: 'red',
        icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
        message: 'This order has been cancelled.',
      },
      reviewed: {
        color: 'blue',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        message: 'Our team has reviewed your order and is preparing pricing.',
      },
      approved: {
        color: 'green',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        message: 'Your order has been approved! Invoice generation in progress.',
      },
      invoiced: {
        color: 'purple',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        message: 'Invoice has been generated. Please check your email or contact us.',
      },
    }

    return info[status] || info.pending
  }

  function getProductImage(product) {
    if (!product?.product_images || product.product_images.length === 0) {
      return '/images/placeholder-product.jpg'
    }
    
    const primaryImage = product.product_images.find(img => img.is_primary)
    return primaryImage?.image_url || product.product_images[0]?.image_url
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (notFound) {
    return (
      <CustomerLayout>
        <Head>
          <title>Order Not Found - {siteConfig.brandName}</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        </Head>
        <div className="max-w-4xl mx-auto">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have access to it.</p>
            <Link href="/customer/orders" className="btn-primary inline-block px-6 py-3">
              View All Orders
            </Link>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const isCancelled = order.is_cancelled || order.status === 'cancelled'
  const canCancel = canCustomerCancelOrder(order)

  return (
    <CustomerLayout>
      <Head>
        <title>Order {order.order_number} - Empire Car A/C</title>
      </Head>

      {/* Toast Notification */}
      {toast && (
        <CustomerToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            href="/customer/orders"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>

          {/* Order Header */}
          <div className={`bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100 transition-all duration-500 ${statusUpdating ? 'ring-4 ring-green-300 ring-opacity-50 scale-[1.02]' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Order {order.order_number}
                </h1>
                <p className="text-sm text-gray-600">
                  Placed on {formatDate(order.created_at)}
                </p>
              </div>
              <div className="relative">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border bg-${statusInfo.color}-100 text-${statusInfo.color}-800 border-${statusInfo.color}-200 transition-all duration-300 ${statusUpdating ? 'animate-pulse scale-110' : ''}`}>
                  {getStatusDisplayName(order.status)}
                </span>
                {statusUpdating && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
              </div>
            </div>

            {/* Cancellation Alert */}
            {isCancelled && (
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 mb-1">Order Cancelled</h3>
                    {order.cancelled_at && (
                      <p className="text-sm text-red-800 mb-1">
                        Cancelled on {formatDate(order.cancelled_at)}
                      </p>
                    )}
                    {order.cancellation_reason && (
                      <p className="text-sm text-red-800">
                        <span className="font-medium">Reason:</span> {order.cancellation_reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Message */}
            <div className={`bg-${statusInfo.color}-50 border border-${statusInfo.color}-200 rounded-lg p-4 flex items-start`}>
              <svg className={`w-6 h-6 text-${statusInfo.color}-600 mr-3 flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusInfo.icon} />
              </svg>
              <div className="flex-1">
                <h3 className={`font-semibold text-${statusInfo.color}-900 mb-1`}>
                  Order Status
                </h3>
                <p className={`text-sm text-${statusInfo.color}-800`}>
                  {statusInfo.message}
                </p>
              </div>
            </div>

            {/* Cancel Order Button */}
            {canCancel && (
              <div className="mt-4">
                <button
                  onClick={() => setShowCancellationModal(true)}
                  disabled={cancelling}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cancel Order
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  You can cancel this order until payment is processed.
                </p>
              </div>
            )}

            {/* Payment Information */}
            {order.payment_received_at && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Payment Confirmed
                </h3>
                <div className="text-xs sm:text-sm space-y-1 text-green-800">
                  {order.payment_amount && (
                    <p><span className="font-medium">Amount Paid:</span> ₹{order.payment_amount.toFixed(2)}</p>
                  )}
                  <p><span className="font-medium">Received on:</span> {formatDate(order.payment_received_at)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  {/* Product Image */}
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={getProductImage(item.product)}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.product_name}
                    </h3>
                    {item.product_code && (
                      <p className="text-xs text-gray-500 mb-2">Code: {item.product_code}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Quantity: <span className="font-semibold text-gray-900">{item.quantity}</span>
                      </span>
                      {item.product?.brand && (
                        <span className="text-gray-500">
                          Brand: {item.product.brand}
                        </span>
                      )}
                    </div>
                    {item.product?.car_model && (
                      <p className="text-xs text-gray-500 mt-1">
                        Compatible: {item.product.car_model}
                      </p>
                    )}
                  </div>

                  {/* View Product Link */}
                  {item.product?.slug && (
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="flex-shrink-0 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Order Notes</h2>
              <p className="text-gray-700 whitespace-pre-line">{order.notes}</p>
            </div>
          )}

          {/* Pricing Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">About Pricing</h3>
                <p className="text-sm text-blue-800">
                  Pricing information will be provided after our team reviews your order. 
                  You will receive a detailed invoice via email once the order is processed.
                  For any questions, please contact our sales team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancellationModal && (
        <CancellationModal
          order={order}
          userType="customer"
          onClose={() => setShowCancellationModal(false)}
          onConfirm={handleCancelOrder}
        />
      )}
    </CustomerLayout>
  )
}
