import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { supabase } from '@/lib/supabaseClient'

/**
 * Admin Login Page
 * Email/password authentication via Supabase Auth
 */
export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if user has admin/staff role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      if (roleError) {
        console.error('Role check error:', roleError)
        await supabase.auth.signOut()
        throw new Error(`Access verification failed: ${roleError.message}`)
      }

      if (!roleData) {
        console.error('No role found for user:', data.user.id)
        await supabase.auth.signOut()
        throw new Error('No role assigned to your account')
      }

      // Check specifically for admin role if needed, or just existence
      if (roleData.role !== 'admin') {
         await supabase.auth.signOut() 
         throw new Error('You do not have admin permissions')
      }

      // Redirect to admin dashboard
      router.push('/admin')
    } catch (error) {
      setError(error.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login - Empire Spare Parts</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-slate-500/10 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-md w-full relative z-10">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center group">
              <div className="bg-white p-4 rounded-2xl shadow-2xl mb-4 group-hover:scale-105 transition-transform">
                <Logo size="large" showText={false} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">Impress Enterprise</h1>
              <p className="text-blue-200 font-medium">Admin Dashboard</p>
            </Link>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-slate-600 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent">Sign In</h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-slate-600 text-white rounded-lg hover:from-blue-700 hover:to-slate-700 transition-all transform hover:scale-105 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Website
              </Link>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-white/80 text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure admin access only</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
