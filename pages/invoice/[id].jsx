import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { formatDate, formatCurrency } from '@/utils/invoiceHelpers';

/**
 * Public Invoice View Page
 * Allows customers to view their invoices without login
 */
export default function PublicInvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, [id]);

  async function fetchInvoice() {
    try {
      setLoading(true);
      
      // Fetch invoice (public access)
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) throw invoiceError;
      
      if (!invoiceData) {
        setError('Invoice not found');
        setLoading(false);
        return;
      }
      
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
      setError('Failed to load invoice');
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

      // Add Logo centered with business name
      const logoImg = new Image();
      logoImg.src = '/Empire Car Ac  Logo Design.jpg';
      const logoSize = 15;
      const logoX = (pageWidth / 2) - 40; // Center the logo+text combo
      doc.addImage(logoImg, 'JPEG', logoX, yPos - 3, logoSize, logoSize);

      // Company Header (next to logo)
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(businessInfo.name, logoX + logoSize + 3, yPos + 8);
      
      yPos += 23;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(businessInfo.address, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 5;
      doc.text(`${businessInfo.city}, ${businessInfo.state} ${businessInfo.zipCode}`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 5;
      doc.text(`Phone: ${businessInfo.phone} | Website: ${businessInfo.website}`, pageWidth / 2, yPos, { align: 'center' });
      
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
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  }

  function printInvoice() {
    window.print();
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <Head>
          <title>Invoice Not Found - Empire Car A/C</title>
        </Head>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h2>
                <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist or has been removed.</p>
                <Link href="/" className="btn-primary inline-block">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{invoice.invoice_number} - Invoice</title>
        <meta name="description" content={`Invoice ${invoice.invoice_number} for ${invoice.customer_name}`} />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header Actions */}
            <div className="mb-4 sm:mb-6 flex flex-row gap-2 sm:gap-3 print:hidden">
              <button
                onClick={generatePDF}
                className="btn-primary flex items-center justify-center gap-2 flex-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <button
                onClick={printInvoice}
                className="btn-secondary flex items-center justify-center gap-2 flex-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>

            {/* Invoice Content */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
              {/* Business Header */}
              <div className="mb-6 sm:mb-8 border-b pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <img src="/Empire Car Ac  Logo Design.jpg" alt="Empire Car A/C Logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center">{businessInfo.name}</h1>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs sm:text-sm text-gray-600">{businessInfo.address}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{businessInfo.city}, {businessInfo.state} {businessInfo.zipCode}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Phone: <a href="tel:{businessInfo.phone}" className="text-primary-600 hover:underline">{businessInfo.phone}</a></p>
                  <p className="text-xs sm:text-sm text-gray-600">Website: <a href="https://{businessInfo.website}" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">{businessInfo.website}</a></p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">INVOICE</h2>
                  <div className="space-y-1">
                    <p className="text-sm sm:text-base text-gray-700">
                      <span className="font-semibold">Invoice #:</span> {invoice.invoice_number}
                    </p>
                    <p className="text-sm sm:text-base text-gray-700">
                      <span className="font-semibold">Date:</span> {formatDate(invoice.date)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">Bill To:</h3>
                  <div className="space-y-1">
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{invoice.customer_name}</p>
                    {invoice.customer_phone && (
                      <p className="text-sm sm:text-base text-gray-700">Phone: {invoice.customer_phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6 sm:mb-8">
                <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-primary-600 text-white">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-xs sm:text-sm">Item Description</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm w-16 sm:w-20">Qty</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-xs sm:text-sm w-24 sm:w-32">Unit Price</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-xs sm:text-sm w-24 sm:w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{item.item_name}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-700">{item.quantity}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm text-gray-700">₹{formatCurrency(item.unit_price)}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm text-gray-900 font-semibold">₹{formatCurrency(item.line_total)}</td>
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
                    <span className="text-sm sm:text-base text-gray-700">Subtotal:</span>
                    <span className="text-sm sm:text-base font-medium text-gray-900">₹{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 sm:py-3 border-t-2 border-gray-300">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary-600">₹{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t text-center">
                <p className="text-sm sm:text-base text-gray-600 italic">Thank you for your business!</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white.rounded-xl, .bg-white.rounded-xl * {
            visibility: visible;
          }
          .bg-white.rounded-xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
            border-radius: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
