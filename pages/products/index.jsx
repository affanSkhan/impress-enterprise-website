import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import CategoryFilter from '@/components/CategoryFilter'
import { supabase } from '@/lib/supabaseClient'

/**
 * Products Catalogue Page
 * Public page displaying all active products with filtering
 * Phase 2: Enhanced with live data fetching, responsive grid, and SEO
 */
export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, searchTerm])

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (!error && data) {
      setCategories(data)
    }
  }

  async function fetchProducts() {
    setLoading(true)
    
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(image_url, is_primary)
      `, { count: 'exact' })
      .eq('is_active', true)

    // Filter by category
    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory)
    }

    // Search filter (name, brand, or car_model)
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,car_model.ilike.%${searchTerm}%`)
    }

    // Sort by most recent first
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (!error && data) {
      setProducts(data)
      setTotalProducts(count || 0)
    }
    setLoading(false)
  }

  // Clear search
  function clearSearch() {
    setSearchTerm('')
    setSelectedCategory('all')
  }

  return (
    <>
      <Head>
        <title>Car A/C Parts Catalogue - Empire Car A/C | Amravati</title>
        <meta name="description" content="Browse our extensive catalogue of car air conditioning spare parts and accessories. Find A/C compressors, condensers, and more. Contact us for pricing and availability." />
        <meta name="keywords" content="car ac parts, ac compressor, ac condenser, car air conditioning, ac spare parts, amravati" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Car A/C Parts Catalogue - Empire Car A/C" />
        <meta property="og:description" content="Browse our extensive catalogue of car A/C spare parts and accessories" />
        <meta property="og:url" content="https://yoursite.com/products" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Car A/C Parts Catalogue - Empire Car A/C" />
        <meta name="twitter:description" content="Browse car A/C spare parts and accessories in Amravati" />
        
        <link rel="canonical" href="https://yoursite.com/products" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-gray-900">
              Product Catalogue
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Browse our selection of {totalProducts} quality spare parts
            </p>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Products
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by name, brand, or car model..."
                    className="input-field pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedCategory !== 'all') && (
              <div className="mt-4 flex items-center flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="ml-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                    Category: {categories.find(c => c.id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory('all')} className="ml-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                <button onClick={clearSearch} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12 sm:py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 sm:py-20 bg-white rounded-lg shadow-md">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
              <button onClick={clearSearch} className="btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-4 text-sm text-gray-600">
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
              </div>

              {/* Responsive Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}

          {/* Contact CTA */}
          {!loading && products.length > 0 && (
            <div className="mt-12 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6 sm:p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Need A/C Installation or Repair Service?</h2>
              <p className="text-gray-700 mb-4">
                Visit our Amravati shop for professional car A/C services or contact us for parts availability
              </p>
              <Link href="/contact" className="btn-primary">
                Contact Us
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
