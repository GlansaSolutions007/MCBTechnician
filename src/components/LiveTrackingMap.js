import React, { useEffect, useState, useRef } from "react";
import {
  View,
  PermissionsAndroid,
  Platform,
  Text,
  StyleSheet,
} from "react-native";
// import MapView, { Marker } from "react-native-maps";
import Geolocation from "react-native-geolocation-service";

export default function LiveTrackingMap() {
  const [location, setLocation] = useState(null);
  const watchId = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const fineGranted =
          granted["android.permission.ACCESS_FINE_LOCATION"] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const coarseGranted =
          granted["android.permission.ACCESS_COARSE_LOCATION"] ===
          PermissionsAndroid.RESULTS.GRANTED;

        if (!fineGranted && !coarseGranted) {
          console.warn("Location permission not granted");
          return;
        }
      }

      startWatchingLocation();
    };

    requestLocationPermission();

    return () => {
      if (watchId.current) Geolocation.clearWatch(watchId.current);
    };
  }, []);

  const startWatchingLocation = () => {
    watchId.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        console.log("📍 Current Location:", latitude, longitude);
        setLocation(newLocation);

        if (mapRef.current) {
          mapRef.current.animateToRegion(newLocation, 1000);
        }
      },
      (error) => {
        console.error("❌ Location Error:", error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000,
        showLocationDialog: true,
        forceRequestLocation: true,
      }
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Map View (70%) */}
      <View style={{ flex: 7 }}>
        {/* <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          region={location}
          showsUserLocation={true}
          followsUserLocation={true}
        >
          {location && (
            <Marker coordinate={location} title="You are here" />
          )}
        </MapView> */}
      </View>

      {/* Info View (30%) */}
      <View style={styles.infoContainer}>
        <Text style={styles.label}>👤 Name: Naveen Nagam</Text>
        <Text style={styles.label}>
          📍 Latitude: {location ? location.latitude.toFixed(6) : "Loading..."}
        </Text>
        <Text style={styles.label}>
          📍 Longitude:{" "}
          {location ? location.longitude.toFixed(6) : "Loading..."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    flex: 3,
    padding: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
});
