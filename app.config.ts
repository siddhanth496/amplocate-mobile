import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Amplocate',
  slug: 'amplocate',
  scheme: 'amplocate',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  backgroundColor: '#0c0e10',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0c0e10',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'app.amplocate.mobile',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Amplocate uses your location to show nearby chargers and route you to them.',
    },
  },
  android: {
    package: 'app.amplocate.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0c0e10',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Amplocate uses your location to show nearby chargers and route you to them.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
