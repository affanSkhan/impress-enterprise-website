import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import siteConfig from '@/site.config'
import { supabase } from '@/lib/supabaseClient'

/**
 * Furniture Category Page
 * Dynamic route: /furniture/[category]
 * Shows furniture products filtered by category
 */
export default function FurnitureCategoryPage() {
  const router = useRouter()
  const { category: categorySlug } = router.query

  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('newest')

  // Find category from config
  const categoryConfig = siteConfig.services.furniture.categories.find(
    cat => cat.slug === categorySlug
  )

  useEffect(() => {
    if (categorySlug) {
      fetchCategoryAndProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, sortBy])

  async function fetchCategoryAndProducts() {
    setLoading(true)

    // Fetch category from database
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', categorySlug)
      .single()

    if (categoryError) {
      console.error('Category fetch error:', categoryError)
      setLoading(false)
      return
    }

    setCategory(categoryData)

    // Fetch products for this category
    let query = supabase
      .from('products')
      .select(`
        *,
        categories(id, name, slug),
        images:product_images(image_url, is_primary)
      `)
      .eq('category_id', categoryData.id)
      .eq('is_active', true)

    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        query = query.order('price', { ascending: true })
        break
      case 'price_high':
        query = query.order('price', { ascending: false })
        break
      case 'name':
        query = query.order('name', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data: productsData, error: productsError } = await query

    if (!productsError && productsData) {
      setProducts(productsData)
    }

    setLoading(false)
  }

  // Filter products based on search and price range
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPrice = 
      (!priceRange.min || product.price >= parseFloat(priceRange.min)) &&
      (!priceRange.max || product.price <= parseFloat(priceRange.max))

    return matchesSearch && matchesPrice
  })

  if (!categoryConfig) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <Link href="/furniture" className="text-teal-600 hover:underline">
              ← Back to Furniture
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{categoryConfig.name} - Furniture - {siteConfig.brandName}</title>
        <meta name="description" content={`Shop quality ${categoryConfig.name.toLowerCase()} with free delivery and assembly. Custom designs available.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-600 hover:text-teal-600">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href="/furniture" className="text-gray-600 hover:text-teal-600">Furniture</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{categoryConfig.name}</span>
            </div>
          </div>
        </div>

        {/* Category Header */}
        <section className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-4xl">{categoryConfig.icon}</span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">{categoryConfig.name}</h1>
                <p className="text-teal-100">Premium furniture with free delivery</p>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:col-span-1 mb-8 lg:mb-0">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                <h2 className="text-lg font-bold mb-4">Filters</h2>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search furniture..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(searchTerm || priceRange.min || priceRange.max) && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setPriceRange({ min: '', max: '' })
                    }}
                    className="w-full mt-4 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Other Categories */}
              <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <h3 className="text-lg font-bold mb-4">Other Categories</h3>
                <div className="space-y-2">
                  {siteConfig.services.furniture.categories
                    .filter(cat => cat.slug !== categorySlug)
                    .map(cat => (
                      <Link
                        key={cat.slug}
                        href={`/furniture/${cat.slug}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-teal-50 transition-colors"
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </Link>
                    ))}
                </div>
              </div>

              {/* Contact for Custom */}
              <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-xl shadow-lg p-6 mt-6 text-white">
                <h3 className="font-bold mb-2">Need Custom Furniture?</h3>
                <p className="text-sm mb-4 text-teal-100">Get personalized designs tailored to your space</p>
                <a
                  href={siteConfig.getWhatsAppLink('Hi, I need custom furniture')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-all font-semibold text-center"
                >
                  Contact Us
                </a>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${filteredProducts.length} products found`}
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-6 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="text-xl font-bold mb-2">No furniture found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filters or contact us for custom orders</p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setPriceRange({ min: '', max: '' })
                      }}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Clear Filters
                    </button>
                    <Link
                      href="/contact"
                      className="px-6 py-2 border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50"
                    >
                      Get Custom Quote
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden"
                      >
                        <div className="aspect-square bg-gray-100 relative overflow-hidden">
                          {primaryImage?.image_url ? (
                            <img
                              src={primaryImage.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <span className="text-6xl">{categoryConfig.icon}</span>
                            </div>
                          )}
                          {product.is_featured && (
                            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              Featured
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-teal-600 transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          {product.brand && (
                            <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                          )}
                          {product.price ? (
                            <p className="text-lg font-bold text-teal-600">
                              ₹{product.price.toLocaleString()}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Contact for price</p>
                          )}
                          {product.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
