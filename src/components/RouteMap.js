import React, { useEffect, useState } from "react";
import { View, Alert, ActivityIndicator, StyleSheet } from "react-native";
import * as Location from "expo-location";
import { Linking } from "react-native";

export default function AutoNavigateToSRNagar() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Ask for location permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Please allow location access.");
        setLoading(false);
        return;
      }

      // Get current location
      let currentLoc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLoc.coords;

      // Destination: SR Nagar, Hyderabad
      const destLat = 17.4426;
      const destLng = 78.4483;

      const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destLat},${destLng}&travelmode=driving`;

      // Open Google Maps
      Linking.openURL(url).catch(() => {
        Alert.alert("Error", "Could not open Google Maps.");
      });

      setLoading(false);
    })();
  }, []);

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color="blue" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
});
