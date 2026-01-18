// Enhanced Order Helper Functions
// Handles payment tracking, cancellation, and WhatsApp integration

import { supabase } from '@/lib/supabaseClient'

/**
 * Record payment for an order
 */
export async function recordPayment(orderId, paymentData, userId) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_method: paymentData.method,
        payment_reference: paymentData.reference,
        payment_amount: paymentData.amount,
        payment_received_at: new Date().toISOString(),
        payment_verified_by: userId,
        status: 'payment_received',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error recording payment:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Mark quotation as sent
 */
export async function markQuotationSent(orderId, method, userId) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        quotation_sent_at: new Date().toISOString(),
        quotation_sent_via: method || 'whatsapp',
        quotation_sent_by: userId,
        status: 'quotation_sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error marking quotation sent:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Mark quote as approved by customer
 */
export async function markQuoteApproved(orderId, userId) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        quote_approved_at: new Date().toISOString(),
        quote_approved_by: userId,
        status: 'quote_approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error marking quote approved:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId, cancelledBy, cancelledByType, reason) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        is_cancelled: true,
        cancelled_at: new Date().toISOString(),
        cancelled_by_id: cancelledBy,
        cancelled_by_type: cancelledByType,
        cancellation_reason: reason,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error cancelling order:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if order can be cancelled by customer
 */
export function canCustomerCancelOrder(order) {
  if (!order) return false
  
  return (
    !order.is_cancelled &&
    ['pending', 'reviewed', 'quotation_sent', 'quote_approved', 'payment_pending'].includes(order.status)
  )
}

/**
 * Check if order can be cancelled by admin
 */
export function canAdminCancelOrder(order) {
  if (!order) return false
  return !order.is_cancelled
}

/**
 * Generate WhatsApp Click-to-Chat link
 */
export function generateWhatsAppLink(phone, orderId, orderNumber, customerName, orderTotal, invoiceId) {
  // Remove any non-numeric characters from phone
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Add country code if not present (assuming India +91)
  const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
  
  // Determine the link to send
  let quotationLink = ''
  let linkText = ''
  
  if (invoiceId) {
    // If invoice exists, link to invoice (singular path)
    quotationLink = `${window.location.origin}/invoice/${invoiceId}`
    linkText = 'View your quotation/invoice here:'
  } else {
    // If no invoice yet, link to order page
    quotationLink = `${window.location.origin}/customer/orders/${orderId}`
    linkText = 'View your order details here:'
  }
  
  // Create quotation message
  const message = `Hi ${customerName},

Thank you for your order!

*Order Details:*
Order Number: ${orderNumber}
Total Amount: ₹${orderTotal?.toLocaleString() || 'TBD'}

${linkText}
${quotationLink}

Please review and confirm if you'd like to proceed with this order.

For any questions, feel free to contact us.

- Impress Enterprise`

  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Get status badge color
 */
export function getStatusColor(status) {
  const colors = {
    pending: 'yellow',
    quotation_sent: 'blue',
    payment_received: 'green',
    completed: 'emerald',
    cancelled: 'red',
    // Old statuses (for backwards compatibility)
    quote_approved: 'cyan',
    payment_pending: 'orange',
    processing: 'purple',
    ready_for_pickup: 'emerald',
    invoiced: 'purple',
    reviewed: 'blue',
    approved: 'green',
  }
  
  return colors[status] || 'gray'
}

/**
 * Get status display name
 */
export function getStatusDisplayName(status) {
  const names = {
    pending: 'Pending Review',
    quotation_sent: 'Quotation Sent',
    payment_received: 'Payment Received',
    completed: 'Completed',
    cancelled: 'Cancelled',
    // Old statuses (for backwards compatibility)
    quote_approved: 'Quote Approved',
    payment_pending: 'Payment Pending',
    processing: 'Processing',
    ready_for_pickup: 'Ready for Pickup',
    invoiced: 'Invoiced',
    reviewed: 'Reviewed',
    approved: 'Approved',
  }
  
  return names[status] || status
}

/**
 * Get next possible statuses (Simplified flow)
 */
export function getNextStatuses(currentStatus) {
  const statusFlow = {
    pending: ['quotation_sent', 'cancelled'],
    quotation_sent: ['payment_received', 'cancelled'],
    payment_received: ['completed'],
    completed: [],
    cancelled: [],
    // Old statuses compatibility (for existing orders)
    quote_approved: ['payment_received', 'cancelled'],
    payment_pending: ['payment_received', 'cancelled'],
    processing: ['completed'],
    ready_for_pickup: ['completed'],
    invoiced: ['completed'],
    reviewed: ['quotation_sent', 'cancelled'],
    approved: ['payment_received', 'cancelled'],
  }
  
  return statusFlow[currentStatus] || []
}
