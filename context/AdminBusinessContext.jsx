import { createContext, useContext, useState, useEffect } from 'react'

const AdminBusinessContext = createContext()

export function AdminBusinessProvider({ children }) {
  // 'all', 'electronics', 'furniture', 'solar'
  const [businessType, setBusinessType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('admin_business_context')
    if (saved) {
      setBusinessType(saved)
    }
    console.log('[AdminBusinessContext] loaded businessType from localStorage:', saved)
    setLoading(false)
  }, [])

  const setBusinessContext = (type) => {
    console.log('[AdminBusinessContext] setBusinessContext called:', type)
    setBusinessType(type)
    localStorage.setItem('admin_business_context', type)
  }

  // Helper to check if a feature/item belongs to current context
  const isVisible = (moduleBusinessType) => {
    if (businessType === 'all') return true
    if (!moduleBusinessType) return true // Universal items
    return businessType === moduleBusinessType
  }

  // Theme colors based on business type
  const getThemeColor = () => {
    switch(businessType) {
      case 'solar': return 'amber'
      case 'electronics': return 'blue'
      case 'furniture': return 'teal'
      default: return 'slate'
    }
  }

  const value = {
    businessType,
    setBusinessContext,
    isVisible,
    getThemeColor,
    loading
  }

  return (
    <AdminBusinessContext.Provider value={value}>
      {children}
    </AdminBusinessContext.Provider>
  )
}

export const useAdminBusiness = () => useContext(AdminBusinessContext)
