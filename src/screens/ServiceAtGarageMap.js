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
  const bookingParam = route?.params?.booking;
  const [booking, setBooking] = useState(bookingParam || null);
  const [updatedBooking, setUpdatedBooking] = useState(bookingParam || null);
  const displayBooking = updatedBooking?.BookingID === booking?.BookingID && updatedBooking ? updatedBooking : booking;

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
            const statusOrder = { Confirmed: 1, StartJourney: 2, Reached: 3, ServiceStarted: 4, Completed: 5 };
            const prevOrder = statusOrder[prev?.BookingStatus] ?? 0;
            const apiOrder = statusOrder[fromApi.BookingStatus] ?? 0;
            if (apiOrder < prevOrder) return { ...fromApi, BookingStatus: prev.BookingStatus };
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

  const updateTechnicianTracking = async (actionType) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}TechnicianTracking/UpdateTechnicianTracking`,
        { bookingID: Number(booking.BookingID), actionType },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res?.data?.status === false || res?.data?.isValid === false) {
        Alert.alert("Error", res?.data?.message || `Failed to update ${actionType}.`);
        return false;
      }
      return true;
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || `Failed to send ${actionType}.`);
      return false;
    }
  };

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
    const ok = await updateTechnicianTracking("StartJourney");
    if (!ok) return;
    const next = { ...booking, BookingStatus: "StartJourney" };
    setUpdatedBooking(next);
    navigation.setParams({ booking: next });
    onRefresh();
    await openGoogleMaps();
  };

  const handleNavigate = () => openGoogleMaps();

  const handleReached = async () => {
    const ok = await updateTechnicianTracking("Reached");
    if (!ok) return;
    const next = { ...booking, BookingStatus: "Reached" };
    setUpdatedBooking(next);
    navigation.setParams({ booking: next });
    onRefresh();
    try {
      await stopBackgroundTracking();
    } catch (_) {}
    navigation.navigate("CarPickUp", { booking: next });
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
                  title="Customer"
                  pinColor="red"
                />
              )}
              {hasValidCoordinates && !addressLocation && (
                <Marker coordinate={{ latitude: Latitude, longitude: Longitude }} title="Destination" pinColor="red" />
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

      <ScrollView
        style={styles.actionsScroll}
        contentContainerStyle={styles.actionsContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {displayBooking.BookingStatus !== "Completed" && (
          <>
            {displayBooking.BookingStatus === "Confirmed" && (
              <TouchableOpacity style={styles.startButton} onPress={handleStartRide}>
                <Ionicons name="rocket" size={20} color="#fff" style={{ marginRight: 8 }} />
                <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Start Journey</CustomText>
              </TouchableOpacity>
            )}
            {(displayBooking.BookingStatus === "StartJourney" || displayBooking.BookingStatus === "ServiceStarted") && (
              <View style={styles.startreach}>
                <TouchableOpacity style={[styles.navButton, { flex: 1 }]} onPress={handleNavigate}>
                  <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Navigate</CustomText>
                </TouchableOpacity>
                {displayBooking.BookingStatus === "StartJourney" && (
                  <TouchableOpacity style={[styles.reachedButton, { flex: 1 }]} onPress={handleReached}>
                    <Ionicons name="flag" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Reached</CustomText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
        {displayBooking.BookingStatus === "Reached" && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate("CarPickUp", { booking: displayBooking })}
          >
            <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>Pickup Car</CustomText>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  mapWrap: { flex: 1, minHeight: 280 },
  mapPlaceholder: {
    flex: 1,
    minHeight: 280,
    backgroundColor: color.neutral[200],
  },
  actionsScroll: { flexGrow: 0 },
  actionsContent: { padding: 16, paddingBottom: 24 },
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
  startreach: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
});
