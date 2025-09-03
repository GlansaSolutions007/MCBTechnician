import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import globalStyles from "../styles/globalStyles";
import CustomText from "../components/CustomText";
import { color } from "../styles/theme";
import notificationService, { NOTIFICATION_TYPES } from "../utils/notificationService";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [technicianId, setTechnicianId] = useState(null);

  useEffect(() => {
    loadTechnicianId();
    loadNotifications();
  }, []);

  const loadTechnicianId = async () => {
    try {
      const techId = await AsyncStorage.getItem("techID");
      setTechnicianId(techId);
    } catch (error) {
      console.error("Failed to load technician ID:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const storedNotifications = await notificationService.getStoredNotifications();
      setNotifications(storedNotifications);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      await loadNotifications(); // Reload to update UI
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const clearAllNotifications = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await notificationService.clearAllNotifications();
              setNotifications([]);
            } catch (error) {
              console.error("Failed to clear notifications:", error);
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_BOOKING:
        return "calendar-outline";
      case NOTIFICATION_TYPES.BOOKING_UPDATE:
        return "refresh-outline";
      case NOTIFICATION_TYPES.BOOKING_CANCELLED:
        return "close-circle-outline";
      case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
        return "card-outline";
      case NOTIFICATION_TYPES.LOCATION_REQUEST:
        return "location-outline";
      case NOTIFICATION_TYPES.SYSTEM_ALERT:
        return "warning-outline";
      case NOTIFICATION_TYPES.REMINDER:
        return "time-outline";
      case NOTIFICATION_TYPES.CUSTOMER_MESSAGE:
        return "chatbubble-outline";
      case NOTIFICATION_TYPES.SERVICE_COMPLETED:
        return "checkmark-circle-outline";
      case NOTIFICATION_TYPES.EARNING_UPDATE:
        return "trending-up-outline";
      default:
        return "notifications-outline";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_BOOKING:
        return color.primary;
      case NOTIFICATION_TYPES.BOOKING_UPDATE:
        return color.warning || "#FF9800";
      case NOTIFICATION_TYPES.BOOKING_CANCELLED:
        return color.error || "#F44336";
      case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
        return color.success || "#4CAF50";
      case NOTIFICATION_TYPES.LOCATION_REQUEST:
        return color.info || "#2196F3";
      case NOTIFICATION_TYPES.SYSTEM_ALERT:
        return color.warning || "#FF9800";
      case NOTIFICATION_TYPES.REMINDER:
        return color.info || "#2196F3";
      case NOTIFICATION_TYPES.CUSTOMER_MESSAGE:
        return color.primary;
      case NOTIFICATION_TYPES.SERVICE_COMPLETED:
        return color.success || "#4CAF50";
      case NOTIFICATION_TYPES.EARNING_UPDATE:
        return color.success || "#4CAF50";
      default:
        return color.primary;
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_BOOKING:
        return "New Booking Assigned";
      case NOTIFICATION_TYPES.BOOKING_UPDATE:
        return "Booking Updated";
      case NOTIFICATION_TYPES.BOOKING_CANCELLED:
        return "Booking Cancelled";
      case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
        return "Payment Received";
      case NOTIFICATION_TYPES.LOCATION_REQUEST:
        return "Location Request";
      case NOTIFICATION_TYPES.SYSTEM_ALERT:
        return "System Alert";
      case NOTIFICATION_TYPES.REMINDER:
        return "Reminder";
      case NOTIFICATION_TYPES.CUSTOMER_MESSAGE:
        return "Customer Message";
      case NOTIFICATION_TYPES.SERVICE_COMPLETED:
        return "Service Completed";
      case NOTIFICATION_TYPES.EARNING_UPDATE:
        return "Earning Update";
      default:
        return "Notification";
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return `${diffInMinutes} min ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hr ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return "Unknown time";
    }
  };

  const handleNotificationPress = (notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Handle navigation based on notification type
    if (notification.data?.bookingId) {
      // Navigate to booking details
      console.log("Navigate to booking:", notification.data.bookingId);
    } else if (notification.data?.paymentId) {
      // Navigate to payment details
      console.log("Navigate to payment:", notification.data.paymentId);
    } else if (notification.data?.customerId) {
      // Navigate to customer profile
      console.log("Navigate to customer:", notification.data.customerId);
    }
  };

  const renderNotification = (notification, index) => {
    const iconName = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);
    const title = getNotificationTitle(notification.type);
    const isUnread = !notification.read;

    return (
      <TouchableOpacity
        key={notification.id || index}
        style={[
          styles.notificationCard,
          isUnread && styles.unreadCard,
          { borderLeftColor: iconColor }
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={iconName} size={20} color={iconColor} />
          </View>
          <View style={styles.notificationContent}>
            <CustomText style={[styles.notificationTitle, isUnread && styles.unreadText]}>
              {notification.title || title}
            </CustomText>
            <CustomText style={styles.notificationBody} numberOfLines={2}>
              {notification.body}
            </CustomText>
            {notification.data?.bookingId && (
              <CustomText style={styles.bookingId}>
                Booking ID: {notification.data.bookingId}
              </CustomText>
            )}
          </View>
          <View style={styles.notificationMeta}>
            <CustomText style={styles.timestamp}>
              {formatTime(notification.timestamp)}
            </CustomText>
            {isUnread && <View style={[styles.unreadDot, { backgroundColor: iconColor }]} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (notifications.length === 0) {
    return (
      <View style={[globalStyles.bgcontainer, styles.emptyContainer]}>
        <View style={styles.emptyContent}>
          <Ionicons name="notifications-off-outline" size={64} color={color.gray || "#999"} />
          <CustomText style={styles.emptyTitle}>No Notifications</CustomText>
          <CustomText style={styles.emptySubtitle}>
            You're all caught up! New notifications will appear here.
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.bgcontainer}>
      {/* Header */}
      <View style={styles.header}>
        <CustomText style={styles.headerTitle}>Notifications</CustomText>
        <TouchableOpacity onPress={clearAllNotifications} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color={color.error || "#F44336"} />
          <CustomText style={styles.clearButtonText}>Clear All</CustomText>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {notifications.map((notification, index) => 
          renderNotification(notification, index)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: color.white,
    borderBottomWidth: 1,
    borderBottomColor: color.lightGray || "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: color.textDark,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: color.lightRed || "#ffebee",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: color.error || "#F44336",
    marginLeft: 4,
  },
  notificationCard: {
    backgroundColor: color.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: color.lightBlue || "#f3f8ff",
    borderLeftWidth: 4,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: color.textDark,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: "700",
  },
  notificationBody: {
    fontSize: 14,
    color: color.textLight || "#666",
    lineHeight: 20,
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 12,
    color: color.primary,
    fontWeight: "500",
  },
  notificationMeta: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 40,
  },
  timestamp: {
    fontSize: 12,
    color: color.gray || "#999",
    marginBottom: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: color.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: color.textLight || "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
