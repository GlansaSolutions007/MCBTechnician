import React, { useEffect, useState, useRef } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  Callout,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

function decodePolyline(encoded) {
  let points = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

export default function MiniMapRoute({ route }) {
  const customerLat = route?.params?.customerLat ?? null;
  const customerLng = route?.params?.customerLng ?? null;

  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission denied");
          setLoading(false);
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
      } catch (err) {
        console.error("Error getting location:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (currentLocation && customerLat && customerLng) {
      fetchRoute(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        { latitude: customerLat, longitude: customerLng }
      );
    }
  }, [currentLocation, customerLat, customerLng]);

  const fetchRoute = async (origin, destination) => {
    try {
      const { data } = await axios.get(
        "https://maps.googleapis.com/maps/api/directions/json",
        {
          params: {
            origin: `${origin.latitude},${origin.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            key: "AIzaSyAC8UIiyDI55MVKRzNTHwQ9mnCnRjDymVo",
          },
        }
      );

      if (data.status !== "OK") {
        console.error("Directions API error:", data);
        return;
      }

      const points = data.routes[0]?.overview_polyline?.points;
      const legs = data.routes[0]?.legs[0];
      if (legs) {
        setDistance(legs.distance.text);
        setDuration(legs.duration.text);
      }

      if (points) {
        const decoded = decodePolyline(points);
        setRouteCoords(decoded);
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(decoded, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching route:", err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={styles.center}>
        <Text>No location available. Please enable GPS.</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        <Marker coordinate={currentLocation} pinColor="blue">
          <Callout>
            <Text>You</Text>
          </Callout>
        </Marker>

        {customerLat && customerLng && (
          <Marker
            coordinate={{ latitude: customerLat, longitude: customerLng }}
            pinColor="red"
          >
            <Callout>
              <Text>Customer</Text>
            </Callout>
          </Marker>
        )}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#007BFF"
          />
        )}
      </MapView>

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <View style={styles.infoWrapper}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{distance ?? "--"}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{duration ?? "--"}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.locateButton}
          onPress={() => {
            mapRef.current?.animateToRegion({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }}
        >
          <Ionicons name="navigate" size={20} color="#1FA4A2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    height: 200,
    backgroundColor: "#1FA4A2", // teal background
    elevation: 4,
    margin: 10,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoWrapper: {
    flexDirection: "row",
  },
  infoBox: {
    marginRight: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: "#fff",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#B6F2EC", // light greenish
  },
  locateButton: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 50,
    elevation: 3,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
