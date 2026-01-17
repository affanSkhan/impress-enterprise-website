import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { supabase } from '../../../lib/supabaseClient';

export default function MeasurementsManagement() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [actionForm, setActionForm] = useState({
    assigned_technician: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
    status: ''
  });

  const fetchMeasurements = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('custom_order_requests')
        .select(`
          *,
          customers (
            full_name,
            phone_number
          )
        `)
        .eq('request_type', 'measurement')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMeasurements(data || []);
    } catch (error) {
      console.error('Error fetching measurements:', error);
      showToast('Failed to load measurements', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const openActionModal = (measurement, action) => {
    setSelectedMeasurement(measurement);
    setActionForm({
      assigned_technician: measurement.specifications?.assigned_technician || '',
      scheduled_date: measurement.preferred_date?.split('T')[0] || '',
      scheduled_time: measurement.preferred_date?.split('T')[1]?.substring(0, 5) || '',
      notes: '',
      status: action
    });
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if (!selectedMeasurement) return;

    try {
      const updates = {
        status: actionForm.status,
        updated_at: new Date().toISOString()
      };

      // Update specifications with assignment details
      if (actionForm.status === 'assigned' || actionForm.status === 'scheduled') {
        updates.specifications = {
          ...selectedMeasurement.specifications,
          assigned_technician: actionForm.assigned_technician,
          scheduled_date: `${actionForm.scheduled_date}T${actionForm.scheduled_time}:00`,
          assignment_notes: actionForm.notes
        };
      }

      if (actionForm.status === 'completed') {
        updates.specifications = {
          ...selectedMeasurement.specifications,
          completion_notes: actionForm.notes,
          completed_at: new Date().toISOString()
        };
      }

      const { error } = await supabase
        .from('custom_order_requests')
        .update(updates)
        .eq('id', selectedMeasurement.id);

      if (error) throw error;

      showToast(`Measurement ${actionForm.status} successfully`, 'success');
      setShowActionModal(false);
      fetchMeasurements();
    } catch (error) {
      console.error('Error updating measurement:', error);
      showToast(error.message || 'Failed to update measurement', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statuses = [
    { value: 'all', label: 'All Requests', count: measurements.length },
    { value: 'pending', label: 'Pending', count: measurements.filter(m => m.status === 'pending').length },
    { value: 'assigned', label: 'Assigned', count: measurements.filter(m => m.status === 'assigned').length },
    { value: 'scheduled', label: 'Scheduled', count: measurements.filter(m => m.status === 'scheduled').length },
    { value: 'completed', label: 'Completed', count: measurements.filter(m => m.status === 'completed').length },
    { value: 'cancelled', label: 'Cancelled', count: measurements.filter(m => m.status === 'cancelled').length }
  ];

  return (
    <AdminLayout>
      <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Measurement Requests</h1>
          <p className="text-gray-600">Manage and schedule furniture measurement appointments</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {statuses.map(status => (
            <button
              key={status.value}
              onClick={() => setFilter(status.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                filter === status.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="text-2xl font-bold text-gray-900">{status.count}</div>
              <div className="text-sm text-gray-600">{status.label}</div>
            </button>
          ))}
        </div>

        {/* Measurements List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading measurements...</p>
          </div>
        ) : measurements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600 text-lg">No Measurement Requests Found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {measurements.map(measurement => (
              <div key={measurement.id} className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-100 hover:border-blue-300 transition-all">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            Request #{measurement.id}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(measurement.status)}`}>
                            {measurement.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div>
                            <span className="font-semibold">Customer:</span> {measurement.customers?.full_name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-semibold">Phone:</span> {measurement.contact_phone}
                          </div>
                          <div>
                            <span className="font-semibold">Furniture:</span> {measurement.furniture_type}
                          </div>
                          <div>
                            <span className="font-semibold">Room:</span> {measurement.specifications?.room_type || 'N/A'}
                          </div>
                          <div>
                            <span className="font-semibold">Preferred Date:</span>{' '}
                            {new Date(measurement.preferred_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div>
                            <span className="font-semibold">Requested:</span>{' '}
                            {new Date(measurement.created_at).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-1">Address:</div>
                      <div className="text-sm text-gray-600">{measurement.delivery_address}</div>
                    </div>

                    {/* Dimensions (if provided) */}
                    {measurement.specifications?.dimensions_known && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                        <div className="text-sm font-semibold text-blue-900 mb-2">Approximate Dimensions:</div>
                        <div className="flex gap-4 text-sm text-blue-800">
                          {measurement.specifications?.length && (
                            <div><span className="font-semibold">L:</span> {measurement.specifications.length}cm</div>
                          )}
                          {measurement.specifications?.width && (
                            <div><span className="font-semibold">W:</span> {measurement.specifications.width}cm</div>
                          )}
                          {measurement.specifications?.height && (
                            <div><span className="font-semibold">H:</span> {measurement.specifications.height}cm</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Special Requirements */}
                    {measurement.specifications?.special_requirements && (
                      <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-200">
                        <div className="text-sm font-semibold text-purple-900 mb-1">Special Requirements:</div>
                        <div className="text-sm text-purple-800">{measurement.specifications.special_requirements}</div>
                      </div>
                    )}

                    {/* Assignment Details */}
                    {measurement.specifications?.assigned_technician && (
                      <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200">
                        <div className="text-sm font-semibold text-green-900 mb-2">Assignment Details:</div>
                        <div className="text-sm text-green-800">
                          <div><span className="font-semibold">Technician:</span> {measurement.specifications.assigned_technician}</div>
                          {measurement.specifications.scheduled_date && (
                            <div>
                              <span className="font-semibold">Scheduled:</span>{' '}
                              {new Date(measurement.specifications.scheduled_date).toLocaleString('en-IN')}
                            </div>
                          )}
                          {measurement.specifications.assignment_notes && (
                            <div className="mt-2">
                              <span className="font-semibold">Notes:</span> {measurement.specifications.assignment_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reference Images */}
                    {measurement.reference_images && measurement.reference_images.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Room Photos:</div>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                          {measurement.reference_images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Room ${idx + 1}`}
                              className="w-full h-20 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400"
                              onClick={() => window.open(img, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    {measurement.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openActionModal(measurement, 'assigned')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                        >
                          Assign Technician
                        </button>
                        <button
                          onClick={() => openActionModal(measurement, 'cancelled')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all text-sm font-semibold"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    
                    {measurement.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => openActionModal(measurement, 'scheduled')}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-sm font-semibold"
                        >
                          Confirm Schedule
                        </button>
                        <button
                          onClick={() => openActionModal(measurement, 'cancelled')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all text-sm font-semibold"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {measurement.status === 'scheduled' && (
                      <button
                        onClick={() => openActionModal(measurement, 'completed')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all text-sm font-semibold"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedMeasurement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {actionForm.status === 'assigned' && 'Assign Technician'}
              {actionForm.status === 'scheduled' && 'Confirm Schedule'}
              {actionForm.status === 'completed' && 'Complete Measurement'}
              {actionForm.status === 'cancelled' && 'Cancel Request'}
            </h2>

            <div className="space-y-4">
              {(actionForm.status === 'assigned' || actionForm.status === 'scheduled') && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Technician Name *
                    </label>
                    <input
                      type="text"
                      value={actionForm.assigned_technician}
                      onChange={(e) => setActionForm({...actionForm, assigned_technician: e.target.value})}
                      placeholder="Enter technician name"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      value={actionForm.scheduled_date}
                      onChange={(e) => setActionForm({...actionForm, scheduled_date: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Scheduled Time *
                    </label>
                    <input
                      type="time"
                      value={actionForm.scheduled_time}
                      onChange={(e) => setActionForm({...actionForm, scheduled_time: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes {actionForm.status === 'cancelled' ? '*' : '(Optional)'}
                </label>
                <textarea
                  value={actionForm.notes}
                  onChange={(e) => setActionForm({...actionForm, notes: e.target.value})}
                  placeholder="Add any notes or instructions..."
                  rows="4"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  required={actionForm.status === 'cancelled'}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white z-50`}>
          {toast.message}
        </div>
      )}
    </AdminLayout>
  );
}
