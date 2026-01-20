# Development Build Guide

## ⚠️ Important: This project requires a Development Build

This app **cannot** run in **Expo Go** because it uses:
- Custom native code (`@react-native-firebase/messaging`)
- Custom config plugins (Android manifest modifications)
- Native modules that require compilation

## ✅ Solution: Create a Development Build

A development build is a custom version of your app that includes your native code and can be installed on your device, similar to Expo Go but with your custom native dependencies.

## Steps to Create a Development Build

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Login to your Expo account
```bash
eas login
```

### 3. Configure EAS (if not already done)
```bash
eas build:configure
```

### 4. Create a Development Build

#### For Android:
```bash
eas build --profile development --platform android
```

#### For iOS:
```bash
eas build --profile development --platform ios
```

#### For both platforms:
```bash
eas build --profile development --platform all
```

### 5. Install the Development Build

After the build completes:
- **Android**: Download the APK from the EAS build page and install it on your device
- **iOS**: Install via TestFlight or download the IPA and install via Xcode

### 6. Start the Development Server

Once the development build is installed on your device:

```bash
npm start
# or
expo start --dev-client
```

Then:
- Scan the QR code with your development build app (not Expo Go)
- Or press `a` for Android / `i` for iOS to open in the development build

## Development Build vs Expo Go

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Custom native code | ❌ No | ✅ Yes |
| Config plugins | ❌ Limited | ✅ Full support |
| Firebase Messaging | ❌ No | ✅ Yes |
| Installation | App Store | Custom build |
| Development speed | ⚡ Fast | 🐢 Slower (needs rebuild for native changes) |

## Local Development Build (Alternative)

If you want to build locally instead of using EAS:

### Android:
```bash
npx expo run:android
```

### iOS:
```bash
npx expo run:ios
```

This will:
1. Generate native projects
2. Install dependencies
3. Build and run on connected device/emulator

## Troubleshooting

### Build fails with manifest error
- The `withAndroidManifestFix` plugin should resolve this
- Make sure the plugin is in your `app.json` plugins array

### Development build not connecting
- Make sure your device and computer are on the same network
- Check firewall settings
- Try using `expo start --tunnel` for remote access

### Native changes not reflecting
- Development builds need to be rebuilt when you change:
  - Native dependencies
  - Config plugins
  - `app.json` native configuration
- JavaScript changes work with hot reload (no rebuild needed)

## Quick Commands Reference

```bash
# Create development build (Android)
eas build --profile development --platform android

# Create development build (iOS)
eas build --profile development --platform ios

# Start dev server
npm start

# Start with dev client flag
expo start --dev-client

# Local Android build
npx expo run:android

# Local iOS build
npx expo run:ios
```

## Your Current Configuration

✅ You already have:
- `expo-dev-client` installed
- Development profile in `eas.json` with `developmentClient: true`
- Custom config plugin for Android manifest fixes

You're ready to create a development build! 🚀

