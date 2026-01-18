import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PhoneInput from '@/components/PhoneInput'
import useSimpleAuth from '@/hooks/useSimpleAuth'

/**
 * Customer Signup Page
 * Allows new customers to create an account with mobile OTP
 * Includes WhatsApp availability verification
 */
export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useSimpleAuth()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [whatsappStatus, setWhatsappStatus] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleWhatsAppStatus = (status) => {
    setWhatsappStatus(status)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!formData.phone.trim()) {
      setError('Please enter your mobile number')
      return
    }

    // Check WhatsApp availability if verification was performed
    if (whatsappStatus && !whatsappStatus.available) {
      if (whatsappStatus.reason === 'duplicate') {
        setError('This phone number is already registered. Please use a different number or try logging in.')
      } else if (whatsappStatus.error) {
        setError('Could not verify phone number. Please check your internet connection and try again.')
      } else {
        setError(whatsappStatus.message || 'Please enter a valid 10-digit mobile number that is available on WhatsApp')
      }
      return
    }

    // Additional validation for phone number format
    if (formData.phone) {
      const phoneDigits = formData.phone.replace(/\D/g, '')
      // Check if it's an Indian number (most common case)
      if (formData.phone.startsWith('+91')) {
        const indianNumber = phoneDigits.substring(2) // Remove 91
        if (indianNumber.length !== 10) {
          setError('Please enter a valid 10-digit Indian mobile number')
          return
        }
        if (!/^[6-9]/.test(indianNumber)) {
          setError('Indian mobile numbers must start with 6, 7, 8, or 9')
          return
        }
      }
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    setLoading(true)
    
    const result = await signUp(formData.name, formData.phone, formData.password)

    if (result.success) {
      router.push('/customer/dashboard')
    } else {
      setError(result.error || 'Failed to create account')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Sign Up - Impress Enterprise</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent">
                Create Account
              </h1>
              <p className="text-center text-gray-500 text-sm mb-6">
                Join us today
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Number
                  </label>
                  <PhoneInput
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    showWhatsAppCheck={true}
                    onWhatsAppStatus={handleWhatsAppStatus}
                    placeholder="Enter 10-digit number"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                    Log In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
