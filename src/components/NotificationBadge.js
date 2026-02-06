import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from './CustomText';
import { color } from '../styles/theme';
import notificationService from '../utils/notificationService';
import globalStyles from '../styles/globalStyles';

export default function NotificationBadge({ onPress, size = 24, color: iconColor = color.black, showBadge = true }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Set up interval to refresh unread count
    const interval = setInterval(loadUnreadCount, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Ionicons name="notifications-outline" size={size} color={iconColor} />
      {showBadge && unreadCount > 0 && (
        <View style={styles.badge}>
          <CustomText style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </CustomText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: color.error || '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: color.white,
  },
  badgeText: {
    color: color.white,
    ...globalStyles.f10Medium,
    textAlign: 'center',
  },
});
