import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.morsevibe.app',
  appName: 'Morse Vibe',
  webDir: 'dist',
  server: {
    cleartext: true,
    allowNavigation: ['api.adsb.lol', '*.adsb.lol'],
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0F1011',
    },
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0F1011',
  },
  android: {
    backgroundColor: '#0F1011',
  },
};
export default config;
