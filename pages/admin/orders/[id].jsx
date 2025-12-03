import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabaseClient'
import { convertOrderToInvoice } from '@/utils/orderHelpers'

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
            car_model,
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

  async function handleUpdateStatus(newStatus) {
    if (!confirm(`Change order status to "${newStatus}"?`)) return

    try {
      setSaving(true)
      setErrorMessage('')

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setOrder({ ...order, status: newStatus })
      setSuccessMessage(`Status updated to ${newStatus}`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error updating status:', error)
      setErrorMessage('Failed to update status')
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

  async function handleGenerateInvoice() {
    if (!confirm('Generate invoice from this order? This will create a new invoice with the prices you have set.')) return

    try {
      setSaving(true)
      setErrorMessage('')

      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setErrorMessage('You must be logged in to generate invoice')
        setSaving(false)
        return
      }

      // Convert order to invoice
      const result = await convertOrderToInvoice(id, session.user.id)

      if (result.success) {
        setSuccessMessage(`Invoice ${result.invoiceNumber} generated successfully!`)
        
        // Update local order state
        setOrder({ ...order, status: 'invoiced', invoice_id: result.invoice.id })
        
        // Redirect to invoice after a short delay
        setTimeout(() => {
          router.push(`/admin/invoices/${result.invoice.id}`)
        }, 2000)
      } else {
        setErrorMessage(result.error || 'Failed to generate invoice')
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      setErrorMessage('Failed to generate invoice: ' + error.message)
    } finally {
      setSaving(false)
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

  const statusColors = {
    pending: 'yellow',
    reviewed: 'blue',
    approved: 'green',
    invoiced: 'purple',
  }

  const currentColor = statusColors[order.status] || 'gray'

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

            {/* Status Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={order.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={saving}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 bg-${currentColor}-50 border-${currentColor}-300 text-${currentColor}-800 w-full sm:w-auto`}
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="invoiced">Invoiced</option>
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
                      {item.product?.car_model && <p>Model: {item.product.car_model}</p>}
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleGenerateInvoice}
              disabled={saving || order.status === 'invoiced'}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Invoice
            </button>

            {order.invoice_id && (
              <Link
                href={`/admin/invoices/${order.invoice_id}`}
                className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-md text-center w-full sm:w-auto"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Invoice
              </Link>
            )}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Set prices for all items before generating an invoice. 
              Once an invoice is generated, this order will be marked as "Invoiced".
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
