import { createClient } from '@supabase/supabase-js'

// Create a Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      VAPID_PUBLIC_KEY: !!process.env.VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      
      // Show first/last characters for verification
      VAPID_PUBLIC_KEY_preview: process.env.VAPID_PUBLIC_KEY 
        ? `${process.env.VAPID_PUBLIC_KEY.substring(0, 10)}...${process.env.VAPID_PUBLIC_KEY.substring(process.env.VAPID_PUBLIC_KEY.length - 10)}`
        : 'NOT SET',
      
      NEXT_PUBLIC_VAPID_PUBLIC_KEY_preview: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY 
        ? `${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.substring(0, 10)}...${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.substring(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length - 10)}`
        : 'NOT SET',
        
      keysMatch: process.env.VAPID_PUBLIC_KEY === process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    }

    // Check database access
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .limit(5)

    const { data: admins, error: adminError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'staff'])

    res.status(200).json({
      environment: envCheck,
      database: {
        subscriptions: {
          count: subscriptions?.length || 0,
          error: subError?.message,
          sample: subscriptions?.[0] ? {
            user_id: subscriptions[0].user_id,
            endpoint_preview: subscriptions[0].endpoint?.substring(0, 50) + '...'
          } : null
        },
        admins: {
          count: admins?.length || 0,
          error: adminError?.message
        }
      }
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    res.status(500).json({ error: error.message, stack: error.stack })
  }
}
