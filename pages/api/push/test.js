export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Send test notification
    const response = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '🔔 Test Notification',
        message: 'This is a test push notification. If you see this, push notifications are working!',
        url: '/admin',
        userType: 'admin'
      })
    })

    const data = await response.json()

    res.status(200).json({ 
      success: true,
      message: 'Test notification sent',
      data
    })

  } catch (error) {
    console.error('Error sending test notification:', error)
    res.status(500).json({ error: error.message })
  }
}
