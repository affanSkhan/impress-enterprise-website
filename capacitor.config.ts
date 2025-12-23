import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.empire.admin',
  appName: 'Empire Admin',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'app.empire.local'
  },
  android: {
    path: 'android',
    initialFocus: '/admin'
  }
};

export default config;
