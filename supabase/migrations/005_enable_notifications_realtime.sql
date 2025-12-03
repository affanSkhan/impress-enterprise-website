-- Migration: Enable Realtime for Notifications
-- Description: Enables Supabase Realtime subscriptions for the notifications table
-- Created: 2025-12-03

-- Enable realtime for the notifications table
-- This allows the frontend to receive instant updates when new notifications are created
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Set replica identity to FULL so we get all column values in realtime updates
-- This is necessary for the UPDATE events to work properly
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add RLS policy for notifications (if not already exists)
-- Public access is fine since notifications don't contain sensitive data
-- and are meant to be displayed to admin users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'Public can view notifications'
    ) THEN
        CREATE POLICY "Public can view notifications" ON notifications
          FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'Admins can manage notifications'
    ) THEN
        CREATE POLICY "Admins can manage notifications" ON notifications
          FOR ALL USING (
            auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'staff'))
          );
    END IF;
END $$;

-- Enable RLS on notifications table if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE notifications IS 'Stores in-app notifications for admin users with realtime enabled';
