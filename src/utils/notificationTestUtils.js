import { db } from "../config/firebaseConfig";
import { ref, set, get, push } from "firebase/database";
import { registerForPushNotificationsAsync } from "./notifications";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const testNotificationUtils = {
  // Test FCM token generation
  async testFCMTokenGeneration() {
    try {
      console.log("🔍 Testing FCM token generation...");
      
      const tokens = await registerForPushNotificationsAsync();
      console.log("📱 Generated tokens:", tokens);
      
      if (tokens.expoPushToken) {
        console.log("✅ Expo push token generated successfully");
      } else {
        console.log("❌ Expo push token is null");
      }
      
      if (tokens.fcmToken) {
        console.log("✅ FCM token generated successfully");
      } else {
        console.log("❌ FCM token is null");
      }
      
      return tokens;
    } catch (error) {
      console.error("❌ Error testing FCM token generation:", error);
      return null;
    }
  },

  // Test saving tokens to Firebase
  async testTokenSaving(technicianId) {
    try {
      console.log("💾 Testing token saving to Firebase...");
      
      const tokens = await registerForPushNotificationsAsync();
      if (!tokens.expoPushToken && !tokens.fcmToken) {
        console.log("❌ No tokens to save");
        return false;
      }
      
      // Save to Firebase
      const tokenRef = ref(db, `technicianPushTokens/${technicianId}`);
      await set(tokenRef, {
        expo: tokens.expoPushToken || null,
        fcm: tokens.fcmToken || null,
        lastUpdated: new Date().toISOString(),
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version
        }
      });
      
      console.log("✅ Tokens saved to Firebase successfully");
      return true;
    } catch (error) {
      console.error("❌ Error saving tokens to Firebase:", error);
      return false;
    }
  },

  // Test sending a test notification via Firebase
  async testFirebaseNotification(technicianId, notificationData = {}) {
    try {
      console.log("🚀 Testing Firebase notification...");
      
      const defaultNotification = {
        title: "Test Notification",
        body: "This is a test notification from Firebase",
        data: {
          type: "test",
          timestamp: new Date().toISOString(),
          technicianId
        },
        ...notificationData
      };
      
      // Save test notification to Firebase
      const notificationRef = ref(db, `testNotifications/${technicianId}`);
      await push(notificationRef, {
        ...defaultNotification,
        sentAt: new Date().toISOString(),
        status: "sent"
      });
      
      console.log("✅ Test notification sent to Firebase");
      return true;
    } catch (error) {
      console.error("❌ Error sending test notification:", error);
      return false;
    }
  },

  // Test notification permissions
  async testNotificationPermissions() {
    try {
      console.log("🔐 Testing notification permissions...");
      
      const { status } = await Notifications.getPermissionsAsync();
      console.log("📱 Current permission status:", status);
      
      if (status === 'granted') {
        console.log("✅ Notification permissions granted");
        return true;
      } else {
        console.log("❌ Notification permissions not granted:", status);
        return false;
      }
    } catch (error) {
      console.error("❌ Error checking notification permissions:", error);
      return false;
    }
  },

  // Comprehensive test
  async runAllTests(technicianId) {
    console.log("🧪 Running comprehensive notification tests...");
    
    const results = {
      permissions: false,
      tokenGeneration: false,
      tokenSaving: false,
      firebaseNotification: false
    };
    
    // Test permissions
    results.permissions = await this.testNotificationPermissions();
    
    // Test token generation
    const tokens = await this.testFCMTokenGeneration();
    results.tokenGeneration = !!(tokens?.expoPushToken || tokens?.fcmToken);
    
    // Test token saving
    results.tokenSaving = await this.testTokenSaving(technicianId);
    
    // Test Firebase notification
    results.firebaseNotification = await this.testFirebaseNotification(technicianId);
    
    // Summary
    console.log("📊 Test Results Summary:");
    console.log("Permissions:", results.permissions ? "✅" : "❌");
    console.log("Token Generation:", results.tokenGeneration ? "✅" : "❌");
    console.log("Token Saving:", results.tokenSaving ? "✅" : "❌");
    console.log("Firebase Notification:", results.firebaseNotification ? "✅" : "❌");
    
    return results;
  }
};

export default testNotificationUtils;
