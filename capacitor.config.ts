import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.13d75504e73f40669f13b3dbc2b67027',
  appName: 'Calo',
  webDir: 'dist',
  server: {
    url: 'https://13d75504-e73f-4066-9f13-b3dbc2b67027.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;
