import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { supabase } from '../../../lib/supabaseClient';
import { useAdminBusiness } from '@/context/AdminBusinessContext';

export default function CustomOrdersManagement() {
  const router = useRouter();
  const { businessType, getThemeColor } = useAdminBusiness();
  const theme = getThemeColor(); // 'blue', 'amber', 'green', 'indigo'
  
  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [quoteForm, setQuoteForm] = useState({
    quoted_amount: '',
    quote_notes: '',
    estimated_delivery_days: '',
    status: ''
  });

  const fetchCustomOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('custom_order_requests')
        .select(`
          *,
          customers (
            full_name,
            phone_number,
            email
          )
        `)
        .eq('request_type', 'custom_order')
        .order('created_at', { ascending: false });

      if (businessType !== 'all') {
        query = query.eq('business_type', businessType);
      }

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCustomOrders(data || []);
    } catch (error) {
      console.error('Error fetching custom orders:', error);
      showToast('Failed to load custom orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [businessType, filter]);

  useEffect(() => {
    fetchCustomOrders();
  }, [fetchCustomOrders]);

  const openQuoteModal = (order, action) => {
    setSelectedOrder(order);
    setQuoteForm({
      quoted_amount: order.quoted_amount || '',
      quote_notes: order.quote_notes || '',
      estimated_delivery_days: order.estimated_delivery_days || '',
      status: action
    });
    setShowQuoteModal(true);
  };

  const handleQuoteSubmit = async () => {
    if (!selectedOrder) return;

    try {
      const updates = {
        status: quoteForm.status,
        updated_at: new Date().toISOString()
      };

      if (quoteForm.status === 'quoted') {
        if (!quoteForm.quoted_amount) {
          showToast('Please enter quoted amount', 'error');
          return;
        }
        updates.quoted_amount = parseFloat(quoteForm.quoted_amount);
        updates.quote_notes = quoteForm.quote_notes;
        updates.estimated_delivery_days = quoteForm.estimated_delivery_days ? parseInt(quoteForm.estimated_delivery_days) : null;
        updates.quoted_at = new Date().toISOString();
      }

      if (quoteForm.status === 'rejected') {
        if (!quoteForm.quote_notes) {
          showToast('Please provide rejection reason', 'error');
          return;
        }
        updates.quote_notes = quoteForm.quote_notes;
      }

      const { error } = await supabase
        .from('custom_order_requests')
        .update(updates)
        .eq('id', selectedOrder.id);

      if (error) throw error;

      showToast(`Order ${quoteForm.status} successfully`, 'success');
      setShowQuoteModal(false);
      fetchCustomOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      showToast(error.message || 'Failed to update order', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      in_production: 'bg-purple-100 text-purple-800',
      completed: 'bg-teal-100 text-teal-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statuses = [
    { value: 'all', label: 'All Orders', count: customOrders.length },
    { value: 'pending', label: 'Pending', count: customOrders.filter(o => o.status === 'pending').length },
    { value: 'quoted', label: 'Quoted', count: customOrders.filter(o => o.status === 'quoted').length },
    { value: 'approved', label: 'Approved', count: customOrders.filter(o => o.status === 'approved').length },
    { value: 'in_production', label: 'In Production', count: customOrders.filter(o => o.status === 'in_production').length },
    { value: 'completed', label: 'Completed', count: customOrders.filter(o => o.status === 'completed').length },
    { value: 'rejected', label: 'Rejected', count: customOrders.filter(o => o.status === 'rejected').length }
  ];

  return (
    <AdminLayout>
      <div className={`p-6 bg-gradient-to-br from-${theme}-50 via-white to-orange-50 min-h-screen`}>
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Order Requests</h1>
            <p className="text-gray-600">Manage custom furniture orders and generate quotes</p>
          </div>
          {businessType !== 'all' && (
             <div className={`px-4 py-2 rounded-lg bg-${theme}-100 text-${theme}-800 font-bold uppercase`}>
               {businessType} Custom Orders
             </div>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-8">
          {statuses.map(status => (
            <button
              key={status.value}
              onClick={() => setFilter(status.value)}
              className={`p-3 rounded-lg border-2 transition-all text-sm ${
                filter === status.value
                  ? `border-${theme}-500 bg-${theme}-50`
                  : `border-gray-200 bg-white hover:border-${theme}-300`
              }`}
            >
              <div className="text-xl font-bold text-gray-900">{status.count}</div>
              <div className="text-xs text-gray-600">{status.label}</div>
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${theme}-600 mx-auto`}></div>
            <p className="text-gray-600 mt-4">Loading custom orders...</p>
          </div>
        ) : customOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600 text-lg">
                {businessType !== 'all' 
                 ? `No Custom Orders Found for ${businessType}` 
                 : 'No Custom Orders Found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {customOrders.map(order => (
              <div key={order.id} className={`bg-white rounded-lg shadow-md p-6 border-2 border-gray-100 hover:border-${theme}-300 transition-all`}>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            Order #{order.id}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(order.status)}`}>
                            {order.status.replace('_', ' ').toUpperCase()}
                          </span>
                           {businessType === 'all' && order.business_type && (
                             <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize`}>
                               {order.business_type}
                             </span>
                           )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div>
                            <span className="font-semibold">Customer:</span> {order.customers?.full_name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-semibold">Phone:</span> {order.contact_phone}
                          </div>
                          <div>
                            <span className="font-semibold">Furniture:</span> {order.furniture_type}
                          </div>
                          <div>
                            <span className="font-semibold">Requested:</span>{' '}
                            {new Date(order.created_at).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className={`bg-gradient-to-r from-${theme}-50 to-orange-50 rounded-lg p-4 mb-4 border border-${theme}-200`}>
                      <div className="text-sm font-semibold text-gray-900 mb-3">Specifications:</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {order.specifications?.dimensions?.length && (
                          <div>
                            <span className="text-gray-600">Length:</span>
                            <div className="font-semibold text-gray-900">{order.specifications.dimensions.length} cm</div>
                          </div>
                        )}
                        {order.specifications?.dimensions?.width && (
                          <div>
                            <span className="text-gray-600">Width:</span>
                            <div className="font-semibold text-gray-900">{order.specifications.dimensions.width} cm</div>
                          </div>
                        )}
                        {order.specifications?.dimensions?.height && (
                          <div>
                            <span className="text-gray-600">Height:</span>
                            <div className="font-semibold text-gray-900">{order.specifications.dimensions.height} cm</div>
                          </div>
                        )}
                        {order.specifications?.material && (
                          <div>
                            <span className="text-gray-600">Material:</span>
                            <div className="font-semibold text-gray-900">{order.specifications.material}</div>
                          </div>
                        )}
                        {order.specifications?.color && (
                          <div>
                            <span className="text-gray-600">Color:</span>
                            <div className="font-semibold text-gray-900">{order.specifications.color}</div>
                          </div>
                        )}
                        {order.specifications?.finish && (
                          <div>
                            <span className="text-gray-600">Finish:</span>
                            <div className="font-semibold text-gray-900">{order.specifications.finish}</div>
                          </div>
                        )}
                      </div>

                      {/* Budget Range */}
                      {(order.specifications?.budget?.min || order.specifications?.budget?.max) && (
                        <div className={`mt-3 pt-3 border-t border-${theme}-200`}>
                          <span className="text-sm text-gray-600">Budget Range: </span>
                          <span className="font-semibold text-gray-900">
                            {order.specifications.budget.min && `₹${order.specifications.budget.min.toLocaleString()}`}
                            {order.specifications.budget.min && order.specifications.budget.max && ' - '}
                            {order.specifications.budget.max && `₹${order.specifications.budget.max.toLocaleString()}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-1">Delivery Address:</div>
                      <div className="text-sm text-gray-600">{order.delivery_address}</div>
                    </div>

                    {/* Special Requirements */}
                    {order.specifications?.special_requirements && (
                      <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-200">
                        <div className="text-sm font-semibold text-purple-900 mb-1">Special Requirements:</div>
                        <div className="text-sm text-purple-800">{order.specifications.special_requirements}</div>
                      </div>
                    )}

                    {/* Quote Details */}
                    {order.quoted_amount && (
                      <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                        <div className="text-sm font-semibold text-green-900 mb-2">Quote Details:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-800">
                          <div>
                            <span className="font-semibold">Amount:</span> ₹{order.quoted_amount.toLocaleString()}
                          </div>
                          {order.estimated_delivery_days && (
                            <div>
                              <span className="font-semibold">Est. Delivery:</span> {order.estimated_delivery_days} days
                            </div>
                          )}
                          {order.quoted_at && (
                            <div>
                              <span className="font-semibold">Quoted On:</span>{' '}
                              {new Date(order.quoted_at).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>
                        {order.quote_notes && (
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <span className="font-semibold">Notes:</span> {order.quote_notes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reference Images */}
                    {order.reference_images && order.reference_images.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Reference Images:</div>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                          {order.reference_images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Reference ${idx + 1}`}
                              className={`w-full h-20 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-${theme}-400`}
                              onClick={() => window.open(img, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openQuoteModal(order, 'quoted')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                        >
                          Generate Quote
                        </button>
                        <button
                          onClick={() => openQuoteModal(order, 'rejected')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all text-sm font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    {order.status === 'quoted' && (
                      <>
                        <button
                          onClick={() => openQuoteModal(order, 'approved')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all text-sm font-semibold"
                        >
                          Mark Approved
                        </button>
                        <button
                          onClick={() => openQuoteModal(order, 'quoted')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                        >
                          Update Quote
                        </button>
                      </>
                    )}

                    {order.status === 'approved' && (
                      <button
                        onClick={() => openQuoteModal(order, 'in_production')}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-sm font-semibold"
                      >
                        Start Production
                      </button>
                    )}

                    {order.status === 'in_production' && (
                      <button
                        onClick={() => openQuoteModal(order, 'completed')}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-all text-sm font-semibold"
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

      {/* Quote Modal */}
      {showQuoteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {quoteForm.status === 'quoted' && 'Generate Quote'}
              {quoteForm.status === 'approved' && 'Approve Order'}
              {quoteForm.status === 'in_production' && 'Start Production'}
              {quoteForm.status === 'completed' && 'Complete Order'}
              {quoteForm.status === 'rejected' && 'Reject Order'}
            </h2>

            <div className="space-y-4">
              {quoteForm.status === 'quoted' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quoted Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={quoteForm.quoted_amount}
                      onChange={(e) => setQuoteForm({...quoteForm, quoted_amount: e.target.value})}
                      placeholder="Enter quoted amount"
                      className={`w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-${theme}-500 focus:outline-none`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estimated Delivery (Days)
                    </label>
                    <input
                      type="number"
                      value={quoteForm.estimated_delivery_days}
                      onChange={(e) => setQuoteForm({...quoteForm, estimated_delivery_days: e.target.value})}
                      placeholder="e.g., 30"
                      className={`w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-${theme}-500 focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quote Notes
                    </label>
                    <textarea
                      value={quoteForm.quote_notes}
                      onChange={(e) => setQuoteForm({...quoteForm, quote_notes: e.target.value})}
                      placeholder="Add any notes about the quote, materials, or timeline..."
                      rows="4"
                      className={`w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-${theme}-500 focus:outline-none resize-none`}
                    />
                  </div>
                </>
              )}

              {quoteForm.status === 'rejected' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={quoteForm.quote_notes}
                    onChange={(e) => setQuoteForm({...quoteForm, quote_notes: e.target.value})}
                    placeholder="Explain why this order cannot be fulfilled..."
                    rows="4"
                    className={`w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-${theme}-500 focus:outline-none resize-none`}
                    required
                  />
                </div>
              )}

              {(quoteForm.status === 'approved' || quoteForm.status === 'in_production' || quoteForm.status === 'completed') && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    {quoteForm.status === 'approved' && 'Customer has approved the quote. Mark this order as approved to proceed with production.'}
                    {quoteForm.status === 'in_production' && 'Order will be marked as in production. Manufacturing process can begin.'}
                    {quoteForm.status === 'completed' && 'Order will be marked as completed. Ensure delivery has been made successfully.'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowQuoteModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleQuoteSubmit}
                className={`flex-1 px-4 py-2 bg-${theme}-600 text-white rounded-lg hover:bg-${theme}-700 transition-all font-semibold`}
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
