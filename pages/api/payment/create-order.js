import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * API: Create Razorpay Order
 * POST /api/payment/create-order
 * Creates a Razorpay order for checkout
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId, amount } = req.body

    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Order ID and amount are required' })
    }

    // Verify order exists and belongs to the user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Payment gateway not configured' })
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        order_id: orderId,
        order_number: order.order_number,
        customer_name: order.customer_name,
      },
    })

    // Update order with Razorpay order ID
    await supabase
      .from('orders')
      .update({
        razorpay_order_id: razorpayOrder.id,
        payment_amount: amount,
      })
      .eq('id', orderId)

    // Create payment transaction record
    await supabase
      .from('payment_transactions')
      .insert({
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        amount: amount,
        currency: 'INR',
        status: 'pending',
        payment_gateway: 'razorpay',
      })

    return res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Razorpay order creation error:', error)
    return res.status(500).json({ 
      error: 'Failed to create payment order',
      message: error.message 
    })
  }
}
