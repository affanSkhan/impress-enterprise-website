import Head from 'next/head'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import ProductShowcase from '@/components/ProductShowcase'
import siteConfig from '@/site.config'

/**
 * Home Page
 * Main landing page for the public site
 * Redirects to /admin when opened as native app
 */
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if running as native app
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
      // Redirect to admin dashboard for native app
      router.replace('/admin')
    }
  }, [router])

  return (
    <>
      <Head>
        <title>{siteConfig.seo.title}</title>
        <meta name="description" content={siteConfig.seo.description} />
        <meta name="keywords" content={Array.isArray(siteConfig.seo.keywords) ? siteConfig.seo.keywords.join(', ') : siteConfig.seo.keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={siteConfig.seo.openGraph.title} />
        <meta property="og:description" content={siteConfig.seo.openGraph.description} />
        <meta property="og:url" content={siteConfig.domain} />
        <meta property="og:site_name" content={siteConfig.brandName} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteConfig.seo.openGraph.title} />
        <meta name="twitter:description" content={siteConfig.seo.openGraph.description} />
        
        <link rel="canonical" href={siteConfig.domain} />
      </Head>

      <Navbar />

      <main className="min-h-screen">
        {/* Hero Section - Mobile Optimized */}
        <section className="bg-gradient-to-br from-amber-600 via-blue-500 to-cyan-500 text-white py-8 sm:py-12 lg:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col items-center text-center">
              {/* Logo */}
              <div className="mb-4 sm:mb-6">
                <Logo size="large" className="[&_.text-gray-900]:text-white [&_.bg-gradient-to-r]:from-slate-300 [&_.bg-gradient-to-r]:to-blue-300" />
              </div>
              
              {/* Tagline - Simplified for mobile */}
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 px-4">
                Solar • Electronics • Furniture
              </h1>
              
              <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
                Quality products and expert services for your home and business in {siteConfig.location.city}
              </p>
              
              {/* CTA Buttons - Better mobile spacing */}
              <div className="w-full max-w-md flex flex-col gap-3 px-4">
                <Link href="/products" className="w-full px-6 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all text-center font-bold shadow-xl text-lg">
                  🛍️ Browse Products
                </Link>
                <Link href="/contact" className="w-full px-6 py-4 border-2 border-white bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all text-center font-semibold">
                  📞 Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase Section - NEW */}
        <ProductShowcase />

        {/* Services Banner - Mobile First Design */}
        <section id="services" className="py-8 sm:py-12 lg:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-center bg-gradient-to-r from-amber-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                Our Services
              </h2>
              <p className="text-center text-gray-600 mb-8 text-sm sm:text-base px-4">
                Tap to explore each category
              </p>
              
              <div className="grid grid-cols-1 gap-5 mb-8">
                {/* Solar Service - Enhanced Mobile Card */}
                <Link href="/products?solar=true" className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-lg active:scale-95 transition-all border-2 border-amber-200">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-4xl sm:text-5xl">{siteConfig.services.solar.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-amber-700 mb-1">{siteConfig.services.solar.name}</h3>
                      <p className="text-gray-600 text-sm">{siteConfig.services.solar.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {siteConfig.services.solar.offerings.slice(0, 4).map((offering, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                        <span className="text-amber-600 font-bold text-base mt-0.5">✓</span>
                        <span className="text-gray-700">{offering}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl px-5 py-3 font-semibold">
                    <span>Explore Solar Products</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                
                {/* Electronics Service */}
                <Link href="/electronics" className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-lg active:scale-95 transition-all border-2 border-blue-200">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-4xl sm:text-5xl">{siteConfig.services.electronics.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-blue-700 mb-1">{siteConfig.services.electronics.name}</h3>
                      <p className="text-gray-600 text-sm">{siteConfig.services.electronics.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {siteConfig.services.electronics.offerings.slice(0, 4).map((offering, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                        <span className="text-blue-600 font-bold text-base mt-0.5">✓</span>
                        <span className="text-gray-700">{offering}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl px-5 py-3 font-semibold">
                    <span>Shop Electronics</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Furniture Service */}
                <Link href="/furniture" className="group bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 shadow-lg active:scale-95 transition-all border-2 border-teal-200">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-4xl sm:text-5xl">{siteConfig.services.furniture.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-teal-700 mb-1">{siteConfig.services.furniture.name}</h3>
                      <p className="text-gray-600 text-sm">{siteConfig.services.furniture.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {siteConfig.services.furniture.offerings.slice(0, 4).map((offering, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                        <span className="text-teal-600 font-bold text-base mt-0.5">✓</span>
                        <span className="text-gray-700">{offering}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl px-5 py-3 font-semibold">
                    <span>Browse Furniture</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>

              {/* Need Service CTA - Simplified for Mobile */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 shadow-xl text-white mb-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                    <span className="text-4xl">{siteConfig.services.repair.icon}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Need Repair Service?</h3>
                  <p className="text-sm sm:text-base mb-5 text-indigo-100">
                    Expert repairs for AC, refrigerators, solar systems & more
                  </p>
                  <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-bold shadow-lg w-full sm:w-auto justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Request Service
                  </Link>
                </div>
              </div>

              {/* Location Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-full shadow-md border border-gray-200">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">Serving {siteConfig.location.city}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - Mobile Optimized */}
        <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent">
              Why Choose Us?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
              <div className="text-center bg-white rounded-2xl p-5 shadow-md border border-gray-100">
                <div className="bg-gradient-to-br from-amber-400 to-orange-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">Quality Products</h3>
                <p className="text-gray-600 text-sm">
                  Certified solar panels, inverters & quality electronics
                </p>
              </div>
              
              <div className="text-center bg-white rounded-2xl p-5 shadow-md border border-gray-100">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">Expert Service</h3>
                <p className="text-gray-600 text-sm">
                  Skilled technicians for repairs & installations
                </p>
              </div>
              
              <div className="text-center bg-white rounded-2xl p-5 shadow-md border border-gray-100">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">Local & Trusted</h3>
                <p className="text-gray-600 text-sm">
                  Serving {siteConfig.location.city} with excellence
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Action Bar - Mobile Sticky */}
        <section className="py-6 bg-gradient-to-r from-blue-600 to-cyan-600">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href="/products" className="w-full sm:w-auto px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-bold shadow-lg text-center">
                🛍️ Browse All Products
              </Link>
              <Link href="/contact" className="w-full sm:w-auto px-6 py-3 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all font-semibold text-center">
                📞 Get in Touch
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
