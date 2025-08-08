import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import axios from "axios";
import { decode } from "@mapbox/polyline";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../styles/theme";

const MiniMapRoute = ({ origin, destination, bookingId }) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

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
          fetchRoute(coords);
        }
      );
    };

    startTracking();
  }, []);

  const fetchRoute = async (originCoords) => {
    try {
      const res = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car",
        {
          coordinates: [
            [originCoords.longitude, originCoords.latitude],
            [destination.longitude, destination.latitude],
          ],
        },
        {
          headers: {
            Authorization:
              "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjU5NTg4YmFhNjU0NDQ1NDE4M2M3ZDllYzhjODNjYWU2IiwiaCI6Im11cm11cjY0In0=",
            "Content-Type": "application/json",
          },
        }
      );

      const geometry = res.data.routes[0].geometry;
      const coords = decode(geometry).map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }));

      setRouteCoords(coords);
      setLoading(false); // Map is ready to display

      setTimeout(() => {
        if (mapRef.current && coords.length > 0) {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 40, bottom: 40, left: 40, right: 40 },
            animated: false,
          });
        }
      }, 300);
    } catch (error) {
      console.error("Error fetching mini route:", error);
      setLoading(false);
    }
  };

  const openGoogleMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.mapContainer}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {location && <Marker coordinate={location} />}
            <Marker coordinate={destination} />
            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeWidth={3}
                strokeColor="blue"
              />
            )}
          </MapView>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.button} onPress={openGoogleMaps}>
              <Ionicons name="navigate" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loader: {
    flex: 1,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  controls: {
    position: "absolute",
    top: 5,
    right: 5,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    backgroundColor: color.primary,
    padding: 10,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default MiniMapRoute;
