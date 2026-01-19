import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import Toast from '@/components/Toast';
import { supabase } from '@/lib/supabaseClient';
import { slugify } from '@/utils/slugify';
import { useAdminBusiness } from '@/context/AdminBusinessContext';

export default function NewCategoryPage() {
  const router = useRouter();
  const { businessType } = useAdminBusiness();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    business_type: '',
  });

  // Set initial business type from context
  useEffect(() => {
    if (businessType && businessType !== 'all') {
      setFormData(prev => ({ ...prev, business_type: businessType }));
    }
  }, [businessType]);

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(e) {
    const name = e.target.value;
    setFormData({
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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      showToast('error', 'Please fill in all fields');
      return;
    }

    // Ensure business type is set
    if (!formData.business_type) {
      showToast('error', 'Please select a business type');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('categories')
        .insert([
          {
            name: formData.name.trim(),
            slug: formData.slug.trim(),
            business_type: formData.business_type,
          },
        ]);

      if (error) throw error;

      showToast('success', 'Category created successfully');
      setTimeout(() => {
        router.push('/admin/categories');
      }, 1000);
    } catch (error) {
      console.error('Error creating category:', error);
      if (error.code === '23505') {
        showToast('error', 'A category with this slug already exists');
      } else {
        showToast('error', 'Failed to create category');
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

      <div className="max-w-2xl">
        <div className="mb-6">
          <Link
            href="/admin/categories"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Add New Category</h1>
          <p className="text-gray-600 mt-1">Create a new product category</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show Business Type selector only if in 'all' context */}
            {businessType === 'all' && (
              <div>
                <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  id="business_type"
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Business Type</option>
                  <option value="solar">Solar</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                className="input-field"
                placeholder="e.g., Engine Parts"
                required
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={handleSlugChange}
                className="input-field"
                placeholder="e.g., engine-parts"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                URL-friendly version of the name (auto-generated)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Category'}
              </button>
              <Link href="/admin/categories" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
