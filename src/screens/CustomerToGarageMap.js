import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";

// Dummy garage offset from current location (for demo map - same style as customer map)
const GARAGE_OFFSET_LAT = 0.015;
const GARAGE_OFFSET_LNG = 0.015;
const DEFAULT_REGION = {
  latitude: 17.385,
  longitude: 78.4867,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function CustomerToGarageMap() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking, estimatedTime = 0, actualTime = 0, carRegistrationNumber = "" } = route.params || {};
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);

  // Dummy garage position: offset from current location, or fixed if no location yet
  const garageCoords = location
    ? {
        latitude: location.latitude + GARAGE_OFFSET_LAT,
        longitude: location.longitude + GARAGE_OFFSET_LNG,
      }
    : {
        latitude: DEFAULT_REGION.latitude + GARAGE_OFFSET_LAT,
        longitude: DEFAULT_REGION.longitude + GARAGE_OFFSET_LNG,
      };

  const initialRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        ...DEFAULT_REGION,
        latitude: (DEFAULT_REGION.latitude + garageCoords.latitude) / 2,
        longitude: (DEFAULT_REGION.longitude + garageCoords.longitude) / 2,
      };

  useEffect(() => {
    let sub = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setLocation(coords);
        if (mapRef.current?.animateToRegion) {
          mapRef.current.animateToRegion(
            {
              ...coords,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            500
          );
        }
      } catch (e) {}
    })();
    return () => {
      try {
        sub?.remove?.();
      } catch (_) {}
    };
  }, []);

  const handleStartToGarage = () => {
    if (location) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${garageCoords.latitude},${garageCoords.longitude}&travelmode=driving`;
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleDropCar = () => {
    const updatedBooking = {
      ...booking,
      ServiceStartedAt: booking?.ServiceStartedAt || new Date().toISOString(),
      CarRegistrationNumber: carRegistrationNumber || booking?.CarRegistrationNumber || "",
    };
    navigation.navigate("ServiceEnd", {
      booking: updatedBooking,
      estimatedTime: estimatedTime || 0,
      actualTime: actualTime || 0,
      carRegistrationNumber: carRegistrationNumber || booking?.CarRegistrationNumber || "",
    });
  };

  if (!booking) {
    return (
      <View style={[globalStyles.bgcontainer, globalStyles.justifycenter, globalStyles.alineItemscenter]}>
        <CustomText style={globalStyles.f16Bold}>No booking data.</CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation={!!location}
          showsMyLocationButton={!!location}
        >
          <Marker
            coordinate={garageCoords}
            title="Garage"
            description="Drop car at garage"
            pinColor={color.primary}
          />
        </MapView>
      </View>

      {carRegistrationNumber ? (
        <View style={styles.regNumberBar}>
          <Ionicons name="car" size={18} color={color.primary} style={{ marginRight: 8 }} />
          <CustomText style={[globalStyles.f14Bold, { color: color.primary }]}>
            Car registration: {carRegistrationNumber}
          </CustomText>
        </View>
      ) : null}

      <View style={styles.actionsContent}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleStartToGarage}>
          <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
          <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Start to Garage</CustomText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dropButton} onPress={handleDropCar}>
          <MaterialCommunityIcons name="car-side" size={20} color="#fff" style={{ marginRight: 8 }} />
          <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Drop Car</CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  mapWrap: { flex: 1, minHeight: 280 },
  regNumberBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: color.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.primary,
  },
  actionsContent: { padding: 16, paddingBottom: 24 },
  primaryButton: {
    backgroundColor: color.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
    elevation: 3,
  },
  dropButton: {
    backgroundColor: color.alertInfo,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
    elevation: 3,
  },
});
