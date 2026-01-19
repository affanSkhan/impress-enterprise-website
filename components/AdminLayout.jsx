import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Logo from './Logo'
import NotificationBell from './NotificationBell'
import PWAInstallPrompt from './PWAInstallPrompt'
import { supabase } from '@/lib/supabaseClient'
import { subscribeToPushNotifications } from '@/utils/pushNotifications'
import { useAdminBusiness } from '@/context/AdminBusinessContext'
import BusinessSwitcher from './BusinessSwitcher'

/**
 * Admin Layout Content
 * Internal component that consumes the context
 */
function AdminLayoutContent({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { businessType, isVisible, getThemeColor } = useAdminBusiness()

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
      } else {
        router.push('/admin/login')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
      } else {
        router.push('/admin/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // Register Service Worker for PWA and Push Notifications
  useEffect(() => {
    if ('serviceWorker' in navigator && router.pathname.startsWith('/admin') && user) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          // Check if already subscribed before attempting to subscribe
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            // Already subscribed
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, [router.pathname, user])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-${getThemeColor()}-50`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600`}></div>
      </div>
    )
  }

  const themeColor = getThemeColor() // 'amber', 'blue', 'teal', 'slate'
  
  // Theme classes helpers
  const sidebarActiveClass = `bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-md`
  const sidebarHoverClass = `text-gray-700 hover:bg-gray-100`

  return (
    <>
      <Head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="theme-color" content="#1e293b" />
      </Head>
      <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-3 sm:px-4 h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 mr-2 sm:mr-4 text-gray-600"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo size="small" showText={false} />
              <span className="hidden sm:inline text-base font-bold text-gray-800 tracking-tight">
                ADMIN PANEL
              </span>
            </Link>
            
            {/* Added Business Switcher */}
            <div className="hidden md:block ml-6 border-l pl-6 border-gray-200 h-8 flex items-center">
              <BusinessSwitcher />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="md:hidden">
               {/* Mobile placeholder */}
            </div>

            <NotificationBell />
            <Link href="/" target="_blank" className="text-gray-500 hover:text-blue-600 p-2 transition-colors" title="View Public Site">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <div className="hidden sm:flex items-center space-x-2 border-l border-gray-200 pl-4 ml-2">
              <div className="flex flex-col items-end mr-2">
                 <span className="text-sm font-semibold text-gray-700 max-w-[150px] truncate leading-tight">{user.email?.split('@')[0]}</span>
                 <span className="text-xs text-gray-500 capitalize">{businessType === 'all' ? 'Super Admin' : businessType}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="sm:hidden p-2 text-gray-600 hover:text-primary-600"
              aria-label="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay - Mobile only */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-white shadow-xl transition-transform duration-300 z-40 overflow-y-auto border-r border-gray-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 min-h-full flex flex-col">
          {/* Mobile Switcher inside Sidebar */}
          <div className="md:hidden mb-6 pb-6 border-b border-gray-100">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 px-2">Business Context</p>
            <BusinessSwitcher />
          </div>

          <div className="space-y-6 flex-1">
            
            {/* Core Management */}
            <div>
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Core</p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/admin"
                    className={`flex items-center px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      router.pathname === '/admin' ? sidebarActiveClass : sidebarHoverClass
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/orders"
                    className={`flex items-center px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      router.pathname.startsWith('/admin/orders') ? sidebarActiveClass : sidebarHoverClass
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Orders
                  </Link>
                </li>
               <li>
                  <Link
                    href="/admin/products"
                    className={`flex items-center px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      router.pathname.startsWith('/admin/products') ? sidebarActiveClass : sidebarHoverClass
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Products
                  </Link>
                </li>
              </ul>
            </div>

            {/* Specialized Modules */}
            <div>
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Inventory</p>
              <ul className="space-y-1">
                {/* Inventory - Electronics/Furniture/Solar(parts) */}
                {(isVisible('electronics') || isVisible('furniture') || isVisible('solar') || isVisible('all')) && (
                <li>
                  <Link
                    href="/admin/inventory"
                    className={`flex items-center px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      router.pathname.startsWith('/admin/inventory') ? sidebarActiveClass : sidebarHoverClass
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Inventory
                  </Link>
                </li>
                )}
              </ul>
            </div>

            {/* Finance & System */}
            <div>
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Finance</p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/admin/invoices"
                    className={`flex items-center px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      router.pathname.startsWith('/admin/invoices') ? sidebarActiveClass : sidebarHoverClass
                    }`}
                  >
                     <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Invoices
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/categories"
                    className={`flex items-center px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      router.pathname.startsWith('/admin/categories') ? sidebarActiveClass : sidebarHoverClass
                    }`}
                  >
                     <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Categories
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="pt-2"> 
               <Link
                    href="/admin/settings"
                    className={`flex items-center px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-gray-700 hover:bg-gray-100 mt-2`}
                  >
                    <svg className="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
            </div>
          </div>

          <div className="mt-auto border-t border-gray-100 pt-4 pb-2">
             <p className="text-xs text-center text-gray-400 font-medium">
              Impress Enterprise
            </p>
            <p className="text-[10px] text-center text-gray-400 mt-1">
              Designed and developed by <a href="https://affan.tech" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">Affan.Tech</a>
            </p>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-64'} min-h-screen bg-gray-50`}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* PWA Install Prompt - Only show in admin */}
      <PWAInstallPrompt />
      </div>
    </>
  )
}

/**
 * Admin Layout
 * Wraps content with the Business Context Provider
 */
export default function AdminLayout({ children }) {
  // Use the already-mounted AdminBusinessProvider from pages/_app.jsx
  return <AdminLayoutContent>{children}</AdminLayoutContent>
}
