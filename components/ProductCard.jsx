import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

/**
 * ProductCard Component
 * Displays a product card with image, category, brand, and car model
 * Navigates to product details page on click
 * Includes quick Add to Cart button
 */
export default function ProductCard({ product }) {
  const router = useRouter()
  const [addingToCart, setAddingToCart] = useState(false)
  const [showMessage, setShowMessage] = useState(false)

  // Get primary image or first image
  const getPrimaryImage = () => {
    if (!product.images || product.images.length === 0) {
      return '/placeholder-product.png'
    }
    const primary = product.images.find(img => img.is_primary)
    return primary ? primary.image_url : product.images[0].image_url
  }

  // Add to Cart functionality
  async function handleAddToCart(e) {
    e.preventDefault() // Prevent navigation to product page
    e.stopPropagation()

    const customerId = localStorage.getItem('customer_id')
    
    if (!customerId) {
      router.push(`/auth/login?returnUrl=/products`)
      return
    }

    setAddingToCart(true)

    try {
      // Check if item already in cart
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('customer_id', customerId)
        .eq('product_id', product.id)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id)

        if (error) throw error
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert([{
            customer_id: customerId,
            product_id: product.id,
            quantity: 1
          }])

        if (error) throw error
      }

      // Trigger cart update event for navbar
      window.dispatchEvent(new Event('cart-updated'))

      // Show success message
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 2000)
    } catch (error) {
      console.error('Add to cart error:', error)
      alert('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  // Build product URL with preserved query params
  const buildProductUrl = () => {
    const { category, search } = router.query
    const query = new URLSearchParams()
    if (category) query.set('category', category)
    if (search) query.set('search', search)
    
    const queryString = query.toString()
    return `/products/${product.slug}${queryString ? `?${queryString}` : ''}`
  }

  return (
    <Link href={buildProductUrl()}>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer h-full flex flex-col transform hover:-translate-y-2 border border-gray-100">
        {/* Product Image */}
        <div className="relative h-48 sm:h-56 bg-gray-100">
          <Image
            src={getPrimaryImage()}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-2 left-2">
              <span className="bg-gradient-to-r from-blue-600 to-slate-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                {product.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 hover:bg-gradient-to-r hover:from-blue-600 hover:to-slate-600 hover:bg-clip-text hover:text-transparent transition-all">
            {product.name}
          </h3>
          
          {/* Brand */}
          {product.brand && (
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="truncate">{product.brand}</span>
            </div>
          )}

          {/* Car Model */}
          {product.car_model && (
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span className="truncate">{product.car_model}</span>
            </div>
          )}

          {/* Description Preview */}
          {product.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-auto space-y-2">
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full btn-primary py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {showMessage ? (
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Added!
                </span>
              ) : addingToCart ? (
                'Adding...'
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </span>
              )}
            </button>

            {/* View Details Link */}
            <div className="text-center text-sm font-semibold bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent flex items-center justify-center group">
              View Details
              <svg className="w-4 h-4 ml-1 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
