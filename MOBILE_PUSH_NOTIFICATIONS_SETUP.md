# 🔔 Mobile Push Notifications Setup Guide

## Overview
This guide will help you set up mobile push notifications so admin users receive notifications with sound/ringtone on their mobile devices when customers place orders or other events occur.

## ✅ What Was Implemented

### 1. Enhanced Service Worker (`public/sw.js`)
- Added push notification handler with sound and vibration
- Supports notification actions (View/Dismiss)
- Auto-focuses existing admin window or opens new one

### 2. Push Notification Utility (`utils/pushNotifications.js`)
- Auto-subscribes admin users to push notifications
- Handles permission requests
- Manages subscription lifecycle

### 3. API Endpoints (`pages/api/push/`)
- **subscribe.js** - Save push subscription to database
- **unsubscribe.js** - Remove push subscription
- **send.js** - Send push notifications to admin users
- **test.js** - Send test notification

### 4. Database Table
- Created `push_subscriptions` table to store subscriptions
- RLS policies for security
- Auto-cleanup of old subscriptions

### 5. Auto-Integration
- AdminLayout automatically subscribes users to push notifications
- No manual setup required for admin users

## 🚀 Setup Instructions

### Step 1: Install Dependencies
```bash
npm install web-push
```

### Step 2: Generate VAPID Keys
VAPID keys are required for push notifications. Generate them once:

```bash
npx web-push generate-vapid-keys
```

This will output something like:
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib27SsgRa4t0xZW3C0U5WtWDQV2GxBmwR5RVzlKxXy6PctMHvBMPHZQP7xg

Private Key:
UUxEqXfb-6PEiAqb9XFZXQnT8ULp_PvLXhPwEzEW8eQ
=======================================
```

### Step 3: Add VAPID Keys to Environment Variables
Create or update `.env.local` file in your project root:

```env
# Push Notification VAPID Keys
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
```

**Important:** Replace the placeholder keys with your generated keys!

### Step 4: Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/011_create_push_subscriptions.sql`
3. Click Run

### Step 5: Restart Development Server
```bash
npm run dev
```

### Step 6: Test Push Notifications
1. Login as admin
2. Allow notifications when prompted
3. Open browser console and run:
```javascript
fetch('/api/push/test', { method: 'POST' })
```
4. You should receive a test notification with sound!

## 📱 How It Works

### For Admin Users:
1. **Auto-Subscribe**: When admin logs in, they're automatically subscribed to push notifications
2. **Permission Request**: Browser asks for notification permission (allow it)
3. **Background Notifications**: Even with browser closed, notifications appear with sound
4. **Click to Open**: Clicking notification opens the admin panel

### Notification Triggers:
Push notifications are sent automatically for:
- ✅ New customer orders
- ✅ Order status changes
- ✅ Low stock alerts
- ✅ New invoices created
- ✅ Any other admin notifications

### Features:
- 🔊 **Sound**: System notification sound plays
- 📳 **Vibration**: Mobile devices vibrate (pattern: buzz-pause-buzz-pause-buzz)
- 🔔 **Badge**: Shows notification count on app icon
- 👆 **Interactive**: Click to view details, or dismiss
- 📲 **Mobile & Desktop**: Works on both platforms

## 🔧 Integration with Existing System

### Automatic Push Sending
To send push notifications when creating regular notifications, add this to your notification creation:

```javascript
// After creating in-app notification
await fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: notificationTitle,
    message: notificationMessage,
    url: notificationLink,
    userType: 'admin' // or specific userId
  })
})
```

### Manual Push Sending
You can also send push notifications programmatically:

```javascript
await fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Order',
    message: 'Order #12345 received from John Doe',
    url: '/admin/orders/order-id',
    userType: 'admin'
  })
})
```

## 🧪 Testing

### Test 1: Browser Test
1. Open admin dashboard in Chrome/Firefox/Edge
2. Open DevTools → Console
3. Run: `fetch('/api/push/test', { method: 'POST' })`
4. Should see notification with sound

### Test 2: Mobile Test
1. Open admin dashboard on mobile browser
2. Add to home screen (PWA)
3. Allow notifications
4. Close browser
5. Have another user place an order
6. Should receive notification with ringtone

### Test 3: Background Test
1. Login as admin
2. Allow notifications
3. Close browser tab
4. Trigger a notification (place order as customer)
5. Should still receive notification

## 🎨 Notification Appearance

### Desktop:
```
╔═══════════════════════════════════╗
║  🏪 Empire Car A/C                ║
╠═══════════════════════════════════╣
║  New Order Received               ║
║  Order #ORD-20241222-0001 has     ║
║  been placed by John Doe          ║
║                                   ║
║  [View]  [Dismiss]                ║
╚═══════════════════════════════════╝
```

### Mobile:
- Shows in notification shade
- Plays notification sound
- Vibrates device
- Shows app icon
- Swipe actions available

## 🔐 Security

- ✅ RLS (Row Level Security) enabled on push_subscriptions
- ✅ Users can only manage their own subscriptions
- ✅ VAPID keys keep subscriptions secure
- ✅ Invalid subscriptions auto-deleted
- ✅ 90-day auto-cleanup of inactive subscriptions

## 🌐 Browser Support

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome  | ✅      | ✅     | Full support |
| Firefox | ✅      | ✅     | Full support |
| Edge    | ✅      | ✅     | Full support |
| Safari  | ⚠️      | ⚠️     | Limited (iOS 16.4+) |
| Opera   | ✅      | ✅     | Full support |

**Note:** iOS Safari requires iOS 16.4+ and website added to home screen

## 📊 Monitoring

Check push subscription status:
```sql
-- In Supabase SQL Editor
SELECT 
  u.email,
  ps.endpoint,
  ps.created_at,
  ps.updated_at
FROM push_subscriptions ps
JOIN auth.users u ON u.id = ps.user_id
ORDER BY ps.updated_at DESC;
```

## 🛠️ Troubleshooting

### Issue: No notification sound on mobile
**Solution:** Ensure phone is not in silent mode and notification permissions are granted in phone settings

### Issue: "Notification permission denied"
**Solution:** Clear browser data and revisit site, or check browser notification settings

### Issue: Notifications not appearing
**Solution:** 
1. Check browser console for errors
2. Verify VAPID keys are correct
3. Check push_subscriptions table has entries
4. Test with `/api/push/test`

### Issue: Works on desktop but not mobile
**Solution:**
1. Ensure HTTPS is enabled (required for push)
2. Add website to home screen on iOS
3. Grant notification permission in phone settings

## ⚙️ Configuration Options

### Change Vibration Pattern
Edit `public/sw.js`:
```javascript
vibrate: [300, 100, 200, 100, 300], // [on, off, on, off, on] in ms
```

### Change Notification Sound
Sound is controlled by OS, but you can set priority:
```javascript
// In send.js payload
priority: 'high', // Makes notification more prominent
```

### Customize Notification Actions
Edit `public/sw.js`:
```javascript
actions: [
  { action: 'open', title: 'View Now' },
  { action: 'snooze', title: 'Remind Later' },
  { action: 'close', title: 'Dismiss' }
]
```

## 📝 Next Steps

1. ✅ Install web-push: `npm install web-push`
2. ✅ Generate VAPID keys: `npx web-push generate-vapid-keys`
3. ✅ Add keys to `.env.local`
4. ✅ Run database migration in Supabase
5. ✅ Restart dev server: `npm run dev`
6. ✅ Test notifications: Login as admin and test

## 🎉 You're All Set!

Once setup is complete:
- Admin users auto-subscribe on login
- Push notifications sent automatically for all events
- Works in background even when browser closed
- Sound and vibration on mobile devices
- Click to open relevant admin page

For support or issues, check the troubleshooting section above!
