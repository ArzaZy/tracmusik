import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TracMusic',
  slug: 'tracmusic',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icons/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/icons/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0D0D1A',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.traclabs.tracmusic',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icons/adaptive-icon.png',
      backgroundColor: '#0D0D1A',
    },
    package: 'com.traclabs.tracmusic',
    versionCode: 1,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      'android.permission.WAKE_LOCK',
    ],
    softwareKeyboardLayoutMode: 'pan',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-av',
      {
        microphonePermission: false,
      },
    ],
    [
      'react-native-track-player',
      {
        enableMusicControls: true,
        enableCastButton: false,
      },
    ],
  ],
  scheme: 'tracmusic',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    jamendoClientId: process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
