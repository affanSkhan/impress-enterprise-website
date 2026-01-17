import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabaseClient'
import siteConfig from '@/site.config'
import { useAdminBusiness } from '@/context/AdminBusinessContext'

/**
 * Admin Inventory Management Page
 * Manual stock adjustments with reasons and history tracking
 */
export default function InventoryManagement() {
  const { businessType, getThemeColor } = useAdminBusiness()
  const [products, setProducts] = useState([])
  const [variants, setVariants] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [toast, setToast] = useState(null)
  const [filterType, setFilterType] = useState('all') // all, low_stock, out_of_stock
  const [searchQuery, setSearchQuery] = useState('')
  
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustment_type: 'add',
    quantity: 0,
    reason: '',
    notes: ''
  })

  // Use useCallback properly for fetchInventoryData to include it in dependency arrays
  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all products with their variants
      // We use !inner to ensure we can filter by product fields if needed
      let variantsQuery = supabase
        .from('product_variants')
        .select(`
          *,
          product:products!inner(id, name, slug, price, business_type)
        `)
        .order('stock_quantity', { ascending: true })

      if (businessType !== 'all') {
        variantsQuery = variantsQuery.eq('product.business_type', businessType)
      }

      const { data: variantsData, error: variantsError } = await variantsQuery

      if (variantsError) throw variantsError
      setVariants(variantsData || [])

      // Fetch recent adjustments
      let adjustmentsQuery = supabase
        .from('inventory_adjustments')
        .select(`
          *,
          variant:product_variants!inner(
            sku,
            product:products!inner(name, business_type)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (businessType !== 'all') {
         adjustmentsQuery = adjustmentsQuery.eq('variant.product.business_type', businessType)
      }

      const { data: adjustmentsData, error: adjustmentsError } = await adjustmentsQuery

      if (adjustmentsError) throw adjustmentsError
      setAdjustments(adjustmentsData || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      showToast('error', 'Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }, [businessType])

  useEffect(() => {
    fetchInventoryData()
  }, [fetchInventoryData])

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  function getFilteredVariants() {
    let filtered = variants

    // Filter by stock status
    if (filterType === 'low_stock') {
      filtered = filtered.filter(v => v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold)
    } else if (filterType === 'out_of_stock') {
      filtered = filtered.filter(v => v.stock_quantity <= 0)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(v => 
        v.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }

  function getStockStatusColor(variant) {
    if (variant.stock_quantity <= 0) return 'red'
    if (variant.stock_quantity <= variant.low_stock_threshold) return 'yellow'
    return 'green'
  }

  function getStockStatusLabel(variant) {
    if (variant.stock_quantity <= 0) return 'Out of Stock'
    if (variant.stock_quantity <= variant.low_stock_threshold) return 'Low Stock'
    return 'In Stock'
  }

  function openAdjustmentModal(variant) {
    setSelectedVariant(variant)
    setAdjustmentForm({
      adjustment_type: 'add',
      quantity: 0,
      reason: '',
      notes: ''
    })
    setShowAdjustModal(true)
  }

  async function handleSaveAdjustment(e) {
    e.preventDefault()

    if (!adjustmentForm.quantity || adjustmentForm.quantity === 0) {
      showToast('error', 'Quantity must be greater than 0')
      return
    }

    if (!adjustmentForm.reason) {
      showToast('error', 'Reason is required')
      return
    }

    try {
      const finalQuantity = adjustmentForm.adjustment_type === 'add' 
        ? parseInt(adjustmentForm.quantity) 
        : -parseInt(adjustmentForm.quantity)

      const newStockQuantity = selectedVariant.stock_quantity + finalQuantity

      if (newStockQuantity < 0) {
        showToast('error', 'Stock cannot be negative')
        return
      }

      // Update variant stock
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock_quantity: newStockQuantity })
        .eq('id', selectedVariant.id)

      if (updateError) throw updateError

      // Create adjustment record (trigger will handle this automatically, but we can also insert manually)
      const { error: adjustmentError } = await supabase
        .from('inventory_adjustments')
        .insert([{
          variant_id: selectedVariant.id,
          adjustment_type: adjustmentForm.adjustment_type,
          quantity: Math.abs(finalQuantity),
          reason: adjustmentForm.reason,
          notes: adjustmentForm.notes,
          old_quantity: selectedVariant.stock_quantity,
          new_quantity: newStockQuantity
        }])

      if (adjustmentError) throw adjustmentError

      showToast('success', 'Inventory adjusted successfully')
      setShowAdjustModal(false)
      fetchInventoryData()
    } catch (error) {
      console.error('Error adjusting inventory:', error)
      showToast('error', 'Failed to adjust inventory')
    }
  }

  const filteredVariants = getFilteredVariants()
  const lowStockCount = variants.filter(v => v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold).length
  const outOfStockCount = variants.filter(v => v.stock_quantity <= 0).length

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Inventory Management - {siteConfig.brandName}</title>
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
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Track and adjust stock levels for all product variants</p>
          </div>
          {businessType !== 'all' && (
             <div className={`px-4 py-2 rounded-lg bg-${getThemeColor()}-100 text-${getThemeColor()}-800 font-bold uppercase`}>
               {businessType} Inventory
             </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Variants</p>
                <p className="text-3xl font-bold text-gray-900">{variants.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock</p>
                <p className="text-3xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
                <p className="text-3xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by SKU or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterType === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('low_stock')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterType === 'low_stock' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Low Stock
              </button>
              <button
                onClick={() => setFilterType('out_of_stock')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterType === 'out_of_stock' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Out of Stock
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Attributes</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No variants found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredVariants.map((variant) => (
                    <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{variant.product?.name}</div>
                        {businessType === 'all' && variant.product?.business_type && (
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize bg-gray-100 text-gray-600 mt-1 inline-block`}>
                            {variant.product.business_type}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-900">{variant.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {variant.size && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {variant.size}
                            </span>
                          )}
                          {variant.color && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {variant.color}
                            </span>
                          )}
                          {variant.material && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {variant.material}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">{variant.stock_quantity}</span>
                          <span className="text-sm text-gray-500">units</span>
                        </div>
                        {variant.stock_quantity <= variant.low_stock_threshold && (
                          <p className="text-xs text-gray-500 mt-1">
                            Threshold: {variant.low_stock_threshold}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-${getStockStatusColor(variant)}-100 text-${getStockStatusColor(variant)}-800`}>
                          {getStockStatusLabel(variant)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openAdjustmentModal(variant)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-sm shadow-md"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Adjustments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Adjustments</h2>
          <div className="space-y-3">
            {adjustments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No adjustments recorded yet</p>
            ) : (
              adjustments.map((adjustment) => (
                <div key={adjustment.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    adjustment.adjustment_type === 'add' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <svg className={`w-5 h-5 ${adjustment.adjustment_type === 'add' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {adjustment.adjustment_type === 'add' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">
                        {adjustment.variant?.product?.name} - {adjustment.variant?.sku}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(adjustment.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className={`font-semibold ${adjustment.adjustment_type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                        {adjustment.adjustment_type === 'add' ? '+' : '-'}{adjustment.quantity}
                      </span>
                      {' units • '}{adjustment.old_quantity} → {adjustment.new_quantity}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Reason:</span> {adjustment.reason}
                    </p>
                    {adjustment.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Notes:</span> {adjustment.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      {showAdjustModal && selectedVariant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Adjust Stock</h2>
              <p className="text-gray-600 mt-1">
                {selectedVariant.product?.name} - {selectedVariant.sku}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Current Stock: <span className="font-bold text-gray-900">{selectedVariant.stock_quantity}</span> units
              </p>
            </div>
            
            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustmentForm({ ...adjustmentForm, adjustment_type: 'add' })}
                    className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                      adjustmentForm.adjustment_type === 'add'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
                    }`}
                  >
                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentForm({ ...adjustmentForm, adjustment_type: 'remove' })}
                    className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                      adjustmentForm.adjustment_type === 'remove'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-red-400'
                    }`}
                  >
                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    Remove Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={adjustmentForm.quantity}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  New stock will be: {selectedVariant.stock_quantity + (adjustmentForm.adjustment_type === 'add' ? parseInt(adjustmentForm.quantity || 0) : -parseInt(adjustmentForm.quantity || 0))} units
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Purchase">Purchase from supplier</option>
                  <option value="Return">Customer return</option>
                  <option value="Damage">Damaged goods</option>
                  <option value="Lost">Lost/Theft</option>
                  <option value="Sale">Manual sale adjustment</option>
                  <option value="Count">Stock count correction</option>
                  <option value="Transfer">Transfer to/from warehouse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional details..."
                  rows="3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-md"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
