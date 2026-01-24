import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'

/**
 * Product Details Page
 * Dynamic route: /products/[slug]
 * Shows full product information with image gallery and Add to Cart
 */
export default function ProductDetailsPage() {
  const router = useRouter()
  const { slug } = router.query
  
  const [product, setProduct] = useState(null)
  const [images, setImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')

  // WhatsApp configuration (update with your number)
  const whatsappNumber = '917741077666' // Replace with your actual WhatsApp number

  useEffect(() => {
    if (slug) {
      fetchProduct()
    }
  }, [slug])

  async function fetchProduct() {
    setLoading(true)
    setNotFound(false)

    // Fetch product by slug
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name, slug)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (productError || !productData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // Fetch all images for this product
    const { data: imagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productData.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    setProduct(productData)
    setImages(imagesData || [])
    
    // Set first image as selected (primary or first available)
    if (imagesData && imagesData.length > 0) {
      const primaryImage = imagesData.find(img => img.is_primary) || imagesData[0]
      setSelectedImage(primaryImage.image_url)
    } else {
      // No images uploaded - use placeholder
      setSelectedImage(null)
    }

    setLoading(false)
  }

  // Generate WhatsApp message
  function getWhatsAppLink() {
    if (!product) return '#'

    const message = `Hello, I want details for: ${product.name}`
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  }

  // Add to Cart functionality
  async function handleAddToCart() {
    // Check if customer is logged in
    const customerId = localStorage.getItem('customer_id')
    
    console.log('Adding to cart, customer_id:', customerId)
    console.log('Product ID:', product?.id)
    
    if (!customerId) {
      // Redirect to login with return URL
      router.push(`/auth/login?returnUrl=${router.asPath}`)
      return
    }

    setAddingToCart(true)
    setCartMessage('')

    try {
      // Check if item already in cart
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('customer_id', customerId)
        .eq('product_id', product.id)
        .maybeSingle()

      if (checkError) {
        console.error('Check cart error:', checkError)
        throw checkError
      }

      if (existingItem) {
        // Update quantity
        console.log('Updating existing cart item:', existingItem.id)
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id)

        if (error) throw error
        setCartMessage('Cart updated successfully!')
      } else {
        // Add new item
        console.log('Adding new cart item')
        const { error } = await supabase
          .from('cart_items')
          .insert([{
            customer_id: customerId,
            product_id: product.id,
            quantity: quantity
          }])

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        setCartMessage('Added to cart successfully!')
      }

      // Trigger cart update event for navbar
      window.dispatchEvent(new Event('cart-updated'))

      // Clear message after 3 seconds
      setTimeout(() => setCartMessage(''), 3000)
    } catch (error) {
      console.error('Add to cart error:', error)
      setCartMessage('Failed to add to cart: ' + error.message)
    } finally {
      setAddingToCart(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading product...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // Not found state
  if (notFound || !product) {
    return (
      <>
        <Head>
          <title>Product Not Found - Impress Enterprise</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-8">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/products" className="btn-primary">
              Back to Products
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // SEO metadata
  const pageTitle = `${product.name} - Impress Enterprise`
  const pageDescription = product.description || `${product.name} - contact us for pricing and availability.`

  // Build back URL with preserved filters
  const buildBackUrl = () => {
    const { category, search } = router.query
    const query = new URLSearchParams()
    if (category) query.set('category', category)
    if (search) query.set('search', search)
    
    const queryString = query.toString()
    return `/products${queryString ? `?${queryString}` : ''}`
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${product.name}, ${product.brand || ''}, spare parts`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://yoursite.com/products/${product.slug}`} />
        {selectedImage && selectedImage !== '/placeholder-product.png' && (
          <meta property="og:image" content={selectedImage} />
        )}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {selectedImage && selectedImage !== '/placeholder-product.png' && (
          <meta name="twitter:image" content={selectedImage} />
        )}
        
        <link rel="canonical" href={`https://yoursite.com/products/${product.slug}`} />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-gray-600">
              <li>
                <Link href="/" className="hover:text-primary-600">Home</Link>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link href={buildBackUrl()} className="hover:text-primary-600">Products</Link>
              </li>
              {product.categories && (
                <>
                  <li>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </li>
                  <li className="text-gray-900">{product.categories.name}</li>
                </>
              )}
            </ol>
          </nav>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
            {/* Image Gallery */}
            <div>
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No image available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(image.image_url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === image.image_url
                          ? 'border-primary-600 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image.image_url}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
                      {image.is_primary && (
                        <div className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded">
                          Main
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Image Counter */}
              {images.length > 0 && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  {images.length} image{images.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>

            {/* Product Information */}
            <div>
              {/* Category Badge */}
              {product.categories && (
                <div className="mb-3">
                  <Link
                    href={`/products?category=${product.categories.id}`}
                    className="inline-block bg-primary-100 text-primary-800 text-sm font-semibold px-4 py-1 rounded-full hover:bg-primary-200 transition-colors"
                  >
                    {product.categories.name}
                  </Link>
                </div>
              )}

              {/* Product Name */}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Key Details */}
              <div className="space-y-3 mb-6">
                {product.brand && (
                  <div className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 mr-3 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <div>
                      <span className="text-sm text-gray-500 block">Brand</span>
                      <span className="font-medium">{product.brand}</span>
                    </div>
                  </div>
                )}

                {/* business-specific compatibility removed; use description or specs instead */}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Pricing Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Pricing & Availability</h3>
                    <p className="text-sm text-blue-800">
                      Contact us for current pricing and stock availability. We offer competitive rates and bulk discounts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                    disabled={quantity <= 1}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 font-semibold"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Cart Success Message */}
              {cartMessage && (
                <div className={`mb-4 p-3 rounded-lg ${cartMessage.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {cartMessage}
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="space-y-3">
                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>

                {/* WhatsApp Enquiry */}
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Ask Questions
                </a>

                {/* Browse More */}
                <Link
                  href="/products"
                  className="flex items-center justify-center w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  ← Browse More Products
                </Link>
              </div>
            </div>
          </div>

          {/* Related Products Section (Optional Enhancement) */}
          {product.categories && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">More in {product.categories.name}</h2>
              <p className="text-gray-600 mb-4">
                <Link href={`/products?category=${product.categories.id}`} className="text-primary-600 hover:underline">
                  View all {product.categories.name} products →
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
