import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.calo.app',
  appName: 'Calo',
  webDir: 'dist',
  server: {
    url: 'https:caloai.netlify.app/',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;
