package com.empire.admin;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Create notification channel for Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            
            NotificationChannel channel = new NotificationChannel(
                "empire_orders",
                "Order Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for new orders and updates");
            channel.enableVibration(true);
            channel.enableLights(true);
            
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
}
