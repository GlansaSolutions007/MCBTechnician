# Fix for EAS Build Error: "package.json does not exist in /home/expo/workingdir/build"

## Problem Description
When trying to build the MCBTechnician app using EAS Build, you encounter the following error:
```
Pre-install hook: package.json does not exist in /home/expo/workingdir/build
Build error hook: package.json does not exist in /home/expo/workingdir/build
Build complete hook: package.json does not exist in /home/expo/workingdir/build
Fail job: Build failed
```

## Root Cause
The build is failing because:
1. **Missing Environment Variables**: The app imports `@env` but there's no `.env` file
2. **Build Process Failure**: The build fails when trying to resolve environment variables
3. **Missing Dependencies**: Some required dependencies might not be properly configured

## Solutions Implemented

### Solution 1: Environment Variables in app.json ✅ (Recommended)
I've updated your `app.json` file to include environment variables in the `extra` section:

```json
"extra": {
  "eas": {
    "projectId": "8e8b25c9-7fe9-49af-9a3c-61216354ad9e"
  },
  "API_BASE_URL": "https://api.mycarsbuddy.com/api/",
  "API_BASE_URL_IMAGE": "https://api.mycarsbuddy.com/",
  "RAZORPAY_KEY": "your_razorpay_key_here",
  "RAZORPAY_SECRET": "your_razorpay_secret_here",
  "GOOGLE_MAPS_APIKEY": "AIzaSyAC8UIiyDI55MVKRzNTHwQ9mnCnRjDymVo"
}
```

### Solution 2: Environment Configuration Fallback ✅
Created `src/config/env.js` as a fallback when `@env` imports fail:

```javascript
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const API_BASE_URL = extra.API_BASE_URL || 'https://api.mycarsbuddy.com/api/';
export const API_BASE_URL_IMAGE = extra.API_BASE_URL_IMAGE || 'https://api.mycarsbuddy.com/';
// ... other variables
```

### Solution 3: Updated EAS Configuration ✅
Enhanced `eas.json` with proper build configurations and environment variables:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "staging"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_URL": "production"
      }
    }
  }
}
```

### Solution 4: Created .easignore ✅
Added `.easignore` file to ensure important build files are not excluded:

```
# Keep these important files
!package.json
!app.json
!eas.json
!babel.config.js
!metro.config.js
!index.js
!App.js
```

## Files Modified

1. **`app.json`** - Added environment variables in extra section
2. **`eas.json`** - Enhanced build configurations
3. **`.easignore`** - Created to prevent file exclusions
4. **`src/config/env.js`** - Created environment fallback configuration
5. **`babel.config.js`** - Updated with safe fallback options

## Next Steps

### 1. Update Your Environment Variables
Replace the placeholder values in `app.json` with your actual API keys:

```json
"RAZORPAY_KEY": "your_actual_razorpay_key",
"RAZORPAY_SECRET": "your_actual_razorpay_secret"
```

### 2. Test Local Build
Before running EAS build, test locally:

```bash
npm start
```

### 3. Run EAS Build
Try building again:

```bash
# For development build
eas build --profile development --platform android

# For preview build
eas build --profile preview --platform android

# For production build
eas build --profile production --platform android
```

## Alternative Solution: Create .env File

If you prefer using a `.env` file instead of app.json:

1. Create a `.env` file in the MCBTechnician directory
2. Add your environment variables:

```bash
API_BASE_URL=https://api.mycarsbuddy.com/api/
API_BASE_URL_IMAGE=https://api.mycarsbuddy.com/
RAZORPAY_KEY=your_actual_key
RAZORPAY_SECRET=your_actual_secret
GOOGLE_MAPS_APIKEY=AIzaSyAC8UIiyDI55MVKRzNTHwQ9mnCnRjDymVo
```

3. Add `.env` to your `.gitignore` file for security

## Troubleshooting

### If Build Still Fails:

1. **Check EAS CLI Version**:
   ```bash
   eas --version
   ```
   Ensure you have version >= 16.17.3

2. **Clear EAS Cache**:
   ```bash
   eas build:clean
   ```

3. **Check Project Configuration**:
   ```bash
   eas build:configure
   ```

4. **Verify Dependencies**:
   ```bash
   npm install
   ```

### Common Issues:

1. **Missing Dependencies**: Ensure all dependencies are installed
2. **Invalid JSON**: Check for syntax errors in app.json and eas.json
3. **Permission Issues**: Ensure you have proper access to the EAS project
4. **Network Issues**: Check your internet connection during build

## Support

If you continue to experience issues:

1. Check the EAS build logs for specific error messages
2. Verify all environment variables are properly set
3. Ensure your EAS project ID is correct
4. Contact EAS support with specific error details

## Success Indicators

When the build is successful, you should see:
- ✅ Pre-install hook completed
- ✅ Build process started
- ✅ Build completed successfully
- ✅ APK/AAB file generated

The enhanced location tracking system will be included in your build, providing customers with real-time technician location updates even when the app is closed.
