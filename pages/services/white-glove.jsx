import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '../../components/CustomerLayout';
import { supabase } from '../../lib/supabaseClient';

export default function WhiteGloveService() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    order_id: '',
    measurement_service: false,
    installation_service: false,
    removal_service: false,
    preferred_date: '',
    preferred_time: '',
    address: '',
    phone_number: '',
    special_instructions: ''
  });

  const fetchCustomerData = useCallback(async () => {
    try {
      const phone = localStorage.getItem('customerPhone');
      if (!phone) {
        router.push('/auth/customer-login');
        return;
      }

      // Get customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', phone)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Pre-fill address and phone
      setFormData(prev => ({
        ...prev,
        address: customerData.address || '',
        phone_number: customerData.phone_number || ''
      }));

      // Get customer's orders for dropdown
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, created_at')
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    }
  }, [router]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateServiceCost = () => {
    let cost = 0;
    if (formData.measurement_service) cost += 500;
    if (formData.installation_service) cost += 1500;
    if (formData.removal_service) cost += 800;
    return cost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.address.trim()) {
      showToast('Please enter delivery address', 'error');
      return;
    }

    if (!formData.phone_number.trim()) {
      showToast('Please enter contact number', 'error');
      return;
    }

    if (!formData.measurement_service && !formData.installation_service && !formData.removal_service) {
      showToast('Please select at least one service', 'error');
      return;
    }

    if (!formData.preferred_date) {
      showToast('Please select preferred date', 'error');
      return;
    }

    if (!formData.preferred_time) {
      showToast('Please select preferred time', 'error');
      return;
    }

    setLoading(true);

    try {
      // Create white-glove service request in delivery_tracking table
      const { data, error } = await supabase
        .from('delivery_tracking')
        .insert([
          {
            order_id: formData.order_id || null,
            current_status: 'pending',
            estimated_delivery: `${formData.preferred_date}T${formData.preferred_time}:00`,
            delivery_address: formData.address,
            delivery_phone: formData.phone_number,
            white_glove_services: {
              measurement: formData.measurement_service,
              installation: formData.installation_service,
              removal: formData.removal_service,
              total_cost: calculateServiceCost(),
              special_instructions: formData.special_instructions,
              requested_at: new Date().toISOString()
            }
          }
        ])
        .select()
        .single();

      if (error) throw error;

      showToast('White-Glove Service request submitted successfully!', 'success');
      
      // Reset form
      setTimeout(() => {
        router.push('/customer/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error submitting request:', error);
      showToast(error.message || 'Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const serviceCost = calculateServiceCost();

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              White-Glove Service
            </h1>
            <p className="text-gray-600 text-lg">
              Premium delivery and installation services for your furniture
            </p>
          </div>

          {/* Service Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100 hover:border-purple-300 transition-all">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Measurement</h3>
              <p className="text-gray-600 text-center text-sm mb-3">
                Professional measurement of your space and existing furniture
              </p>
              <p className="text-2xl font-bold text-center text-purple-600">₹500</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-pink-100 hover:border-pink-300 transition-all">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Installation</h3>
              <p className="text-gray-600 text-center text-sm mb-3">
                Expert assembly and installation at your location
              </p>
              <p className="text-2xl font-bold text-center text-pink-600">₹1,500</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100 hover:border-orange-300 transition-all">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Old Item Removal</h3>
              <p className="text-gray-600 text-center text-sm mb-3">
                Removal and disposal of your old furniture
              </p>
              <p className="text-2xl font-bold text-center text-orange-600">₹800</p>
            </div>
          </div>

          {/* Request Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Selection (Optional) */}
              {orders.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Link to Existing Order (Optional)
                  </label>
                  <select
                    name="order_id"
                    value={formData.order_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select an order (optional)</option>
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        Order #{order.order_number} - ₹{order.total_amount.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Service Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Services *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all">
                    <input
                      type="checkbox"
                      name="measurement_service"
                      checked={formData.measurement_service}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="ml-3 flex-1">
                      <span className="font-semibold text-gray-900">Measurement Service</span>
                      <span className="block text-sm text-gray-600">Professional space measurement</span>
                    </span>
                    <span className="text-lg font-bold text-purple-600">₹500</span>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-pink-50 hover:border-pink-300 transition-all">
                    <input
                      type="checkbox"
                      name="installation_service"
                      checked={formData.installation_service}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-pink-600 rounded"
                    />
                    <span className="ml-3 flex-1">
                      <span className="font-semibold text-gray-900">Installation Service</span>
                      <span className="block text-sm text-gray-600">Expert assembly and setup</span>
                    </span>
                    <span className="text-lg font-bold text-pink-600">₹1,500</span>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-all">
                    <input
                      type="checkbox"
                      name="removal_service"
                      checked={formData.removal_service}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-orange-600 rounded"
                    />
                    <span className="ml-3 flex-1">
                      <span className="font-semibold text-gray-900">Old Item Removal</span>
                      <span className="block text-sm text-gray-600">Removal and disposal</span>
                    </span>
                    <span className="text-lg font-bold text-orange-600">₹800</span>
                  </label>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    name="preferred_date"
                    value={formData.preferred_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Time *
                  </label>
                  <select
                    name="preferred_time"
                    value={formData.preferred_time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select time slot</option>
                    <option value="09:00">09:00 AM - 12:00 PM</option>
                    <option value="12:00">12:00 PM - 03:00 PM</option>
                    <option value="15:00">03:00 PM - 06:00 PM</option>
                    <option value="18:00">06:00 PM - 09:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="Enter complete address with landmark"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your contact number"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  name="special_instructions"
                  value={formData.special_instructions}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Any specific requirements or instructions for our team..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Total Cost */}
              {serviceCost > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total Service Cost:</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ₹{serviceCost.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    * Payment will be collected at the time of service
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
              >
                {loading ? 'Submitting Request...' : 'Request White-Glove Service'}
              </button>
            </form>
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What to Expect
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Our team will contact you within 24 hours to confirm the appointment</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Professional and trained service personnel</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>All services come with a satisfaction guarantee</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Payment can be made after service completion</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white z-50`}>
          {toast.message}
        </div>
      )}
    </CustomerLayout>
  );
}
