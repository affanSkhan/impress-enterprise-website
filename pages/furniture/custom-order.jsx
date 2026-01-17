import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '../../components/CustomerLayout';
import { supabase } from '../../lib/supabaseClient';

export default function CustomOrderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [formData, setFormData] = useState({
    furniture_type: '',
    length: '',
    width: '',
    height: '',
    material: '',
    color: '',
    finish: '',
    budget_min: '',
    budget_max: '',
    delivery_address: '',
    phone_number: '',
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
        delivery_address: customerData.address || '',
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!formData.delivery_address.trim()) {
      showToast('Please enter delivery address', 'error');
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
          const filePath = `custom-orders/${fileName}`;

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

      // Create custom order request
      const { data, error } = await supabase
        .from('custom_order_requests')
        .insert([
          {
            customer_id: customer.id,
            request_type: 'custom_order',
            furniture_type: formData.furniture_type,
            specifications: {
              dimensions: {
                length: formData.length || null,
                width: formData.width || null,
                height: formData.height || null
              },
              material: formData.material || null,
              color: formData.color || null,
              finish: formData.finish || null,
              budget: {
                min: formData.budget_min ? parseFloat(formData.budget_min) : null,
                max: formData.budget_max ? parseFloat(formData.budget_max) : null
              },
              special_requirements: formData.special_requirements || null
            },
            delivery_address: formData.delivery_address,
            contact_phone: formData.phone_number,
            reference_images: imageUrls,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      showToast('Custom order request submitted successfully!', 'success');
      
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
    'Study Table', 'Coffee Table', 'Bookshelf', 'Chair', 
    'Cabinet', 'Dresser', 'Nightstand', 'Other'
  ];

  const materials = [
    'Solid Wood', 'Engineered Wood', 'Metal', 'Glass', 
    'Fabric', 'Leather', 'Marble', 'Combination'
  ];

  const finishes = [
    'Natural Wood', 'Painted', 'Lacquered', 'Polished', 
    'Matte', 'Glossy', 'Distressed', 'Antique'
  ];

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
              Custom Furniture Order
            </h1>
            <p className="text-gray-600 text-lg">
              Design your perfect furniture piece with our custom manufacturing service
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-4 text-center border-2 border-pink-100">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-xl">1</div>
              <h3 className="font-bold text-gray-900 text-sm">Submit Request</h3>
              <p className="text-xs text-gray-600 mt-1">Share your requirements</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 text-center border-2 border-orange-100">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xl">2</div>
              <h3 className="font-bold text-gray-900 text-sm">Get Quote</h3>
              <p className="text-xs text-gray-600 mt-1">Receive detailed pricing</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 text-center border-2 border-purple-100">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-xl">3</div>
              <h3 className="font-bold text-gray-900 text-sm">Approve Design</h3>
              <p className="text-xs text-gray-600 mt-1">Review and confirm</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 text-center border-2 border-green-100">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl">4</div>
              <h3 className="font-bold text-gray-900 text-sm">Manufacturing</h3>
              <p className="text-xs text-gray-600 mt-1">We craft your piece</p>
            </div>
          </div>

          {/* Order Form */}
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                >
                  <option value="">Select furniture type</option>
                  {furnitureTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Dimensions (in cm) - Optional
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Length</label>
                    <input
                      type="number"
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      placeholder="e.g., 200"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Width</label>
                    <input
                      type="number"
                      name="width"
                      value={formData.width}
                      onChange={handleInputChange}
                      placeholder="e.g., 100"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Height</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="e.g., 80"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Material and Finish */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Material Preference
                  </label>
                  <select
                    name="material"
                    value={formData.material}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                  >
                    <option value="">Select material</option>
                    {materials.map(material => (
                      <option key={material} value={material}>{material}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Finish Preference
                  </label>
                  <select
                    name="finish"
                    value={formData.finish}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                  >
                    <option value="">Select finish</option>
                    {finishes.map(finish => (
                      <option key={finish} value={finish}>{finish}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color / Shade Preference
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Dark Walnut, White Oak, Black, Beige"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Budget Range (₹)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                    <input
                      type="number"
                      name="budget_min"
                      value={formData.budget_min}
                      onChange={handleInputChange}
                      placeholder="e.g., 10000"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                    <input
                      type="number"
                      name="budget_max"
                      value={formData.budget_max}
                      onChange={handleInputChange}
                      placeholder="e.g., 50000"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Reference Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reference Images
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload inspiration images or room photos (Maximum 5 images)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
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

              {/* Delivery Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="Enter complete delivery address"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none resize-none"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Special Requirements */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Special Requirements or Design Notes
                </label>
                <textarea
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="Describe your vision, specific features, style preferences, or any other details..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold py-4 px-6 rounded-lg hover:from-pink-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
              >
                {loading ? 'Submitting Request...' : 'Submit Custom Order Request'}
              </button>
            </form>
          </div>

          {/* Info Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What Happens Next?
              </h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Our team reviews your requirements within 24 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>We provide a detailed quote with design options</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>After approval, manufacturing begins (2-4 weeks)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Professional delivery and installation at your location</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Why Custom Order?
              </h3>
              <ul className="space-y-2 text-green-800 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Perfect fit for your space</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Choose your materials and finishes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Unique design tailored to your style</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Premium quality craftsmanship</span>
                </li>
              </ul>
            </div>
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
