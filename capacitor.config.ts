import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.morsevibe.app',
  appName: 'Morse Vibe',
  webDir: 'dist',
  // Point to your deployed Railway/Render server URL in production.
  // During local dev, Capacitor will use the bundled dist/ files.
  server: {
    // Uncomment and set this to your live server URL after deploying:
    // url: 'https://your-morse-vibe.railway.app',
    // cleartext: false,
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
