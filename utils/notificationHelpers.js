// Helper function to send both in-app and push notifications
import { supabase } from '@/lib/supabaseClient'

/**
 * Send notification to admin users (both in-app and push)
 * @param {Object} notification - Notification details
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {string} notification.type - Notification type (info, success, warning, error)
 * @param {string} notification.category - Notification category
 * @param {string} notification.link - Optional link to resource
 * @param {Object} notification.metadata - Optional additional data
 * @param {boolean} sendPush - Whether to also send push notification (default: true)
 */
export async function sendAdminNotification({
  title,
  message,
  type = 'info',
  category = 'general',
  link = null,
  metadata = null,
  sendPush = true
}) {
  try {
    // Create in-app notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        category,
        link,
        metadata,
        recipient_type: 'admin',
        recipient_id: null,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating in-app notification:', error)
      throw error
    }

    // Send push notification if enabled
    if (sendPush) {
      try {
        await fetch('/api/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            message,
            url: link || '/admin',
            userType: 'admin',
            tag: `notification-${data.id}`,
            id: data.id
          })
        })
      } catch (pushError) {
        // Don't fail if push notification fails
        console.warn('Failed to send push notification:', pushError)
      }
    }

    return data
  } catch (error) {
    console.error('Error sending admin notification:', error)
    throw error
  }
}

/**
 * Send notification to a specific customer (both in-app and push)
 */
export async function sendCustomerNotification({
  customerId,
  title,
  message,
  type = 'info',
  category = 'general',
  link = null,
  metadata = null,
  sendPush = true
}) {
  try {
    // Create in-app notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        category,
        link,
        metadata,
        recipient_type: 'customer',
        recipient_id: customerId,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer notification:', error)
      throw error
    }

    // Send push notification if enabled (implement customer push later)
    if (sendPush) {
      try {
        await fetch('/api/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            message,
            url: link || '/customer/dashboard',
            userId: customerId,
            tag: `notification-${data.id}`,
            id: data.id
          })
        })
      } catch (pushError) {
        console.warn('Failed to send customer push notification:', pushError)
      }
    }

    return data
  } catch (error) {
    console.error('Error sending customer notification:', error)
    throw error
  }
}

/**
 * Example usage in your code:
 * 
 * // When a new order is created
 * await sendAdminNotification({
 *   title: 'New Order Received',
 *   message: `Order #${orderNumber} from ${customerName}`,
 *   type: 'info',
 *   category: 'order',
 *   link: `/admin/orders/${orderId}`,
 *   metadata: { order_id: orderId, customer_name: customerName }
 * })
 * 
 * // When order status changes
 * await sendCustomerNotification({
 *   customerId: order.customer_id,
 *   title: 'Order Status Updated',
 *   message: `Your order #${orderNumber} is now ${newStatus}`,
 *   type: 'success',
 *   category: 'order',
 *   link: `/customer/orders/${orderId}`
 * })
 */
