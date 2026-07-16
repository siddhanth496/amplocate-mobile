# Amplocate — Mobile

React Native (Expo) app for Amplocate: reliable EV charger discovery, community verification, risk-free multi-stop trip planning, and your EV dashboard.

## Stack
Expo 54 · expo-router · TypeScript · Leaflet-in-WebView map (dark Carto tiles, no API keys) · volt-on-dark brand

## Run it
```bash
npm install
npx expo start
```
Scan the QR with the **Expo Go** app (Android/iOS). The app points at the live API
(`https://amplocate-api.onrender.com`) by default — override with:
```bash
EXPO_PUBLIC_API_URL=http://<your-ip>:8000 npx expo start
```

## Screens
Login (OTP) · Discover (map + list + filters) · Charger details + community reports ·
Multi-stop trip planner with charger suggestions · Garage (catalog + manual EV entry) ·
EV dashboard (stats) · Profile

## Builds
`npx eas build -p android --profile preview` (requires a free Expo account) produces an installable APK.
