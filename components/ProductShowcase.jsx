import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ProductCard'

export default function ProductShowcase() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  async function fetchFeaturedProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*)
        `)
        .eq('is_active', true)
        .limit(4)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setProducts(data)
    } catch (err) {
      console.error('Error fetching showcase products:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 w-1/4 rounded"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[4/5] bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) return null

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              ✨ Featured Products
            </h2>
            <p className="mt-1 text-gray-600 text-sm sm:text-base">Latest arrivals & best sellers</p>
          </div>
          <Link 
            href="/products" 
            className="hidden sm:inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
          >
            View All
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
          <div className="flex gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[280px] sm:w-auto">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View All Button */}
        <div className="mt-5 text-center sm:hidden">
          <Link 
            href="/products" 
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg active:scale-95 transition-transform"
          >
            View All Products
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
