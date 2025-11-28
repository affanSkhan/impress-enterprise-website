import { supabase } from '@/lib/supabaseClient'

/**
 * Convert an order to an invoice
 * Copies order items to invoice items with admin-set prices
 * Updates order status to 'invoiced' and links to the new invoice
 */
export async function convertOrderToInvoice(orderId, userId) {
  try {
    // Fetch order with customer and items (including product prices)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(id, name, phone),
        order_items(*, product:products(price))
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError
    if (!order) throw new Error('Order not found')

    // Use admin_price if set, otherwise use product default price
    // Validate that all items have prices available
    const itemsWithPrices = order.order_items.map(item => ({
      ...item,
      finalPrice: item.admin_price || item.product?.price || 0
    }))
    
    const missingPrices = itemsWithPrices.filter(item => !item.finalPrice || item.finalPrice <= 0)
    if (missingPrices.length > 0) {
      throw new Error('All items must have prices set before generating invoice')
    }

    // Check if already invoiced
    if (order.status === 'invoiced' && order.invoice_id) {
      throw new Error('Order has already been invoiced')
    }

    // Calculate totals using final prices
    const subtotal = itemsWithPrices.reduce((sum, item) => {
      const itemTotal = item.finalPrice * item.quantity
      return sum + itemTotal
    }, 0)
    const total = subtotal

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
        tax_percent: 0,
        tax_amount: 0,
        total: parseFloat(total.toFixed(2)),
        created_by: userId
      }])
      .select()
      .single()

    if (invoiceError) throw invoiceError

    // Insert invoice items using final prices
    const itemsToInsert = itemsWithPrices.map(item => {
      const lineTotal = item.finalPrice * item.quantity
      return {
        invoice_id: invoiceData.id,
        product_id: item.product_id,
        item_name: item.product_name,
        quantity: item.quantity,
        unit_price: parseFloat(item.finalPrice.toFixed(2)),
        line_total: parseFloat(lineTotal.toFixed(2))
      }
    })

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
