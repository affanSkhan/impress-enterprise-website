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
} else {
  console.log('VAPID keys configured successfully')
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

  const startTime = Date.now();
  console.log('=== Push Send API Called ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const { title, message, url, userId, userType = 'admin', tag } = req.body

    console.log('Request body:', JSON.stringify({ title, message, url, userId, userType, tag }));

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

    // Log all subscription endpoints
    subscriptions.forEach((sub, i) => {
      console.log(`Subscription ${i + 1}: ${sub.endpoint?.substring(0, 60)}...`);
    });

    // Send push notification to all subscriptions
    const pushPromises = subscriptions.map(async (sub, index) => {
      // Unique tag for each notification to prevent deduplication issues
      const uniqueTag = `empire-${Date.now()}-${index}`;
      
      const payload = JSON.stringify({
        title: title || 'Empire Car A/C',
        body: message || 'You have a new notification',
        message: message,
        url: url || '/admin',
        link: url || '/admin',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: uniqueTag,
        timestamp: Date.now()
      })

      // CRITICAL: Options for background delivery - Standard Web Push headers
      const pushOptions = {
        TTL: 2419200, // 28 days - maximum allowed persistence
        urgency: 'high', // HIGH urgency wakes device from doze mode
        topic: 'empire-order-' + Date.now(), // Unique topic to prevent deduplication
      }

      try {
        console.log(`[${index + 1}] Sending push to: ${sub.endpoint?.substring(0, 60)}...`);
        console.log(`[${index + 1}] TTL: ${pushOptions.TTL}, Urgency: ${pushOptions.urgency}`);
        
        const result = await webpush.sendNotification(sub.subscription, payload, pushOptions)
        console.log(`[${index + 1}] ✓ Push sent! Status: ${result.statusCode}`);
        return { success: true, endpoint: sub.endpoint, statusCode: result.statusCode }
      } catch (error) {
        console.error(`[${index + 1}] ✗ Push failed:`, {
          message: error.message,
          statusCode: error.statusCode,
          endpoint: sub.endpoint.substring(0, 50),
          body: error.body
        });
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('Removing invalid subscription (410/404)');
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        }
        
        return { 
          success: false, 
          endpoint: sub.endpoint, 
          error: error.message || String(error), 
          statusCode: error.statusCode,
          body: error.body ? (typeof error.body === 'string' ? error.body : JSON.stringify(error.body)) : undefined
        }
      }
    })

    const results = await Promise.allSettled(pushPromises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length

    console.log(`Push notifications result: ${successCount}/${subscriptions.length} successful`);

    // Serialize results properly for JSON response
    const serializedResults = results.map(r => {
      if (r.status === 'fulfilled') {
        if (!r.value.success) {
          console.log('Failed push result:', JSON.stringify(r.value, null, 2))
        }
        return r.value
      } else {
        // Handle rejected promises
        const reason = r.reason
        console.log('Rejected push promise:', {
          message: reason?.message,
          statusCode: reason?.statusCode,
          stack: reason?.stack
        })
        return {
          success: false,
          error: reason?.message || String(reason),
          statusCode: reason?.statusCode,
          body: reason?.body ? String(reason.body) : undefined
        }
      }
    })

    res.status(200).json({ 
      success: successCount > 0,
      message: `Push notifications sent to ${successCount}/${subscriptions.length} subscriptions`,
      results: serializedResults,
      totalSubscriptions: subscriptions.length,
      successCount
    })

  } catch (error) {
    console.error('Error sending push notifications:', error)
    res.status(500).json({ error: error.message })
  }
}
