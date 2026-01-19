import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import Toast from '@/components/Toast';
import { supabase } from '@/lib/supabaseClient';
import { useAdminBusiness } from '@/context/AdminBusinessContext'

export default function CategoriesPage() {
  const router = useRouter();
  const { businessType, getThemeColor } = useAdminBusiness();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
        
      if (businessType !== 'all') {
         query = query.eq('business_type', businessType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast('error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [businessType]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleDelete(id) {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('success', 'Category deleted successfully');
      setDeleteConfirm(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('error', 'Failed to delete category. It may be in use by products.');
    }
  }

  function showToast(type, message) {
    setToast({ type, message });
  }

  // Filter categories by search term
  const filteredCategories = categories.filter(category => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      category.name?.toLowerCase().includes(searchLower) ||
      category.slug?.toLowerCase().includes(searchLower)
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
              Are you sure you want to delete the category &ldquo;{deleteConfirm.name}&rdquo;? This action cannot be undone.
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Categories</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage product categories</p>
          </div>
          <div className="flex gap-2">
             {businessType !== 'all' && (
             <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-${getThemeColor()}-100 text-${getThemeColor()}-800`}>
               {businessType} Mode
             </span>
             )}
            <div className="relative group">
              {businessType !== 'all' ? (
                <Link
                  href="/admin/categories/new"
                  className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Category
                </Link>
                ) : (
                 <>
                <button
                  className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Category
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                    {/* Dropdown for All Context */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 hidden group-hover:block border border-gray-100">
                        <div className="py-1">
                             <h6 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Context</h6>
                            <Link href="/admin/categories/new?context=solar" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                                Solar Category
                            </Link>
                            <Link href="/admin/categories/new?context=electronics" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                                Electronic Category
                            </Link>
                             <Link href="/admin/categories/new?context=furniture" className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                                Furniture Category
                            </Link>
                        </div>
                    </div>
                </>
                )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card p-3 sm:p-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or slug..."
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

      {filteredCategories.length === 0 && !loading ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 mb-4">{searchTerm ? 'No categories match your search' : 'No categories found'}</p>
          {!searchTerm && (
            <Link href="/admin/categories/new" className="btn-primary inline-block">
              Create Your First Category
            </Link>
          )}
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="btn-secondary inline-block">
              Clear Search
            </button>
          )}
        </div>
      ) : !loading && (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                <div className="mb-3">
                  <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-sm font-semibold text-gray-900 mb-1">{category.name}</h3>
                       <p className="text-xs text-gray-500 mb-2">{category.slug}</p>
                     </div>
                      {businessType === 'all' && category.business_type && (
                         <span className={`inline-flex items-center px-2 py-1 rounded-md uppercase text-xs font-bold ${
                           category.business_type === 'electronics' ? 'bg-blue-100 text-blue-800' :
                           category.business_type === 'furniture' ? 'bg-amber-100 text-amber-800' :
                           category.business_type === 'solar' ? 'bg-green-100 text-green-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {category.business_type}
                         </span>
                      )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(category.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-md text-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(category)}
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
                      Name
                    </th>
                    {businessType === 'all' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </td>
                       {businessType === 'all' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                             category.business_type === 'electronics' ? 'bg-blue-100 text-blue-800' :
                             category.business_type === 'furniture' ? 'bg-amber-100 text-amber-800' :
                             category.business_type === 'solar' ? 'bg-green-100 text-green-800' :
                             'bg-gray-100 text-gray-800'
                           }`}>
                             {category.business_type || 'all'}
                           </span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{category.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(category.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(category)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Results count */}
      {!loading && filteredCategories.length > 0 && (
        <p className="text-sm text-gray-600 mt-4 text-center">
          Showing {filteredCategories.length} of {categories.length} {categories.length !== 1 ? 'categories' : 'category'}
        </p>
      )}
    </AdminLayout>
  );
}
