import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import Toast from '@/components/Toast';
import { supabase } from '@/lib/supabaseClient';
import { useAdminBusiness } from '@/context/AdminBusinessContext'

export default function ProductsPage() {
  const router = useRouter();
  const { businessType, getThemeColor } = useAdminBusiness()
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .order('created_at', { ascending: false });

      if (businessType !== 'all') {
        query = query.eq('business_type', businessType)
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [businessType])

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleDelete(id) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('success', 'Product deleted successfully');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('error', 'Failed to delete product');
    }
  }

  async function toggleActive(id, currentStatus) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      showToast('success', `Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('error', 'Failed to update product status');
    }
  }

  function showToast(type, message) {
    setToast({ type, message });
  }

  // Filter products by search term
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.slug?.toLowerCase().includes(searchLower) ||
      product.category?.name?.toLowerCase().includes(searchLower) ||
      product.brand?.toLowerCase().includes(searchLower) ||
      product.sku?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &ldquo;{deleteConfirm.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 capitalize">{businessType === 'all' ? 'All Products' : `${businessType} Products`}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your product inventory</p>
          </div>
          <div className="flex gap-2">
             {businessType !== 'all' && (
             <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-${getThemeColor()}-100 text-${getThemeColor()}-800`}>
               {businessType} Mode
             </span>
             )}
            <Link
              href={businessType && businessType !== 'all' ? `/admin/products/new/${businessType}` : '/admin/products/new'}
              className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card p-3 sm:p-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, category, brand, or SKU..."
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 && !loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No products found</p>
          <Link href={businessType && businessType !== 'all' ? `/admin/products/new/${businessType}` : '/admin/products/new'} className="btn-primary inline-block">
            Create Your First Product
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.slug}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                       {/* Business Type Badge */}
                      {businessType === 'all' && (
                         <span className={`inline-flex items-center px-2 py-1 rounded-md uppercase text-xs font-bold ${
                           product.business_type === 'electronics' ? 'bg-blue-100 text-blue-800' :
                           product.business_type === 'furniture' ? 'bg-amber-100 text-amber-800' :
                           product.business_type === 'solar' ? 'bg-green-100 text-green-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {product.business_type || 'All'}
                         </span>
                      )}
                      
                      {product.category && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {product.category.name}
                        </span>
                      )}
                      {product.brand && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700">
                          {product.brand}
                        </span>
                      )}
                    </div>
                    {product.sku && (
                      <p className="text-xs text-gray-600 mt-2">SKU: {product.sku}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleActive(product.id, product.is_active)}
                    className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${
                      product.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-md text-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  <Link
                    href={`/admin/products/${product.id}/variants`}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-md text-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Variants
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(product)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                     {businessType === 'all' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.slug}</div>
                    </td>
                     {businessType === 'all' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                           product.business_type === 'electronics' ? 'bg-blue-100 text-blue-800' :
                           product.business_type === 'furniture' ? 'bg-amber-100 text-amber-800' :
                           product.business_type === 'solar' ? 'bg-green-100 text-green-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {product.business_type || 'all'}
                         </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.brand || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/products/${product.id}/variants`}
                          className="text-purple-600 hover:text-purple-900"
                          title="Manage Variants"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(product)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </AdminLayout>
  );
}
