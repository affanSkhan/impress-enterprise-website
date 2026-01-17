import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import Toast from '@/components/Toast';
import { supabase } from '@/lib/supabaseClient';
import { slugify } from '@/utils/slugify';
import { useAdminBusiness } from '@/context/AdminBusinessContext'

export default function NewProductPage({ initialBusinessType = '' }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category_id: '',
    brand: '',
    description: '',
    price: '',
    stock_quantity: '',
    is_active: true,
    // business-specific fields
    business_type: '',
    sku: '',
    warranty_months: '',
    specs: '',
    material: '',
    length: '',
    width: '',
    height: '',
    wattage: '',
    panel_type: '',
    warranty_years: ''
  });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  // If page was opened via /admin/products/new/[type], prefill business_type
  useEffect(() => {
    if (initialBusinessType && !formData.business_type) {
      setFormData(prev => ({ ...prev, business_type: initialBusinessType }))
    }
  }, [initialBusinessType])

  const { businessType } = useAdminBusiness()
  // resolvedBusinessType: prefer initialBusinessType prop (if any), then context businessType
  const resolvedBusinessType = (typeof initialBusinessType !== 'undefined' && initialBusinessType) || businessType || formData.business_type

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      // If categories include a business_type column, filter client-side 
      const filtered = (data || []).filter(cat => {
        if (!cat) return false
        // Filter out legacy car categories (those without business_type or explicit car categories)
        if (!cat.business_type) return false 
        
        if (!resolvedBusinessType || resolvedBusinessType === 'all') return true
        return cat.business_type === resolvedBusinessType
      })
      setCategories(filtered);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast('error', 'Failed to load categories');
    }
  }

  function handleNameChange(e) {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: slugify(name),
    });
  }

  function handleSlugChange(e) {
    setFormData({
      ...formData,
      slug: slugify(e.target.value),
    });
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim() || !formData.category_id) {
      showToast('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // determine business type to save
      const resolvedBusinessType = businessType && businessType !== 'all' ? businessType : (formData.business_type || null)

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        category_id: formData.category_id,
        brand: formData.brand.trim() || null,
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : 0,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
        is_active: formData.is_active,
        business_type: resolvedBusinessType,
      }

      // include business-specific attributes
      if (resolvedBusinessType === 'electronics') {
        payload.sku = formData.sku || null
        payload.warranty_months = formData.warranty_months ? parseInt(formData.warranty_months) : null
        payload.specs = formData.specs ? formData.specs.trim() : null
      }

      if (resolvedBusinessType === 'furniture') {
        payload.material = formData.material || null
        payload.length = formData.length ? parseFloat(formData.length) : null
        payload.width = formData.width ? parseFloat(formData.width) : null
        payload.height = formData.height ? parseFloat(formData.height) : null
      }

      if (resolvedBusinessType === 'solar') {
        payload.wattage = formData.wattage ? parseFloat(formData.wattage) : null
        payload.panel_type = formData.panel_type || null
        payload.warranty_years = formData.warranty_years ? parseInt(formData.warranty_years) : null
      }

      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      showToast('success', 'Product created! Redirecting to add images...');
      setTimeout(() => {
        // Redirect to edit page to upload images
        router.push(`/admin/products/${data.id}/edit`);
      }, 1500);
    } catch (error) {
      console.error('Error creating product:', error);
      if (error.code === '23505') {
        showToast('error', 'A product with this slug already exists');
      } else {
        showToast('error', 'Failed to create product');
      }
    } finally {
      setLoading(false);
    }
  }

  function showToast(type, message) {
    setToast({ type, message });
  }

  return (
    <AdminLayout>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-3xl">
        <div className="mb-6">
          <Link
            href="/admin/products"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Add New Product</h1>
          <p className="text-gray-600 mt-1">Create a new product listing</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="input-field"
                  placeholder="e.g., Solar Panel X1, Smart TV, or Sofa Set"
                  required
                />
                {formData.slug && (
                  <p className="text-xs text-gray-500 mt-1">
                    URL will be: /products/{formData.slug}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Luminous, Samsung, Ikea"
                />
              </div>

              {/* No car_model field — fields are business-specific for electronics, furniture, solar */}

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="input-field"
                  placeholder="Enter product description..."
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Price (₹) <span className="text-xs text-gray-500">(Not shown on customer website)</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This price will be used as default when generating invoices
                </p>
              </div>

              <div>
                <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  id="stock_quantity"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="input-field"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Current stock available (alerts when ≤ 5)
                </p>
              </div>

              {/* Business selector when context is 'all' */}
              {businessType === 'all' && (
                <div>
                  <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                  <select
                    id="business_type"
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select business</option>
                    <option value="electronics">Electronics</option>
                    <option value="furniture">Furniture</option>
                    <option value="solar">Solar</option>
                  </select>
                </div>
              )}

              {/* Electronics fields */}
              {(businessType === 'electronics' || formData.business_type === 'electronics') && (
                <>
                  <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                    <input id="sku" name="sku" value={formData.sku} onChange={handleChange} className="input-field" placeholder="e.g., SKU-12345" />
                  </div>
                  <div>
                    <label htmlFor="warranty_months" className="block text-sm font-medium text-gray-700 mb-2">Warranty (months)</label>
                    <input id="warranty_months" name="warranty_months" value={formData.warranty_months} onChange={handleChange} type="number" className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="specs" className="block text-sm font-medium text-gray-700 mb-2">Specifications (JSON or text)</label>
                    <textarea id="specs" name="specs" value={formData.specs} onChange={handleChange} rows={3} className="input-field" placeholder='e.g., {"voltage":"12V","amps":"5A"}' />
                  </div>
                </>
              )}

              {/* Furniture fields */}
              {(businessType === 'furniture' || formData.business_type === 'furniture') && (
                <>
                  <div>
                    <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                    <input id="material" name="material" value={formData.material} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">Length (cm)</label>
                    <input id="length" name="length" value={formData.length} onChange={handleChange} type="number" className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">Width (cm)</label>
                    <input id="width" name="width" value={formData.width} onChange={handleChange} type="number" className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                    <input id="height" name="height" value={formData.height} onChange={handleChange} type="number" className="input-field" />
                  </div>
                </>
              )}

              {/* Solar fields */}
              {(businessType === 'solar' || formData.business_type === 'solar') && (
                <>
                  <div>
                    <label htmlFor="wattage" className="block text-sm font-medium text-gray-700 mb-2">Wattage (W)</label>
                    <input id="wattage" name="wattage" value={formData.wattage} onChange={handleChange} type="number" className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="panel_type" className="block text-sm font-medium text-gray-700 mb-2">Panel Type</label>
                    <input id="panel_type" name="panel_type" value={formData.panel_type} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="warranty_years" className="block text-sm font-medium text-gray-700 mb-2">Warranty (years)</label>
                    <input id="warranty_years" name="warranty_years" value={formData.warranty_years} onChange={handleChange} type="number" className="input-field" />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                    Active (visible on public site)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
              <Link href="/admin/products" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
