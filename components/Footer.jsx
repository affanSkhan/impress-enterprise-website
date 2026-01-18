import Link from 'next/link'
import Logo from './Logo'
import siteConfig from '@/site.config'

/**
 * Footer Component
 * Displays footer for public pages
 */
export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-slate-900/30 to-blue-900/20"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* About Section */}
          <div className="text-center md:text-left">
            <div className="mb-4 flex justify-center md:justify-start">
              <Logo size="small" className="[&_.text-gray-900]:text-white [&_.bg-gradient-to-r]:from-slate-400 [&_.bg-gradient-to-r]:to-blue-400" />
            </div>
            <p className="text-gray-300 mb-3 text-sm sm:text-base">
              {siteConfig.description}
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors py-1 block sm:inline">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors py-1 block sm:inline">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors py-1 block sm:inline">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Info</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{siteConfig.contact.phoneFormatted}</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{siteConfig.contact.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700/50 mt-8 pt-8 text-center">
          <p className="text-gray-400">&copy; {currentYear} {siteConfig.brandName}. All rights reserved.</p>
          <p className="text-gray-500 text-lg mt-2">
            Designed and developed by <a href="https://affan.tech" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:from-blue-500 hover:via-purple-600 hover:to-pink-600 transition-all font-semibold">Affan.Tech</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
