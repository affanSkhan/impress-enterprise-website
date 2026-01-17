import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import CustomerLayout from '@/components/CustomerLayout'
import useSimpleAuth from '@/hooks/useSimpleAuth'
import { supabase } from '@/lib/supabaseClient'
import siteConfig from '@/site.config'

/**
 * Enhanced Customer Cart Page
 * View and manage cart items (products + services), place orders
 * Mobile-optimized with grouped items display
 */
export default function CartPage() {
  const router = useRouter()
  const { customer } = useSimpleAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)

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
            sku,
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

  const getProductImage = (product) => {
    const primaryImage = product.images?.find(img => img.is_primary)
    return primaryImage?.image_url || product.images?.[0]?.image_url || '/placeholder-product.png'
  }

  // Group cart items by type (products vs services)
  const groupedItems = {
    products: cartItems.filter(item => item.product), // Items with products
    services: [] // Placeholder for future service bookings
  }

  // Get category name for grouping
  const getCategoryGroup = (product) => {
    if (!product?.category?.name) return 'Other'
    const categoryName = product.category.name.toLowerCase()
    
    // Map to service groups
    if (categoryName.includes('solar')) return 'Solar Products'
    if (categoryName.includes('furniture')) return 'Furniture'
    return 'Electronics'
  }

  // Group products by category
  const productsByCategory = groupedItems.products.reduce((acc, item) => {
    const group = getCategoryGroup(item.product)
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})

  return (
    <CustomerLayout>
      <Head>
        <title>Shopping Cart - {siteConfig.brandName}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <div className="max-w-5xl mx-auto">
        {/* Mobile-optimized header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Shopping Cart
          </h1>
          {cartItems.length > 0 && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="card text-center py-8 sm:py-12">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Add some products to get started</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/electronics" className="btn-primary inline-block">
                Shop Electronics
              </Link>
              <Link href="/furniture" className="border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-all font-semibold inline-block">
                Browse Furniture
              </Link>
            </div>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Cart Items - Mobile optimized */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 mb-6 lg:mb-0">
              {/* Group by Category */}
              {Object.entries(productsByCategory).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center gap-2 px-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      category === 'Solar Products' ? 'bg-amber-100' :
                      category === 'Furniture' ? 'bg-teal-100' : 'bg-blue-100'
                    }`}>
                      <span className="text-lg">
                        {category === 'Solar Products' ? '☀️' :
                         category === 'Furniture' ? '🪑' : '⚡'}
                      </span>
                    </div>
                    <h2 className="font-bold text-gray-900">{category}</h2>
                    <span className="text-xs text-gray-500">({items.length})</span>
                  </div>

                  {/* Category Items */}
                  {items.map((item) => (
                    <div key={item.id} className="card hover:shadow-lg transition-all">
                      <div className="flex gap-3 sm:gap-4">
                        {/* Product Image - Mobile optimized */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                          <Image
                            src={getProductImage(item.product)}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2">
                            {item.product.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-1">
                            {item.product.brand && `${item.product.brand}`}
                            {item.product.sku && ` • ${item.product.sku}`}
                          </p>

                          {/* Quantity Controls - Mobile touch-friendly */}
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Qty:</span>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 hover:bg-gray-100 transition-colors touch-manipulation text-lg"
                                disabled={item.quantity <= 1}
                              >
                                −
                              </button>
                              <span className="px-3 py-1.5 sm:px-4 sm:py-2 border-x border-gray-300 font-semibold min-w-[2.5rem] sm:min-w-[3rem] text-center text-sm sm:text-base">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 hover:bg-gray-100 transition-colors touch-manipulation text-lg"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button - Mobile optimized */}
                        <div className="flex items-start">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all touch-manipulation"
                            aria-label="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Delivery Note - Mobile friendly */}
              <div className="card bg-blue-50 border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Delivery Information</h4>
                    <p className="text-xs sm:text-sm text-blue-800">
                      Free local delivery for orders above ₹5,000. Installation and setup available for electronics.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Summary - Sticky on mobile */}
            <div className="lg:col-span-1">
              <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Order Summary</h3>
                  <span className="text-sm text-gray-600">{cartItems.length} item(s)</span>
                </div>

                {/* Price Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs sm:text-sm text-amber-800 font-medium mb-1">
                        <strong>Pricing Note</strong>
                      </p>
                      <p className="text-xs text-amber-700">
                        Our team will review your order and provide a detailed quote. You'll receive pricing before any charges apply.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Breakdown */}
                <div className="space-y-2 mb-4 pb-4 border-b">
                  {Object.entries(productsByCategory).map(([category, items]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="text-gray-600">{category}</span>
                      <span className="font-medium">{items.length} item(s)</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <Link
                  href="/checkout"
                  className="block w-full btn-primary py-3 text-base sm:text-lg text-center mb-3 touch-manipulation"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/products"
                  className="block w-full text-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base touch-manipulation"
                >
                  Continue Shopping
                </Link>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By placing an order, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
