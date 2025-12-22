import webpush from 'web-push'
import { supabase } from '@/lib/supabaseClient'

// Configure web-push with VAPID keys
// Generate keys with: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib27SsgRa4t0xZW3C0U5WtWDQV2GxBmwR5RVzlKxXy6PctMHvBMPHZQP7xg'
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'UUxEqXfb-6PEiAqb9XFZXQnT8ULp_PvLXhPwEzEW8eQ'

webpush.setVapidDetails(
  'mailto:admin@empirecarac.in',
  vapidPublicKey,
  vapidPrivateKey
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { title, message, url, userId, userType = 'admin' } = req.body

    // Get all subscriptions for the specified user type
    let query = supabase
      .from('push_subscriptions')
      .select('*')

    if (userId) {
      query = query.eq('user_id', userId)
    } else if (userType) {
      // Get all admin users
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'staff'])

      const adminIds = admins?.map(a => a.user_id) || []
      query = query.in('user_id', adminIds)
    }

    const { data: subscriptions, error } = await query

    if (error) throw error

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No push subscriptions found' })
    }

    // Send push notification to all subscriptions
    const pushPromises = subscriptions.map(async (sub) => {
      const payload = JSON.stringify({
        title: title || 'Empire Car A/C',
        body: message || 'You have a new notification',
        message: message,
        url: url || '/admin',
        link: url || '/admin',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'notification-' + Date.now(),
        timestamp: Date.now()
      })

      try {
        await webpush.sendNotification(sub.subscription, payload)
        return { success: true, endpoint: sub.endpoint }
      } catch (error) {
        console.error('Error sending push notification:', error)
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        }
        
        return { success: false, endpoint: sub.endpoint, error: error.message }
      }
    })

    const results = await Promise.allSettled(pushPromises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length

    res.status(200).json({ 
      success: true,
      message: `Push notifications sent to ${successCount}/${subscriptions.length} subscriptions`,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
    })

  } catch (error) {
    console.error('Error sending push notifications:', error)
    res.status(500).json({ error: error.message })
  }
}
