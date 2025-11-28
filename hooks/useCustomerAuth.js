import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

/**
 * Custom hook for customer authentication
 * Manages customer login state and profile
 */
export default function useCustomerAuth() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    checkUser()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await checkUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setCustomer(null)
        }
      }
    )

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        // Fetch customer profile
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        setCustomer(customerData)
      } else {
        setUser(null)
        setCustomer(null)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign up new customer
   */
  async function signUp(email, password, name, phone) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create customer profile
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .insert([
            {
              user_id: authData.user.id,
              name,
              email,
              phone,
            },
          ])
          .select()
          .single()

        if (customerError) throw customerError

        setUser(authData.user)
        setCustomer(customerData)

        return { success: true, user: authData.user, customer: customerData }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign in existing customer
   */
  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Fetch customer profile
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        setUser(data.user)
        setCustomer(customerData)

        return { success: true, user: data.user, customer: customerData }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign out customer
   */
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setCustomer(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  /**
   * Update customer profile
   */
  async function updateProfile(updates) {
    if (!customer) return { success: false, error: 'No customer logged in' }

    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customer.id)
        .select()
        .single()

      if (error) throw error

      setCustomer(data)
      return { success: true, customer: data }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    user,
    customer,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }
}
