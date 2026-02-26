import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import { API_BASE_URL } from "@env";

// Dummy garage offset from current location
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
  const [updatedBooking, setUpdatedBooking] = useState(booking);
  const displayBooking = updatedBooking || booking;
  const mapRef = useRef(null);

  const pd = displayBooking?.PickupDelivery ?? booking?.PickupDelivery;
  const currentLeg = Array.isArray(pd) ? pd[0] : pd;
  const driverStatus = currentLeg?.DriverStatus ?? (pd && !Array.isArray(pd) ? pd?.DriverStatus : null);
  const routeType =
    currentLeg?.PickFrom?.[0]?.RouteType ??
    currentLeg?.PickFrom?.RouteType ??
    currentLeg?.DropAt?.RouteType ??
    booking?.PickupDelivery?.RouteType ??
    "CustomerToDealer";
  const legId =
    currentLeg?.Id ??
    currentLeg?.ID ??
    currentLeg?.PickupDeliveryId ??
    (pd && !Array.isArray(pd) ? pd?.Id ?? pd?.ID ?? pd?.PickupDeliveryId : undefined);
  const fromArray =
    Array.isArray(pd) && pd.length > 0
      ? pd.reduce((acc, l) => acc ?? l?.Id ?? l?.ID ?? l?.PickupDeliveryId, null)
      : null;
  const carPickupDeliveryId = Number(
    legId ?? booking?.PickupDeliveryId ?? booking?.CarPickupDeliveryId ?? displayBooking?.PickupDeliveryId ?? displayBooking?.CarPickupDeliveryId ?? fromArray ?? 0
  );

  const dropAt = currentLeg?.DropAt;
  const dropLat = dropAt?.Latitude != null ? Number(dropAt.Latitude) : NaN;
  const dropLng = dropAt?.Longitude != null ? Number(dropAt.Longitude) : NaN;
  const bookingLat = booking?.Latitude != null ? Number(booking.Latitude) : NaN;
  const bookingLng = booking?.Longitude != null ? Number(booking.Longitude) : NaN;
  const hasDropCoords = !Number.isNaN(dropLat) && !Number.isNaN(dropLng) && dropLat !== 0 && dropLng !== 0;
  const hasBookingCoords = !Number.isNaN(bookingLat) && !Number.isNaN(bookingLng) && bookingLat !== 0 && bookingLng !== 0;

  const garageCoords = hasDropCoords
    ? { latitude: dropLat, longitude: dropLng }
    : hasBookingCoords
      ? { latitude: bookingLat, longitude: bookingLng }
      : location
        ? {
            latitude: location.latitude + GARAGE_OFFSET_LAT,
            longitude: location.longitude + GARAGE_OFFSET_LNG,
          }
        : {
            latitude: DEFAULT_REGION.latitude + GARAGE_OFFSET_LAT,
            longitude: DEFAULT_REGION.longitude + GARAGE_OFFSET_LNG,
          };

  const pickFrom = currentLeg?.PickFrom;
  const pickLat = pickFrom?.Latitude != null ? Number(pickFrom.Latitude) : NaN;
  const pickLng = pickFrom?.Longitude != null ? Number(pickFrom.Longitude) : NaN;
  const hasPickCoords = !Number.isNaN(pickLat) && !Number.isNaN(pickLng);

  const initialRegion = (() => {
    if (location && hasDropCoords) {
      const midLat = (location.latitude + garageCoords.latitude) / 2;
      const midLng = (location.longitude + garageCoords.longitude) / 2;
      const deltaLat = Math.max(0.02, Math.abs(location.latitude - garageCoords.latitude) * 1.2);
      const deltaLng = Math.max(0.02, Math.abs(location.longitude - garageCoords.longitude) * 1.2);
      return { latitude: midLat, longitude: midLng, latitudeDelta: deltaLat, longitudeDelta: deltaLng };
    }
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return {
      ...DEFAULT_REGION,
      latitude: hasDropCoords ? (garageCoords.latitude + DEFAULT_REGION.latitude) / 2 : (DEFAULT_REGION.latitude + garageCoords.latitude) / 2,
      longitude: hasDropCoords ? (garageCoords.longitude + DEFAULT_REGION.longitude) / 2 : (DEFAULT_REGION.longitude + garageCoords.longitude) / 2,
    };
  })();

  const onRefresh = async () => {
    if (!booking?.BookingID || !booking?.TechID) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}Bookings/GetAssignedBookings?Id=${booking.TechID}`
      );
      if (response.data && response.data.length > 0) {
        const fromApi = response.data.find((b) => b.BookingID === booking.BookingID);
        if (fromApi) {
          setUpdatedBooking(fromApi);
          navigation.setParams({ booking: fromApi });
        }
      }
    } catch (error) {
      console.error("Error refreshing booking:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [booking?.BookingID])
  );

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setLocation(coords);
        if (mapRef.current?.animateToRegion) {
          mapRef.current.animateToRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500);
        }
      } catch (e) {}
    })();
  }, []);

  const handleLetsStart = async () => {
    if (carPickupDeliveryId > 0) {
      try {
        await axios.post(
          `${API_BASE_URL}ServiceImages/InsertTracking`,
          { pickDropId: carPickupDeliveryId, status: "in_transit" },
          { headers: { "Content-Type": "application/json" } }
        );
        await onRefresh();
      } catch (e) {
        console.error("InsertTracking Error:", e);
      }
    }

    try {
      const statusPayload = {
        bookingID: Number(booking?.BookingID || 0),
        serviceType: booking?.ServiceType || "ServiceAtGarage",
        routeType,
        action: "in_transit",
        updatedBy: Number(booking?.TechID || 3),
        role: "Technician",
      };
      console.log("UpdateBookingStatus Payload (in_transit):", JSON.stringify(statusPayload, null, 2));
      await axios.post(
        `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
        statusPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("UpdateBookingStatus posted for in_transit");
    } catch (e) {
      console.error("UpdateBookingStatus Error:", e?.response?.data || e);
    }

    const dest = `${garageCoords.latitude},${garageCoords.longitude}`;
    const url = location
      ? `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${dest}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    Linking.openURL(url).catch(() => {});
  };

  const handleNavigate = () => {
    if (location) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${garageCoords.latitude},${garageCoords.longitude}&travelmode=driving`;
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleReached = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}ServiceImages/InsertTracking`,
        { pickDropId: carPickupDeliveryId, status: "drop_reached" },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("InsertTracking Error:", e);
    }

    try {
      const statusPayload = {
        bookingID: Number(booking?.BookingID || 0),
        serviceType: booking?.ServiceType || "ServiceAtGarage",
        routeType,
        action: "drop_reached",
        updatedBy: Number(booking?.TechID || 3),
        role: "Technician",
      };
      console.log("UpdateBookingStatus Payload (drop_reached):", JSON.stringify(statusPayload, null, 2));
      await axios.post(
        `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
        statusPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("UpdateBookingStatus posted for drop_reached");
    } catch (e) {
      console.error("UpdateBookingStatus Error:", e?.response?.data || e);
    }

    const phoneNumber =
      displayBooking?.PhoneNumber ||
      displayBooking?.Leads?.PhoneNumber ||
      displayBooking?.PickupDelivery?.DropAt?.PersonNumber ||
      "";
    try {
      const payload = {
        carPickupDeliveryId: Number(carPickupDeliveryId),
        otpType: "Delivery",
        phoneNumber: String(phoneNumber).trim(),
      };
      const response = await axios.post(
        `${API_BASE_URL}ServiceImages/GenerateOTP`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("OTP ================>>>>>>>>>>", payload);
    } catch (e) {}
    navigation.navigate("DropCarAtGarage", {
      booking: displayBooking,
      estimatedTime,
      actualTime,
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
          {hasPickCoords && (
            <Marker
              coordinate={{ latitude: pickLat, longitude: pickLng }}
              title="Pickup (Customer)"
              description={pickFrom?.Address || "Customer location"}
              pinColor={color.neutral[500]}
            />
          )}
          <Marker
            coordinate={garageCoords}
            title="Drop location (Garage)"
            description={dropAt?.Address || "Drop car at garage"}
            pinColor={color.primary}
          />
        </MapView>
      </View>

      <View style={styles.buttonsSection}>
        <ScrollView
          style={styles.actionsScroll}
          contentContainerStyle={styles.actionsContent}
          showsVerticalScrollIndicator={false}
        >

          {driverStatus === "car_picked" && (
            <TouchableOpacity style={styles.startButton} onPress={handleLetsStart}>
              <Ionicons name="rocket" size={20} color="#fff" style={{ marginRight: 8 }} />
              <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Let's Start</CustomText>
            </TouchableOpacity>
          )}

          {driverStatus === "in_transit" && (
            <View style={styles.twoButtonsRow}>
              <TouchableOpacity style={[styles.twoButton, styles.navButton]} onPress={handleNavigate}>
                <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 4 }} />
                <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]} numberOfLines={1}>Navigate</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.twoButton, styles.reachedButton]} onPress={handleReached}>
                <Ionicons name="flag" size={18} color="#fff" style={{ marginRight: 4 }} />
                <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]} numberOfLines={1}>Reached</CustomText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  mapWrap: { flex: 1 },
  buttonsSection: {
    backgroundColor: color.background,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  actionsScroll: { maxHeight: 220 },
  actionsContent: { paddingBottom: 8 },
  regNumberBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: color.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.primary,
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: color.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
    elevation: 3,
  },
  twoButtonsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    marginTop: 10,
  },
  twoButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 3,
  },
  navButton: {
    backgroundColor: color.alertInfo,
  },
  reachedButton: {
    backgroundColor: color.yellow,
  },
});
