import crypto from 'crypto'
import { supabase } from '@/lib/supabaseAdmin'

/**
 * API: Razorpay Webhook
 * POST /api/payment/webhook
 * Handles Razorpay webhook events for payment updates
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    const webhookSignature = req.headers['x-razorpay-signature']

    if (webhookSecret && webhookSignature) {
      const body = JSON.stringify(req.body)
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')

      if (expectedSignature !== webhookSignature) {
        console.error('Webhook signature mismatch')
        return res.status(400).json({ error: 'Invalid signature' })
      }
    }

    const event = req.body.event
    const payload = req.body.payload?.payment?.entity || req.body.payload?.order?.entity

    console.log('Razorpay webhook event:', event)

    switch (event) {
      case 'payment.captured':
        // Payment successful
        await handlePaymentSuccess(payload)
        break

      case 'payment.failed':
        // Payment failed
        await handlePaymentFailed(payload)
        break

      case 'order.paid':
        // Order fully paid
        await handleOrderPaid(payload)
        break

      default:
        console.log('Unhandled webhook event:', event)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

async function handlePaymentSuccess(payment) {
  try {
    const razorpayOrderId = payment.order_id
    const paymentId = payment.id

    // Update payment transaction
    await supabase
      .from('payment_transactions')
      .update({
        razorpay_payment_id: paymentId,
        status: 'success',
        paid_at: new Date().toISOString(),
        payment_method: payment.method,
        gateway_response: payment,
      })
      .eq('razorpay_order_id', razorpayOrderId)

    // Update order status
    await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        status: 'confirmed',
      })
      .eq('razorpay_order_id', razorpayOrderId)

    console.log('Payment success processed:', paymentId)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(payment) {
  try {
    const razorpayOrderId = payment.order_id
    const paymentId = payment.id

    // Update payment transaction
    await supabase
      .from('payment_transactions')
      .update({
        razorpay_payment_id: paymentId,
        status: 'failed',
        error_code: payment.error_code,
        error_description: payment.error_description,
        gateway_response: payment,
      })
      .eq('razorpay_order_id', razorpayOrderId)

    console.log('Payment failed processed:', paymentId)
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handleOrderPaid(order) {
  try {
    const razorpayOrderId = order.id

    // Update order status
    await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        status: 'confirmed',
      })
      .eq('razorpay_order_id', razorpayOrderId)

    console.log('Order paid processed:', razorpayOrderId)
  } catch (error) {
    console.error('Error handling order paid:', error)
  }
}

// Disable body parser to get raw body for signature verification
export const config = {
  api: {
    bodyParser: true,
  },
}
