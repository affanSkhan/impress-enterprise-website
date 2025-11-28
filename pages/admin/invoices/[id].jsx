import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AdminLayout from '@/components/AdminLayout';
import Toast from '@/components/Toast';
import useAdminAuth from '@/hooks/useAdminAuth';
import { supabase } from '@/lib/supabaseClient';
import { formatDate, formatCurrency } from '@/utils/invoiceHelpers';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAdminAuth();
  
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Business information (⚠️ UPDATE WITH YOUR DETAILS)
  const businessInfo = {
    name: 'Empire Car A/C',
    address: 'Shop Number 19, Usmaniya Masjid Complex, Bus stand road',
    city: 'Amravati',
    state: 'Maharashtra',
    zipCode: '444601',
    phone: '+917741077666',
    email: 'info@empirespareparts.com',
    website: 'www.empirespareparts.com'
  };

  useEffect(() => {
    if (id && user) {
      fetchInvoice();
    }
  }, [id, user]);

  async function fetchInvoice() {
    try {
      setLoading(true);
      
      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) throw invoiceError;
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
      showToast('error', 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }

  function generatePDF() {
    if (!invoice || !items.length) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPos = 20;

      // Company Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(businessInfo.name, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(businessInfo.address, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 5;
      doc.text(`${businessInfo.city}, ${businessInfo.state} ${businessInfo.zipCode}`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 5;
      doc.text(`Phone: ${businessInfo.phone} | Email: ${businessInfo.email}`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;

      // Horizontal line
      doc.setDrawColor(200);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 10;

      // Invoice details - Two columns
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 15, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPos += 7;
      doc.text(`Invoice #: ${invoice.invoice_number}`, 15, yPos);
      yPos += 6;
      doc.text(`Date: ${formatDate(invoice.date)}`, 15, yPos);

      // Customer details (right side)
      let customerY = yPos - 13;
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', pageWidth - 15, customerY, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      customerY += 7;
      doc.text(invoice.customer_name, pageWidth - 15, customerY, { align: 'right' });
      if (invoice.customer_phone) {
        customerY += 6;
        doc.text(`Phone: ${invoice.customer_phone}`, pageWidth - 15, customerY, { align: 'right' });
      }

      yPos += 15;

      // Items table
      const tableData = items.map(item => [
        item.item_name,
        item.quantity.toString(),
        `Rs. ${formatCurrency(item.unit_price)}`,
        `Rs. ${formatCurrency(item.line_total)}`
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Item Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 5
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' }
        }
      });

      // Get Y position after table
      yPos = doc.lastAutoTable.finalY + 10;

      // Totals section (right aligned)
      const totalsX = pageWidth - 15;
      const labelX = totalsX - 50;

      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', labelX, yPos);
      doc.text(`Rs. ${formatCurrency(invoice.subtotal)}`, totalsX, yPos, { align: 'right' });

      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total:', labelX, yPos);
      doc.text(`Rs. ${formatCurrency(invoice.total)}`, totalsX, yPos, { align: 'right' });

      // Footer
      yPos = doc.internal.pageSize.height - 20;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });

      // Save PDF
      doc.save(`${invoice.invoice_number}.pdf`);
      showToast('success', 'PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('error', 'Failed to generate PDF');
    }
  }

  function printInvoice() {
    window.print();
  }

  function shareViaWhatsApp() {
    if (!invoice) return;
    
    // Generate PDF first
    generatePDF();
    
    // Use public invoice URL
    const publicUrl = `${window.location.origin}/invoice/${invoice.id}`;
    
    const message = `*Invoice ${invoice.invoice_number}*\n\n` +
      `Customer: ${invoice.customer_name}\n` +
      `Amount: ₹${formatCurrency(invoice.total)}\n` +
      `Date: ${formatDate(invoice.date)}\n\n` +
      `📄 PDF has been downloaded. Please attach it to this chat.\n\n` +
      `🔗 View online: ${publicUrl}`;
    
    const whatsappUrl = `https://wa.me/${invoice.customer_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowShareMenu(false);
    
    showToast('success', 'PDF downloaded! Please attach it to WhatsApp.');
  }

  function shareViaEmail() {
    if (!invoice) return;
    
    // Generate PDF first
    generatePDF();
    
    // Use public invoice URL
    const publicUrl = `${window.location.origin}/invoice/${invoice.id}`;
    
    const subject = `Invoice ${invoice.invoice_number} - ${businessInfo.name}`;
    const body = `Dear ${invoice.customer_name},\n\n` +
      `Please find your invoice details below:\n\n` +
      `Invoice Number: ${invoice.invoice_number}\n` +
      `Date: ${formatDate(invoice.date)}\n` +
      `Amount: ₹${formatCurrency(invoice.total)}\n\n` +
      `View invoice online: ${publicUrl}\n\n` +
      `Note: PDF has been downloaded. Please attach it to this email.\n\n` +
      `Thank you for your business!\n\n` +
      `Best regards,\n${businessInfo.name}\n${businessInfo.phone}`;
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setShowShareMenu(false);
    
    showToast('success', 'PDF downloaded! Please attach it to your email.');
  }

  function copyInvoiceLink() {
    if (!invoice) return;
    
    // Use public invoice URL
    const publicUrl = `${window.location.origin}/invoice/${invoice.id}`;
    navigator.clipboard.writeText(publicUrl)
      .then(() => {
        showToast('success', 'Public invoice link copied to clipboard!');
        setShowShareMenu(false);
      })
      .catch(() => {
        showToast('error', 'Failed to copy link');
      });
  }

  function showToast(type, message) {
    setToast({ type, message });
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!invoice) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Invoice Not Found</h2>
          <Link href="/admin/invoices" className="btn-primary">
            Back to Invoices
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>{invoice.invoice_number} - Invoice Details</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <Link
            href="/admin/invoices"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Invoices
          </Link>
          
          <div className="flex gap-3">
            <button
              onClick={generatePDF}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={printInvoice}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            
            {/* Share Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              
              {showShareMenu && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowShareMenu(false)}
                  ></div>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs text-gray-600">📄 PDF will be downloaded for sharing</p>
                    </div>
                    <div className="py-1" role="menu">
                      <button
                        onClick={shareViaWhatsApp}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        role="menuitem"
                      >
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Share via WhatsApp
                      </button>
                      
                      <button
                        onClick={shareViaEmail}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        role="menuitem"
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Share via Email
                      </button>
                      
                      <button
                        onClick={copyInvoiceLink}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        role="menuitem"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Invoice Link
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="card bg-white">
          {/* Business Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{businessInfo.name}</h1>
            <p className="text-gray-600">{businessInfo.address}</p>
            <p className="text-gray-600">{businessInfo.city}, {businessInfo.state} {businessInfo.zipCode}</p>
            <p className="text-gray-600">Phone: {businessInfo.phone} | Email: {businessInfo.email}</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">INVOICE</h2>
              <div className="space-y-1">
                <p className="text-gray-700">
                  <span className="font-semibold">Invoice #:</span> {invoice.invoice_number}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Date:</span> {formatDate(invoice.date)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Bill To:</h3>
              <div className="space-y-1">
                <p className="text-gray-900 font-semibold">{invoice.customer_name}</p>
                {invoice.customer_phone && (
                  <p className="text-gray-700">Phone: {invoice.customer_phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Item Description</th>
                    <th className="px-4 py-3 text-center font-semibold w-20">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold w-32">Unit Price</th>
                    <th className="px-4 py-3 text-right font-semibold w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-900">{item.item_name}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-700">₹{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-semibold">₹{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between items-center py-2 border-t border-gray-200">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium text-gray-900">₹{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
                <span className="text-xl font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-primary-600">₹{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center">
            <p className="text-gray-600 italic">Thank you for your business!</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .card, .card * {
            visibility: visible;
          }
          .card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
