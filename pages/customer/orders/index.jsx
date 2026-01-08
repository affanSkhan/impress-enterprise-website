import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import CustomerLayout from '@/components/CustomerLayout'
import useSimpleAuth from '@/hooks/useSimpleAuth'
import { supabase } from '@/lib/supabaseClient'
import siteConfig from '@/site.config'

/**
 * Customer Orders List Page - Enhanced
 * Shows all orders with reorder functionality and mobile-optimized design
 */
export default function CustomerOrders() {
  const router = useRouter()
  const { customer } = useSimpleAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [reordering, setReordering] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, confirmed, processing, shipped, delivered, cancelled

  const fetchOrders = useCallback(async () => {
    if (!customer) return
    
    try {
      setLoading(true)
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id,
            product_id,
            product_name,
            quantity,
            admin_price,
            admin_total
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })

      // Apply filter
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [customer, filter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  async function handleReorder(orderId) {
    if (!confirm('Add all items from this order to your cart?')) return
    
    setReordering(orderId)
    try {
      // Get order items
      const { data: items, error } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)
      
      if (error) throw error
      
      // Add each item to cart
      const cartPromises = items.map(item => 
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
      
      alert(`${items.length} item(s) added to cart!`)
      router.push('/customer/cart')
    } catch (error) {
      console.error('Reorder error:', error)
      alert('Failed to reorder. Please try again.')
    } finally {
      setReordering(null)
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <CustomerLayout>
      <Head>
        <title>My Orders - {siteConfig.brandName}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent mb-2">
              My Orders
            </h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>

          {/* Filter Tabs - Mobile scroll */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'processing', label: 'Processing' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap touch-manipulation ${
                    filter === value
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? "You haven't placed any orders yet."
                  : `No ${filter} orders found.`}
              </p>
              <Link href="/products" className="btn-primary inline-block">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const itemCount = order.order_items?.length || 0
                const totalAmount = order.order_items?.reduce((sum, item) => sum + (item.admin_total || 0), 0) || 0
                const hasPricing = totalAmount > 0
                const isDelivered = order.status === 'delivered'
                
                return (
                  <div key={order.id} className="card hover:shadow-xl transition-all">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border-2 ${getStatusBadge(order.status)}`}>
                            <span>{getStatusIcon(order.status)}</span>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1">
                          Order #{order.order_number}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Order Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Items</p>
                        <p className="font-semibold text-gray-900">{itemCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="font-semibold text-gray-900">
                          {hasPricing ? `₹${totalAmount.toFixed(2)}` : 'Pending'}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-500 mb-1">Payment</p>
                        <p className="font-semibold text-gray-900 capitalize">
                          {order.payment_method || 'COD'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Link
                        href={`/customer/orders/${order.id}`}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold text-center text-sm touch-manipulation"
                      >
                        View Details
                      </Link>
                      {isDelivered && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleReorder(order.id)
                          }}
                          disabled={reordering === order.id}
                          className="px-4 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-semibold text-sm disabled:opacity-50 touch-manipulation"
                        >
                          {reordering === order.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Reordering...
                            </span>
                          ) : (
                            '🔄 Reorder'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
