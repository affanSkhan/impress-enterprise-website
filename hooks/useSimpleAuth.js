import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

/**
 * Simplified customer authentication without Supabase Auth
 * Uses direct database authentication for customers
 */
export default function useSimpleAuth() {
  const router = useRouter()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if customer is logged in via localStorage
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const customerId = localStorage.getItem('customer_id')
      if (customerId) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .single()
        
        if (data) {
          setCustomer(data)
        } else {
          localStorage.removeItem('customer_id')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign up new customer - simplified version
   */
  async function signUp(name, phone, password) {
    try {
      // Hash password (simple - in production use bcrypt)
      const hashedPassword = btoa(password) // Base64 encoding for now
      
      // Check if phone already exists
      const { data: existing, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', phone)
        .maybeSingle()
      
      if (checkError) {
        console.error('Check existing user error:', checkError)
        // verify connection/table validity
      }
      
      if (existing) {
        return { success: false, error: 'Phone number already registered' }
      }

      // Create customer directly in database
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            name,
            phone,
            password: hashedPassword,
          },
        ])
        .select()
        .single()

      if (customerError) throw customerError

      // Store customer ID in localStorage
      localStorage.setItem('customer_id', customerData.id)
      setCustomer(customerData)

      return { success: true, customer: customerData }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign in existing customer
   */
  async function signIn(phone, password) {
    try {
      const hashedPassword = btoa(password)
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .eq('password', hashedPassword)
        .single()

      if (error || !data) {
        return { success: false, error: 'Invalid phone number or password' }
      }

      localStorage.setItem('customer_id', data.id)
      setCustomer(data)

      return { success: true, customer: data }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign out customer
   */
  function signOut() {
    localStorage.removeItem('customer_id')
    setCustomer(null)
    router.push('/')
  }

  /**
   * Update customer profile
   */
  async function updateProfile(updates) {
    if (!customer) return { success: false, error: 'Not logged in' }

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
    customer,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }
}
