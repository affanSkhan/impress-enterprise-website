import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Logo from './Logo'
import NotificationBell from './NotificationBell'
import PWAInstallPrompt from './PWAInstallPrompt'
import { supabase } from '@/lib/supabaseClient'
import { subscribeToPushNotifications } from '@/utils/pushNotifications'

/**
 * Admin Layout Component
 * Wraps all admin pages with navigation and authentication
 */
export default function AdminLayout({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start closed on mobile

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
          console.log('Service Worker registered successfully:', registration.scope);
          
          // Check if already subscribed before attempting to subscribe
          // This prevents unsubscribing and resubscribing on every page load
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            console.log('Already subscribed to push notifications');
          }
          // Note: Don't auto-subscribe here - let user control it via Notifications settings page
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="theme-color" content="#1e293b" />
      </Head>
      <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-white via-slate-50 to-blue-50 shadow-lg fixed top-0 left-0 right-0 z-40 backdrop-blur-sm">
        <div className="flex items-center justify-between px-3 sm:px-4 h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 mr-2 sm:mr-4"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo size="small" showText={false} />
              <span className="hidden sm:inline text-base font-semibold text-gray-800">
                Admin Panel
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <NotificationBell />
            <Link href="/" target="_blank" className="text-gray-600 hover:text-primary-600 p-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-gray-600 max-w-[150px] truncate">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-slate-600 text-white rounded-lg hover:from-blue-700 hover:to-slate-700 transition-all text-sm font-semibold shadow-md"
              >
                Logout
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
      <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-gradient-to-b from-white to-blue-50 shadow-2xl transition-transform duration-300 z-40 overflow-y-auto border-r-2 border-blue-100 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 min-h-full flex flex-col">
          <ul className="space-y-2 flex-1">
            <li>
              <Link
                href="/admin"
                className={`flex items-center px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  router.pathname === '/admin' ? 'bg-gradient-to-r from-blue-600 to-slate-600 text-white shadow-md' : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/admin/products"
                className={`flex items-center px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  router.pathname.startsWith('/admin/products') ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md' : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Products
              </Link>
            </li>
            <li>
              <Link
                href="/admin/categories"
                className={`flex items-center px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  router.pathname.startsWith('/admin/categories') ? 'bg-gradient-to-r from-slate-600 to-gray-600 text-white shadow-md' : 'text-gray-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Categories
              </Link>
            </li>
            <li>
              <Link
                href="/admin/orders"
                className={`flex items-center px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  router.pathname.startsWith('/admin/orders') ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md' : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Orders
              </Link>
            </li>
            <li>
              <Link
                href="/admin/invoices/new"
                className={`flex items-center px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  router.pathname === '/admin/invoices/new' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                New Invoice
              </Link>
            </li>
            <li>
              <Link
                href="/admin/invoices"
                className={`flex items-center px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  router.pathname === '/admin/invoices' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice History
              </Link>
            </li>
            <li>
              <Link
                href="/admin/notifications"
                className={`flex items-center px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  router.pathname === '/admin/notifications' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </Link>
            </li>
          </ul>

          <div className="mt-8 pt-4 border-t border-blue-200 text-center">
             <p className="text-lg text-gray-500">
              Designed and developed by <a href="https://affan.tech" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:from-blue-500 hover:via-purple-600 hover:to-pink-600 transition-all font-semibold">Affan.Tech</a>
            </p>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 lg:ml-0 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50`}>
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
