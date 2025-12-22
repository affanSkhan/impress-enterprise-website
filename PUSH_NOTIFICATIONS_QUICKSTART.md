# 🚀 Quick Start: Enable Mobile Push Notifications

## Complete These Steps to Get Push Notifications Working

### Step 1: Install Required Package (1 minute)
Open terminal in your project folder and run:
```bash
npm install web-push
```

### Step 2: Generate VAPID Keys (1 minute)
In the same terminal, run:
```bash
npx web-push generate-vapid-keys
```

**Copy the output** - you'll need it in the next step!

Example output:
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib27SsgRa4t0xZW3C0U5WtWDQV2GxBmwR5RVzlKxXy6PctMHvBMPHZQP7xg

Private Key:
UUxEqXfb-6PEiAqb9XFZXQnT8ULp_PvLXhPwEzEW8eQ
=======================================
```

### Step 3: Add Keys to Environment File (2 minutes)
1. Create or open `.env.local` file in your project root folder
2. Add these lines (replace with YOUR keys from Step 2):

```env
# Push Notification Keys
VAPID_PUBLIC_KEY=paste_your_public_key_here
VAPID_PRIVATE_KEY=paste_your_private_key_here
NEXT_PUBLIC_VAPID_PUBLIC_KEY=paste_your_public_key_here
```

⚠️ **IMPORTANT:** Use YOUR generated keys, not the example above!

### Step 4: Run Database Migration (2 minutes)
1. Go to https://supabase.com and login
2. Open your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Open this file: `supabase/migrations/011_create_push_subscriptions.sql`
6. Copy ALL the contents
7. Paste into Supabase SQL Editor
8. Click **Run** button

### Step 5: Restart Your Server (1 minute)
Stop your development server (Ctrl+C) and restart:
```bash
npm run dev
```

### Step 6: Test It! (2 minutes)
1. Open your admin dashboard in browser
2. Login as admin
3. When prompted, click **Allow** for notifications
4. Open browser console (F12)
5. Run this command:
   ```javascript
   fetch('/api/push/test', { method: 'POST' })
   ```
6. You should see a notification with sound! 🔔

## ✅ That's It!

Your push notifications are now live! Admin users will automatically:
- Subscribe to push notifications when they login
- Receive notifications with sound when customers place orders
- Get alerts even when browser is closed (on mobile)
- Hear ringtone/notification sound on their phone

## 📱 Mobile Setup (Optional)
For best mobile experience:
1. Open admin dashboard on mobile browser
2. Add to home screen (makes it a PWA app)
3. Allow notifications when prompted
4. Close browser
5. You'll still receive notifications with sound!

## 🎯 What Triggers Notifications?

Push notifications are sent automatically for:
- ✅ New customer orders
- ✅ Order status changes
- ✅ Low stock alerts
- ✅ New invoices created

## 🆘 Troubleshooting

**No notification sound?**
- Check phone is not in silent mode
- Verify notification permissions in browser settings

**"Permission denied" error?**
- Clear browser cache and try again
- Check notification settings in browser

**Still not working?**
- See full guide: `MOBILE_PUSH_NOTIFICATIONS_SETUP.md`
- Check browser console for errors

## 📚 Documentation

- Full setup guide: `MOBILE_PUSH_NOTIFICATIONS_SETUP.md`
- Real-time notifications: `REALTIME_NOTIFICATIONS_SETUP.md`

---

**Total Time: ~10 minutes** ⏱️

Need help? Check the troubleshooting section in `MOBILE_PUSH_NOTIFICATIONS_SETUP.md`
