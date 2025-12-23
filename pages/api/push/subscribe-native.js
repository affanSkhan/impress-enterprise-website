// API endpoint to save native FCM tokens
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fcmToken, userId, platform } = req.body

    if (!fcmToken || !userId) {
      return res.status(400).json({ error: 'FCM token and userId are required' })
    }

    console.log('[Native Subscribe] Saving FCM token for user:', userId);

    // Save or update the FCM token
    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: { fcmToken, platform }, // Store FCM token in subscription field
        endpoint: `fcm:${fcmToken}`, // Use fcm: prefix to identify native tokens
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('[Native Subscribe] Error:', error);
      return res.status(500).json({ error: error.message })
    }

    console.log('[Native Subscribe] Token saved successfully');
    res.status(200).json({ success: true })

  } catch (error) {
    console.error('[Native Subscribe] Error:', error);
    res.status(500).json({ error: error.message })
  }
}
