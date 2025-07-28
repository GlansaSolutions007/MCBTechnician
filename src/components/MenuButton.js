// src/components/MenuButton.js
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MenuButton({ onPress }) {
  return (
    <TouchableOpacity style={{ marginLeft: 15 }} onPress={onPress}>
      <Ionicons name="menu" size={24} color="black" />
    </TouchableOpacity>
  );
}
