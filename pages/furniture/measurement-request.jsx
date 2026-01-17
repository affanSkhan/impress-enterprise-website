import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '../../components/CustomerLayout';
import { supabase } from '../../lib/supabaseClient';

export default function MeasurementRequest() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [formData, setFormData] = useState({
    furniture_type: '',
    room_type: '',
    preferred_date: '',
    preferred_time: '',
    address: '',
    phone_number: '',
    dimensions_known: false,
    length: '',
    width: '',
    height: '',
    special_requirements: ''
  });

  const fetchCustomerData = useCallback(async () => {
    try {
      const phone = localStorage.getItem('customerPhone');
      if (!phone) {
        router.push('/auth/customer-login');
        return;
      }

      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', phone)
        .single();

      if (error) throw error;
      setCustomer(customerData);

      // Pre-fill address and phone
      setFormData(prev => ({
        ...prev,
        address: customerData.address || '',
        phone_number: customerData.phone_number || ''
      }));

    } catch (error) {
      console.error('Error fetching customer:', error);
      showToast('Failed to load customer data', 'error');
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      showToast('Maximum 5 images allowed', 'error');
      return;
    }

    setImageFiles(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.furniture_type.trim()) {
      showToast('Please select furniture type', 'error');
      return;
    }

    if (!formData.room_type.trim()) {
      showToast('Please select room type', 'error');
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

    if (!formData.address.trim()) {
      showToast('Please enter address', 'error');
      return;
    }

    if (!formData.phone_number.trim()) {
      showToast('Please enter contact number', 'error');
      return;
    }

    setLoading(true);

    try {
      // Upload images if any
      let imageUrls = [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          const filePath = `measurement-requests/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          imageUrls.push(publicUrl);
        }
      }

      // Create measurement request in custom_order_requests table
      const { data, error } = await supabase
        .from('custom_order_requests')
        .insert([
          {
            customer_id: customer.id,
            request_type: 'measurement',
            furniture_type: formData.furniture_type,
            specifications: {
              room_type: formData.room_type,
              dimensions_known: formData.dimensions_known,
              length: formData.length || null,
              width: formData.width || null,
              height: formData.height || null,
              special_requirements: formData.special_requirements || null
            },
            preferred_date: `${formData.preferred_date}T${formData.preferred_time}:00`,
            delivery_address: formData.address,
            contact_phone: formData.phone_number,
            reference_images: imageUrls,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      showToast('Measurement request submitted successfully!', 'success');
      
      // Reset form and redirect
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

  const furnitureTypes = [
    'Sofa', 'Dining Table', 'Bed', 'Wardrobe', 'TV Unit', 
    'Study Table', 'Coffee Table', 'Bookshelf', 'Chair', 'Other'
  ];

  const roomTypes = [
    'Living Room', 'Bedroom', 'Dining Room', 'Study Room', 
    'Office', 'Kids Room', 'Guest Room', 'Other'
  ];

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Schedule Measurement
            </h1>
            <p className="text-gray-600 text-lg">
              Book a professional measurement appointment for your furniture
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-2 border-blue-100">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Quick Visit</h3>
              <p className="text-sm text-gray-600">30-45 minutes measurement session</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-2 border-purple-100">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Professional</h3>
              <p className="text-sm text-gray-600">Trained measurement specialists</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-2 border-green-100">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">FREE Service</h3>
              <p className="text-sm text-gray-600">Complimentary measurement</p>
            </div>
          </div>

          {/* Request Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Furniture Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Furniture Type *
                </label>
                <select
                  name="furniture_type"
                  value={formData.furniture_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select furniture type</option>
                  {furnitureTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Type *
                </label>
                <select
                  name="room_type"
                  value={formData.room_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select room type</option>
                  {roomTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Dimensions Known Checkbox */}
              <div>
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    name="dimensions_known"
                    checked={formData.dimensions_known}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="ml-3">
                    <span className="font-semibold text-gray-900 block">I already know the approximate dimensions</span>
                    <span className="text-sm text-gray-600">Optional - helps us prepare better</span>
                  </span>
                </label>
              </div>

              {/* Dimensions (if known) */}
              {formData.dimensions_known && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      placeholder="e.g., 200"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      name="width"
                      value={formData.width}
                      onChange={handleInputChange}
                      placeholder="e.g., 100"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="e.g., 80"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select time slot</option>
                    <option value="09:00">09:00 AM - 11:00 AM</option>
                    <option value="11:00">11:00 AM - 01:00 PM</option>
                    <option value="14:00">02:00 PM - 04:00 PM</option>
                    <option value="16:00">04:00 PM - 06:00 PM</option>
                    <option value="18:00">06:00 PM - 08:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Measurement Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="Enter complete address with landmark"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room/Space Photos (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload photos of the room or space (Maximum 5 images)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Special Requirements */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Special Requirements (Optional)
                </label>
                <textarea
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Any specific requirements or notes for our measurement team..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
              >
                {loading ? 'Submitting Request...' : 'Schedule Measurement'}
              </button>
            </form>
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What We Measure
            </h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Accurate dimensions of the space and doorways</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Ceiling height and floor levelness</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Electrical outlet and switch locations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Photo documentation for reference</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Professional recommendations</span>
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
