import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabaseClient'
import useAdminAuth from '@/hooks/useAdminAuth'

/**
 * Admin Bookings Management Page
 * Calendar view and management for service bookings
 */
export default function AdminBookings() {
  const { user, loading: authLoading } = useAdminAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState('list') // list or calendar
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedStatus])

  async function fetchBookings() {
    setLoading(true)
    try {
      let query = supabase
        .from('service_bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return statusConfig[status] || 'bg-gray-100 text-gray-800 border-gray-200'
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

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const updates = { status: newStatus }
      if (newStatus === 'completed') {
        updates.completion_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('service_bookings')
        .update(updates)
        .eq('id', bookingId)

      if (error) throw error
      fetchBookings()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const filterTabs = [
    { value: 'all', label: 'All Bookings', count: bookings.length },
    { value: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { value: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { value: 'in_progress', label: 'In Progress', count: bookings.filter(b => b.status === 'in_progress').length },
    { value: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { value: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length }
  ]

  // Get bookings for calendar view (current month)
  const getMonthBookings = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.preferred_date)
      return bookingDate.getMonth() === month && bookingDate.getFullYear() === year
    })
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getBookingsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(booking => 
      booking.preferred_date === dateStr
    )
  }

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))
  }

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Service Bookings - Admin Dashboard</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Service Bookings
          </h1>
          <p className="text-gray-600">Manage service appointments and technician assignments</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Calendar View
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Total: <span className="font-bold text-gray-900">{bookings.length}</span> bookings
          </div>
        </div>

        {viewMode === 'list' ? (
          <>
            {/* Filter Tabs */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-2">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedStatus(tab.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      selectedStatus === tab.value
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-2 ${
                      selectedStatus === tab.value ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      ({tab.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600 mb-4">No bookings found</p>
                {selectedStatus !== 'all' && (
                  <button
                    onClick={() => setSelectedStatus('all')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View all bookings
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Booking Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {booking.booking_number}
                            </h3>
                            <p className="text-sm text-gray-600">{booking.customer_name}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(booking.status)}`}>
                            {getStatusIcon(booking.status)} {booking.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Service:</span>
                            <span className="ml-2 font-medium text-gray-900">{booking.service_type}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <span className="ml-2 font-medium text-gray-900">{booking.customer_phone}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Preferred Date:</span>
                            <span className="ml-2 font-medium text-gray-900">{formatDate(booking.preferred_date)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Time:</span>
                            <span className="ml-2 font-medium text-gray-900">{booking.preferred_time || 'Not specified'}</span>
                          </div>
                        </div>

                        {booking.assigned_technician && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-xl">👷</span>
                              <span className="text-gray-600">Technician:</span>
                              <span className="font-medium text-gray-900">{booking.assigned_technician}</span>
                              {booking.technician_phone && (
                                <span className="text-gray-600">({booking.technician_phone})</span>
                              )}
                            </div>
                          </div>
                        )}

                        {booking.description && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-3">
                            <span className="font-medium">Description:</span> {booking.description}
                          </p>
                        )}

                        <p className="text-xs text-gray-500">
                          Booked on {formatDate(booking.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center text-sm font-medium"
                        >
                          View Details
                        </Link>
                        
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center text-sm font-medium"
                          >
                            ✅ Confirm
                          </button>
                        )}
                        
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center text-sm font-medium"
                          >
                            🔧 Start
                          </button>
                        )}
                        
                        {booking.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'completed')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center text-sm font-medium"
                          >
                            ✔️ Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Calendar View
          <div className="card">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-xl font-bold text-gray-900">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {generateCalendarDays().map((date, index) => {
                const dayBookings = date ? getBookingsForDate(date) : []
                const isToday = date && date.toDateString() === new Date().toDateString()
                
                return (
                  <div
                    key={index}
                    className={`min-h-24 border rounded-lg p-2 ${
                      date ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                    } ${isToday ? 'border-indigo-600 border-2' : 'border-gray-200'}`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-indigo-600' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </div>
                        {dayBookings.length > 0 && (
                          <div className="space-y-1">
                            {dayBookings.slice(0, 2).map((booking) => (
                              <Link
                                key={booking.id}
                                href={`/admin/bookings/${booking.id}`}
                                className={`block text-xs p-1 rounded truncate ${getStatusBadge(booking.status)}`}
                                title={`${booking.customer_name} - ${booking.service_type}`}
                              >
                                {getStatusIcon(booking.status)} {booking.customer_name.split(' ')[0]}
                              </Link>
                            ))}
                            {dayBookings.length > 2 && (
                              <div className="text-xs text-gray-600 text-center">
                                +{dayBookings.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Calendar Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Legend</h3>
              <div className="flex flex-wrap gap-3">
                {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(status)}`}>
                      {getStatusIcon(status)} {status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
