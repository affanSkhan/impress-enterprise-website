import { supabase } from '@/lib/supabaseClient'

/**
 * Convert an order to an invoice
 * Copies order items to invoice items with admin-set prices
 * Updates order status to 'invoiced' and links to the new invoice
 */
export async function convertOrderToInvoice(orderId, userId) {
  try {
    // Fetch order with customer and items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(id, name, phone),
        order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError
    if (!order) throw new Error('Order not found')

    // Validate that all items have prices set
    const missingPrices = order.order_items.filter(item => !item.admin_price || item.admin_price <= 0)
    if (missingPrices.length > 0) {
      throw new Error('All items must have prices set before generating invoice')
    }

    // Check if already invoiced
    if (order.status === 'invoiced' && order.invoice_id) {
      throw new Error('Order has already been invoiced')
    }

    // Calculate totals
    const subtotal = order.order_items.reduce((sum, item) => sum + (item.admin_total || 0), 0)
    const taxPercent = 0 // Set default tax, can be modified
    const taxAmount = (subtotal * taxPercent) / 100
    const total = subtotal + taxAmount

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber()

    // Insert invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        invoice_number: invoiceNumber,
        customer_name: order.customer.name,
        customer_phone: order.customer.phone || null,
        date: new Date().toISOString().split('T')[0],
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax_percent: parseFloat(taxPercent),
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        created_by: userId,
        notes: order.notes ? `Generated from Order: ${order.order_number}\n\n${order.notes}` : `Generated from Order: ${order.order_number}`
      }])
      .select()
      .single()

    if (invoiceError) throw invoiceError

    // Insert invoice items
    const itemsToInsert = order.order_items.map(item => ({
      invoice_id: invoiceData.id,
      product_id: item.product_id,
      item_name: item.product_name,
      quantity: item.quantity,
      unit_price: parseFloat(item.admin_price.toFixed(2)),
      line_total: parseFloat(item.admin_total.toFixed(2))
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)

    if (itemsError) throw itemsError

    // Update order status and link to invoice
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'invoiced',
        invoice_id: invoiceData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) throw updateError

    return {
      success: true,
      invoice: invoiceData,
      invoiceNumber: invoiceNumber
    }

  } catch (error) {
    console.error('Error converting order to invoice:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXX
 */
async function generateInvoiceNumber() {
  try {
    // Get existing invoices from today
    const today = new Date().toISOString().split('T')[0]
    const datePrefix = today.replace(/-/g, '')
    
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `INV-${datePrefix}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    if (error) throw error

    // Extract counter from last invoice number
    let counter = 1
    if (invoices && invoices.length > 0) {
      const lastNumber = invoices[0].invoice_number
      const lastCounter = parseInt(lastNumber.split('-')[2])
      counter = lastCounter + 1
    }

    // Format: INV-YYYYMMDD-0001
    return `INV-${datePrefix}-${counter.toString().padStart(4, '0')}`
  } catch (error) {
    console.error('Error generating invoice number:', error)
    // Fallback to timestamp if error
    return `INV-${Date.now()}`
  }
}
