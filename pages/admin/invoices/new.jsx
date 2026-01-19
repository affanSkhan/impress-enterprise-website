import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import Toast from '@/components/Toast';
import PhoneInput from '@/components/PhoneInput';
import useAdminAuth from '@/hooks/useAdminAuth';
import { supabase } from '@/lib/supabaseClient';
import {
  generateInvoiceNumber,
  calculateLineTotal,
  calculateSubtotal,
  formatCurrency,
  validateInvoice,
  formatDateForInput
} from '@/utils/invoiceHelpers';
import { useAdminBusiness } from '@/context/AdminBusinessContext';

export default function NewInvoicePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  const { businessType } = useAdminBusiness();
  
  const [products, setProducts] = useState([]);
  const [existingInvoices, setExistingInvoices] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Create formData for business_type to handle 'all' case
  const [selectedBusinessType, setSelectedBusinessType] = useState('');

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(formatDateForInput(new Date()));
  
  // Items
  const [items, setItems] = useState([
    { id: 1, product_id: '', item_name: '', quantity: 1, unit_price: 0 }
  ]);

  useEffect(() => {
    // If we have a query param 'type', prioritize that
    if (router.query.type) {
         setSelectedBusinessType(router.query.type);
         return;
    }

    if (businessType && businessType !== 'all') {
      setSelectedBusinessType(businessType);
    }
  }, [businessType, router.query]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchInvoices();
    }
  }, [user, selectedBusinessType, businessType]); // Re-fetch when context or selection changes

  async function fetchProducts() {
    try {
      let query = supabase
        .from('products')
        .select('id, name, brand, sku')
        .eq('is_active', true)
        .order('name');
      
      // Filter products based on selected business type (if set) OR context (if strict)
      const targetType = businessType === 'all' ? selectedBusinessType : businessType;
      
      if (targetType) {
        query = query.eq('business_type', targetType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  async function fetchInvoices() {
    try {
      let query = supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(100);

       // Optional: Filter existing invoices too to ensure numbering uniqueness within scope?
       // Usually numbering is global. Leaving it global for now unless requested.

      const { data, error } = await query;

      if (error) throw error;
      setExistingInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  }


  // Add new item row
  function addItem() {
    const newId = Math.max(...items.map(i => i.id), 0) + 1;
    setItems([...items, { id: newId, product_id: '', item_name: '', quantity: 1, unit_price: 0 }]);
  }

  // Remove item row
  function removeItem(id) {
    if (items.length === 1) {
      showToast('error', 'At least one item is required');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  }

  // Handle product selection
  function handleProductSelect(itemId, productId) {
    const product = products.find(p => p.id === productId);
    setItems(items.map(item => {
      if (item.id === itemId) {
            return {
          ...item,
          product_id: productId,
          item_name: product ? `${product.name}${product.sku ? ` - ${product.sku}` : ''}` : ''
        };
      }
      return item;
    }));
  }

  // Update item field
  function updateItem(itemId, field, value) {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  }

  // Calculate totals
  const subtotal = calculateSubtotal(items);
  const total = subtotal;

  // Submit invoice
  async function handleSubmit(e) {
    e.preventDefault();

    const currentBusinessType = businessType === 'all' ? selectedBusinessType : businessType;

    if (!currentBusinessType) {
      showToast('error', 'Please select a business type');
      return;
    }

    // Validate
    const validation = validateInvoice({
      customer_name: customerName,
      items: items
    });

    if (!validation.valid) {
      showToast('error', validation.errors.join(', '));
      return;
    }

    try {
      setLoading(true);

      // Generate invoice number
      const invoiceNumber = generateInvoiceNumber(existingInvoices);

      // Insert invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          business_type: currentBusinessType,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          date: invoiceDate,
          subtotal: parseFloat(formatCurrency(subtotal)),
          tax_percent: 0,
          tax_amount: 0,
          total: parseFloat(formatCurrency(total)),
          created_by: user.id
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      const itemsToInsert = items.map(item => ({
        invoice_id: invoiceData.id,
        product_id: item.product_id || null,
        item_name: item.item_name.trim(),
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(formatCurrency(item.unit_price)),
        line_total: parseFloat(formatCurrency(calculateLineTotal(item.quantity, item.unit_price)))
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      showToast('success', `Invoice ${invoiceNumber} created successfully!`);
      
      // Redirect to invoice detail page
      setTimeout(() => {
        router.push(`/admin/invoices/${invoiceData.id}`);
      }, 1500);

    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast('error', 'Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type, message) {
    setToast({ type, message });
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
        <title>Create New Invoice - Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/invoices"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Invoices
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Create New Invoice</h1>
          <p className="text-gray-600 mt-1">Fill in the details to generate a new invoice</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Type Selector (Only if context is 'all') */}
          {businessType === 'all' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Business Information</h2>
              <div>
                <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  id="business_type"
                  value={selectedBusinessType}
                  onChange={(e) => setSelectedBusinessType(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select Business Type</option>
                  <option value="solar">Solar</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                </select>
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customer_name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-field"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Phone
                </label>
                <PhoneInput
                  id="customer_phone"
                  name="customer_phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label htmlFor="invoice_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  id="invoice_date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Invoice Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="btn-primary text-sm"
              >
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-24">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-32">Unit Price</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-32">Total</th>
                    <th className="px-3 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-3">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleProductSelect(item.id, e.target.value)}
                          className="input-field text-sm"
                        >
                          <option value="">Select or enter manually</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} {product.sku && `(${product.sku})`}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateItem(item.id, 'item_name', e.target.value)}
                          className="input-field text-sm"
                          placeholder="Item description"
                          required
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          className="input-field text-sm"
                          min="1"
                          required
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                          className="input-field text-sm"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          required
                        />
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        ₹{formatCurrency(calculateLineTotal(item.quantity, item.unit_price))}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Totals</h2>
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium text-lg">₹{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
                <span className="text-xl font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-primary-600">₹{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Link href="/admin/invoices" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Invoice...' : 'Save & Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
