import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text, Alert, Image, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

export default function LiveTrackingWithRoute() {
  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeFetched, setRouteFetched] = useState(false);
  const mapRef = useRef(null);

  const destination = {
    latitude: 17.36191607830754,
    longitude: 78.47466965365447,
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
          timeInterval: 1000,
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

          if (!routeFetched) {
            fetchRoute(coords);
            setRouteFetched(true);
          }
        }
      );
    };

    startTracking();
  }, []);

  const fetchRoute = async (origin) => {
    try {
      const res = await axios.post(
        `https://api.openrouteservice.org/v2/directions/driving-car`,
        {
          coordinates: [
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ],
        },
        {
          headers: {
            Authorization: "YOUR_API_KEY_HERE", // Replace this!
            "Content-Type": "application/json",
          },
        }
      );

      const geometry = res.data.routes[0].geometry;
      const decoded = decodePolyline(geometry);
      setRouteCoords(decoded);
    } catch (err) {
      console.log("Failed to fetch route:", err.message);
    }
  };

  const decodePolyline = (geometry) => {
    const polyline = require("@mapbox/polyline");
    return polyline.decode(geometry).map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));
  };

  const centerMap = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion(location, 1000);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {location ? (
        <>
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

          {/* Button to zoom to current location */}
          <TouchableOpacity style={styles.centerButton} onPress={centerMap}>
            <Ionicons name="locate" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.loading}>
          <Text>Getting location...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
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
    bottom: 30,
    right: 20,
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 30,
    elevation: 5,
  },
});
