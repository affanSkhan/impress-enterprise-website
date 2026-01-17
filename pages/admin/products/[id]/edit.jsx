import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import Toast from '@/components/Toast';
import ImageUploader from '@/components/ImageUploader';
import ProductImageGallery from '@/components/ProductImageGallery';
import { supabase, uploadProductImages, deleteProductImage, setPrimaryImage } from '@/lib/supabaseClient';
import { slugify } from '@/utils/slugify';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category_id: '',
    brand: '',
    description: '',
    price: '',
    is_active: true,
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
  const [imageLoading, setImageLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchCategories();
      fetchImages();
    }
  }, [id]);

  async function fetchProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          slug: data.slug,
          category_id: data.category_id,
          // car_model removed — deprecated for current businesses
          brand: data.brand || '',
          description: data.description || '',
          price: data.price || '',
          is_active: data.is_active,
          business_type: data.business_type || '',
          sku: data.sku || '',
          warranty_months: data.warranty_months || '',
          specs: data.specs ? (typeof data.specs === 'string' ? data.specs : JSON.stringify(data.specs)) : '',
          material: data.material || '',
          length: data.length || '',
          width: data.width || '',
          height: data.height || '',
          wattage: data.wattage || '',
          panel_type: data.panel_type || '',
          warranty_years: data.warranty_years || ''
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast('error', 'Failed to load product');
    } finally {
      setFetching(false);
    }
  }

  async function fetchImages() {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  // helper to detect JSON
  function isJSON(str) {
    if (!str || typeof str !== 'string') return false;
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim() || !formData.category_id) {
      showToast('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          category_id: formData.category_id,
          // car_model removed — deprecated for current businesses
          brand: formData.brand.trim() || null,
          description: formData.description.trim() || null,
          price: formData.price ? parseFloat(formData.price) : 0,
          is_active: formData.is_active,
          business_type: formData.business_type || null,
          sku: formData.sku || null,
          warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : null,
          specs: formData.specs ? (isJSON(formData.specs) ? JSON.parse(formData.specs) : formData.specs) : null,
          material: formData.material || null,
          length: formData.length ? parseFloat(formData.length) : null,
          width: formData.width ? parseFloat(formData.width) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          wattage: formData.wattage ? parseFloat(formData.wattage) : null,
          panel_type: formData.panel_type || null,
          warranty_years: formData.warranty_years ? parseInt(formData.warranty_years) : null,
        })
        .eq('id', id);

      if (error) throw error;

      showToast('success', 'Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      if (error.code === '23505') {
        showToast('error', 'A product with this slug already exists');
      } else {
        showToast('error', 'Failed to update product');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(files) {
    try {
      setImageLoading(true);
      
      // Upload images to storage
      const { uploadedImages, errors } = await uploadProductImages(id, files);

      if (errors.length > 0) {
        console.error('Upload errors:', errors);
        showToast('error', `Failed to upload ${errors.length} image(s)`);
      }

      if (uploadedImages.length > 0) {
        // Insert image records into database
        const imageRecords = uploadedImages.map(img => ({
          product_id: id,
          image_url: img.publicUrl,
          is_primary: images.length === 0, // Set first image as primary if no images exist
        }));

        const { error } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (error) throw error;

        showToast('success', `${uploadedImages.length} image(s) uploaded successfully`);
        fetchImages(); // Refresh image list
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      showToast('error', 'Failed to upload images');
    } finally {
      setImageLoading(false);
    }
  }

  async function handleSetPrimary(image) {
    try {
      setImageLoading(true);
      const { success, error } = await setPrimaryImage(id, image.id);

      if (!success) throw error;

      showToast('success', 'Primary image updated');
      fetchImages(); // Refresh image list
    } catch (error) {
      console.error('Error setting primary image:', error);
      showToast('error', 'Failed to set primary image');
    } finally {
      setImageLoading(false);
    }
  }

  async function handleDeleteImage(image) {
    try {
      setImageLoading(true);
      const { success, error } = await deleteProductImage(image.id, image.image_url);

      if (!success) throw error;

      showToast('success', 'Image deleted successfully');
      fetchImages(); // Refresh image list
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('error', 'Failed to delete image');
    } finally {
      setImageLoading(false);
    }
  }

  function showToast(type, message) {
    setToast({ type, message });
  }

  if (fetching) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
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
          <h1 className="text-3xl font-bold text-gray-800">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update product information</p>
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
                  placeholder="e.g., Solar Panel X1"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL will be: /products/{formData.slug}
                </p>
              </div>

              {/* Hidden slug field - auto-generated from name */}
              <input type="hidden" name="slug" value={formData.slug} />

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

              <div className="md:col-span-2">
                {/* car_model field removed — UI only supports electronics, furniture, solar */}
              </div>

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

              {/* Electronics fields */}
              {(formData.business_type === 'electronics') && (
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
              {(formData.business_type === 'furniture') && (
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
              {(formData.business_type === 'solar') && (
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
                {loading ? 'Updating...' : 'Update Product'}
              </button>
              <Link href="/admin/products" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Image Management Section */}
        <div className="card mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Product Images</h2>
            <p className="text-gray-600 mt-1">Upload and manage product images</p>
          </div>

          {/* Existing Images Gallery */}
          {images.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Current Images ({images.length})
              </h3>
              <ProductImageGallery
                images={images}
                onSetPrimary={handleSetPrimary}
                onDelete={handleDeleteImage}
                loading={imageLoading}
              />
            </div>
          )}

          {/* Upload New Images */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Upload New Images
            </h3>
            <ImageUploader
              onUpload={handleImageUpload}
              maxImages={10}
              maxSizeMB={5}
            />
          </div>

          {imageLoading && (
            <div className="mt-4 flex items-center justify-center py-4 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
              <span className="text-primary-600 font-medium">Processing images...</span>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
