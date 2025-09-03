import notificationService, { NOTIFICATION_TYPES } from './notificationService';

// Test utility functions for notifications
export const testNotifications = {
  // Test new booking notification
  testNewBooking: async (bookingId = 'TEST123') => {
    await notificationService.sendLocalNotification({
      title: 'New Booking Assigned',
      body: `You have been assigned a new booking. Please review the details and accept or decline.`,
      data: {
        type: NOTIFICATION_TYPES.NEW_BOOKING,
        bookingId,
        customerName: 'John Doe',
        serviceType: 'Oil Change',
        location: 'Hyderabad, Telangana'
      },
      channelId: 'bookings',
      categoryIdentifier: 'bookings',
      priority: 'high'
    });
  },

  // Test booking update notification
  testBookingUpdate: async (bookingId = 'TEST123') => {
    await notificationService.sendLocalNotification({
      title: 'Booking Updated',
      body: 'The booking details have been updated. Please check the new information.',
      data: {
        type: NOTIFICATION_TYPES.BOOKING_UPDATE,
        bookingId,
        updateType: 'time_change',
        oldTime: '10:00 AM',
        newTime: '11:00 AM'
      },
      channelId: 'bookings',
      categoryIdentifier: 'bookings',
      priority: 'default'
    });
  },

  // Test booking cancellation notification
  testBookingCancelled: async (bookingId = 'TEST123') => {
    await notificationService.sendLocalNotification({
      title: 'Booking Cancelled',
      body: 'A booking has been cancelled by the customer.',
      data: {
        type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
        bookingId,
        customerName: 'John Doe',
        reason: 'Schedule conflict'
      },
      channelId: 'bookings',
      categoryIdentifier: 'bookings',
      priority: 'default'
    });
  },

  // Test payment received notification
  testPaymentReceived: async (paymentId = 'PAY789') => {
    await notificationService.sendLocalNotification({
      title: 'Payment Received',
      body: 'You have received a payment of ₹500 for your service.',
      data: {
        type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
        paymentId,
        amount: '₹500',
        bookingId: 'TEST123',
        customerName: 'John Doe'
      },
      channelId: 'payments',
      categoryIdentifier: 'payments',
      priority: 'default'
    });
  },

  // Test location request notification
  testLocationRequest: async () => {
    await notificationService.sendLocalNotification({
      title: 'Location Request',
      body: 'A customer is requesting your current location for service tracking.',
      data: {
        type: NOTIFICATION_TYPES.LOCATION_REQUEST,
        customerId: 'CUST456',
        customerName: 'John Doe',
        serviceType: 'Emergency Repair'
      },
      channelId: 'default',
      priority: 'high'
    });
  },

  // Test system alert notification
  testSystemAlert: async () => {
    await notificationService.sendLocalNotification({
      title: 'System Maintenance',
      body: 'The system will be under maintenance from 2:00 AM to 4:00 AM. Some features may be temporarily unavailable.',
      data: {
        type: NOTIFICATION_TYPES.SYSTEM_ALERT,
        alertType: 'maintenance',
        startTime: '2:00 AM',
        endTime: '4:00 AM'
      },
      channelId: 'system',
      priority: 'low'
    });
  },

  // Test reminder notification
  testReminder: async () => {
    await notificationService.sendLocalNotification({
      title: 'Service Reminder',
      body: 'You have a scheduled service appointment in 1 hour. Please ensure you have all necessary tools.',
      data: {
        type: NOTIFICATION_TYPES.REMINDER,
        bookingId: 'TEST123',
        customerName: 'John Doe',
        serviceType: 'Oil Change',
        appointmentTime: '11:00 AM'
      },
      channelId: 'default',
      priority: 'default'
    });
  },

  // Test customer message notification
  testCustomerMessage: async (customerId = 'CUST456') => {
    await notificationService.sendLocalNotification({
      title: 'New Customer Message',
      body: 'John Doe: Hi, I have a question about the service. Can you call me?',
      data: {
        type: NOTIFICATION_TYPES.CUSTOMER_MESSAGE,
        customerId,
        customerName: 'John Doe',
        message: 'Hi, I have a question about the service. Can you call me?',
        timestamp: new Date().toISOString()
      },
      channelId: 'default',
      categoryIdentifier: 'customer',
      priority: 'default'
    });
  },

  // Test service completed notification
  testServiceCompleted: async (bookingId = 'TEST123') => {
    await notificationService.sendLocalNotification({
      title: 'Service Completed',
      body: 'Great job! The service has been marked as completed. Customer feedback will be available soon.',
      data: {
        type: NOTIFICATION_TYPES.SERVICE_COMPLETED,
        bookingId,
        customerName: 'John Doe',
        serviceType: 'Oil Change',
        completionTime: new Date().toISOString()
      },
      channelId: 'default',
      priority: 'default'
    });
  },

  // Test earning update notification
  testEarningUpdate: async () => {
    await notificationService.sendLocalNotification({
      title: 'Earning Update',
      body: 'Your weekly earnings have been updated. You earned ₹2,500 this week.',
      data: {
        type: NOTIFICATION_TYPES.EARNING_UPDATE,
        period: 'weekly',
        amount: '₹2,500',
        previousAmount: '₹2,000',
        change: '+₹500'
      },
      channelId: 'payments',
      categoryIdentifier: 'payments',
      priority: 'default'
    });
  },

  // Test scheduled notification
  testScheduledNotification: async () => {
    const trigger = new Date(Date.now() + 10000); // 10 seconds from now
    
    await notificationService.scheduleNotification({
      title: 'Scheduled Reminder',
      body: 'This is a scheduled notification that will appear in 10 seconds.',
      data: {
        type: NOTIFICATION_TYPES.REMINDER,
        scheduled: true
      },
      trigger: { date: trigger },
      channelId: 'default'
    });
  },

  // Test all notification types
  testAllTypes: async () => {
    console.log('Testing all notification types...');
    
    await testNotifications.testNewBooking();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testNotifications.testBookingUpdate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testNotifications.testPaymentReceived();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testNotifications.testLocationRequest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testNotifications.testCustomerMessage();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testNotifications.testServiceCompleted();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testNotifications.testEarningUpdate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('All notification types tested successfully!');
  },

  // Clear all test notifications
  clearAllTestNotifications: async () => {
    await notificationService.clearAllNotifications();
    console.log('All test notifications cleared');
  }
};

export default testNotifications;
