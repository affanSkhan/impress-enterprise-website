import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import CustomerLayout from '../../../components/CustomerLayout'
import { supabase } from '../../../lib/supabaseClient'
import useSimpleAuth from '../../../hooks/useSimpleAuth'

export default function CustomerReturns() {
  const router = useRouter()
  const { customer, loading: authLoading } = useSimpleAuth()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (customer) {
      fetchReturns()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer])

  async function fetchReturns() {
    try {
      let query = supabase
        .from('return_requests')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setReturns(data || [])
    } catch (error) {
      console.error('Error fetching returns:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (customer) {
      fetchReturns()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, customer])

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_transit: 'bg-blue-100 text-blue-800',
      received: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-emerald-100 text-emerald-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  if (authLoading || loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading returns...</p>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <Head>
        <title>My Returns - Impress Enterprise</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Returns</h1>
          <p className="text-gray-600 mt-2">Track and manage your return requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex overflow-x-auto">
            {[
              { value: 'all', label: 'All Returns' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'in_transit', label: 'In Transit' },
              { value: 'completed', label: 'Completed' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                  filter === tab.value
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Returns List */}
        {returns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Returns Found</h3>
            <p className="text-gray-600 mb-6">You haven't requested any returns yet</p>
            <button
              onClick={() => router.push('/customer/orders')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              View Orders
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map(returnRequest => (
              <div
                key={returnRequest.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {returnRequest.product_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Return #{returnRequest.return_number}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(returnRequest.status)}`}>
                      {returnRequest.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Return Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {returnRequest.return_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Reason</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {returnRequest.reason.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Quantity</p>
                      <p className="text-sm font-medium text-gray-900">
                        {returnRequest.quantity} item(s)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Requested On</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(returnRequest.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {returnRequest.description && (
                    <div className="bg-gray-50 rounded p-3 mb-4">
                      <p className="text-xs text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-gray-900">{returnRequest.description}</p>
                    </div>
                  )}

                  {returnRequest.admin_response && (
                    <div className="bg-blue-50 rounded p-3 mb-4">
                      <p className="text-xs text-blue-700 mb-1 font-medium">Admin Response</p>
                      <p className="text-sm text-blue-900">{returnRequest.admin_response}</p>
                    </div>
                  )}

                  {returnRequest.status === 'approved' && returnRequest.return_tracking_number && (
                    <div className="bg-green-50 rounded p-3 mb-4">
                      <p className="text-xs text-green-700 mb-1 font-medium">Tracking Information</p>
                      <p className="text-sm text-green-900">
                        Tracking #: {returnRequest.return_tracking_number}
                      </p>
                      {returnRequest.return_carrier && (
                        <p className="text-xs text-green-700 mt-1">
                          Carrier: {returnRequest.return_carrier}
                        </p>
                      )}
                    </div>
                  )}

                  {returnRequest.refund_amount && returnRequest.refund_status === 'completed' && (
                    <div className="bg-emerald-50 rounded p-3 mb-4">
                      <p className="text-xs text-emerald-700 mb-1 font-medium">Refund Processed</p>
                      <p className="text-sm text-emerald-900">
                        ₹{returnRequest.refund_amount.toLocaleString()} refunded via {returnRequest.refund_method?.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        {new Date(returnRequest.refund_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/customer/returns/${returnRequest.id}`)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
