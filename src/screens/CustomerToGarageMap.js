import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import { API_BASE_URL, GOOGLE_MAPS_APIKEY } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

function decodePolyline(t) {
  const points = [];
  let index = 0;
  const len = t.length;
  let lat = 0;
  let lng = 0;
  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push({ Latitude: lat / 1e5, Longitude: lng / 1e5 });
  }
  return points;
}

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
  const [loadingLetsStart, setLoadingLetsStart] = useState(false);
  const [loadingReached, setLoadingReached] = useState(false);
  const displayBooking = updatedBooking || booking;
  const mapRef = useRef(null);
  const [addressCoords, setAddressCoords] = useState(null);
  const [dropAddressCoords, setDropAddressCoords] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);

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

  const dropAt = currentLeg?.DropAt ?? (Array.isArray(booking?.PickupDelivery) ? booking.PickupDelivery[0]?.DropAt : booking?.PickupDelivery?.DropAt);
  const pickFrom = currentLeg?.PickFrom ?? (Array.isArray(booking?.PickupDelivery) ? booking.PickupDelivery[0]?.PickFrom : booking?.PickupDelivery?.PickFrom);
  const addressForPickup =
    (typeof pickFrom?.Address === "string" && pickFrom.Address.trim() !== "" ? pickFrom.Address : null) ||
    displayBooking?.FullAddress ||
    booking?.FullAddress ||
    displayBooking?.Leads?.FullAddress ||
    booking?.Leads?.City ||
    "";
  const addressForDrop =
    (typeof dropAt?.Address === "string" && dropAt.Address.trim() !== "" ? dropAt.Address : null) ||
    "";

  const dropLat = dropAt?.Latitude != null ? Number(dropAt.Latitude) : NaN;
  const dropLng = dropAt?.Longitude != null ? Number(dropAt.Longitude) : NaN;
  const bookingLat = booking?.Latitude != null ? Number(booking.Latitude) : NaN;
  const bookingLng = booking?.Longitude != null ? Number(booking.Longitude) : NaN;
  const hasDropCoords = !Number.isNaN(dropLat) && !Number.isNaN(dropLng) && dropLat !== 0 && dropLng !== 0;
  const hasBookingCoords = !Number.isNaN(bookingLat) && !Number.isNaN(bookingLng) && bookingLat !== 0 && bookingLng !== 0;

  const getCoordinatesFromAddress = async (address, setter) => {
    try {
      if (!address || String(address).trim() === "") return;
      const normalizedAddress = String(address).replace(/\r?\n/g, ", ").trim();
      if (!normalizedAddress) return;
      setIsGeocoding(true);
      const result = await Location.geocodeAsync(normalizedAddress);
      setIsGeocoding(false);
      if (result && result.length > 0) {
        const { latitude, longitude } = result[0];
        setter({ Latitude: latitude, Longitude: longitude });
      }
    } catch (error) {
      setIsGeocoding(false);
      console.log("Geocoding error:", error);
    }
  };

  useEffect(() => {
    if (addressForPickup && addressForPickup.trim() !== "") {
      getCoordinatesFromAddress(addressForPickup, setAddressCoords);
    }
  }, [addressForPickup]);

  useEffect(() => {
    if (addressForDrop && addressForDrop.trim() !== "") {
      getCoordinatesFromAddress(addressForDrop, setDropAddressCoords);
    }
  }, [addressForDrop]);

  const garageCoords = dropAddressCoords
    ? { latitude: dropAddressCoords.Latitude, longitude: dropAddressCoords.Longitude }
    : hasDropCoords
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

  const pickLat = pickFrom?.Latitude != null ? Number(pickFrom.Latitude) : addressCoords?.Latitude ?? NaN;
  const pickLng = pickFrom?.Longitude != null ? Number(pickFrom.Longitude) : addressCoords?.Longitude ?? NaN;
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
    const techID = await AsyncStorage.getItem("techID");
    if (!booking?.BookingID || !techID) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}Bookings/GetAssignedBookings?Id=${techID}`
      );
      const raw = response?.data?.data ?? response?.data;
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      if (list.length > 0) {
        const fromApi = list.find((b) => b.BookingID === booking.BookingID);
        if (fromApi) {
          setUpdatedBooking(fromApi);
          navigation.setParams({ booking: fromApi });
        }
      }
    } catch (error) {
      console.error("Error refreshing booking:", error);
    }
  };

  // useFocusEffect(
  //   useCallback(() => {
  //     onRefresh();
  //     const onBack = () => {
  //       navigation.navigate("Booking");
  //       return true;
  //     };
  //     const subscription = BackHandler.addEventListener("hardwareBackPress", onBack);
  //     return () => subscription.remove();
  //   }, [booking?.BookingID, navigation])
  // );

  const fetchRoute = async (origin, dest) => {
    const hasOrigin = origin != null && Number.isFinite(origin.Latitude) && Number.isFinite(origin.Longitude);
    const hasDest = dest != null && Number.isFinite(dest.Latitude) && Number.isFinite(dest.Longitude);
    if (!hasOrigin || !hasDest) {
      setRouteCoords([]);
      return;
    }
    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${origin.Latitude},${origin.Longitude}`,
            destination: `${dest.Latitude},${dest.Longitude}`,
            key: GOOGLE_MAPS_APIKEY,
          },
        }
      );
      const { status, routes } = res?.data || {};
      if (status !== "OK" || !routes?.[0]?.overview_polyline?.points) {
        setRouteCoords([]);
        return;
      }
      setRouteCoords(decodePolyline(routes[0].overview_polyline.points));
    } catch (e) {
      setRouteCoords([]);
    }
  };

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
      } catch (e) { }
    })();
  }, []);

  useEffect(() => {
    if (location && garageCoords) {
      const origin = { Latitude: location.latitude, Longitude: location.longitude };
      const dest = { Latitude: garageCoords.latitude, Longitude: garageCoords.longitude };
      fetchRoute(origin, dest);
    }
  }, [location, garageCoords?.latitude, garageCoords?.longitude]);

  useEffect(() => {
    if (routeCoords.length > 0 && mapRef.current?.fitToCoordinates) {
      mapRef.current.fitToCoordinates(
        routeCoords.map((c) => ({ latitude: c.Latitude, longitude: c.Longitude })),
        { edgePadding: { top: 80, right: 40, bottom: 80, left: 40 }, animated: true }
      );
    }
  }, [routeCoords]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        onRefresh();
      }, 1000);

      return () => clearTimeout(timer);
    }, [booking?.BookingID])
  );

  const handleLetsStart = async () => {
    setLoadingLetsStart(true);
    const techID = await AsyncStorage.getItem("techID");

    // ✅ 1. Update UI instantly
    setUpdatedBooking((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (Array.isArray(updated.PickupDelivery)) {
        updated.PickupDelivery = updated.PickupDelivery.map((leg, index) =>
          index === 0 ? { ...leg, DriverStatus: "in_transit" } : leg
        );
      } else if (updated.PickupDelivery) {
        updated.PickupDelivery = { ...updated.PickupDelivery, DriverStatus: "in_transit" };
      }
      return updated;
    });

    // ✅ 2. Open Google Maps immediately — don't wait for API calls
    const dest = `${garageCoords.latitude},${garageCoords.longitude}`;
    const url = location
      ? `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${dest}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    setLoadingLetsStart(false);
    Linking.openURL(url).catch(() => { });

    // ✅ 3. Fire API calls in the background (don't await)
    (async () => {
      try {
        if (carPickupDeliveryId > 0) {
          await axios.post(
            `${API_BASE_URL}ServiceImages/InsertTracking`,
            { pickDropId: carPickupDeliveryId, status: "in_transit" },
            { headers: { "Content-Type": "application/json" } }
          );
        }
        await axios.post(
          `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
          {
            bookingID: Number(booking?.BookingID || 0),
            serviceType: booking?.ServiceType || "ServiceAtGarage",
            routeType:
              booking?.PickupDelivery?.[0]?.PickFrom?.RouteType ??
              booking?.PickupDelivery?.[0]?.DropAt?.RouteType ??
              booking?.PickupDelivery?.[0]?.RouteType ??
              "CustomerToDealer",
            action: "in_transit",
            updatedBy: Number(techID),
            role: "Technician",
          },
          { headers: { "Content-Type": "application/json" } }
        );
        await onRefresh();
      } catch (e) {
        console.error("Error:", e);
      }
    })();
  };



  const handleNavigate = () => {
    if (location) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${garageCoords.latitude},${garageCoords.longitude}&travelmode=driving`;
      Linking.openURL(url).catch(() => { });
    }
  };

  const handleReached = async () => {
    setLoadingReached(true);  
    const techID = await AsyncStorage.getItem("techID");
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
        routeType:
          booking?.PickupDelivery?.[0]?.PickFrom?.RouteType ??
          booking?.PickupDelivery?.[0]?.DropAt?.RouteType ??
          booking?.PickupDelivery?.[0]?.RouteType ??
          "CustomerToDealer",
        action: "drop_reached",
        updatedBy: Number(techID),
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

    if (routeType !== "DealerToCustomer") {
    const phoneNumber = displayBooking?.PickupDelivery[0]?.DropAt?.PersonNumber || "";
    console.log("phoneNumber===============", phoneNumber);
    try {
      const payload = {
        // CarPickupDeliveryId: Number(carPickupDeliveryId),
        carPickupDeliveryId: Number(carPickupDeliveryId),
        otpType: "Delivery",
        phoneNumber: String(phoneNumber).trim(),
      };
      const response = await axios.post(
        `${API_BASE_URL}ServiceImages/GenerateOTP`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("GenerateOTP response:", response?.data);
    } catch (e) {
      console.error("GenerateOTP Error:", e?.response?.data || e);
    }
  }
    setLoadingReached(false);
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
        {(dropAt && (addressForDrop || hasDropCoords)) || dropAddressCoords || addressCoords || isGeocoding ? (
          isGeocoding && !addressCoords && !dropAddressCoords && !hasDropCoords ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: color.background, justifyContent: "center", alignItems: "center" }]}>
              <CustomText style={globalStyles.f14Medium}>Loading location...</CustomText>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={initialRegion}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {(hasPickCoords || addressCoords) && (
                <Marker
                  coordinate={{ latitude: pickLat, longitude: pickLng }}
                  title="Pickup (Customer)"
                  description={pickFrom?.Address || addressForPickup || "Customer location"}
                  pinColor={color.neutral[500]}
                />
              )}
              <Marker
                coordinate={garageCoords}
                title="Drop location (Garage)"
                description={dropAt?.Address || addressForDrop || "Drop car at garage"}
                pinColor={color.primary}
              />
              {routeCoords?.length > 0 && location && (
                <Polyline
                  coordinates={routeCoords.map((c) => ({ latitude: c.Latitude, longitude: c.Longitude }))}
                  strokeColor="#0000FF"
                  strokeWidth={3}
                />
              )}
            </MapView>
          )
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: color.background, justifyContent: "center", alignItems: "center" }]}>
            <CustomText style={globalStyles.f12Medium}>No location available</CustomText>
          </View>
        )}
      </View>

      <View style={styles.buttonsSection}>
        <ScrollView
          style={styles.actionsScroll}
          contentContainerStyle={styles.actionsContent}
          showsVerticalScrollIndicator={false}
        >

          {(driverStatus === "pickup_reached" || driverStatus === "car_picked") && (
            <TouchableOpacity
              style={[styles.startButton, loadingLetsStart && { opacity: 0.7 }]}
              onPress={handleLetsStart}
              disabled={loadingLetsStart}
            >
              {loadingLetsStart ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Let's Start</CustomText>
                </>
              )}
            </TouchableOpacity>
          )}

          {driverStatus === "in_transit" && (
            <View style={styles.twoButtonsRow}>
              <TouchableOpacity style={[styles.twoButton, styles.navButton]} onPress={handleNavigate}>
                <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 4 }} />
                <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]} numberOfLines={1}>Navigate</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.twoButton, styles.reachedButton, loadingReached && { opacity: 0.7 }]}
                onPress={handleReached}
                disabled={loadingReached}
              >
                {loadingReached ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="flag" size={18} color="#fff" style={{ marginRight: 4 }} />
                    <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]} numberOfLines={1}>Reached</CustomText>
                  </>
                )}
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