import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabaseClient'
import useAdminAuth from '@/hooks/useAdminAuth'

/**
 * Admin Booking Details Page
 * View and manage individual service booking
 */
export default function BookingDetails() {
  const router = useRouter()
  const { id } = router.query
  const { user, loading: authLoading } = useAdminAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    status: '',
    assigned_technician: '',
    technician_phone: '',
    scheduled_date: '',
    scheduled_time: '',
    admin_notes: '',
    service_charges: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && id) {
      fetchBooking()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id])

  async function fetchBooking() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      setBooking(data)
      setFormData({
        status: data.status || '',
        assigned_technician: data.assigned_technician || '',
        technician_phone: data.technician_phone || '',
        scheduled_date: data.scheduled_date || '',
        scheduled_time: data.scheduled_time || '',
        admin_notes: data.admin_notes || '',
        service_charges: data.service_charges || ''
      })
    } catch (error) {
      console.error('Error fetching booking:', error)
      alert('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = { ...formData }
      if (formData.status === 'completed' && !booking.completion_date) {
        updates.completion_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('service_bookings')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      await fetchBooking()
      setIsEditing(false)
      alert('Booking updated successfully!')
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    }
    return statusConfig[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      in_progress: '🔧',
      completed: '✔️',
      cancelled: '❌'
    }
    return icons[status] || '📋'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleWhatsApp = () => {
    const message = `Hi ${booking.customer_name}, this is regarding your service booking ${booking.booking_number} for ${booking.service_type}.`
    const whatsappUrl = `https://wa.me/91${booking.customer_phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!booking) {
    return (
      <AdminLayout>
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
          <Link href="/admin/bookings" className="btn btn-primary">
            Back to Bookings
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Booking {booking.booking_number} - Admin Dashboard</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/bookings" className="text-indigo-600 hover:text-indigo-700 mb-2 inline-flex items-center text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Bookings
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {booking.booking_number}
              </h1>
              <p className="text-gray-600">Service Booking Details</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusBadge(booking.status)}`}>
              {getStatusIcon(booking.status)} {booking.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                👤 Customer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-semibold text-gray-900">{booking.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{booking.customer_phone}</p>
                    <button
                      onClick={handleWhatsApp}
                      className="p-1 text-green-600 hover:text-green-700 transition-colors"
                      title="WhatsApp"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="font-semibold text-gray-900">{booking.customer_address}</p>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🔧 Service Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service Type</p>
                  <p className="font-semibold text-gray-900 text-lg">{booking.service_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Problem Description</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900">{booking.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Preferred Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(booking.preferred_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Preferred Time</p>
                    <p className="font-semibold text-gray-900">{booking.preferred_time || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Section */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  ⚙️ Management
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Technician</label>
                      <input
                        type="text"
                        name="assigned_technician"
                        value={formData.assigned_technician}
                        onChange={handleInputChange}
                        placeholder="Technician name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Technician Phone</label>
                      <input
                        type="tel"
                        name="technician_phone"
                        value={formData.technician_phone}
                        onChange={handleInputChange}
                        placeholder="10-digit number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                      <input
                        type="date"
                        name="scheduled_date"
                        value={formData.scheduled_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Time</label>
                      <select
                        name="scheduled_time"
                        value={formData.scheduled_time}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select time</option>
                        <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                        <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                        <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Charges (₹)</label>
                    <input
                      type="number"
                      name="service_charges"
                      value={formData.service_charges}
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                    <textarea
                      name="admin_notes"
                      value={formData.admin_notes}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Internal notes about this booking..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          status: booking.status || '',
                          assigned_technician: booking.assigned_technician || '',
                          technician_phone: booking.technician_phone || '',
                          scheduled_date: booking.scheduled_date || '',
                          scheduled_time: booking.scheduled_time || '',
                          admin_notes: booking.admin_notes || '',
                          service_charges: booking.service_charges || ''
                        })
                      }}
                      disabled={saving}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {booking.assigned_technician ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Assigned Technician</p>
                      <p className="font-semibold text-gray-900 text-lg">{booking.assigned_technician}</p>
                      {booking.technician_phone && (
                        <p className="text-sm text-gray-600 mt-1">📞 {booking.technician_phone}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-yellow-800">⚠️ No technician assigned yet</p>
                    </div>
                  )}

                  {booking.scheduled_date && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Scheduled Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(booking.scheduled_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Scheduled Time</p>
                        <p className="font-semibold text-gray-900">{booking.scheduled_time || 'Not set'}</p>
                      </div>
                    </div>
                  )}

                  {booking.service_charges && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Service Charges</p>
                      <p className="font-bold text-2xl text-green-600">₹{parseFloat(booking.service_charges).toLocaleString()}</p>
                    </div>
                  )}

                  {booking.admin_notes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Admin Notes</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-900">{booking.admin_notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Info */}
            <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
              <h3 className="font-bold text-lg mb-4 text-indigo-900">Booking Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Booking ID</p>
                  <p className="font-mono font-semibold text-gray-900">{booking.id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Booked On</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(booking.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(booking.updated_at)}</p>
                </div>
                {booking.completion_date && (
                  <div>
                    <p className="text-gray-600">Completed On</p>
                    <p className="font-semibold text-green-700">{formatDateTime(booking.completion_date)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleWhatsApp}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Contact Customer
                </button>
                
                <a
                  href={`tel:${booking.customer_phone}`}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  📞 Call Customer
                </a>

                {booking.assigned_technician && booking.technician_phone && (
                  <a
                    href={`tel:${booking.technician_phone}`}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    👷 Call Technician
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
