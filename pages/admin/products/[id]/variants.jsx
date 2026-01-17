import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabaseClient'
import siteConfig from '@/site.config'

/**
 * Admin Product Variants Management Page
 * CRUD operations for product variants (SKU, size, color, material, price, stock)
 */
export default function ProductVariants() {
  const router = useRouter()
  const { id } = router.query // product_id
  
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVariant, setEditingVariant] = useState(null)
  const [toast, setToast] = useState(null)
  
  const [formData, setFormData] = useState({
    sku: '',
    size: '',
    color: '',
    material: '',
    price_adjustment: 0,
    stock_quantity: 0,
    low_stock_threshold: 5,
    is_active: true
  })

  const fetchProductAndVariants = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (productError) throw productError
      setProduct(productData)

      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false })

      if (variantsError) throw variantsError
      setVariants(variantsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('error', 'Failed to load product variants')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchProductAndVariants()
    }
  }, [id, fetchProductAndVariants])

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  function openAddModal() {
    setEditingVariant(null)
    setFormData({
      sku: '',
      size: '',
      color: '',
      material: '',
      price_adjustment: 0,
      stock_quantity: 0,
      low_stock_threshold: 5,
      is_active: true
    })
    setShowAddModal(true)
  }

  function openEditModal(variant) {
    setEditingVariant(variant)
    setFormData({
      sku: variant.sku || '',
      size: variant.size || '',
      color: variant.color || '',
      material: variant.material || '',
      price_adjustment: variant.price_adjustment || 0,
      stock_quantity: variant.stock_quantity || 0,
      low_stock_threshold: variant.low_stock_threshold || 5,
      is_active: variant.is_active
    })
    setShowAddModal(true)
  }

  async function handleSaveVariant(e) {
    e.preventDefault()
    
    if (!formData.sku) {
      showToast('error', 'SKU is required')
      return
    }

    try {
      setSaving(true)

      if (editingVariant) {
        // Update existing variant
        const { error } = await supabase
          .from('product_variants')
          .update(formData)
          .eq('id', editingVariant.id)

        if (error) throw error
        showToast('success', 'Variant updated successfully')
      } else {
        // Create new variant
        const { error } = await supabase
          .from('product_variants')
          .insert([{ ...formData, product_id: id }])

        if (error) throw error
        showToast('success', 'Variant created successfully')
      }

      setShowAddModal(false)
      fetchProductAndVariants()
    } catch (error) {
      console.error('Error saving variant:', error)
      showToast('error', error.message || 'Failed to save variant')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteVariant(variantId) {
    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId)

      if (error) throw error
      showToast('success', 'Variant deleted successfully')
      fetchProductAndVariants()
    } catch (error) {
      console.error('Error deleting variant:', error)
      showToast('error', 'Failed to delete variant')
    }
  }

  async function handleToggleActive(variant) {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: !variant.is_active })
        .eq('id', variant.id)

      if (error) throw error
      showToast('success', `Variant ${!variant.is_active ? 'activated' : 'deactivated'}`)
      fetchProductAndVariants()
    } catch (error) {
      console.error('Error toggling variant:', error)
      showToast('error', 'Failed to update variant status')
    }
  }

  function getStockStatusColor(variant) {
    if (variant.stock_quantity <= 0) return 'red'
    if (variant.stock_quantity <= variant.low_stock_threshold) return 'yellow'
    return 'green'
  }

  function calculateFinalPrice(variant) {
    const basePrice = product?.price || 0
    return basePrice + (variant.price_adjustment || 0)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading variants...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!product) {
    return (
      <AdminLayout>
        <Head>
          <title>Product Not Found - {siteConfig.brandName}</title>
        </Head>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <Link href="/admin/products" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Products
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Product Variants - {product.name} - {siteConfig.brandName}</title>
      </Head>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/products" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Products
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600 mt-1">Manage product variants and inventory</p>
              <p className="text-sm text-gray-500 mt-1">Base Price: ₹{product.price?.toFixed(2)}</p>
            </div>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-md flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Variant
            </button>
          </div>
        </div>

        {/* Variants Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {variants.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Variants Yet</h3>
              <p className="text-gray-600 mb-6">Create variants to manage different sizes, colors, or materials for this product.</p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Variant
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Attributes</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {variants.map((variant) => (
                    <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-gray-900">{variant.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {variant.size && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              Size: {variant.size}
                            </span>
                          )}
                          {variant.color && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                              Color: {variant.color}
                            </span>
                          )}
                          {variant.material && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Material: {variant.material}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className="text-lg font-bold text-gray-900">₹{calculateFinalPrice(variant).toFixed(2)}</span>
                          {variant.price_adjustment !== 0 && (
                            <span className={`ml-2 text-xs ${variant.price_adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({variant.price_adjustment > 0 ? '+' : ''}₹{variant.price_adjustment})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-${getStockStatusColor(variant)}-100 text-${getStockStatusColor(variant)}-800`}>
                          {variant.stock_quantity} units
                        </span>
                        {variant.stock_quantity <= variant.low_stock_threshold && variant.stock_quantity > 0 && (
                          <p className="text-xs text-yellow-600 mt-1">Low stock!</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(variant)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            variant.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {variant.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(variant)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit variant"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete variant"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Variant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingVariant ? 'Edit Variant' : 'Add New Variant'}
              </h2>
            </div>
            
            <form onSubmit={handleSaveVariant} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., PROD-001-RED-L"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Size</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Large, XL, 2x3m"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Red, Blue, White"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Material</label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Cotton, Leather, Wood"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price Adjustment (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_adjustment}
                    onChange={(e) => setFormData({ ...formData, price_adjustment: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Final Price: ₹{(product.price + (formData.price_adjustment || 0)).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 5 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5"
                    min="0"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-semibold text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : (editingVariant ? 'Update Variant' : 'Create Variant')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
