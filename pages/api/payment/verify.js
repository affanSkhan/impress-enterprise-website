import crypto from 'crypto'
import { supabase } from '@/lib/supabaseAdmin'

/**
 * API: Verify Razorpay Payment
 * POST /api/payment/verify
 * Verifies Razorpay payment signature and updates order status
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' })
    }

    // Verify signature
    const text = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex')

    const isValid = expectedSignature === razorpay_signature

    if (!isValid) {
      // Invalid signature - update transaction as failed
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_code: 'SIGNATURE_MISMATCH',
          error_description: 'Payment signature verification failed',
        })
        .eq('razorpay_order_id', razorpay_order_id)

      return res.status(400).json({ 
        success: false,
        error: 'Payment verification failed' 
      })
    }

    // Valid payment - update order and transaction
    const now = new Date().toISOString()

    // Update order status
    const { data: order } = await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        status: 'confirmed',
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select('*')
      .single()

    // Update payment transaction
    await supabase
      .from('payment_transactions')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'success',
        paid_at: now,
        gateway_response: {
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          signature: razorpay_signature,
        },
      })
      .eq('razorpay_order_id', razorpay_order_id)

    // Send payment success notification to admins
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Payment Received',
          message: `Payment completed for order #${order?.order_number || 'N/A'}`,
          url: `/admin/orders/${order?.id}`,
          userType: 'admin'
        })
      })
    } catch (pushError) {
      console.error('Push notification error:', pushError)
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order?.id,
      orderNumber: order?.order_number,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Payment verification failed',
      message: error.message 
    })
  }
}
