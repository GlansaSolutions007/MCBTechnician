# Push Notifications System for MCB Technician App

## Overview
This document describes the comprehensive push notification system implemented in the MCB Technician app. The system provides real-time notifications for various technician activities including new bookings, payment updates, customer messages, and system alerts.

## Features Implemented

### 🔔 **Notification Types**
- **New Booking**: When a new service is assigned
- **Booking Update**: When booking details change
- **Booking Cancelled**: When a booking is cancelled
- **Payment Received**: When payment is received
- **Location Request**: When customer requests location
- **System Alert**: System maintenance and updates
- **Reminder**: Service appointment reminders
- **Customer Message**: New customer communications
- **Service Completed**: Service completion confirmations
- **Earning Update**: Weekly/monthly earning updates

### 📱 **Platform Support**
- **Android**: Custom notification channels with different priorities
- **iOS**: Rich notification categories with action buttons
- **Cross-platform**: Consistent behavior across devices

### 🎯 **Smart Features**
- **Badge Count**: Shows unread notification count
- **Action Buttons**: Quick actions from notification (accept/decline booking)
- **Rich Content**: Detailed information in notifications
- **Local Storage**: Notifications persist between app sessions
- **Background Processing**: Works even when app is closed

## Architecture

### Core Components

#### 1. **NotificationService** (`src/utils/notificationService.js`)
- Main service class managing all notification operations
- Handles permissions, channels, and categories
- Manages notification listeners and responses
- Provides local storage for notifications

#### 2. **NotificationBadge** (`src/components/NotificationBadge.js`)
- Reusable component showing unread count
- Auto-updates every 30 seconds
- Used in headers and navigation

#### 3. **Notifications Screen** (`src/screens/Notifications.js`)
- Displays all notifications with rich UI
- Supports pull-to-refresh
- Shows notification status (read/unread)
- Allows clearing all notifications

#### 4. **Test Utilities** (`src/utils/notificationTestUtils.js`)
- Development tools for testing notifications
- Functions to test each notification type
- Scheduled notification testing

## Setup and Configuration

### 1. **App Configuration** (`app.json`)
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icons/notification-icon.png",
          "color": "#017F77",
          "sounds": ["./assets/notificationtone.wav"]
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "android": {
      "permissions": ["VIBRATE", "RECEIVE_BOOT_COMPLETED"]
    }
  }
}
```

### 2. **Dependencies**
```json
{
  "dependencies": {
    "expo-notifications": "~0.27.6",
    "expo-device": "~5.9.3",
    "@react-native-async-storage/async-storage": "2.1.2"
  }
}
```

### 3. **Permissions**
- **Android**: `VIBRATE`, `RECEIVE_BOOT_COMPLETED`
- **iOS**: `remote-notification` background mode

## Usage

### Initialization
The notification service is automatically initialized when a technician logs in:

```javascript
// In AuthContext.js
useEffect(() => {
  if (techID && token) {
    // Initialize notification service
    await notificationService.initialize(techID);
  }
}, []);
```

### Sending Notifications

#### Local Notifications
```javascript
import notificationService from '../utils/notificationService';

// Send immediate notification
await notificationService.sendLocalNotification({
  title: 'New Booking',
  body: 'You have a new service request',
  data: { type: 'new_booking', bookingId: '123' },
  channelId: 'bookings',
  priority: 'high'
});
```

#### Scheduled Notifications
```javascript
// Schedule notification for later
const trigger = new Date(Date.now() + 60000); // 1 minute from now

await notificationService.scheduleNotification({
  title: 'Reminder',
  body: 'Service appointment in 1 hour',
  trigger: { date: trigger },
  channelId: 'default'
});
```

### Notification Categories and Channels

#### Android Channels
- **Default**: High priority, all notifications
- **Bookings**: High priority, booking-related
- **Payments**: Default priority, payment updates
- **System**: Low priority, system alerts

#### iOS Categories
- **Bookings**: View, Accept, Decline actions
- **Payments**: View Details action
- **Customer**: Reply, View Profile actions

## Testing

### Test Functions Available
```javascript
import testNotifications from '../utils/notificationTestUtils';

// Test individual notification types
await testNotifications.testNewBooking();
await testNotifications.testPaymentReceived();
await testNotifications.testCustomerMessage();

// Test all types at once
await testNotifications.testAllTypes();

// Clear all test notifications
await testNotifications.clearAllTestNotifications();
```

### Test Buttons in Profile Screen
- **Send Test Push (API)**: Tests server-side notifications
- **Test Local Notification**: Tests single local notification
- **Test All Types**: Tests all notification types
- **Clear All Notifications**: Clears stored notifications

## Notification Data Structure

### Standard Notification Object
```javascript
{
  id: "unique_identifier",
  title: "Notification Title",
  body: "Notification message body",
  data: {
    type: "notification_type",
    bookingId: "optional_booking_id",
    customerId: "optional_customer_id",
    // ... other relevant data
  },
  timestamp: "2025-01-03T10:30:00.000Z",
  read: false,
  type: "notification_type"
}
```

### Data Types by Notification Type
```javascript
// New Booking
{
  type: "new_booking",
  bookingId: "BK123",
  customerName: "John Doe",
  serviceType: "Oil Change",
  location: "Hyderabad, Telangana"
}

// Payment Received
{
  type: "payment_received",
  paymentId: "PAY789",
  amount: "₹500",
  bookingId: "BK123",
  customerName: "John Doe"
}
```

## Background Processing

### Notification Handling
- **Foreground**: Notifications appear as in-app alerts
- **Background**: Notifications appear in system tray
- **Closed**: Notifications wake up the app if needed

### Badge Management
- Badge count automatically updates
- Persists between app sessions
- Clears when notifications are read

## Troubleshooting

### Common Issues

#### 1. **Notifications Not Appearing**
- Check notification permissions
- Verify notification channels are set up
- Ensure app is not in battery optimization mode

#### 2. **Badge Count Not Updating**
- Check if notification service is initialized
- Verify AsyncStorage permissions
- Restart the app

#### 3. **Action Buttons Not Working**
- Ensure notification categories are properly configured
- Check if navigation is properly set up
- Verify notification response handling

### Debug Commands
```javascript
// Check notification permissions
const status = await Notifications.getPermissionsAsync();
console.log('Permission status:', status);

// Check badge count
const badgeCount = await Notifications.getBadgeCountAsync();
console.log('Badge count:', badgeCount);

// List all scheduled notifications
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Scheduled notifications:', scheduled);
```

## Best Practices

### 1. **Notification Content**
- Keep titles under 40 characters
- Use clear, actionable language
- Include relevant data for navigation

### 2. **Timing**
- Don't send too many notifications
- Use appropriate priority levels
- Schedule reminders appropriately

### 3. **User Experience**
- Allow users to customize preferences
- Provide clear action buttons
- Maintain consistent notification style

## Future Enhancements

### Planned Features
- **Notification Preferences**: User-configurable settings
- **Smart Scheduling**: AI-powered notification timing
- **Rich Media**: Images and videos in notifications
- **Group Notifications**: Batch similar notifications
- **Analytics**: Notification engagement tracking

### Integration Opportunities
- **Chat System**: Real-time customer messaging
- **Payment Gateway**: Payment status updates
- **Service Tracking**: Real-time service updates
- **Customer Feedback**: Rating and review notifications

## Support and Maintenance

### Regular Tasks
- Monitor notification delivery rates
- Update notification content and styling
- Test on new device models and OS versions
- Optimize notification timing and frequency

### Performance Monitoring
- Track notification open rates
- Monitor app launch times from notifications
- Analyze user engagement patterns
- Optimize battery usage

## Conclusion

The push notification system provides a robust foundation for keeping technicians informed and engaged. With comprehensive testing tools, flexible configuration options, and cross-platform support, it ensures reliable communication between the app and technicians.

For technical support or feature requests, refer to the development team or create an issue in the project repository.
