# Enhanced Location Tracking System for MCB Technician App

## Overview
This document describes the enhanced location tracking system implemented in the MCB Technician app to ensure reliable location updates even when the app is closed or the device is locked.

## Problem Solved
Previously, customers could only see technician locations when the technician app was open and active. This caused issues when:
- Technicians closed the app
- Device screen was locked
- App was in background
- Device was in power-saving mode

## Solution Implemented

### 1. Background Location Tracking
- **Expo Location Background Updates**: Uses `expo-location` with background task support
- **Background Fetch**: Additional reliability layer using `expo-background-fetch`
- **Foreground Service**: Android notification to keep location service running

### 2. Enhanced Configuration
- **iOS**: Added background modes for location, background processing, and background fetch
- **Android**: Enhanced permissions including WAKE_LOCK and RECEIVE_BOOT_COMPLETED
- **App Configuration**: Updated app.json with proper background task definitions

### 3. Improved Location Updates
- **Frequency**: Increased from 9.5s to 3-5s intervals for more responsive tracking
- **Distance**: Reduced from 5m to 3m movement threshold
- **Accuracy**: Added accuracy, speed, and heading data to location updates
- **Metadata**: Tracks whether updates come from foreground or background

## Technical Implementation

### Core Files Modified
1. **`src/utils/locationTracker.js`** - Main location tracking logic
2. **`src/contexts/AuthContext.js`** - Automatic tracking management
3. **`src/components/TrackingStatusIndicator.js`** - UI for tracking status
4. **`src/screens/Dashboard.js`** - Integration of tracking status
5. **`package.json`** - Added expo-background-fetch dependency
6. **`app.json`** - Enhanced permissions and background modes

### Background Tasks
- **`mcbt-background-location`**: Main location tracking task
- **`mcbt-background-fetch`**: Fallback location updates every 15 minutes

### Location Update Flow
```
Device Location Change → Location Service → Background Task → Firebase Update → Customer App
```

## Features

### 1. Automatic Tracking
- Starts automatically when technician logs in
- Continues running in background
- Restarts after device reboot (Android)

### 2. Real-time Status
- Shows current tracking status (Background Active, Foreground Only, Inactive)
- Displays last update timestamp
- Toggle button to start/stop background tracking

### 3. Smart Updates
- Throttles updates to prevent excessive Firebase writes
- Prioritizes accuracy over frequency
- Handles network failures gracefully

## Usage

### For Technicians
1. **Login**: Location tracking starts automatically
2. **Dashboard**: View tracking status and control background tracking
3. **Background Mode**: App continues sharing location when closed
4. **Manual Control**: Toggle background tracking on/off as needed

### For Customers
1. **Real-time Updates**: See technician location updates every 3-5 seconds
2. **Background Support**: Location updates continue even when technician app is closed
3. **Route Calculation**: More accurate ETA calculations with frequent updates

## Permissions Required

### iOS
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- Background modes: location, background-processing, background-fetch

### Android
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `FOREGROUND_SERVICE`
- `WAKE_LOCK`
- `RECEIVE_BOOT_COMPLETED`

## Performance Considerations

### Battery Optimization
- Uses balanced accuracy mode
- Throttles updates to prevent excessive battery drain
- Background fetch limited to 15-minute intervals

### Data Usage
- Location updates sent to Firebase every 3-5 seconds
- Background fetch every 15 minutes as fallback
- Estimated data usage: ~2-5 MB per day

### Network Handling
- Graceful fallback when network is unavailable
- Queues updates when offline
- Automatic retry on network restoration

## Troubleshooting

### Common Issues
1. **Background tracking not working**
   - Check location permissions
   - Ensure app is not in battery optimization
   - Verify background app refresh is enabled (iOS)

2. **Location updates stopped**
   - Check if app was force-closed
   - Verify Firebase connection
   - Restart background tracking from dashboard

3. **Battery drain**
   - Reduce update frequency if needed
   - Check for other background apps
   - Use power-saving mode when appropriate

### Debug Information
- Console logs show tracking status
- Dashboard displays current tracking state
- Firebase database shows update timestamps

## Future Enhancements

### Planned Improvements
1. **Geofencing**: Automatic tracking start/stop based on work areas
2. **Smart Updates**: Adaptive update frequency based on movement
3. **Offline Support**: Local storage of location data when offline
4. **Analytics**: Track technician movement patterns and efficiency

### Performance Optimizations
1. **Batch Updates**: Group multiple location updates
2. **Compression**: Reduce data payload size
3. **Predictive Updates**: Estimate location between GPS fixes

## Support

For technical support or questions about the location tracking system:
1. Check the console logs for error messages
2. Verify all permissions are granted
3. Test on different devices and OS versions
4. Contact development team with specific error details

## Security Notes

- Location data is only shared with authorized customers
- Firebase security rules control access to location data
- No location history is stored beyond current session
- All location updates are encrypted in transit
