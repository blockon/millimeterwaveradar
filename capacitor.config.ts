import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mmradar.controller',
  appName: '毫米波雷达控制端',
  webDir: 'www/controllPage/html',
  server: {
    androidScheme: 'https',
  },
};

export default config;
