import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import CustomerLayout from '@/components/CustomerLayout'
import useSimpleAuth from '@/hooks/useSimpleAuth'
import { supabase } from '@/lib/supabaseClient'

/**
 * Customer Cart Page
 * View and manage cart items, place orders
 */
export default function CartPage() {
  const router = useRouter()
  const { customer } = useSimpleAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    if (customer) {
      fetchCart()
    }
  }, [customer])

  async function fetchCart() {
    try {
      console.log('Fetching cart for customer:', customer.id)
      
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(
            id,
            name,
            slug,
            brand,
            car_model,
            category:categories(name),
            images:product_images(image_url, is_primary)
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Cart fetch error:', error)
        throw error
      }
      
      console.log('Cart items fetched:', data)
      setCartItems(data || [])
    } catch (error) {
      console.error('Error fetching cart:', error)
      alert('Failed to load cart: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) return

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error

      // Update local state
      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )

      // Trigger cart update event for navbar
      window.dispatchEvent(new Event('cart-updated'))
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity')
    }
  }

  async function removeItem(itemId) {
    if (!confirm('Remove this item from cart?')) return

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setCartItems(items => items.filter(item => item.id !== itemId))

      // Trigger cart update event for navbar
      window.dispatchEvent(new Event('cart-updated'))
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item')
    }
  }

  async function placeOrder() {
    if (cartItems.length === 0) {
      alert('Your cart is empty')
      return
    }

    if (!confirm(`Place order for ${cartItems.length} item(s)?`)) return

    setPlacing(true)

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customer.id,
          status: 'pending',
        })
        .select('*')
        .single()

      if (orderError) throw orderError

      // Create order items from cart
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_code: item.product.brand ? `${item.product.brand} - ${item.product.car_model || ''}`.trim() : null,
        quantity: item.quantity,
        admin_price: 0, // Admin will set prices later
        admin_total: 0,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', customer.id)

      if (clearError) throw clearError

      // Send push notification to admins about new order
      try {
        await fetch('/api/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Order Received',
            message: `Order #${orderNumber} has been placed by ${customer.name || 'a customer'}`,
            url: `/admin/orders/${orderData.id}`,
            userType: 'admin'
          })
        })
      } catch (pushError) {
        // Don't fail the order if push notification fails
        console.warn('Failed to send push notification:', pushError)
      }

      // Trigger cart update event for navbar
      window.dispatchEvent(new Event('cart-updated'))

      // Redirect to order detail
      router.push(`/customer/orders/${orderData.id}`)
    } catch (error) {
      console.error('Error placing order:', error)
      const errorMessage = error?.message || 'Failed to place order. Please try again.'
      alert(errorMessage)
      setPlacing(false)
    }
  }

  const getProductImage = (product) => {
    const primaryImage = product.images?.find(img => img.is_primary)
    return primaryImage?.image_url || product.images?.[0]?.image_url || '/placeholder-product.png'
  }

  return (
    <CustomerLayout>
      <Head>
        <title>Shopping Cart - Empire Car A/C</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent">
          Shopping Cart
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started</p>
            <Link href="/products" className="btn-primary inline-block">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="card hover:shadow-xl transition-shadow">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="relative w-full sm:w-24 h-48 sm:h-24 flex-shrink-0">
                      <Image
                        src={getProductImage(item.product)}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.product.brand && `${item.product.brand}`}
                        {item.product.car_model && ` • ${item.product.car_model}`}
                        {item.product.category && ` • ${item.product.category.name}`}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700">Quantity:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-4 py-2 hover:bg-gray-100 transition-colors touch-manipulation"
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="px-4 py-2 border-x border-gray-300 font-semibold min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-4 py-2 hover:bg-gray-100 transition-colors touch-manipulation"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="flex sm:flex-col justify-end sm:justify-start">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="card bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                <span className="text-gray-600">{cartItems.length} item(s)</span>
              </div>

              <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Prices will be provided by our team after reviewing your order.
                  You'll receive a detailed quote before any charges apply.
                </p>
              </div>

              <button
                onClick={placeOrder}
                disabled={placing}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                By placing an order, you agree to our terms and conditions
              </p>
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  )
}
