import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import { API_BASE_URL, GOOGLE_MAPS_APIKEY } from "@env";
import { stopBackgroundTracking } from "../utils/locationTracker";

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

export default function ServiceAtGarageMap() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking: bookingParam, estimatedTime = 0, actualTime = 0, carRegistrationNumber = "" } = route?.params || {};
  const [booking, setBooking] = useState(bookingParam || null);
  const [updatedBooking, setUpdatedBooking] = useState(bookingParam || null);
  const displayBooking = updatedBooking?.BookingID === booking?.BookingID && updatedBooking ? updatedBooking : booking;
  // Car pickup done = show "Drop Car at Garage" instead of "Pickup Car" when status is Reached
  const carPickupDone = !!(
    displayBooking?.CarPickUpDate ?? displayBooking?.CarPickupDate
  );
  const statusForButtons = displayBooking?.PickupDelivery?.DriverStatus;

  const fullAddress = booking?.FullAddress || booking?.Leads?.FullAddress || booking?.Leads?.City || "";
  const rawLat = booking?.latitude ?? booking?.Latitude;
  const rawLng = booking?.longitude ?? booking?.Longitude;
  const hasValidCoordinates =
    rawLat != null &&
    rawLng != null &&
    !isNaN(Number(rawLat)) &&
    !isNaN(Number(rawLng)) &&
    Number.isFinite(Number(rawLat)) &&
    Number.isFinite(Number(rawLng));
  const Latitude = hasValidCoordinates ? Number(rawLat) : null;
  const Longitude = hasValidCoordinates ? Number(rawLng) : null;
  const destination = hasValidCoordinates ? { Latitude: parseFloat(Latitude), Longitude: parseFloat(Longitude) } : null;

  const [location, setLocation] = useState(null);
  const [addressLocation, setAddressLocation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef(null);

  const geocodeAddress = async (address) => {
    if (!address || address.trim() === "") return null;
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        { params: { address, key: GOOGLE_MAPS_APIKEY } }
      );
      if (response.data?.status === "OK" && response.data.results?.length > 0) {
        const loc = response.data.results[0].geometry.location;
        return { Latitude: loc.lat, Longitude: loc.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const fetchRoute = async (origin, dest) => {
    if (!origin?.Latitude || !origin?.Longitude || !dest?.Latitude || !dest?.Longitude) return;
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

  const onRefresh = async () => {
    if (!booking?.BookingID || !booking?.TechID) return;
    setRefreshing(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}Bookings/GetAssignedBookings?Id=${booking.TechID}`
      );
      const data = res?.data;
      if (Array.isArray(data) && data.length > 0) {
        const fromApi = data.find((b) => b.BookingID === booking.BookingID);
        if (fromApi) {
          setUpdatedBooking((prev) => {
            const statusOrder = {
              assigned: 1,
              pickup_started: 2,
              pickup_reached: 3,
              car_picked: 4,
              in_transit: 5,
              drop_reached: 6,
              completed: 7,
              cancelled: 8,
            };
            const prevStatus = prev?.PickupDelivery?.DriverStatus || "assigned";
            const apiStatus = fromApi?.PickupDelivery?.DriverStatus || "assigned";
            const prevOrder = statusOrder[prevStatus] ?? 0;
            const apiOrder = statusOrder[apiStatus] ?? 0;
            if (apiOrder < prevOrder) return { ...fromApi, PickupDelivery: { ...fromApi.PickupDelivery, DriverStatus: prevStatus } };
            return fromApi;
          });
        }
      }
    } catch (err) {}
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (booking?.BookingID) onRefresh();
    }, [booking?.BookingID])
  );

  useEffect(() => {
    if (fullAddress && fullAddress.trim() !== "" && !addressLocation) {
      setIsGeocoding(true);
      geocodeAddress(fullAddress).then((loc) => {
        setIsGeocoding(false);
        if (loc) setAddressLocation(loc);
      });
    }
  }, [fullAddress]);

  useEffect(() => {
    let sub = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 1 },
          (loc) =>
            setLocation({
              Latitude: loc.coords.latitude,
              Longitude: loc.coords.longitude,
            })
        );
      } catch (e) {}
    })();
    return () => {
      try {
        sub?.remove?.();
      } catch (_) {}
    };
  }, []);

  useEffect(() => {
    const dest = addressLocation
      ? { Latitude: addressLocation.Latitude, Longitude: addressLocation.Longitude }
      : destination;
    if (location && dest) fetchRoute(location, dest);
  }, [location, addressLocation, destination]);


  const openGoogleMaps = async () => {
    try {
      const destCoords = addressLocation || (hasValidCoordinates && destination) ? addressLocation || destination : null;
      let url = "";
      if (location && destCoords) {
        url = `https://www.google.com/maps/dir/?api=1&origin=${location.Latitude},${location.Longitude}&destination=${destCoords.Latitude},${destCoords.Longitude}&travelmode=driving`;
      } else if (destCoords) {
        url = `https://www.google.com/maps/?api=1&q=${destCoords.Latitude},${destCoords.Longitude}`;
      } else if (fullAddress?.trim()) {
        url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}&travelmode=driving`;
      }
      if (url && (await Linking.canOpenURL(url))) await Linking.openURL(url);
    } catch (e) {}
  };

  const handleStartRide = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}ServiceImages/InsertTracking`,
        {
          pickDropId: Number(displayBooking?.PickupDelivery?.Id || 0),
          status: "pickup_started",
        },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("InsertTracking Error:", e);
    }

    try {
      const statusPayload = {
        bookingID: Number(displayBooking?.BookingID || 0),
        serviceType: displayBooking?.ServiceType || "ServiceAtGarage",
        routeType: displayBooking?.PickupDelivery?.RouteType || "CustomerToDealer",
        action: "pickup_started",
        updatedBy: Number(displayBooking?.TechID || 3),
        role: "Technician",
      };
      console.log("UpdateBookingStatus Payload (pickup_started):", JSON.stringify(statusPayload, null, 2));
      await axios.post(
        `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
        statusPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("UpdateBookingStatus posted for pickup_started");
    } catch (e) {
      console.error("UpdateBookingStatus Error:", e?.response?.data || e);
    }

    const next = {
      ...booking,
      PickupDelivery: {
        ...booking.PickupDelivery,
        DriverStatus: "pickup_started",
      },
    };
    setUpdatedBooking(next);
    navigation.setParams({ booking: next });
    onRefresh();
    await openGoogleMaps();
  };

  const handleNavigate = () => openGoogleMaps();

  const handleReached = async () => {
    const carPickupDeliveryId = Number(displayBooking?.PickupDelivery?.Id ?? 0);
    const phoneNumber = displayBooking?.PhoneNumber || displayBooking?.Leads?.PhoneNumber || "";
    try {
      await axios.post(
        `${API_BASE_URL}ServiceImages/InsertTracking`,
        {
          pickDropId: Number(carPickupDeliveryId),
          status: "pickup_reached",
        },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("InsertTracking Error:", e);
    }

    try {
      const statusPayload = {
        bookingID: Number(displayBooking?.BookingID || 0),
        serviceType: displayBooking?.ServiceType || "ServiceAtGarage",
        routeType: displayBooking?.PickupDelivery?.RouteType || "CustomerToDealer",
        action: "pickup_reached",
        updatedBy: Number(displayBooking?.TechID || 3),
        role: "Technician",
      };
      console.log("UpdateBookingStatus Payload (pickup_reached):", JSON.stringify(statusPayload, null, 2));
      await axios.post(
        `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
        statusPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("UpdateBookingStatus posted for pickup_reached");
    } catch (e) {
      console.error("UpdateBookingStatus Error:", e?.response?.data || e);
    }

    try {
      console.log("GenerateOTP==================", carPickupDeliveryId, "Pickup", phoneNumber);
      await axios.post(
        `${API_BASE_URL}ServiceImages/GenerateOTP`,
        {
          carPickupDeliveryId,
          otpType: "Pickup",
          phoneNumber: String(phoneNumber).trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("GenerateOTP Error:", e);
    }
    const next = {
      ...booking,
      PickupDelivery: {
        ...booking.PickupDelivery,
        DriverStatus: "pickup_reached",
      },
    };
    setUpdatedBooking(next);
    navigation.setParams({ booking: next });
    onRefresh();
    try {
      await stopBackgroundTracking();
    } catch (_) {}
    navigation.navigate("CarPickUp", { booking: next });
  };

  const handleDropCarAtGarage = async () => {
    const carPickupDeliveryId = Number(displayBooking?.PickupDelivery?.Id ?? 0);
    const phoneNumber = displayBooking?.PhoneNumber || displayBooking?.Leads?.PhoneNumber || "";
    try {
      await axios.post(
        `${API_BASE_URL}ServiceImages/GenerateOTP`,
        {
          carPickupDeliveryId,
          otpType: "Delivery",
        },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      // continue even if OTP call fails
    }

    try {
      const statusPayload = {
        bookingID: Number(displayBooking?.BookingID || 0),
        serviceType: displayBooking?.ServiceType || "ServiceAtGarage",
        routeType: displayBooking?.PickupDelivery?.RouteType || "CustomerToDealer",
        action: "in_transit",
        updatedBy: Number(displayBooking?.TechID || 3),
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

    navigation.navigate("DropCarAtGarage", {
      booking: displayBooking,
      estimatedTime: estimatedTime || 0,
      actualTime: actualTime || 0,
      carRegistrationNumber:
        carRegistrationNumber || displayBooking?.CarRegistrationNumber || "",
    });
  };

  if (!booking) {
    return (
      <View style={[globalStyles.bgcontainer, globalStyles.justifycenter, globalStyles.alineItemscenter]}>
        <CustomText style={globalStyles.f16Bold}>No booking data.</CustomText>
      </View>
    );
  }

  const mapDestination = addressLocation || (hasValidCoordinates && { Latitude, Longitude });
  const initialRegion = mapDestination
    ? {
        latitude: mapDestination.Latitude,
        longitude: mapDestination.Longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : { latitude: 0, longitude: 0, latitudeDelta: 0.01, longitudeDelta: 0.01 };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        {(mapDestination || isGeocoding) ? (
          isGeocoding ? (
            <View style={[styles.mapPlaceholder, globalStyles.justifycenter, globalStyles.alineItemscenter]}>
              <CustomText style={globalStyles.f14Medium}>Loading location...</CustomText>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={initialRegion}
              showsUserLocation={!!location}
              showsMyLocationButton={!!location}
            >
              {addressLocation && (
                <Marker
                  coordinate={{ latitude: addressLocation.Latitude, longitude: addressLocation.Longitude }}
                  title="Customer location"
                  description="Customer / pickup location"
                  pinColor="red"
                />
              )}
              {hasValidCoordinates && !addressLocation && (
                <Marker coordinate={{ latitude: Latitude, longitude: Longitude }} title="Customer location" description="Destination" pinColor="red" />
              )}
              {routeCoords?.length > 0 && location && mapDestination && (
                <Polyline
                  coordinates={routeCoords.map((c) => ({ latitude: c.Latitude, longitude: c.Longitude }))}
                  strokeColor="#0000FF"
                  strokeWidth={3}
                />
              )}
            </MapView>
          )
        ) : (
          <View style={[styles.mapPlaceholder, globalStyles.justifycenter, globalStyles.alineItemscenter]}>
            <CustomText style={globalStyles.f14Medium}>No location available</CustomText>
          </View>
        )}
      </View>

      <View style={styles.buttonsSection}>
        <ScrollView
          style={styles.actionsScroll}
          contentContainerStyle={styles.actionsContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
        {/* First: only Let's Start. On click → update to StartJourney, then show only Navigate + Reached */}
        {statusForButtons === "assigned" && (
          <TouchableOpacity style={styles.startButton} onPress={handleStartRide}>
            <Ionicons name="rocket" size={20} color="#fff" style={{ marginRight: 8 }} />
            <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Let's Start</CustomText>
          </TouchableOpacity>
        )}

        {/* StartJourney / ServiceStarted: only Navigate and Reached */}
        {statusForButtons === "pickup_started" && (
          <View style={styles.startreach}>
            <TouchableOpacity style={[styles.navButton, { flex: 1 }]} onPress={handleNavigate}>
              <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
              <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Navigate</CustomText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.reachedButton, { flex: 1 }]} onPress={handleReached}>
              <Ionicons name="flag" size={20} color="#fff" style={{ marginRight: 8 }} />
              <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Reached</CustomText>
            </TouchableOpacity>
          </View>
        )}

        {/* Reached: hide Navigate/Reached, show Pickup Car (or Drop Car at Garage if pickup done) */}
        {statusForButtons === "pickup_reached" && !carPickupDone && (
          <TouchableOpacity
            style={[styles.startButton, { marginTop: 10 }]}
            onPress={() => navigation.navigate("CarPickUp", { booking: displayBooking })}
          >
            <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Pickup Car</CustomText>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
        {statusForButtons === "pickup_reached" && carPickupDone && (
        <TouchableOpacity
            style={[styles.startButton, { marginTop: 10 }]}
            onPress={() => navigation.navigate("CarPickUp", { booking: displayBooking })}
          >
            <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Pickup Car</CustomText>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}

        {statusForButtons === "completed" && (
          <View style={styles.completedHint}>
            <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500]}>This booking is completed.</CustomText>
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
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.neutral[200],
  },
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
  actionsScroll: { maxHeight: 280 },
  actionsContent: { paddingBottom: 8 },
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
  navButton: {
    backgroundColor: color.alertInfo,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 3,
  },
  reachedButton: {
    backgroundColor: color.yellow,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 3,
  },
  dropButton: {
    backgroundColor: color.alertInfo,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 3,
  },
  startreach: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  completedHint: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
