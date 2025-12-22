import { supabase } from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { subscription, userId } = req.body

    console.log('Subscribe API called for user:', userId);

    if (!subscription || !userId) {
      console.error('Missing subscription or userId');
      return res.status(400).json({ error: 'Subscription and userId are required' })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not set');
      return res.status(500).json({ error: 'Server configuration error: Service role key not set' })
    }

    // Use admin client to bypass RLS
    console.log('Saving subscription to database...');
    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription,
        endpoint: subscription.endpoint,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error saving push subscription:', error)
      return res.status(500).json({ 
        error: error.message,
        details: error.details,
        hint: error.hint
      })
    }

    console.log('Push subscription saved successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Push subscription saved successfully' 
    })

  } catch (error) {
    console.error('Error in subscribe endpoint:', error)
    res.status(500).json({ error: error.message })
  }
}
