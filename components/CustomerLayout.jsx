import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import CustomerNotificationBell from './CustomerNotificationBell'
import useSimpleAuth from '@/hooks/useSimpleAuth'

/**
 * Customer Portal Layout
 * Wraps customer pages with navigation and authentication
 */
export default function CustomerLayout({ children }) {
  const router = useRouter()
  const { customer, loading, signOut } = useSimpleAuth()

  useEffect(() => {
    if (!loading && !customer) {
      // Redirect to login if not authenticated
      router.push(`/auth/login?returnUrl=${router.asPath}`)
    }
  }, [customer, loading, router])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!customer) {
    return null
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await signOut()
    }
  }

  return (
    <>
      <Navbar />

      {/* Customer Navigation Bar */}
      <nav className="bg-white shadow-md border-b-2 border-blue-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-6">
              <Link
                href="/customer/dashboard"
                className={`text-sm font-medium transition-colors ${
                  router.pathname === '/customer/dashboard'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/customer/cart"
                className={`text-sm font-medium transition-colors ${
                  router.pathname === '/customer/cart'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Cart
              </Link>
              <Link
                href="/customer/orders"
                className={`text-sm font-medium transition-colors ${
                  router.pathname.startsWith('/customer/orders')
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                My Orders
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <CustomerNotificationBell />
              
              <span className="text-sm text-gray-600 hidden sm:inline">
                {customer.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          {children}
        </div>
      </main>

      <Footer />
    </>
  )
}
