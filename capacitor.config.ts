import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.eb0f6e556f4d4b0fb3d7cc9b3d29fdf4',
  appName: 'Journal Inc',
  webDir: 'dist',
  // Remove server.url for production - app loads from local bundle
  // Uncomment the server block below only for development hot-reload:
  // server: {
  //   url: 'https://eb0f6e55-6f4d-4b0f-b3d7-cc9b3d29fdf4.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SpeechRecognition: {
      // Ensure plugin is properly configured
    }
  }
};

export default config;
