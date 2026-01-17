import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabaseClient'
import { convertOrderToInvoice } from '@/utils/orderHelpers'
import { 
  markQuotationSent, 
  cancelOrder,
  canAdminCancelOrder,
  generateWhatsAppLink,
  getStatusColor,
  getStatusDisplayName,
  getNextStatuses
} from '@/utils/enhancedOrderHelpers'
import CancellationModal from '@/components/CancellationModal'

/**
 * Admin Order Detail Page
 * View and edit order details, set prices, update status, generate invoice
 */
export default function AdminOrderDetail() {
  const router = useRouter()
  const { id } = router.query
  
  const [order, setOrder] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [adminUser, setAdminUser] = useState(null)

  const fetchOrderDetails = useCallback(async () => {
    if (!id) return
    
    try {
      setLoading(true)

      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (orderError || !orderData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Fetch customer
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', orderData.customer_id)
        .single()

      // Fetch order items with product details including price
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(
            id,
            name,
            slug,
            brand,
            sku,
            price,
            product_images(image_url, is_primary)
          )
        `)
        .eq('order_id', id)
        .order('created_at', { ascending: true })

      if (itemsError) throw itemsError

      setOrder(orderData)
      setCustomer(customerData)
      setOrderItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching order:', error)
      setErrorMessage('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchOrderDetails()
  }, [fetchOrderDetails])

  useEffect(() => {
    // Get current admin user
    async function getAdminUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setAdminUser(session.user)
      }
    }
    getAdminUser()
  }, [])

  async function handleUpdateStatus(newStatus) {
    if (!confirm(`Change order status to "${getStatusDisplayName(newStatus)}"?`)) return

    try {
      setSaving(true)
      setErrorMessage('')

      // Build update object based on status
      const updates = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      }

      // Add status-specific fields only if columns exist
      // These will be skipped if migration wasn't run
      try {
        if (newStatus === 'quotation_sent' && !order.quotation_sent_at) {
          updates.quotation_sent_at = new Date().toISOString()
          if (adminUser?.id) updates.quotation_sent_by = adminUser.id
          updates.quotation_sent_via = 'manual'
        } else if (newStatus === 'quote_approved' && !order.quote_approved_at) {
          updates.quote_approved_at = new Date().toISOString()
          if (adminUser?.id) updates.quote_approved_by = adminUser.id
        } else if (newStatus === 'payment_received' && !order.payment_received_at) {
          updates.payment_received_at = new Date().toISOString()
          if (adminUser?.id) updates.payment_verified_by = adminUser.id
        }
      } catch (e) {
        console.warn('Could not set additional fields:', e)
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Database error details:', error)
        throw new Error(error.message || error.hint || JSON.stringify(error))
      }

      setOrder({ ...order, ...updates })
      setSuccessMessage(`Status updated to ${getStatusDisplayName(newStatus)}`)
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchOrderDetails() // Refresh to get updated data
    } catch (error) {
      console.error('Error updating status:', error)
      const errorMsg = error.message || error.hint || error.details || 'Unknown error'
      setErrorMessage('Failed to update status: ' + errorMsg)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendQuotation() {
    if (!customer?.phone) {
      setErrorMessage('Customer phone number not found')
      return
    }

    try {
      setSaving(true)
      setErrorMessage('')

      let invoiceId = order.invoice_id

      // Auto-generate invoice if not exists (simplified workflow)
      if (!invoiceId) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setErrorMessage('You must be logged in')
          setSaving(false)
          return
        }

        // Generate invoice automatically
        const result = await convertOrderToInvoice(order.id, session.user.id)
        if (result.success) {
          invoiceId = result.invoice.id
          setOrder({ ...order, invoice_id: invoiceId, status: 'invoiced' })
        } else {
          setErrorMessage('Failed to generate invoice: ' + result.error)
          setSaving(false)
          return
        }
      }

      // Generate WhatsApp link with invoice
      const whatsappUrl = generateWhatsAppLink(
        customer.phone,
        order.id,
        order.order_number,
        customer.name,
        calculateOrderTotal(),
        invoiceId
      )

      // Mark quotation as sent
      await markQuotationSent(order.id, 'whatsapp', adminUser?.id)

      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank')

      setSuccessMessage('✓ Quotation generated and sent via WhatsApp!')
      await fetchOrderDetails()
    } catch (error) {
      console.error('Error sending quotation:', error)
      setErrorMessage('Failed to send quotation: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleQuoteApproved() {
    if (!confirm('Mark quotation as approved by customer?')) return

    try {
      setSaving(true)
      setErrorMessage('')

      await markQuoteApproved(order.id, adminUser?.id)

      setSuccessMessage('Quotation marked as approved')
      await fetchOrderDetails()
    } catch (error) {
      console.error('Error approving quote:', error)
      setErrorMessage('Failed to approve quote: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePaymentReceived() {
    if (!confirm('Mark payment as received? This will update the order status.')) return

    try {
      setSaving(true)
      setErrorMessage('')

      // Simple payment received - just update the status
      const { error } = await supabase
        .from('orders')
        .update({
          payment_received_at: new Date().toISOString(),
          payment_verified_by: adminUser?.id,
          status: 'payment_received',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (error) throw error

      setSuccessMessage('✓ Payment marked as received!')
      await fetchOrderDetails()
    } catch (error) {
      console.error('Error recording payment:', error)
      setErrorMessage('Failed to record payment: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkCompleted() {
    if (!confirm('Mark order as completed? This indicates the order has been fulfilled.')) return

    try {
      setSaving(true)
      setErrorMessage('')

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (error) throw error

      setSuccessMessage('✓ Order marked as completed!')
      await fetchOrderDetails()
    } catch (error) {
      console.error('Error marking order completed:', error)
      setErrorMessage('Failed to mark order as completed: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelOrder(reason) {
    try {
      setSaving(true)
      setErrorMessage('')

      await cancelOrder(order.id, adminUser?.id, 'admin', reason)

      setSuccessMessage('Order cancelled successfully')
      setShowCancellationModal(false)
      await fetchOrderDetails()
    } catch (error) {
      console.error('Error cancelling order:', error)
      setErrorMessage('Failed to cancel order: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdatePrice(itemId, field, value) {
    try {
      const numValue = parseFloat(value) || 0

      const updates = { [field]: numValue }
      
      // Calculate admin_total if quantity or admin_price changes
      const item = orderItems.find(i => i.id === itemId)
      if (field === 'quantity') {
        updates.admin_total = numValue * (item.admin_price || 0)
      } else if (field === 'admin_price') {
        updates.admin_total = (item.quantity || 0) * numValue
      }

      const { error } = await supabase
        .from('order_items')
        .update(updates)
        .eq('id', itemId)

      if (error) throw error

      // Update local state
      setOrderItems(orderItems.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ))
    } catch (error) {
      console.error('Error updating price:', error)
      setErrorMessage('Failed to update item')
    }
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

  function calculateOrderTotal() {
    return orderItems.reduce((sum, item) => {
      // Use admin_total if set, otherwise calculate from admin_price or product price
      if (item.admin_total > 0) {
        return sum + item.admin_total
      }
      const price = item.admin_price || item.product?.price || 0
      return sum + (price * item.quantity)
    }, 0)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </AdminLayout>
    )
  }

  if (notFound) {
    return (
      <AdminLayout>
        <Head>
          <title>Order Not Found - Admin</title>
        </Head>
        <div className="max-w-2xl mx-auto text-center py-12">
          <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 22s-8-4.5-8-11V5l8-3 8 3v6c0 6.5-8 11-8 11z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <Link href="/admin/orders" className="btn-primary inline-block">
            Back to Orders
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const currentColor = getStatusColor(order.status)
  const nextStatuses = getNextStatuses(order.status)
  const isCancelled = order.is_cancelled || order.status === 'cancelled'

  return (
    <AdminLayout>
      <Head>
        <title>Order {order.order_number} - Admin</title>
      </Head>

      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/admin/orders"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </Link>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4">
            {errorMessage}
          </div>
        )}

        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
          <div className="flex flex-col gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Order {order.order_number}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>

            {/* Cancellation Alert */}
            {isCancelled && (
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 mb-1">Order Cancelled</h3>
                    {order.cancelled_at && (
                      <p className="text-sm text-red-800 mb-1">
                        Cancelled on {formatDate(order.cancelled_at)}
                        {order.cancelled_by_type && ` by ${order.cancelled_by_type}`}
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

            {/* Status Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={order.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={saving || isCancelled}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto bg-${currentColor}-50 border-${currentColor}-300 text-${currentColor}-800`}
              >
                <option value={order.status}>{getStatusDisplayName(order.status)}</option>
                {nextStatuses.map(status => (
                  <option key={status} value={status}>
                    {getStatusDisplayName(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Customer Information</h3>
              <div className="text-xs sm:text-sm space-y-1">
                <p><span className="font-medium">Name:</span> {customer?.name || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {customer?.phone || 'N/A'}</p>
              </div>
            </div>
            {order.notes && (
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Order Notes</h3>
                <p className="text-xs sm:text-sm text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Payment Information */}
          {order.payment_received_at && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Payment Received
              </h3>
              <div className="text-xs sm:text-sm space-y-1 text-green-800">
                {order.payment_method && (
                  <p><span className="font-medium">Method:</span> {order.payment_method.toUpperCase()}</p>
                )}
                {order.payment_amount && (
                  <p><span className="font-medium">Amount:</span> ₹{order.payment_amount.toFixed(2)}</p>
                )}
                {order.payment_reference && (
                  <p><span className="font-medium">Reference:</span> {order.payment_reference}</p>
                )}
                <p><span className="font-medium">Received on:</span> {formatDate(order.payment_received_at)}</p>
              </div>
            </div>
          )}

          {/* Quotation Information */}
          {order.quotation_sent_at && (
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Quotation Details</h3>
              <div className="text-xs sm:text-sm space-y-1 text-blue-800">
                <p><span className="font-medium">Sent on:</span> {formatDate(order.quotation_sent_at)}</p>
                {order.quotation_sent_via && (
                  <p><span className="font-medium">Via:</span> {order.quotation_sent_via}</p>
                )}
                {order.quote_approved_at && (
                  <p className="text-green-700 font-medium mt-2">
                    ✓ Approved on {formatDate(order.quote_approved_at)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order Items - Editable */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Order Items</h2>
          <div className="space-y-3 sm:space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex gap-3 sm:gap-4">
                  {/* Product Image */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={getProductImage(item.product)}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">
                      {item.product_name}
                    </h3>
                    {item.product_code && (
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">Code: {item.product_code}</p>
                    )}
                    <div className="text-[10px] sm:text-xs text-gray-500 space-y-0.5 sm:space-y-1">
                      {item.product?.brand && <p>Brand: {item.product.brand}</p>}
                      {item.product?.sku && <p>SKU: {item.product.sku}</p>}
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdatePrice(item.id, 'quantity', e.target.value)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Price (₹)
                      {item.product?.price > 0 && !item.admin_price && (
                        <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-blue-600 hidden sm:inline">(Def: ₹{item.product.price})</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.admin_price || ''}
                      onChange={(e) => handleUpdatePrice(item.id, 'admin_price', e.target.value)}
                      placeholder={item.product?.price > 0 ? `${item.product.price}` : "Price"}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Total (₹)
                    </label>
                    <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg font-semibold text-gray-900">
                      {(() => {
                        // Calculate total: use admin_total if set, otherwise calculate from prices
                        if (item.admin_total > 0) return item.admin_total.toFixed(2)
                        const price = item.admin_price || item.product?.price || 0
                        return (price * item.quantity).toFixed(2)
                      })()}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex items-end">
                    {item.product?.slug && (
                      <Link
                        href={`/products/${item.product.slug}`}
                        target="_blank"
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <span className="hidden sm:inline">View Product →</span>
                        <span className="sm:hidden">View →</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Total */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-gray-300">
            <div className="flex justify-between items-center text-lg sm:text-xl font-bold">
              <span className="text-gray-700">Order Total:</span>
              <span className="text-blue-600">₹{calculateOrderTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Actions</h2>
          
          {/* Order Flow Actions */}
          {!isCancelled && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Step 1: Send Quotation (auto-generates invoice) */}
                {['pending', 'quotation_sent', 'quote_approved'].includes(order.status) && !order.payment_received_at && (
                  <button
                    onClick={handleSendQuotation}
                    disabled={saving || !customer?.phone}
                    className="px-6 py-4 text-base bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>
                      {order.invoice_id ? 'Resend' : 'Send'} Quotation on WhatsApp
                      {!order.invoice_id && <span className="block text-xs opacity-90">Auto-generates invoice</span>}
                    </span>
                  </button>
                )}

                {/* Step 2: Payment Received (simplified - no modal) */}
                {['quotation_sent', 'quote_approved', 'payment_pending'].includes(order.status) && !order.payment_received_at && (
                  <button
                    onClick={handlePaymentReceived}
                    disabled={saving}
                    className="px-6 py-4 text-base bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Payment Received
                      <span className="block text-xs opacity-90">Mark as paid</span>
                    </span>
                  </button>
                )}

                {/* Step 3: Mark as Completed */}
                {order.status === 'payment_received' && (
                  <button
                    onClick={handleMarkCompleted}
                    disabled={saving}
                    className="px-6 py-4 text-base bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Mark as Completed
                      <span className="block text-xs opacity-90">Order fulfilled</span>
                    </span>
                  </button>
                )}

                {/* Cancel Order */}
                {canAdminCancelOrder(order) && (
                  <button
                    onClick={() => setShowCancellationModal(true)}
                    disabled={saving}
                    className="px-4 py-3 text-sm bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          )}



          {/* Simplified Workflow Info */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm font-bold text-blue-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Simple 3-Step Process:
            </p>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">1</span>
                <p className="text-sm text-blue-800"><strong>Send Quotation:</strong> Auto-generates invoice and sends via WhatsApp</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">2</span>
                <p className="text-sm text-blue-800"><strong>Payment Received:</strong> Mark when customer confirms payment</p>
              </div>
              <div className="flex items-start">
                <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">3</span>
                <p className="text-sm text-blue-800"><strong>Mark as Completed:</strong> Order fulfilled and closed</p>
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-3 italic">
              ⚡ Streamlined flow: Pending → Quotation Sent → Payment Received → Completed
            </p>
          </div>
          
          {/* Invoice Quick Access */}
          {order.invoice_id && (
            <div className="mt-3">
              <Link
                href={`/admin/invoices/${order.invoice_id}`}
                className="block px-4 py-3 text-sm bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-medium text-center"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Invoice/Quotation
              </Link>
            </div>
          )}
        </div>

        {/* Modals */}
        {showCancellationModal && (
          <CancellationModal
            order={order}
            userType="admin"
            onClose={() => setShowCancellationModal(false)}
            onConfirm={handleCancelOrder}
          />
        )}
      </div>
    </AdminLayout>
  )
}
