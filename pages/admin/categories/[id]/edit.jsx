import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import Toast from '@/components/Toast';
import { supabase } from '@/lib/supabaseClient';
import { slugify } from '@/utils/slugify';
import { useAdminBusiness } from '@/context/AdminBusinessContext';

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = router.query;
  const { businessType } = useAdminBusiness();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    business_type: '',
  });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCategory();
    }
  }, [id]);

  async function fetchCategory() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          slug: data.slug,
          business_type: data.business_type || '',
        });
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      showToast('error', 'Failed to load category');
    } finally {
      setFetching(false);
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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      showToast('error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          business_type: formData.business_type,
        })
        .eq('id', id);

      if (error) throw error;

      showToast('success', 'Category updated successfully');
      setTimeout(() => {
        router.push('/admin/categories');
      }, 1000);
    } catch (error) {
      console.error('Error updating category:', error);
      if (error.code === '23505') {
        showToast('error', 'A category with this slug already exists');
      } else {
        showToast('error', 'Failed to update category');
      }
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-800">Edit Category</h1>
          <p className="text-gray-600 mt-1">Update category information</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 mb-2">
                Business Type
              </label>
              <select
                id="business_type"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className="input-field"
              >
                <option value="">None (Global)</option>
                <option value="solar">Solar</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
              </select>
            </div>

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
                placeholder="e.g., Solar Panels, Laptops, Dining Tables"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: Solar Panels, Inverters (Solar) | Laptops, Smartphones (Electronics) | Sofas, Tables (Furniture)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Category'}
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
