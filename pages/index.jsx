import Head from 'next/head'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'

/**
 * Home Page
 * Main landing page for the public site
 */
export default function Home() {
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
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12 sm:py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              {/* Logo */}
              <div className="mb-6">
                <Logo size="large" className="[&_.text-gray-900]:text-white [&_.text-orange-600]:text-orange-300" />
              </div>
              
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                Amravati's trusted source for quality car air conditioning spare parts and accessories. 
                Browse our extensive catalogue • Professional offline services available
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products" className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-center">
                  Browse Products
                </Link>
                <Link href="/contact" className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-primary-600 text-center">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12">Why Choose Us?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Genuine A/C Parts</h3>
                <p className="text-gray-600">
                  All car A/C parts sourced from trusted manufacturers and suppliers
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Professional Service</h3>
                <p className="text-gray-600">
                  Expert car A/C installation & repair services available at our Amravati shop
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Services Banner */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-orange-50 to-orange-100 border-y-4 border-orange-400">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">Professional Car A/C Services</h2>
              <p className="text-base sm:text-lg text-gray-700 mb-4">
                <span className="font-semibold">Installation • Repair • Maintenance</span>
              </p>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                Visit our shop in Amravati for expert car air conditioning services. Our experienced technicians provide professional installation, repair, and maintenance services.
              </p>
              <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-md">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-gray-900">Shop Number 19, Usmaniya Masjid Complex, Bus stand road, Amravati</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Shop Car A/C Parts Online</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Browse our extensive catalogue of genuine car A/C parts and accessories
            </p>
            <Link href="/products" className="btn-primary inline-block">
              View All Products
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
