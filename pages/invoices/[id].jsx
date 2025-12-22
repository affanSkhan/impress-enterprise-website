import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

/**
 * Public Invoice Page
 * Customers can view their invoice via the link sent on WhatsApp
 * No authentication required - public access
 */
export default function PublicInvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Business information
  const businessInfo = {
    name: 'Empire Car A/C',
    address: 'Shop Number 19, Usmaniya Masjid Complex, Bus Stand Road, Amravati',
    city: 'Amravati',
    state: 'Maharashtra',
    zipCode: '444601',
    phone: '+917741077666',
    email: 'Empirecarac@gmail.com',
    website: 'empirecarac.in'
  };

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchInvoice() {
    try {
      setLoading(true);
      
      // Fetch invoice (public access - no auth required)
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError || !invoiceData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      // Fetch related order status
      const { data: orderData } = await supabase
        .from('orders')
        .select('status')
        .eq('invoice_id', id)
        .single();
      
      // Attach order data to invoice
      invoiceData.order = orderData;
      setInvoice(invoiceData);

      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('created_at');

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

    } catch (error) {
      console.error('Error fetching invoice:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatCurrency(amount) {
    if (!amount) return '0.00';
    return parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Head>
          <title>Invoice Not Found - Empire Car A/C</title>
        </Head>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Head>
        <title>Invoice #{invoice.invoice_number} - Empire Car A/C</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="max-w-4xl mx-auto px-4">
        {/* Invoice Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 sm:p-8 relative">
            {/* Dispatched Stamp - Show if order is completed */}
            {invoice.order?.status === 'completed' && (
              <div className="absolute top-4 right-4 transform rotate-12 z-10">
                <div className="border-4 border-green-500 rounded-lg px-6 py-3 bg-white/90 shadow-lg">
                  <div className="text-green-600 font-bold text-xl tracking-wider">
                    DISPATCHED
                  </div>
                  <div className="text-green-500 text-xs text-center mt-1">
                    ✓ DELIVERED
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Logo */}
              <div className="relative w-20 h-20 bg-white rounded-lg p-2 flex-shrink-0">
                <Image
                  src="/Empire Car Ac  Logo Design.jpg"
                  alt="Empire Car A/C"
                  fill
                  className="object-contain"
                />
              </div>
              
              {/* Business Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{businessInfo.name}</h1>
                <p className="text-blue-100 text-sm">{businessInfo.address}</p>
                <p className="text-blue-100 text-sm">{businessInfo.city}, {businessInfo.state} {businessInfo.zipCode}</p>
                <p className="text-blue-100 text-sm mt-2">
                  📞 {businessInfo.phone} | 🌐 {businessInfo.website}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-6 sm:p-8">
            {/* Invoice Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 pb-6 border-b-2 border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">INVOICE</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-gray-700">Invoice Number:</span> <span className="text-gray-900">#{invoice.invoice_number}</span></p>
                  <p><span className="font-semibold text-gray-700">Date:</span> <span className="text-gray-900">{formatDate(invoice.date)}</span></p>
                  {invoice.due_date && (
                    <p><span className="font-semibold text-gray-700">Due Date:</span> <span className="text-gray-900">{formatDate(invoice.due_date)}</span></p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Bill To:</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
                  {invoice.customer_phone && (
                    <p className="text-gray-600">📱 {invoice.customer_phone}</p>
                  )}
                  {invoice.customer_email && (
                    <p className="text-gray-600">✉️ {invoice.customer_email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item Description</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-20">Qty</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 w-32">Unit Price</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {item.item_name}
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-center text-gray-900">{item.quantity}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900">₹{formatCurrency(item.unit_price)}</td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">₹{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full sm:w-80">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-gray-900">₹{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  
                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-700">Tax ({invoice.tax_rate}%):</span>
                      <span className="font-semibold text-gray-900">₹{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                  )}
                  
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between py-2 text-sm text-green-600">
                      <span>Discount:</span>
                      <span className="font-semibold">-₹{formatCurrency(invoice.discount_amount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-3 border-t-2 border-gray-300">
                    <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                    <span className="text-xl font-bold text-blue-600">₹{formatCurrency(invoice.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Notes:</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}

            {/* Payment Instructions */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Payment Information</h4>
              <p className="text-sm text-green-800 mb-3">
                Please contact us to confirm your order and arrange payment:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href={`tel:${businessInfo.phone}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Now
                </a>
                <a 
                  href={`https://wa.me/${businessInfo.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 sm:px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              Thank you for your business! For any questions, please contact us at {businessInfo.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
