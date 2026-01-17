import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabaseClient'
import siteConfig from '@/site.config'
import { useAdminBusiness } from '@/context/AdminBusinessContext'

/**
 * Admin Returns Management Page
 * Approve/reject returns, process refunds, track return shipments
 */
export default function AdminReturns() {
  const { businessType, getThemeColor } = useAdminBusiness()
  const theme = getThemeColor() // 'blue', 'amber', 'green'
  
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [actionForm, setActionForm] = useState({
    status: '',
    admin_response: '',
    tracking_number: '',
    refund_amount: 0,
    refund_method: '',
    refund_date: ''
  })

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('return_requests')
        .select(`
          *,
          order:orders(order_number, total_amount),
          customer:customers(name, email, phone)
        `)
        .order('created_at', { ascending: false })

      if (businessType !== 'all') {
        query = query.eq('business_type', businessType)
      }

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setReturns(data || [])
    } catch (error) {
      console.error('Error fetching returns:', error)
      showToast('error', 'Failed to load returns')
    } finally {
      setLoading(false)
    }
  }, [filter, businessType])

  useEffect(() => {
    fetchReturns()
  }, [fetchReturns])

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  function getStatusBadgeColor(status) {
    const colors = {
      pending: 'yellow',
      approved: 'blue',
      rejected: 'red',
      in_transit: 'purple',
      completed: 'green'
    }
    return colors[status] || 'gray'
  }

  function getReturnTypeLabel(type) {
    const labels = {
      refund: 'Refund',
      exchange: 'Exchange',
      store_credit: 'Store Credit'
    }
    return labels[type] || type
  }

  function openActionModal(returnRequest, action) {
    setSelectedReturn(returnRequest)
    setActionForm({
      status: action,
      admin_response: '',
      tracking_number: returnRequest.tracking_number || '',
      refund_amount: returnRequest.refund_amount || 0,
      refund_method: returnRequest.refund_method || 'original',
      refund_date: ''
    })
    setShowActionModal(true)
  }

  async function handleAction(e) {
    e.preventDefault()

    try {
      const updates = {
        status: actionForm.status,
        admin_response: actionForm.admin_response,
        updated_at: new Date().toISOString()
      }

      if (actionForm.status === 'approved') {
        updates.tracking_number = actionForm.tracking_number
      }

      if (actionForm.status === 'completed' && selectedReturn.return_type === 'refund') {
        updates.refund_amount = parseFloat(actionForm.refund_amount)
        updates.refund_method = actionForm.refund_method
        updates.refund_date = actionForm.refund_date || new Date().toISOString()
      }

      const { error } = await supabase
        .from('return_requests')
        .update(updates)
        .eq('id', selectedReturn.id)

      if (error) throw error

      showToast('success', `Return ${actionForm.status} successfully`)
      setShowActionModal(false)
      fetchReturns()
    } catch (error) {
      console.error('Error processing return:', error)
      showToast('error', 'Failed to process return')
    }
  }

  const statusCounts = {
    all: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
    in_transit: returns.filter(r => r.status === 'in_transit').length,
    completed: returns.filter(r => r.status === 'completed').length
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${theme}-600 mx-auto`}></div>
            <p className="mt-4 text-gray-600">Loading returns...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Returns Management - {siteConfig.brandName}</title>
      </Head>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      <div className={`min-h-screen bg-gradient-to-br from-${theme}-50 via-white to-orange-50 p-6`}>
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Returns Management</h1>
            <p className="text-gray-600">Process customer return requests and manage refunds</p>
          </div>
          {businessType !== 'all' && (
             <div className={`px-4 py-2 rounded-lg bg-${theme}-100 text-${theme}-800 font-bold uppercase`}>
               {businessType} Returns
             </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-xl shadow-lg transition-all ${
              filter === 'all' ? `bg-${theme}-600 text-white` : `bg-white text-gray-900 hover:bg-${theme}-50`
            }`}
          >
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <div className="text-sm">All Returns</div>
          </button>
          
          <button
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-xl shadow-lg transition-all ${
              filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-900 hover:bg-yellow-50'
            }`}
          >
            <div className="text-2xl font-bold">{statusCounts.pending}</div>
            <div className="text-sm">Pending</div>
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`p-4 rounded-xl shadow-lg transition-all ${
              filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-blue-50'
            }`}
          >
            <div className="text-2xl font-bold">{statusCounts.approved}</div>
            <div className="text-sm">Approved</div>
          </button>

          <button
            onClick={() => setFilter('in_transit')}
            className={`p-4 rounded-xl shadow-lg transition-all ${
              filter === 'in_transit' ? 'bg-purple-600 text-white' : 'bg-white text-gray-900 hover:bg-purple-50'
            }`}
          >
            <div className="text-2xl font-bold">{statusCounts.in_transit}</div>
            <div className="text-sm">In Transit</div>
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`p-4 rounded-xl shadow-lg transition-all ${
              filter === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-900 hover:bg-green-50'
            }`}
          >
            <div className="text-2xl font-bold">{statusCounts.completed}</div>
            <div className="text-sm">Completed</div>
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={`p-4 rounded-xl shadow-lg transition-all ${
              filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-white text-gray-900 hover:bg-red-50'
            }`}
          >
            <div className="text-2xl font-bold">{statusCounts.rejected}</div>
            <div className="text-sm">Rejected</div>
          </button>
        </div>

        {/* Returns List */}
        <div className="space-y-4">
          {returns.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {businessType !== 'all' 
                   ? `No ${businessType} returns found` 
                   : 'No returns found'}
              </h3>
              <p className="text-gray-600">There are no return requests matching your filter</p>
            </div>
          ) : (
            returns.map((returnReq) => (
              <div key={returnReq.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left: Return Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            Return #{returnReq.return_number}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${getStatusBadgeColor(returnReq.status)}-100 text-${getStatusBadgeColor(returnReq.status)}-800`}>
                            {returnReq.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            {getReturnTypeLabel(returnReq.return_type)}
                          </span>
                           {businessType === 'all' && returnReq.business_type && (
                             <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 capitalize">
                               {returnReq.business_type}
                             </span>
                           )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Order:</span>
                            <Link href={`/admin/orders/${returnReq.order_id}`} className="ml-2 text-blue-600 hover:text-blue-700 font-semibold">
                              {returnReq.order?.order_number}
                            </Link>
                          </div>
                          <div>
                            <span className="text-gray-500">Customer:</span>
                            <span className="ml-2 text-gray-900 font-semibold">{returnReq.customer?.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Product:</span>
                            <span className="ml-2 text-gray-900">{returnReq.product_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Quantity:</span>
                            <span className="ml-2 text-gray-900 font-semibold">{returnReq.quantity}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Reason:</span>
                            <span className="ml-2 text-gray-900">{returnReq.reason}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Requested:</span>
                            <span className="ml-2 text-gray-900">{new Date(returnReq.created_at).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>

                        {returnReq.description && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Description:</span> {returnReq.description}
                            </p>
                          </div>
                        )}

                        {returnReq.admin_response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-900">
                              <span className="font-semibold">Admin Response:</span> {returnReq.admin_response}
                            </p>
                          </div>
                        )}

                        {returnReq.tracking_number && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-900">
                              <span className="font-semibold">Tracking Number:</span> 
                              <span className="ml-2 font-mono">{returnReq.tracking_number}</span>
                            </p>
                          </div>
                        )}

                        {returnReq.refund_amount && returnReq.refund_amount > 0 && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-green-700 font-semibold">Refund:</span>
                                <span className="ml-2 text-green-900 font-bold">₹{returnReq.refund_amount.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-green-700">Method:</span>
                                <span className="ml-2 text-green-900">{returnReq.refund_method}</span>
                              </div>
                              {returnReq.refund_date && (
                                <div>
                                  <span className="text-green-700">Date:</span>
                                  <span className="ml-2 text-green-900">{new Date(returnReq.refund_date).toLocaleDateString('en-IN')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {returnReq.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openActionModal(returnReq, 'approved')}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-semibold shadow-md flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => openActionModal(returnReq, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold shadow-md flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Reject
                        </button>
                      </>
                    )}
                    
                    {returnReq.status === 'approved' && (
                      <button
                        onClick={() => openActionModal(returnReq, 'in_transit')}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                        Mark In Transit
                      </button>
                    )}
                    
                    {returnReq.status === 'in_transit' && (
                      <button
                        onClick={() => openActionModal(returnReq, 'completed')}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-md flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complete Return
                      </button>
                    )}

                    <Link
                      href={`/admin/orders/${returnReq.order_id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold text-center"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {actionForm.status === 'approved' && 'Approve Return'}
                {actionForm.status === 'rejected' && 'Reject Return'}
                {actionForm.status === 'in_transit' && 'Mark In Transit'}
                {actionForm.status === 'completed' && 'Complete Return'}
              </h2>
              <p className="text-gray-600 mt-1">Return #{selectedReturn.return_number}</p>
            </div>
            
            <form onSubmit={handleAction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Response Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={actionForm.admin_response}
                  onChange={(e) => setActionForm({ ...actionForm, admin_response: e.target.value })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${theme}-500 focus:border-transparent`}
                  placeholder="Enter your response to the customer..."
                  rows="3"
                  required
                />
              </div>

              {actionForm.status === 'approved' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Return Shipping Tracking Number
                  </label>
                  <input
                    type="text"
                    value={actionForm.tracking_number}
                    onChange={(e) => setActionForm({ ...actionForm, tracking_number: e.target.value })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${theme}-500 focus:border-transparent`}
                    placeholder="Enter tracking number for return shipment"
                  />
                </div>
              )}

              {actionForm.status === 'completed' && selectedReturn.return_type === 'refund' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Refund Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={actionForm.refund_amount}
                      onChange={(e) => setActionForm({ ...actionForm, refund_amount: e.target.value })}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${theme}-500 focus:border-transparent`}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Refund Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={actionForm.refund_method}
                      onChange={(e) => setActionForm({ ...actionForm, refund_method: e.target.value })}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${theme}-500 focus:border-transparent`}
                      required
                    >
                      <option value="original">Original Payment Method</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="store_credit">Store Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Refund Date
                    </label>
                    <input
                      type="date"
                      value={actionForm.refund_date}
                      onChange={(e) => setActionForm({ ...actionForm, refund_date: e.target.value })}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${theme}-500 focus:border-transparent`}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 bg-${theme}-600 text-white rounded-lg hover:bg-${theme}-700 transition-all font-semibold`}
                >
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
