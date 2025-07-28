// src/components/NotificationButton.js
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationButton({ onPress }) {
  return (
    <TouchableOpacity style={{ marginRight: 15 }} onPress={onPress}>
      <Ionicons name="notifications-outline" size={24} color="black" />
    </TouchableOpacity>
  );
}
