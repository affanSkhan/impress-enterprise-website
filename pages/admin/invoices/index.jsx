import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import useAdminAuth from '@/hooks/useAdminAuth';
import { supabase } from '@/lib/supabaseClient';
import { formatDate, formatCurrency } from '@/utils/invoiceHelpers';
import { useAdminBusiness } from '@/context/AdminBusinessContext'

export default function InvoicesListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  const { businessType, getThemeColor } = useAdminBusiness();
  
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user, businessType]);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, invoices]);

  async function fetchInvoices() {
    try {
      setLoading(true);
      let query = supabase
        .from('invoices')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (businessType !== 'all') {
        query = query.eq('business_type', businessType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
      setFilteredInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterInvoices() {
    if (!searchTerm.trim()) {
      setFilteredInvoices(invoices);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = invoices.filter(inv => 
      inv.invoice_number?.toLowerCase().includes(term) ||
      inv.customer_name?.toLowerCase().includes(term) ||
      inv.customer_phone?.toLowerCase().includes(term)
    );
    setFilteredInvoices(filtered);
  }

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Invoices - Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Invoices</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and view all invoices</p>
          </div>
          <div className="flex gap-2">
             {businessType !== 'all' && (
             <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-${getThemeColor()}-100 text-${getThemeColor()}-800`}>
               {businessType} Invoices
             </span>
             )}
            <Link href="/admin/invoices/new" className="btn-primary">
                <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Invoice
                </span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm mb-1">Total Invoices</p>
                <p className="text-2xl sm:text-3xl font-bold">{invoices.length}</p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 p-2 sm:p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm mb-1">Total Revenue</p>
                <p className="text-xl sm:text-3xl font-bold truncate">
                  ₹{formatCurrency(invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0))}
                </p>
              </div>
              <div className="bg-green-400 bg-opacity-30 p-2 sm:p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm mb-1">This Month</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {invoices.filter(inv => {
                    const invDate = new Date(inv.date);
                    const now = new Date();
                    return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs sm:text-sm mb-1">Average Value</p>
                <p className="text-xl sm:text-3xl font-bold truncate">
                  ₹{invoices.length > 0 ? formatCurrency(invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0) / invoices.length) : '0.00'}
                </p>
              </div>
              <div className="bg-orange-400 bg-opacity-30 p-2 sm:p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by invoice number, customer name, or phone..."
                  className="input-field pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="btn-secondary"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No invoices found' : 'No invoices yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try a different search term' : 'Create your first invoice to get started'}
              </p>
              {!searchTerm && (
                <Link href="/admin/invoices/new" className="btn-primary inline-flex">
                  Create Invoice
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold text-primary-600 mb-1">{invoice.invoice_number}</div>
                        <div className="text-xs text-gray-500">{formatDate(invoice.date)}</div>
                         {businessType === 'all' && invoice.business_type && (
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize bg-gray-100 text-gray-600 mt-1 inline-block`}>
                            {invoice.business_type}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">₹{formatCurrency(invoice.total)}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-gray-900">{invoice.customer_name}</span>
                      </div>
                      {invoice.customer_phone && (
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-gray-600">{invoice.customer_phone}</span>
                        </div>
                      )}
                    </div>
                    
                    <Link
                      href={`/admin/invoices/${invoice.id}`}
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-md text-sm"
                    >
                      View Details
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Invoice #
                      </th>
                       {businessType === 'all' && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Business
                          </th>
                        )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-medium text-primary-600 text-sm">{invoice.invoice_number}</span>
                        </td>
                         {businessType === 'all' && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                              {invoice.business_type || 'all'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(invoice.date)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {invoice.customer_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {invoice.customer_phone || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                          ₹{formatCurrency(invoice.total)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <Link
                            href={`/admin/invoices/${invoice.id}`}
                            className="text-primary-600 hover:text-primary-900 flex items-center justify-center gap-1"
                          >
                            <span>View</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
