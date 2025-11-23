import Link from 'next/link'
import { useState } from 'react'
import Logo from './Logo'

/**
 * Public Site Navigation Component
 * Displays navigation menu for public pages
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-gradient-to-r from-white via-slate-50 to-blue-50 shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size="small" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Home
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-slate-600 transition-colors font-medium">
              Products
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-700 transition-colors font-medium">
              Contact
            </Link>
            <Link href="/admin/login" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-slate-600 text-white rounded-lg hover:from-blue-700 hover:to-slate-700 transition-all text-sm font-semibold shadow-md">
              Admin Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-100 bg-gradient-to-b from-transparent to-blue-50/50">
            <div className="flex flex-col space-y-2">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-4 py-2 hover:bg-blue-50 rounded-lg">
                Home
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-4 py-2 hover:bg-blue-50 rounded-lg">
                Products
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-cyan-600 transition-colors font-medium px-4 py-2 hover:bg-cyan-50 rounded-lg">
                Contact
              </Link>
              <Link href="/admin/login" className="btn-primary text-sm inline-block text-center mx-4">
                Admin Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
