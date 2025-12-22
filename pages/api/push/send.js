import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase admin client with service role for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('VAPID keys not configured!')
}

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

    console.log('Push send API called:', { title, message, url, userId, userType });

    // Verify VAPID keys are set
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys missing!');
      return res.status(500).json({ error: 'Server configuration error: VAPID keys not set' });
    }

    // Get all subscriptions for the specified user type
    let query = supabaseAdmin
      .from('push_subscriptions')
      .select('*')

    if (userId) {
      console.log('Querying subscriptions for user:', userId);
      query = query.eq('user_id', userId)
    } else if (userType) {
      // Get all admin users
      console.log('Querying admin users...');
      const { data: admins } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'staff'])

      console.log('Found admin users:', admins?.length);
      const adminIds = admins?.map(a => a.user_id) || []
      
      if (adminIds.length === 0) {
        console.error('No admin users found');
        return res.status(404).json({ error: 'No admin users found' });
      }
      
      query = query.in('user_id', adminIds)
    }

    const { data: subscriptions, error } = await query

    if (error) {
      console.error('Database error fetching subscriptions:', error);
      throw error;
    }

    console.log('Found subscriptions:', subscriptions?.length);

    if (!subscriptions || subscriptions.length === 0) {
      console.error('No push subscriptions found in database');
      return res.status(404).json({ error: 'No push subscriptions found. Please enable notifications first.' })
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
Admin
      try {
        console.log('Sending push to endpoint:', sub.endpoint.substring(0, 50) + '...');
        await webpush.sendNotification(sub.subscription, payload)
        console.log('✓ Push sent successfully');
        return { success: true, endpoint: sub.endpoint }
      } catch (error) {
        console.error('✗ Error sending push notification:', error.message, 'Status:', error.statusCode);
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('Removing invalid subscription');
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        }
        
        return { success: false, endpoint: sub.endpoint, error: error.message, statusCode: error.statusCode }
      }
    })

    const results = await Promise.allSettled(pushPromises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length

    console.log(`Push notifications result: ${successCount}/${subscriptions.length} successful`);

    res.status(200).json({ 
      success: successCount > 0,
      message: `Push notifications sent to ${successCount}/${subscriptions.length} subscriptions`,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }),
      totalSubscriptions: subscriptions.length,
      successCount
    })

  } catch (error) {
    console.error('Error sending push notifications:', error)
    res.status(500).json({ error: error.message })
  }
}
