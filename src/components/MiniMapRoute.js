import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import axios from "axios";
import { decode } from "@mapbox/polyline";

const MiniMapRoute = ({ origin, destination }) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    if (origin && destination) {
      fetchRoute();
    }
  }, [origin, destination]);

  const fetchRoute = async () => {
    try {
      const res = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car",
        {
          coordinates: [
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ],
        },
        {
          headers: {
            Authorization:"eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjU5NTg4YmFhNjU0NDQ1NDE4M2M3ZDllYzhjODNjYWU2IiwiaCI6Im11cm11cjY0In0=",
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
    }
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={3}
            strokeColor="blue"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default MiniMapRoute;
