import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import globalStyles from "../styles/globalStyles";
import CustomText from "./CustomText";

export default function LiveTrackingWithRoute() {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const mapRef = useRef(null);
  const ServiceStart = () => {
    navigation.navigate("ServiceStart");
  };
  const destination = {
    latitude: 17.4435,
    longitude: 78.4483,
  };

  useEffect(() => {
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 1,
        },
        async (loc) => {
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          setLocation(coords);

          if (mapRef.current) {
            mapRef.current.animateToRegion(coords, 1000);
          }

          fetchRoute(coords);
        }
      );
    };

    startTracking();
  }, []);

  const fetchRoute = async (origin) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${origin.latitude},${origin.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            key: "AIzaSyAC8UIiyDI55MVKRzNTHwQ9mnCnRjDymVo",
          },
        }
      );

      const points = response.data.routes[0].overview_polyline.points;
      const decoded = decodePolyline(points);
      setRouteCoords(decoded);
    } catch (error) {
      console.error("Google Directions API error:", error.message);
    }
  };

  const decodePolyline = (t) => {
    let points = [];
    let index = 0,
      len = t.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return points;
  };

  const openGoogleMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {location ? (
        <MapView ref={mapRef} style={styles.map} region={location}>
          <Marker coordinate={location}>
            <View style={styles.markerContainer}>
              <Image
                source={require("../../assets/images/custpic.jpg")}
                style={styles.markerImage}
              />
            </View>
          </Marker>
          <Marker coordinate={destination}>
            <View style={styles.markerContainer2}>
              <Image
                source={require("../../assets/images/carbuddy.png")}
                style={styles.markerImage}
              />
            </View>
          </Marker>

          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={4}
              strokeColor="blue"
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text>Getting location...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => {
          if (location && mapRef.current) {
            mapRef.current.animateToRegion(location, 1000);
          }
        }}
      >
        <Ionicons name="locate" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={[styles.startreach]}>
        <TouchableOpacity style={styles.ReachedButton} onPress={ServiceStart}>
          <Text style={styles.startButtonText}>Reached</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startButton} onPress={openGoogleMaps}>
          <Text style={styles.startButtonText}>Start Navigation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 50,
    borderColor: "red",
    borderWidth: 2,
    overflow: "hidden",
  },
  markerContainer2: {
    width: 38,
    height: 18,
    overflow: "hidden",
  },
  markerImage: {
    width: "100%",
    height: "100%",
  },
  centerButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 30,
    elevation: 5,
  },
  startreach: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  startButton: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
    width: "48%",
  },
  ReachedButton: {
    backgroundColor: "#F8B400",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
    width: "48%",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
