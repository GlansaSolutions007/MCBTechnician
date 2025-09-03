import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebaseConfig';
import { ref, set, onValue, off } from 'firebase/database';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification types for technicians
export const NOTIFICATION_TYPES = {
  NEW_BOOKING: 'new_booking',
  BOOKING_UPDATE: 'booking_update',
  BOOKING_CANCELLED: 'booking_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  LOCATION_REQUEST: 'location_request',
  SYSTEM_ALERT: 'system_alert',
  REMINDER: 'reminder',
  CUSTOMER_MESSAGE: 'customer_message',
  SERVICE_COMPLETED: 'service_completed',
  EARNING_UPDATE: 'earning_update'
};

// Notification categories for iOS
export const NOTIFICATION_CATEGORIES = {
  BOOKINGS: 'bookings',
  PAYMENTS: 'payments',
  SYSTEM: 'system',
  CUSTOMER: 'customer'
};

class TechnicianNotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
    this.technicianId = null;
    this.isInitialized = false;
  }

  // Initialize the notification service
  async initialize(technicianId) {
    if (this.isInitialized) return;
    
    this.technicianId = technicianId;
    
    try {
      // Request permissions
      await this.requestPermissions();
      
      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupNotificationChannels();
      }
      
      // Set up notification categories for iOS
      if (Platform.OS === 'ios') {
        await this.setupNotificationCategories();
      }
      
      // Start listening for notifications
      await this.startNotificationListener();
      
      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Request notification permissions
  async requestPermissions() {
    if (!Device.isDevice) {
      throw new Error('Notifications are not supported on simulators');
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      throw new Error('Notification permissions not granted');
    }

    return finalStatus;
  }

  // Set up notification channels for Android
  async setupNotificationChannels() {
    if (Platform.OS !== 'android') return;

    // Main channel for all notifications
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#017F77',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // Channel for booking notifications
    await Notifications.setNotificationChannelAsync('bookings', {
      name: 'Bookings',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#017F77',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // Channel for payment notifications
    await Notifications.setNotificationChannelAsync('payments', {
      name: 'Payments',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#4CAF50',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // Channel for system notifications
    await Notifications.setNotificationChannelAsync('system', {
      name: 'System',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 250],
      lightColor: '#FF9800',
      sound: 'default',
      enableVibrate: false,
      showBadge: false,
    });
  }

  // Set up notification categories for iOS
  async setupNotificationCategories() {
    if (Platform.OS !== 'ios') return;

    // Bookings category
    await Notifications.setNotificationCategoryAsync('bookings', [
      {
        identifier: 'view_booking',
        buttonTitle: 'View',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'accept_booking',
        buttonTitle: 'Accept',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'decline_booking',
        buttonTitle: 'Decline',
        options: {
          isDestructive: true,
          isAuthenticationRequired: false,
        },
      },
    ]);

    // Payments category
    await Notifications.setNotificationCategoryAsync('payments', [
      {
        identifier: 'view_payment',
        buttonTitle: 'View Details',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ]);

    // Customer messages category
    await Notifications.setNotificationCategoryAsync('customer', [
      {
        identifier: 'reply_message',
        buttonTitle: 'Reply',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'view_profile',
        buttonTitle: 'View Profile',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ]);
  }

  // Start listening for notifications
  async startNotificationListener() {
    // Listen for incoming notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listen for notification responses (taps, actions)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle incoming notifications
  handleNotificationReceived(notification) {
    const { title, body, data } = notification.request.content;
    
    // Store notification in local storage
    this.storeNotification({
      id: notification.request.identifier,
      title,
      body,
      data,
      timestamp: new Date().toISOString(),
      read: false,
      type: data?.type || 'unknown'
    });

    // Update badge count
    this.updateBadgeCount();
  }

  // Handle notification responses (taps, actions)
  handleNotificationResponse(response) {
    const { actionIdentifier, notification } = response;
    const { data } = notification.request.content;

    // Mark notification as read
    this.markNotificationAsRead(notification.request.identifier);

    // Handle different actions
    switch (actionIdentifier) {
      case 'view_booking':
        this.navigateToBooking(data?.bookingId);
        break;
      case 'accept_booking':
        this.acceptBooking(data?.bookingId);
        break;
      case 'decline_booking':
        this.declineBooking(data?.bookingId);
        break;
      case 'view_payment':
        this.navigateToPayment(data?.paymentId);
        break;
      case 'reply_message':
        this.replyToCustomer(data?.customerId);
        break;
      case 'view_profile':
        this.viewCustomerProfile(data?.customerId);
        break;
      default:
        // Default action - navigate based on notification type
        this.handleDefaultNavigation(data);
        break;
    }
  }

  // Send local notification
  async sendLocalNotification({
    title,
    body,
    data = {},
    channelId = 'default',
    categoryIdentifier = null,
    sound = 'default',
    priority = 'high'
  }) {
    try {
      const notificationContent = {
        title,
        body,
        data,
        sound,
        priority: priority === 'high' ? 'high' : 'default',
        channelId: Platform.OS === 'android' ? channelId : undefined,
        categoryIdentifier: Platform.OS === 'ios' ? categoryIdentifier : undefined,
      };

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Send immediately
      });

      console.log('Local notification sent:', title);
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  // Schedule notification for later
  async scheduleNotification({
    title,
    body,
    data = {},
    trigger,
    channelId = 'default',
    categoryIdentifier = null
  }) {
    try {
      const notificationContent = {
        title,
        body,
        data,
        channelId: Platform.OS === 'android' ? channelId : undefined,
        categoryIdentifier: Platform.OS === 'ios' ? categoryIdentifier : undefined,
      };

      const identifier = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });

      console.log('Notification scheduled:', identifier);
      return identifier;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  // Store notification in local storage
  async storeNotification(notification) {
    try {
      const key = `notifications_${this.technicianId}`;
      const existing = await AsyncStorage.getItem(key);
      const notifications = existing ? JSON.parse(existing) : [];
      
      // Add new notification at the beginning
      notifications.unshift(notification);
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  // Get stored notifications
  async getStoredNotifications() {
    try {
      const key = `notifications_${this.technicianId}`;
      const existing = await AsyncStorage.getItem(key);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      console.error('Failed to get stored notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const key = `notifications_${this.technicianId}`;
      const existing = await AsyncStorage.getItem(key);
      const notifications = existing ? JSON.parse(existing) : [];
      
      const updated = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      );
      
      await AsyncStorage.setItem(key, JSON.stringify(updated));
      this.updateBadgeCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  // Update badge count
  async updateBadgeCount() {
    try {
      const notifications = await this.getStoredNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      
      await Notifications.setBadgeCountAsync(unreadCount);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      const key = `notifications_${this.technicianId}`;
      await AsyncStorage.removeItem(key);
      await Notifications.setBadgeCountAsync(0);
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const notifications = await this.getStoredNotifications();
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Navigation handlers (to be implemented based on your navigation structure)
  navigateToBooking(bookingId) {
    // Implement navigation to booking details
    console.log('Navigate to booking:', bookingId);
  }

  acceptBooking(bookingId) {
    // Implement booking acceptance logic
    console.log('Accept booking:', bookingId);
  }

  declineBooking(bookingId) {
    // Implement booking decline logic
    console.log('Decline booking:', bookingId);
  }

  navigateToPayment(paymentId) {
    // Implement navigation to payment details
    console.log('Navigate to payment:', paymentId);
  }

  replyToCustomer(customerId) {
    // Implement customer reply logic
    console.log('Reply to customer:', customerId);
  }

  viewCustomerProfile(customerId) {
    // Implement customer profile navigation
    console.log('View customer profile:', customerId);
  }

  handleDefaultNavigation(data) {
    // Implement default navigation based on notification type
    console.log('Default navigation for data:', data);
  }

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
    
    this.isInitialized = false;
    console.log('Notification service cleaned up');
  }
}

// Create singleton instance
const notificationService = new TechnicianNotificationService();

export default notificationService;

// Export individual functions for backward compatibility
export const {
  sendLocalNotification,
  scheduleNotification,
  getStoredNotifications,
  markNotificationAsRead,
  clearAllNotifications,
  getUnreadCount
} = notificationService;
