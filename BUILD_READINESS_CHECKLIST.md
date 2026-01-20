# Build Readiness Checklist ✅

## Pre-Build Verification

### ✅ Configuration Files
- [x] `app.json` - Valid and properly configured
- [x] `eas.json` - Development build profile configured
- [x] `package.json` - All dependencies listed
- [x] `google-services.json` - Present in root directory
- [x] Custom plugin `plugins/withAndroidManifestFix.js` - Created and added to plugins array

### ✅ Android Manifest Fix
- [x] Plugin created to fix Firebase messaging manifest conflict
- [x] Plugin added to `app.json` plugins array
- [x] Plugin adds `tools:replace="android:resource"` to resolve conflict

### ✅ Dependencies
- [x] `expo-dev-client` installed (v6.0.20)
- [x] `@react-native-firebase/app` installed (v23.2.2)
- [x] `@react-native-firebase/messaging` installed (v23.2.2)
- [x] All Expo SDK packages installed

### ✅ Build Configuration
- [x] Development profile in `eas.json` with `developmentClient: true`
- [x] Android package name: `com.itglansa.mcbt`
- [x] EAS project ID configured
- [x] Environment variables in `app.json` extra section

## ⚠️ Before Building - Quick Checks

### 1. Verify Plugin Dependency
The custom plugin requires `@expo/config-plugins`. It should be available through Expo, but if you get an error, install it:

```bash
npm install @expo/config-plugins --save-dev
```

### 2. Verify google-services.json
Make sure `google-services.json` is in the root directory and contains valid Firebase configuration.

### 3. Check Environment Variables
Review `app.json` extra section and update if needed:
- `RAZORPAY_KEY` - Currently placeholder
- `RAZORPAY_SECRET` - Currently placeholder
- Other variables look correct

## 🚀 Ready to Build!

Your project is **ready for build** with the following:

### Build Commands

#### Development Build (Recommended for testing)
```bash
eas build --profile development --platform android
```

#### Preview Build (APK for testing)
```bash
eas build --profile preview --platform android
```

#### Production Build
```bash
eas build --profile production --platform android
```

## 📋 Build Process

1. **Login to EAS** (if not already):
   ```bash
   eas login
   ```

2. **Start the build**:
   ```bash
   eas build --profile development --platform android
   ```

3. **Monitor the build**:
   - Build will be queued on EAS servers
   - You'll get a build URL to track progress
   - Build typically takes 10-20 minutes

4. **Download and install**:
   - Once complete, download the APK/IPA
   - Install on your device
   - Run `npm start` and connect to dev server

## 🔧 If Build Fails

### Common Issues:

1. **Plugin not found**:
   - Ensure `plugins/withAndroidManifestFix.js` exists
   - Check path in `app.json` is correct: `"./plugins/withAndroidManifestFix"`

2. **Manifest conflict still occurs**:
   - The plugin should fix this, but if it persists, check plugin execution

3. **Missing dependencies**:
   - Run `npm install` before building
   - Ensure all dependencies are compatible with Expo SDK 54

4. **google-services.json issues**:
   - Verify file is valid JSON
   - Check it matches your Firebase project

## ✅ Current Status

**Status: READY TO BUILD** ✅

All critical configurations are in place:
- ✅ Android manifest fix plugin configured
- ✅ Development build profile ready
- ✅ Firebase configuration present
- ✅ All dependencies installed
- ✅ No linter errors

You can proceed with the build command!

