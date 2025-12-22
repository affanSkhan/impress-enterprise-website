import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    // Remove subscription from database
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (error) throw error

    res.status(200).json({ 
      success: true, 
      message: 'Push subscription removed successfully' 
    })

  } catch (error) {
    console.error('Error in unsubscribe endpoint:', error)
    res.status(500).json({ error: error.message })
  }
}
