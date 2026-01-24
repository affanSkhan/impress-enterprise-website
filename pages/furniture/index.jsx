import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import siteConfig from '@/site.config'
import { supabase } from '@/lib/supabaseClient'

/**
 * Furniture Landing Page
 * Browse all furniture categories and featured products
 */
export default function FurniturePage() {
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
      .eq('business_type', 'furniture')
      .order('created_at', { ascending: false })
      .limit(6)

    if (!error && data) {
      setFeaturedProducts(data)
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Furniture Shop - {siteConfig.brandName}</title>
        <meta name="description" content="Quality furniture for home and office. Sofas, beds, dining sets, storage solutions. Local delivery and assembly in Daryapur." />
        <meta name="keywords" content="furniture shop, sofa set, bedroom furniture, dining table, office furniture, home furniture, Daryapur" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-teal-600 via-emerald-500 to-teal-700 text-white py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <span className="text-5xl">{siteConfig.services.furniture.icon}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Quality Furniture for Every Space
              </h1>
              <p className="text-lg sm:text-xl mb-8 text-teal-100">
                Transform your home or office with our premium furniture collection
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#categories" className="px-6 py-3 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-all font-semibold shadow-lg">
                  Browse Categories
                </Link>
                <Link href="/contact" className="px-6 py-3 border-2 border-white bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white hover:text-teal-600 transition-all font-semibold">
                  Get Custom Quote
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section id="categories" className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Shop by Category
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {siteConfig.services.furniture.categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/furniture/${category.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border-t-4 border-teal-500">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-3xl">{category.icon}</span>
                      </div>
                    </div>
                    <h3 className="text-center font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-12 sm:py-16 bg-white/50">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Featured Furniture
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product) => {
                  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
                  
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden"
                    >
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {primaryImage?.image_url && (
                          <img
                            src={primaryImage.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                        )}
                        {product.price && (
                          <p className="text-lg font-bold text-teal-600">
                            ₹{product.price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Why Choose Us */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Why Choose Our Furniture?
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center bg-white rounded-xl p-6 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Premium Quality</h3>
                <p className="text-sm text-gray-600">Durable materials and craftsmanship</p>
              </div>
              
              <div className="text-center bg-white rounded-xl p-6 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Custom Designs</h3>
                <p className="text-sm text-gray-600">Tailored to your preferences</p>
              </div>
              
              <div className="text-center bg-white rounded-xl p-6 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Free Delivery</h3>
                <p className="text-sm text-gray-600">Local delivery and assembly</p>
              </div>
              
              <div className="text-center bg-white rounded-xl p-6 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Easy EMI</h3>
                <p className="text-sm text-gray-600">Flexible payment options</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-12 sm:py-16 bg-white/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Our Furniture Services
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {siteConfig.services.furniture.offerings.map((offering, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{offering}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-teal-600 to-emerald-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Transform Your Space?
            </h2>
            <p className="text-lg text-teal-100 mb-8">
              Get a custom furniture quote or visit our showroom
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={siteConfig.getPhoneLink()}
                className="px-6 py-3 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-all font-semibold shadow-lg inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call for Quote
              </a>
              <a
                href={siteConfig.getWhatsAppLink('Hi, I am interested in furniture')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border-2 border-white bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white hover:text-teal-600 transition-all font-semibold inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp Us
              </a>
              <Link
                href="/contact"
                className="px-6 py-3 border-2 border-white bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white hover:text-teal-600 transition-all font-semibold"
              >
                Visit Showroom
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
