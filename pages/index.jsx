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

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section - Professional & Modern */}
        <section className="relative bg-slate-900 text-white py-12 sm:py-20 lg:py-32 overflow-hidden">
          
          {/* Advanced Background Effects */}
          <div className="absolute inset-0 z-0">
             {/* Deep Gradient Base */}
             <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"></div>
             
             {/* Subtle excessive glow */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                <div className="absolute top-0 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-500/20 rounded-full mix-blend-screen filter blur-[60px] sm:blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[60px] sm:blur-[100px] animate-pulse delay-1000"></div>
             </div>
             
             {/* Grid Pattern Overlay */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              {/* Logo Badge */}
              <div className="inline-flex items-center justify-center p-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl mb-6 sm:mb-10 shadow-2xl scale-90 sm:scale-100">
                <Logo size="large" className="[&_.text-gray-900]:text-white [&_.bg-gradient-to-r]:from-white [&_.bg-gradient-to-r]:to-cyan-200" />
              </div>
              
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 sm:mb-6 tracking-tight leading-tight">
                <span className="block text-slate-300 text-lg sm:text-2xl md:text-3xl font-medium mb-1 sm:mb-2 tracking-normal">Welcome to Impress Enterprise</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-blue-200 drop-shadow-sm block mt-2">
                  Solar. Electronics. Furniture.
                </span>
              </h1>
              
              <p className="text-base sm:text-xl md:text-2xl mb-8 sm:mb-14 max-w-3xl mx-auto text-slate-300 leading-relaxed font-light px-2">
                One trusted partner for all your home and business needs in {siteConfig.location.city}. Experience quality, reliability, and excellence.
              </p>
              
              {/* CTA Buttons - Premium Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 max-w-4xl mx-auto mb-8 sm:mb-10">
                <Link href="/solar" className="group relative px-6 py-4 sm:py-5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl sm:rounded-2xl hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden active:scale-95">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex flex-row sm:flex-col items-center justify-center sm:justify-center gap-3 relative z-10">
                    <div className="p-2 sm:p-3 bg-amber-500/10 rounded-lg sm:rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <span className="font-bold text-base sm:text-lg text-slate-200 group-hover:text-white">Solar Solutions</span>
                  </div>
                </Link>
                
                <Link href="/electronics" className="group relative px-6 py-4 sm:py-5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl sm:rounded-2xl hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden active:scale-95">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex flex-row sm:flex-col items-center justify-center sm:justify-center gap-3 relative z-10">
                    <div className="p-2 sm:p-3 bg-blue-500/10 rounded-lg sm:rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="font-bold text-base sm:text-lg text-slate-200 group-hover:text-white">Electronics Hub</span>
                  </div>
                </Link>
                
                <Link href="/furniture" className="group relative px-6 py-4 sm:py-5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl sm:rounded-2xl hover:border-teal-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden active:scale-95">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex flex-row sm:flex-col items-center justify-center sm:justify-center gap-3 relative z-10">
                    <div className="p-2 sm:p-3 bg-teal-500/10 rounded-lg sm:rounded-xl text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
                        </svg>
                    </div>
                    <span className="font-bold text-base sm:text-lg text-slate-200 group-hover:text-white">Furniture Studio</span>
                  </div>
                </Link>
              </div>
              
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/20 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-slate-900 transition-all duration-300 font-semibold text-lg hover:scale-105 active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Us
              </Link>
            </div>
          </div>
        </section>


        {/* Product Showcase Section - NEW */}
        <ProductShowcase />

        {/* Repair Service CTA - Redesigned */}
        <section className="bg-slate-50 py-8 sm:py-12 px-4">
          <div className="container mx-auto">
            <div className="bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative group max-w-6xl mx-auto">
                <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-b md:bg-gradient-to-l from-blue-900/50 to-transparent"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 p-6 sm:p-12 items-center relative z-10">
                  <div className="text-left space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-medium border border-indigo-500/30">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                      <span>Professional Repair Services</span>
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
                      Expert Repairs<br/>When You Need Them
                    </h3>
                    <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                      Facing issues with your AC, Fridge, or Solar system? Our certified team provides quick, reliable repairs at your doorstep.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                      <Link href={`https://wa.me/${siteConfig.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/25 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.128 1.588 5.911L.069 24l6.171-1.616a11.86 11.86 0 005.814 1.516c6.556 0 11.892-5.335 11.892-11.892a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        WhatsApp Us
                      </Link>
                      <Link href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold backdrop-blur-sm transition-all border border-white/10 hover:border-white/20 active:scale-95">
                        Call Now
                      </Link>
                    </div>
                  </div>
                  
                  <div className="hidden md:block relative">
                    <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                       <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 text-indigo-400 border border-indigo-500/20">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       </div>
                       <h4 className="text-xl font-bold text-white mb-2">Technical Support</h4>
                       <p className="text-slate-400 text-sm px-4">Fast turnaround • Genuine Parts • Warranty</p>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
                  </div>
                </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - Modern & Clean */}
        <section className="py-12 sm:py-20 lg:py-24 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10 sm:mb-16">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-slate-900">
                  Why Choose Us?
                </h2>
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">
                  Quality, expertise, and trust you can count on
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-8 px-4 sm:px-0">
                <div className="text-center group p-6 bg-white rounded-3xl shadow-sm sm:shadow-none hover:shadow-xl transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900">Quality Products</h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Certified solar panels, inverters & quality electronics from trusted brands
                  </p>
                </div>
                
                <div className="text-center group p-6 bg-white rounded-3xl shadow-sm sm:shadow-none hover:shadow-xl transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900">Expert Service</h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Skilled technicians with years of experience in repairs & installations
                  </p>
                </div>
                
                <div className="text-center group p-6 bg-white rounded-3xl shadow-sm sm:shadow-none hover:shadow-xl transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900">Local & Trusted</h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Proudly serving {siteConfig.location.city} with dedication and excellence
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Modern & Bold */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-12">
                Ready to Get Started?
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                <Link href="/solar" className="block w-full px-6 py-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl hover:shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 hover:-translate-y-1 font-bold active:scale-95">
                  Explore Solar
                </Link>
                <Link href="/electronics" className="block w-full px-6 py-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-1 font-bold active:scale-95">
                  Shop Electronics
                </Link>
                <Link href="/furniture" className="block w-full px-6 py-4 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl sm:rounded-2xl hover:shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 hover:-translate-y-1 font-bold active:scale-95">
                  Browse Furniture
                </Link>
              </div>
              
              <div className="mt-4 sm:mt-6">
                <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl hover:bg-white hover:text-slate-900 transition-all duration-300 font-semibold active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
