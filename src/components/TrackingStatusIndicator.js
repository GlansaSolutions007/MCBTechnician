import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTrackingStatus, startBackgroundTracking, stopBackgroundTracking } from '../utils/locationTracker';
import { color } from '../styles/theme';

export default function TrackingStatusIndicator({ technicianId }) {
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (technicianId) {
      updateTrackingStatus();
      // Update status every 10 seconds
      const interval = setInterval(updateTrackingStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [technicianId]);

  const updateTrackingStatus = async () => {
    try {
      const status = await getTrackingStatus();
      setTrackingStatus(status);
    } catch (error) {
      console.log('Error updating tracking status:', error);
    }
  };

  const handleToggleBackgroundTracking = async () => {
    if (!technicianId) return;
    
    setIsLoading(true);
    try {
      if (trackingStatus?.backgroundTrackingActive) {
        await stopBackgroundTracking();
        Alert.alert('Background Tracking Stopped', 'Location updates will only work when the app is open.');
      } else {
        await startBackgroundTracking(technicianId);
        Alert.alert('Background Tracking Started', 'Your location will be shared with customers even when the app is closed.');
      }
      await updateTrackingStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle background tracking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!trackingStatus) return color.gray;
    if (trackingStatus.backgroundTrackingActive) return color.success || '#4CAF50';
    if (trackingStatus.foregroundTrackingActive) return color.warning || '#FF9800';
    return color.error || '#F44336';
  };

  const getStatusText = () => {
    if (!trackingStatus) return 'Checking...';
    if (trackingStatus.backgroundTrackingActive) return 'Background Active';
    if (trackingStatus.foregroundTrackingActive) return 'Foreground Only';
    return 'Inactive';
  };

  const getStatusIcon = () => {
    if (!trackingStatus) return 'help-circle-outline';
    if (trackingStatus.backgroundTrackingActive) return 'location';
    if (trackingStatus.foregroundTrackingActive) return 'location-outline';
    return 'location-off';
  };

  if (!technicianId) return null;

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusIndicator}>
          <Ionicons 
            name={getStatusIcon()} 
            size={20} 
            color={getStatusColor()} 
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: trackingStatus?.backgroundTrackingActive ? color.error : color.primary }
          ]}
          onPress={handleToggleBackgroundTracking}
          disabled={isLoading}
        >
          <Text style={styles.toggleButtonText}>
            {isLoading ? '...' : 
             trackingStatus?.backgroundTrackingActive ? 'Stop Background' : 'Start Background'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {trackingStatus?.lastUpdate && (
        <Text style={styles.lastUpdateText}>
          Last update: {trackingStatus.lastUpdate.toLocaleTimeString()}
        </Text>
      )}
      
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          • Background tracking works even when app is closed
        </Text>
        <Text style={styles.infoText}>
          • Foreground tracking only works when app is open
        </Text>
        <Text style={styles.infoText}>
          • Customers can see your live location for better service
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // display: 'none',
    backgroundColor: color.white,
    padding: 16,
    borderRadius: 8,
    margin: 16,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: color.white,
    fontSize: 14,
    fontWeight: '500',
  },
  lastUpdateText: {
    fontSize: 12,
    color: color.gray || '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoRow: {
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: color.gray || '#666',
    lineHeight: 16,
  },
});
