import type { ExpoConfig } from 'expo/config';
const development = process.env.APP_ENV !== 'production';
const config: ExpoConfig = {
  name: 'Bastiat Library',
  slug: 'bastiat-library',
  version: '0.1.0',
  scheme: 'bastiat',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: 'com.gabrielpimenta.bastiatlibrary',
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      ...(development
        ? {
            NSAppTransportSecurity: { NSAllowsArbitraryLoads: true },
            NSLocalNetworkUsageDescription:
              'Connect to your local Bastiat Library development server.',
          }
        : {}),
    },
  },
  android: {
    package: 'com.gabrielpimenta.bastiatlibrary',
    adaptiveIcon: { foregroundImage: './assets/icon.png', backgroundColor: '#152329' },
    blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.CAMERA'],
  },
  plugins: [
    'expo-router',
    [
      'expo-audio',
      {
        enableBackgroundPlayback: true,
        enableBackgroundRecording: false,
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    ['expo-video', { supportsBackgroundPlayback: false, supportsPictureInPicture: false }],
    'expo-sqlite',
    'expo-secure-store',
    'expo-font',
    'expo-image',
    [
      'expo-splash-screen',
      { backgroundColor: '#0D171C', image: './assets/icon.png', imageWidth: 130 },
    ],
    ['expo-build-properties', { android: { usesCleartextTraffic: development } }],
  ],
  experiments: { typedRoutes: true },
  runtimeVersion: { policy: 'appVersion' },
  extra: { buildEnvironment: development ? 'development' : 'production' },
};
export default config;
