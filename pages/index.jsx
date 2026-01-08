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
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-600 via-blue-500 to-cyan-500 text-white py-12 sm:py-16 lg:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col items-center text-center">
              {/* Logo */}
              <div className="mb-6 animate-fade-in">
                <Logo size="large" className="[&_.text-gray-900]:text-white [&_.bg-gradient-to-r]:from-slate-300 [&_.bg-gradient-to-r]:to-blue-300" />
              </div>
              
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
                Your one-stop solution for solar energy systems, quality electronics, and premium furniture. 
                Serving {siteConfig.location.city} with excellence, reliability, and professional service.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#services" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105 text-center font-semibold shadow-lg">
                  View Our Services
                </Link>
                <Link href="/services" className="px-6 py-3 border-2 border-white bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 text-center font-semibold">
                  Book a Service
                </Link>
                <Link href="/contact" className="px-6 py-3 border-2 border-white bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 text-center font-semibold">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase Section - NEW */}
        <ProductShowcase />

        {/* Services Banner - 3 Cards + Book Service CTA */}
        <section id="services" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-center bg-gradient-to-r from-amber-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">Our Professional Services</h2>
              <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                Quality products and services for your home, office, and energy needs
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Solar Service */}
                <Link href="/products" className="group bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-amber-200">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-5xl">{siteConfig.services.solar.icon}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-center text-amber-700">{siteConfig.services.solar.name}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed mb-5 text-center">{siteConfig.services.solar.description}</p>
                  <ul className="text-xs text-gray-600 space-y-2 mb-6">
                    {siteConfig.services.solar.offerings.slice(0, 4).map((offering, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-amber-600 font-bold">✓</span>
                        <span>{offering}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-center">
                    <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg group-hover:from-amber-600 group-hover:to-orange-700 transition-all font-semibold shadow-md">
                      Explore Solar
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
                
                {/* Electronics Service */}
                <Link href="/electronics" className="group bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-blue-200">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-5xl">{siteConfig.services.electronics.icon}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-center text-blue-700">{siteConfig.services.electronics.name}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed mb-5 text-center">{siteConfig.services.electronics.description}</p>
                  <ul className="text-xs text-gray-600 space-y-2 mb-6">
                    {siteConfig.services.electronics.offerings.slice(0, 4).map((offering, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold">✓</span>
                        <span>{offering}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-center">
                    <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg group-hover:from-blue-600 group-hover:to-cyan-700 transition-all font-semibold shadow-md">
                      Shop Electronics
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>

                {/* Furniture Service */}
                <Link href="/furniture" className="group bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-teal-200">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-5xl">{siteConfig.services.furniture.icon}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-center text-teal-700">{siteConfig.services.furniture.name}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed mb-5 text-center">{siteConfig.services.furniture.description}</p>
                  <ul className="text-xs text-gray-600 space-y-2 mb-6">
                    {siteConfig.services.furniture.offerings.slice(0, 4).map((offering, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-teal-600 font-bold">✓</span>
                        <span>{offering}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-center">
                    <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-lg group-hover:from-teal-600 group-hover:to-emerald-700 transition-all font-semibold shadow-md">
                      Browse Furniture
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </div>

              {/* Book Service CTA */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 sm:p-12 shadow-2xl text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                    <span className="text-4xl">{siteConfig.services.repair.icon}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">Need Repair or Installation Service?</h3>
                  <p className="text-lg mb-8 text-indigo-100 max-w-2xl mx-auto">
                    Expert technicians for AC service, refrigerator repair, solar maintenance, and more
                  </p>
                  <Link href="/services" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-bold shadow-xl text-lg group">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book a Service
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Location Badge */}
              <div className="mt-12 flex justify-center">
                <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold text-gray-900">Serving {siteConfig.location.city}, {siteConfig.location.district}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent">Why Choose Us?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center bg-gradient-to-br from-amber-50 via-amber-100 to-orange-100 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-amber-200/50">
                <div className="bg-gradient-to-br from-amber-400 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Certified Solar Solutions</h3>
                <p className="text-gray-600">
                  Quality solar panels, inverters, and batteries with professional installation and maintenance
                </p>
              </div>
              
              <div className="text-center bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-blue-200/50">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Electronics Service</h3>
                <p className="text-gray-600">
                  Skilled technicians for AC, refrigerator, washing machine, and appliance repair
                </p>
              </div>
              
              <div className="text-center bg-gradient-to-br from-cyan-50 via-cyan-100 to-blue-100 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-cyan-200/50">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Local Service Excellence</h3>
                <p className="text-gray-600">
                  Trusted service in {siteConfig.location.city} for all your solar and electronics needs
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 bg-gradient-to-r from-amber-600 via-blue-600 to-cyan-700 bg-clip-text text-transparent">Explore Our Services</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 mb-4 sm:mb-6 md:mb-8 max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto">
              Browse our solar solutions and electronics offerings - Request service or get a quote
            </p>
            <Link href="/products" className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:via-cyan-700 hover:to-blue-800 transition-all transform hover:scale-105 font-semibold text-base sm:text-lg shadow-xl">
              View All Services
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
