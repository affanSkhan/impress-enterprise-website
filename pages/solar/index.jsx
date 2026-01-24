import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import siteConfig from '@/site.config'
import { supabase } from '@/lib/supabaseClient'

/**
 * Solar Solutions Landing Page
 * Browse all solar products and services
 */
export default function SolarPage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  async function fetchFeaturedProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name, slug),
        images:product_images(image_url, is_primary)
      `)
      .eq('is_active', true)
      .eq('business_type', 'solar')
      .order('created_at', { ascending: false })
      .limit(6)

    if (!error && data) {
      setFeaturedProducts(data)
    }
    setLoading(false)
  }

  const solarServices = siteConfig.services.solar

  return (
    <>
      <Head>
        <title>Solar Solutions - {siteConfig.brandName}</title>
        <meta name="description" content="Professional solar panel installation, inverters, batteries, and maintenance services. Solar energy solutions for homes and businesses in Daryapur." />
        <meta name="keywords" content="solar panels, solar installation, solar inverter, solar battery, solar maintenance, solar energy, Daryapur" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Solar Energy Solutions
              </h1>
              <p className="text-lg sm:text-xl text-amber-100 mb-8">
                {solarServices.description}
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/contact" className="btn-primary bg-white text-amber-600 hover:bg-amber-50">
                  Get a Quote
                </Link>
                <Link href="#products" className="btn-secondary border-2 border-white text-white hover:bg-white/10">
                  Browse Products
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">
              Our Solar Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {solarServices.offerings.map((service, index) => (
                <div key={index} className="card bg-white border-l-4 border-amber-500 hover:shadow-xl transition-all">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{service}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section id="products" className="py-12 sm:py-16 bg-white/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">
              Featured Solar Products
            </h2>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading products...</div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">No solar products available at the moment.</p>
                <Link href="/contact" className="btn-primary inline-block">
                  Contact us for custom solutions
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product) => {
                  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
                  return (
                    <Link key={product.id} href={`/products/${product.slug}`}>
                      <div className="card hover:shadow-2xl transition-all cursor-pointer h-full">
                        {primaryImage && (
                          <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                            <img 
                              src={primaryImage.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
                        )}
                        {product.price && (
                          <p className="text-lg font-bold text-amber-600">₹{product.price.toLocaleString()}</p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            <div className="text-center mt-8">
              <Link href="/products?business_type=solar" className="btn-primary inline-block">
                View All Solar Products
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Go Solar?
            </h2>
            <p className="text-lg text-amber-100 mb-8 max-w-2xl mx-auto">
              Get a free consultation and quote for your home or business. Our experts will help you choose the right solar solution.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/contact" className="btn-primary bg-white text-amber-600 hover:bg-amber-50">
                Contact Us Today
              </Link>
              <a href={`tel:${siteConfig.contact.phone}`} className="btn-secondary border-2 border-white text-white hover:bg-white/10">
                Call Now: {siteConfig.contact.phoneFormatted}
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
