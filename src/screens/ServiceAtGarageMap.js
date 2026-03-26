import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
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
import { StatusBar } from "expo-status-bar";
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
  const pd = displayBooking?.PickupDelivery;
  const currentLeg = Array.isArray(pd) ? pd[0] : pd;
  const statusForButtons = currentLeg?.DriverStatus;
  const legId =
    currentLeg?.Id ??
    currentLeg?.ID ??
    currentLeg?.PickupDeliveryId ??
    (pd && !Array.isArray(pd) ? pd?.Id ?? pd?.ID ?? pd?.PickupDeliveryId : undefined);
  const fromArray =
    Array.isArray(pd) && pd.length > 0
      ? pd.reduce((acc, l) => acc ?? l?.Id ?? l?.ID ?? l?.PickupDeliveryId, null)
      : null;
  const pickDropId = Number(
    legId ?? displayBooking?.PickupDeliveryId ?? displayBooking?.CarPickupDeliveryId ?? fromArray ?? 0
  );

  const pickFrom = currentLeg?.PickFrom ?? (Array.isArray(booking?.PickupDelivery) ? booking.PickupDelivery[0]?.PickFrom : booking?.PickupDelivery?.PickFrom);
  const addressForMap =
    (typeof pickFrom?.Address === "string" && pickFrom.Address.trim() !== "" ? pickFrom.Address : null) ||
    displayBooking?.FullAddress ||
    booking?.FullAddress ||
    displayBooking?.Leads?.FullAddress ||
    booking?.Leads?.City ||
    "";
  const fullAddress = addressForMap;
  const rawLat = pickFrom?.Latitude ?? booking?.latitude ?? booking?.Latitude;
  const rawLng = pickFrom?.Longitude ?? booking?.longitude ?? booking?.Longitude;
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
  const [addressCoords, setAddressCoords] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingReached, setLoadingReached] = useState(false);
  const [loadingPickup, setLoadingPickup] = useState(false);
  const mapRef = useRef(null);

  const getCoordinatesFromAddress = async (address) => {
    try {
      if (!address || String(address).trim() === "") return;
      const normalizedAddress = String(address).replace(/\r?\n/g, ", ").trim();
      if (!normalizedAddress) return;
      setIsGeocoding(true);
      const result = await Location.geocodeAsync(normalizedAddress);
      setIsGeocoding(false);
      if (result && result.length > 0) {
        const { latitude, longitude } = result[0];
        setAddressCoords({
          Latitude: latitude,
          Longitude: longitude,
        });
      }
    } catch (error) {
      setIsGeocoding(false);
      console.log("Geocoding error:", error);
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
            const prevPD = prev?.PickupDelivery;
            const apiPD = fromApi?.PickupDelivery;
            const prevStatus =
              (Array.isArray(prevPD) ? prevPD[0]?.DriverStatus : prevPD?.DriverStatus) || "assigned";
            const apiStatus =
              (Array.isArray(apiPD) ? apiPD[0]?.DriverStatus : apiPD?.DriverStatus) || "assigned";
            const prevOrder = statusOrder[prevStatus] ?? 0;
            const apiOrder = statusOrder[apiStatus] ?? 0;
            if (apiOrder < prevOrder) {
              if (Array.isArray(apiPD)) {
                return {
                  ...fromApi,
                  PickupDelivery: apiPD.map((leg, i) =>
                    i === 0 ? { ...leg, DriverStatus: prevStatus } : leg
                  ),
                };
              }
              return { ...fromApi, PickupDelivery: { ...apiPD, DriverStatus: prevStatus } };
            }
            return fromApi;
          });
        }
      }
    } catch (err) { }
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (booking?.BookingID) onRefresh();
    }, [booking?.BookingID])
  );

  useEffect(() => {
    if (addressForMap && String(addressForMap).trim() !== "") {
      getCoordinatesFromAddress(addressForMap);
    }
  }, [addressForMap]);

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
      } catch (e) { }
    })();
    return () => {
      try {
        sub?.remove?.();
      } catch (_) { }
    };
  }, []);

  const mapDestination = addressCoords
    ? { Latitude: addressCoords.Latitude, Longitude: addressCoords.Longitude }
    : hasValidCoordinates
      ? { Latitude, Longitude }
      : null;

  useEffect(() => {
    const dest = addressCoords
      ? { Latitude: addressCoords.Latitude, Longitude: addressCoords.Longitude }
      : hasValidCoordinates
        ? { Latitude, Longitude }
        : null;
    if (location && dest) {
      fetchRoute(location, dest);
    }
  }, [location, addressCoords, hasValidCoordinates, Latitude, Longitude]);

  useEffect(() => {
    if (routeCoords.length > 0 && mapRef.current?.fitToCoordinates) {
      mapRef.current.fitToCoordinates(
        routeCoords.map((c) => ({
          latitude: c.Latitude,
          longitude: c.Longitude,
        })),
        {
          edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
          animated: true,
        }
      );
    }
  }, [routeCoords]);

  const openGoogleMaps = async () => {
    try {
      const destCoords = addressCoords || (hasValidCoordinates && destination) ? addressCoords || destination : null;
      let url = "";
      if (location && destCoords) {
        url = `https://www.google.com/maps/dir/?api=1&origin=${location.Latitude},${location.Longitude}&destination=${destCoords.Latitude},${destCoords.Longitude}&travelmode=driving`;
      } else if (destCoords) {
        url = `https://www.google.com/maps/?api=1&q=${destCoords.Latitude},${destCoords.Longitude}`;
      } else if (fullAddress?.trim()) {
        url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}&travelmode=driving`;
      }
      if (url && (await Linking.canOpenURL(url))) await Linking.openURL(url);
    } catch (e) { }
  };

  const handleStartRide = async () => {
    setLoadingStart(true);
    const techID = await AsyncStorage.getItem("techID");
    if (!pickDropId) {
      console.warn("InsertTracking: no pickDropId (PickupDelivery.Id)");
    }
    try {
      await axios.post(
        `${API_BASE_URL}ServiceImages/InsertTracking`,
        {
          pickDropId,
          status: "pickup_started",
        },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("InsertTracking Error:", e?.response?.data || e);
    }

    try {
      const statusPayload = {
        bookingID: Number(booking?.BookingID || 0),
        serviceType: booking?.ServiceType || "ServiceAtGarage",
        routeType: booking?.PickupDelivery?.[0]?.PickFrom?.RouteType,
        action: "pickup_started",
        updatedBy: Number(techID),
        role: "Technician",
      };
      // console.log("UpdateBookingStatus Payload (pickup_started):", JSON.stringify(statusPayload, null, 2));
      await axios.post(
        `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
        statusPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      // console.log("UpdateBookingStatus posted for pickup_started");
    } catch (e) {
      console.error("UpdateBookingStatus Error:", e?.response?.data || e);
    }

    const currentPD = booking?.PickupDelivery;
    const next = {
      ...booking,
      PickupDelivery: Array.isArray(currentPD)
        ? currentPD.map((leg, i) =>
          i === 0 ? { ...leg, DriverStatus: "pickup_started" } : leg
        )
        : { ...currentPD, DriverStatus: "pickup_started" },
    };
    setUpdatedBooking(next);
    navigation.setParams({ booking: next });
    onRefresh();
    setLoadingStart(false);
    await openGoogleMaps();
  };

  const handleNavigate = () => openGoogleMaps();

  const handleReached = async () => {
    setLoadingReached(true);
    const techID = await AsyncStorage.getItem("techID");
    const phoneNumber = displayBooking?.PickupDelivery[0].PickFrom?.PersonNumber;
    // console.log("phoneNumber===========-----------", phoneNumber)
    try {
      await axios.post(
        `${API_BASE_URL}ServiceImages/InsertTracking`,
        {
          pickDropId,
          status: "pickup_reached",
        },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("InsertTracking Error:", e?.response?.data || e);
    }

    try {
      const statusPayload = {
        bookingID: Number(booking?.BookingID || 0),
        serviceType: booking?.ServiceType || "ServiceAtGarage",
        routeType: booking?.PickupDelivery?.[0]?.PickFrom?.RouteType,
        action: "pickup_reached",
        updatedBy: Number(techID),
        role: "Technician",
      };
      // console.log("UpdateBookingStatus Payload (pickup_reached):", JSON.stringify(statusPayload, null, 2));
      await axios.post(
        `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
        statusPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      // console.log("UpdateBookingStatus posted for pickup_reached");
    } catch (e) {
      console.error("UpdateBookingStatus Error:", e?.response?.data || e);
    }

    try {
      // console.log("GenerateOTP==================", pickDropId, "Pickup", phoneNumber);
      await axios.post(
        `${API_BASE_URL}ServiceImages/GenerateOTP`,
        {
          carPickupDeliveryId: pickDropId,
          otpType: "Pickup",
          phoneNumber: String(phoneNumber).trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("GenerateOTP Error:", e);
    }
    const currentPD = booking?.PickupDelivery;
    const next = {
      ...booking,
      PickupDelivery: Array.isArray(currentPD)
        ? currentPD.map((leg, i) =>
          i === 0 ? { ...leg, DriverStatus: "pickup_reached" } : leg
        )
        : { ...currentPD, DriverStatus: "pickup_reached" },
    };
    setUpdatedBooking(next);
    navigation.setParams({ booking: next });
    onRefresh();
    try {
      await stopBackgroundTracking();
    } catch (_) { }
    setLoadingReached(false);
    navigation.navigate("CarPickUp", { booking: next });
  };

  const handleDropCarAtGarage = async () => {
    const phoneNumber = displayBooking?.PhoneNumber || displayBooking?.Leads?.PhoneNumber || "";
    try {
      await axios.post(
        `${API_BASE_URL}ServiceImages/GenerateOTP`,
        {
          carPickupDeliveryId: Number(pickDropId) || 0,
          otpType: "Delivery",
          phoneNumber: String(phoneNumber || "").trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      // continue even if OTP call fails
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
      <StatusBar backgroundColor='white' barStyle="dark-content" />
      <View style={styles.mapWrap}>
        {(mapDestination || isGeocoding) ? (
          isGeocoding ? (
            <View style={[styles.mapPlaceholder, globalStyles.justifycenter, globalStyles.alineItemscenter]}>
              <CustomText style={globalStyles.f24Medium}>Loading location...</CustomText>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={initialRegion}
              showsUserLocation={!!location}
              showsMyLocationButton={!!location}
            >
              {addressCoords && (
                <Marker
                  coordinate={{
                    latitude: addressCoords.Latitude,
                    longitude: addressCoords.Longitude,
                  }}
                  title="Customer location"
                  description={fullAddress || "Pickup location"}
                  pinColor="red"
                />
              )}
              {hasValidCoordinates && !addressCoords && (
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
            <CustomText style={globalStyles.f12Medium}>No location available</CustomText>
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
            <TouchableOpacity
              style={[styles.startButton, loadingStart && { opacity: 0.7 }]}
              onPress={handleStartRide}
              disabled={loadingStart}
            >
              {loadingStart ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Let's Start</CustomText>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* StartJourney / ServiceStarted: only Navigate and Reached */}
          {statusForButtons === "pickup_started" && (
            <View style={styles.startreach}>
              <TouchableOpacity style={[styles.navButton, { flex: 1 }]} onPress={handleNavigate}>
                <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
                <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Navigate</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reachedButton, { flex: 1 }, loadingReached && { opacity: 0.7 }]}
                onPress={handleReached}
                disabled={loadingReached}
              >
                {loadingReached ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="flag" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Reached</CustomText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Reached: hide Navigate/Reached, show Pickup Car (or Drop Car at Garage if pickup done) */}
          {statusForButtons === "pickup_reached" && !carPickupDone && (
            <TouchableOpacity
              style={[styles.startButton, { marginTop: 10 }, loadingPickup && { opacity: 0.7 }]}
              disabled={loadingPickup}
              onPress={() => { setLoadingPickup(true); navigation.navigate("CarPickUp", { booking: displayBooking }); }}
            >
              {loadingPickup ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Pickup Car</CustomText>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          )}
          {statusForButtons === "pickup_reached" && carPickupDone && (
            <TouchableOpacity
              style={[styles.startButton, { marginTop: 10 }, loadingPickup && { opacity: 0.7 }]}
              disabled={loadingPickup}
              onPress={() => { setLoadingPickup(true); navigation.navigate("CarPickUp", { booking: displayBooking }); }}
            >
              {loadingPickup ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Pickup Car</CustomText>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          )}
          {statusForButtons === "completed" && (
            <View style={styles.completedCard}>
              <Ionicons name="checkmark-circle" size={26} color={color.primary} />
              <CustomText style={styles.completedTitle}>
                Booking Completed
              </CustomText>
              <CustomText style={styles.completedSubText}>
                This service has been successfully completed.
              </CustomText>
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

  completedCard: {
    backgroundColor: "#ecfdf8",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#bbf7ea",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  completedTitle: {
    color: color.primary,
    marginTop: 2,
    ...globalStyles.f16Bold,
  },

  completedSubText: {
    color: color.primary,
    marginTop: 2,
    ...globalStyles.f12Medium,
  },
});