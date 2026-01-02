import Head from 'next/head'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import ProductShowcase from '@/components/ProductShowcase'

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
        <title>Empire Car A/C - Car Air Conditioning Parts & Accessories</title>
        <meta name="description" content="Empire Car A/C - Amravati's trusted source for quality car air conditioning spare parts and accessories. Browse our extensive catalogue of genuine A/C parts. Professional offline services available." />
        <meta name="keywords" content="car ac parts, car air conditioning, ac spare parts, automotive ac, car ac accessories, ac compressor, ac condenser, amravati" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Empire Car A/C - Car Air Conditioning Parts" />
        <meta property="og:description" content="Amravati's trusted source for quality car A/C spare parts and accessories. Professional offline services available." />
        <meta property="og:url" content="https://yoursite.com" />
        <meta property="og:site_name" content="Empire Car A/C" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Empire Car A/C - Car Air Conditioning Parts" />
        <meta name="twitter:description" content="Amravati's trusted source for car A/C spare parts and accessories" />
        
        <link rel="canonical" href="https://yoursite.com" />
      </Head>

      <Navbar />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-slate-500 to-blue-500 text-white py-12 sm:py-16 lg:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col items-center text-center">
              {/* Logo */}
              <div className="mb-6 animate-fade-in">
                <Logo size="large" className="[&_.text-gray-900]:text-white [&_.bg-gradient-to-r]:from-slate-300 [&_.bg-gradient-to-r]:to-blue-300" />
              </div>
              
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                Amravati's trusted source for quality car air conditioning spare parts and accessories. 
                Browse our extensive catalogue • Professional offline services available
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-slate-500 text-white rounded-lg hover:from-blue-600 hover:to-slate-600 transition-all transform hover:scale-105 text-center font-semibold shadow-lg">
                  Browse Products
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

        {/* Services Banner */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-500 via-slate-500 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black opacity-20"></div>
          <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-white drop-shadow-lg">Professional Car A/C Services</h2>
              <p className="text-sm sm:text-base md:text-lg text-white mb-3 sm:mb-4">
                <span className="font-semibold">Installation • Repair • Maintenance</span>
              </p>
              <p className="text-xs sm:text-sm md:text-base text-white/90 mb-4 sm:mb-6">
                Visit our shop in Amravati for expert car air conditioning services. Our experienced technicians provide professional installation, repair, and maintenance services.
              </p>
              <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-xl">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-gray-900 text-xs sm:text-sm">Shop Number 19, Usmaniya Masjid Complex, Bus Stand Road, Amravati</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent">Why Choose Us?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center bg-gradient-to-br from-blue-50 via-blue-100 to-slate-100 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-blue-200/50">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Genuine A/C Parts</h3>
                <p className="text-gray-600">
                  All car A/C parts sourced from trusted manufacturers and suppliers
                </p>
              </div>
              
              <div className="text-center bg-gradient-to-br from-blue-50 via-blue-100 to-slate-100 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-blue-200/50">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Professional Service</h3>
                <p className="text-gray-600">
                  Expert car A/C installation & repair services available at our Amravati shop
                </p>
              </div>
              
              <div className="text-center bg-gradient-to-br from-blue-50 via-blue-100 to-slate-100 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-blue-200/50">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">A/C Specialists</h3>
                <p className="text-gray-600">
                  Expert guidance for all your car air conditioning needs
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 bg-gradient-to-r from-blue-600 via-slate-600 to-blue-700 bg-clip-text text-transparent">Shop Car A/C Parts Online</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 mb-4 sm:mb-6 md:mb-8 max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto">
              Browse our extensive catalogue of genuine car A/C parts and accessories
            </p>
            <Link href="/products" className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-slate-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:via-slate-700 hover:to-blue-800 transition-all transform hover:scale-105 font-semibold text-base sm:text-lg shadow-xl">
              View All Products
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
