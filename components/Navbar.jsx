import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Logo from './Logo'
import { supabase } from '@/lib/supabaseClient'

/**
 * Public Site Navigation Component
 * Displays navigation menu for public pages
 */
export default function Navbar() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  // Fetch cart count
  const fetchCartCount = async () => {
    const customerId = localStorage.getItem('customer_id')
    if (!customerId) {
      setCartCount(0)
      return
    }

    try {
      const { count, error } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)

      if (!error) {
        setCartCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  useEffect(() => {
    // Check if customer is logged in
    const checkAuth = () => {
      const customerId = localStorage.getItem('customer_id')
      setIsLoggedIn(!!customerId)
      if (customerId) {
        fetchCartCount()
      } else {
        setCartCount(0)
      }
    }
    
    checkAuth()
    
    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', checkAuth)
    
    // Check on route changes
    router.events?.on('routeChangeComplete', checkAuth)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
      router.events?.off('routeChangeComplete', checkAuth)
    }
  }, [router])

  // Real-time cart updates
  useEffect(() => {
    if (!isLoggedIn) return
    
    const customerId = localStorage.getItem('customer_id')
    if (!customerId) return

    // Fetch initial count
    fetchCartCount()

    const channel = supabase
      .channel(`cart-changes-${customerId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: `customer_id=eq.${customerId}` },
        (payload) => {
          console.log('Cart changed:', payload)
          fetchCartCount()
        }
      )
      .subscribe((status) => {
        console.log('Cart subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isLoggedIn])

  // Also listen to custom cart update events from within the app
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount()
    }

    window.addEventListener('cart-updated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate)
    }
  }, [])

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <Logo size="small" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Home
            </Link>
            
            {/* Products Dropdown */}
            <div className="relative" 
                 onMouseEnter={() => setProductsDropdownOpen(true)}
                 onMouseLeave={() => setProductsDropdownOpen(false)}>
              <button className="text-gray-700 hover:text-blue-600 transition-colors font-medium flex items-center gap-1">
                Products
                <svg className={`w-4 h-4 transition-transform ${productsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {productsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                  <Link href="/solar" className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors group">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-amber-600">Solar Solutions</div>
                      <div className="text-xs text-gray-500">Panels, Inverters & More</div>
                    </div>
                  </Link>
                  <Link href="/electronics" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-blue-600">Electronics</div>
                      <div className="text-xs text-gray-500">AC, Appliances & More</div>
                    </div>
                  </Link>
                  <Link href="/furniture" className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 transition-colors group">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-teal-600">Furniture</div>
                      <div className="text-xs text-gray-500">Home & Office</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
            
            <Link href="/contact" className="text-gray-700 hover:text-blue-700 transition-colors font-medium">
              Contact
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link href="/customer/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                  Dashboard
                </Link>
                <Link href="/customer/cart" className="relative px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all text-sm font-semibold shadow-md">
                  My Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white animate-pulse">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                  Customer Login
                </Link>
                <Link href="/auth/signup" className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all text-sm font-semibold shadow-md">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 relative -mr-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
            {isLoggedIn && cartCount > 0 && !mobileMenuOpen && (
              <span className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Navigation - Enhanced Slide-in Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-14 sm:top-16 bg-black/20 backdrop-blur-sm z-40" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Menu Header */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 px-5 py-6 text-white">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold">Menu</h2>
                </div>
                <p className="text-blue-100 text-sm">Explore our services</p>
              </div>

              {/* Navigation Links */}
              <div className="py-2">
                <Link 
                  href="/" 
                  className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium border-l-4 border-transparent hover:border-blue-600 active:bg-blue-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </Link>
                
                {/* Products Section with Category Cards */}
                <div className="px-5 py-4 bg-slate-50">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Our Products</h3>
                  <div className="space-y-2">
                    <Link 
                      href="/solar" 
                      className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] border border-amber-100 hover:border-amber-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-sm">Solar Solutions</div>
                        <div className="text-xs text-gray-500">Panels & Inverters</div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    
                    <Link 
                      href="/electronics" 
                      className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] border border-blue-100 hover:border-blue-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-sm">Electronics</div>
                        <div className="text-xs text-gray-500">AC & Appliances</div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    
                    <Link 
                      href="/furniture" 
                      className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] border border-teal-100 hover:border-teal-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-sm">Furniture</div>
                        <div className="text-xs text-gray-500">Home & Office</div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
                
                <Link 
                  href="/contact" 
                  className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-all font-medium border-l-4 border-transparent hover:border-cyan-600 active:bg-cyan-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Contact Us</span>
                </Link>
                
                {/* User Actions Section */}
                <div className="mt-6 px-5 py-4 bg-gradient-to-br from-slate-50 to-blue-50 border-t border-gray-200">
                  {isLoggedIn ? (
                    <div className="space-y-3">
                      <Link 
                        href="/customer/dashboard" 
                        className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-medium border border-gray-200 shadow-sm active:scale-[0.98]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>My Dashboard</span>
                      </Link>
                      
                      <Link 
                        href="/customer/cart" 
                        className="relative flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl transition-all font-bold shadow-lg active:scale-[0.98]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>My Cart</span>
                        {cartCount > 0 && (
                          <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse">
                            {cartCount > 9 ? '9+' : cartCount}
                          </span>
                        )}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link 
                        href="/auth/login" 
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-medium border border-gray-300 shadow-sm active:scale-[0.98]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span>Customer Login</span>
                      </Link>
                      
                      <Link 
                        href="/auth/signup" 
                        className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl transition-all font-bold shadow-lg active:scale-[0.98]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <span>Sign Up Free</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
