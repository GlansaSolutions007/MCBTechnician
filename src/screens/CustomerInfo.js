import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Image,
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Text,
  Vibration,
  Animated,
  ActivityIndicator,
  AppState,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
// import AvailabilityHeader from "../components/AvailabilityHeader";
import { color } from "../styles/theme";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import {
  API_BASE_URL,
  API_BASE_URL_IMAGE,
  GOOGLE_MAPS_APIKEY,
} from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import defaultAvatar from "../../assets/images/buddy.png";
import {
  startBackgroundTracking,
  stopBackgroundTracking,
} from "../utils/locationTracker";
import { getBookingDisplayData } from "../utils/bookingDisplay";
import BookingPickDropRow from "../components/BookingPickDropRow";
import { RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function CustomerInfo() {
  const navigation = useNavigation();
  const route = useRoute();
  const bookingParam = route?.params?.booking;
  if (!bookingParam) {
    return (
      <View style={[globalStyles.bgcontainer, globalStyles.justifycenter, globalStyles.alineItemscenter, { flex: 1 }]}>
        <StatusBar style="dark" />
        <CustomText style={[globalStyles.f16Bold]}>No booking data.</CustomText>
      </View>
    );
  }
  const booking = bookingParam;

  // Merge booking data with Leads data for missing fields
  const customerName = booking.CustomerName || booking.Leads?.FullName || "";
  const profileImage = booking.ProfileImage || null;
  // Vehicle number: Use booking.VehicleNumber if available, otherwise use Leads.Vehicle.RegistrationNumber
  const vehicleNumber = booking.VehicleNumber
    ? booking.VehicleNumber
    : (booking.Leads?.Vehicle?.RegistrationNumber || "");
  const brandName = booking.BrandName || booking.Leads?.Vehicle?.BrandName || "";
  const modelName = booking.ModelName || booking.Leads?.Vehicle?.ModelName || "";
  const fuelTypeName = booking.FuelTypeName || booking.Leads?.Vehicle?.FuelTypeName || "";
  const vehicleImage = booking.VehicleImage || null;

  // Helper function to format date (YYYY-MM-DD to DD MMM YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to format time (HH:MM:SS to HH:MM AM/PM)
  const formatTime = (timeString) => {
    if (!timeString) return "";
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  const [location, setLocation] = useState(null);
  const [addressLocation, setAddressLocation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const mapRef = useRef(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedBookings, setUpdatedBookings] = useState(booking);
  // Prefer refreshed/updated booking so "go back and open again" shows latest status
  const displayBooking =
    updatedBookings?.BookingID === booking?.BookingID && updatedBookings
      ? updatedBookings
      : booking;
  // Address for display and map: prefer FullAddress (geocode when Lat/Long null)
  const fullAddress =
    displayBooking?.FullAddress ||
    displayBooking?.Leads?.FullAddress ||
    displayBooking?.Leads?.City ||
    (Array.isArray(displayBooking?.PickupDelivery) ? displayBooking.PickupDelivery[0]?.PickFrom?.Address : displayBooking?.PickupDelivery?.PickFrom?.Address) ||
    "";
  const pd = displayBooking?.PickupDelivery;
  const currentLeg = Array.isArray(pd) ? pd[0] : pd;
  // const pickupPhoneNumber =
  //   currentLeg?.PickFrom?.PersonNumber ??
  //   (Array.isArray(displayBooking?.PickupDelivery) && displayBooking.PickupDelivery[0]
  //     ? displayBooking.PickupDelivery[0]?.PickFrom?.PersonNumber
  //     : null) ??
  //   displayBooking?.Leads?.PhoneNumber ??
  //   booking?.PhoneNumber ??
  //   "";
  const pickupPhoneNumber = displayBooking?.PickupDelivery[0]?.PickFrom?.PersonNumber;
  // console.log("pickupPhoneNumber===============", pickupPhoneNumber);

  const assignDateTime = bookingParam?.PickupDelivery?.[0]?.AssignDate;

  const assignDate = assignDateTime
    ? new Date(assignDateTime).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "";

  const assignTime = assignDateTime
    ? new Date(assignDateTime).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";

  const driverStatus =
    displayBooking?.DriverStatus ?? currentLeg?.DriverStatus;
  const legId =
    currentLeg?.Id ??
    currentLeg?.ID ??
    currentLeg?.id ??
    currentLeg?.PickupDeliveryId ??
    (pd && !Array.isArray(pd) ? pd?.Id ?? pd?.ID ?? pd?.PickupDeliveryId : undefined);
  const fromArray =
    Array.isArray(pd) && pd.length > 0
      ? pd.reduce((acc, l) => acc ?? l?.Id ?? l?.ID ?? l?.id ?? l?.PickupDeliveryId, null)
      : null;
  const firstLegId = Array.isArray(pd) && pd.length > 0
    ? (pd[0]?.Id ?? pd[0]?.ID ?? pd[0]?.id ?? pd[0]?.PickupDeliveryId)
    : null;
  const pickDropId = Number(
    legId ?? displayBooking?.PickupDeliveryId ?? displayBooking?.CarPickupDeliveryId ?? fromArray ?? firstLegId ?? 0
  );
  const routeType =
    currentLeg?.PickFrom?.RouteType ??
    (Array.isArray(currentLeg?.PickFrom) ? currentLeg?.PickFrom?.[0]?.RouteType : null) ??
    currentLeg?.DropAt?.RouteType ??
    "CustomerToDealer";
  const [expandedPackages, setExpandedPackages] = useState({});
  const [expandedAddOns, setExpandedAddOns] = useState({});
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStartRide, setLoadingStartRide] = useState(false);
  const [loadingNavigate, setLoadingNavigate] = useState(false);
  const [loadingReached, setLoadingReached] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingCollectCash, setLoadingCollectCash] = useState(false);
  const [pulse] = useState(new Animated.Value(0));
  // const today = new Date().toISOString().split("T")[0];
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
  const ServiceStart = async (item) => {
    setLoadingNext(true);
    navigation.navigate(item.ServiceType === "ServiceAtGarage" ? "CarPickUp" : "ServiceStart", { booking: item });
    setLoadingNext(false);
  };
  const ServiceEnd = async (item) => {
    // Calculate estimated time from booking if available
    const estimatedTime = item.TotalEstimatedDurationMinutes
      ? item.TotalEstimatedDurationMinutes * 60
      : 0;

    // Calculate actual time if service has started
    let actualTime = 0;
    if (item.ServiceStartedAt) {
      const startTime = new Date(item.ServiceStartedAt);
      const currentTime = new Date();
      actualTime = Math.floor((currentTime - startTime) / 1000); // Convert to seconds
    }

    navigation.navigate("ServiceEnd", {
      booking: item,
      estimatedTime: estimatedTime,
      actualTime: actualTime,
    });
  };
  const CollectPayment = async (booking) => {
    setLoadingCollectCash(true);
    navigation.navigate("CollectPayment", { booking: booking });
    setLoadingCollectCash(false);
  };
  const onRefresh = useCallback(async () => {
    const currentBooking = route.params?.booking ?? booking;
    if (!currentBooking?.BookingID) {
      setLoading(false);
      return;
    }
    const techID = await AsyncStorage.getItem("techID"); // ← read from storage
    if (!techID) { setLoading(false); return; }

    setRefreshing(true);
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}Bookings/GetAssignedBookings?Id=${techID}`
      );

      const data = Array.isArray(response?.data) ? response.data : response?.data?.data ?? [];
      if (data.length > 0) {
        const fromApi = data.find(
          (b) => b.BookingID === currentBooking.BookingID
        );
        if (fromApi) {
          // Compute next booking state outside the updater — never call navigation inside setState
          const getStatus = (b) =>
            b?.DriverStatus ??
            (Array.isArray(b?.PickupDelivery)
              ? b.PickupDelivery[0]?.DriverStatus
              : b?.PickupDelivery?.DriverStatus);
          const statusOrder = {
            assigned: 1,
            pickup_started: 2,
            pickup_reached: 3,
            car_picked: 4,
            ServiceStart: 5,
            completed: 6,
            ServiceComplete: 7,
            Confirmed: 1,
            StartJourney: 2,
            Reached: 3,
            ServiceStarted: 4,
            Completed: 5,
          };
          const prevStatus = getStatus(updatedBookings);
          const apiStatus = getStatus(fromApi);
          const prevOrder = statusOrder[prevStatus] ?? 0;
          const apiOrder = statusOrder[apiStatus] ?? 0;
          let nextBooking;
          if (apiOrder < prevOrder && prevStatus) {
            nextBooking = {
              ...fromApi,
              DriverStatus: prevStatus,
              PickupDelivery: Array.isArray(fromApi.PickupDelivery)
                ? fromApi.PickupDelivery.map((leg, i) =>
                  i === 0 ? { ...leg, DriverStatus: prevStatus } : leg
                )
                : { ...fromApi.PickupDelivery, DriverStatus: prevStatus },
            };
          } else {
            nextBooking = fromApi;
          }
          setUpdatedBookings(nextBooking);
          navigation.navigate("customerInfo", { booking: nextBooking });
        }
      }
    } catch (error) {
      console.error("Error refreshing booking:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [booking?.BookingID, route.params?.booking?.BookingID, navigation]);

  // Refetch when screen is focused (initial open + go back and open again)
  useFocusEffect(
    useCallback(() => {
      if (route.params?.booking?.BookingID) onRefresh();
    }, [onRefresh, route.params?.booking?.BookingID])
  );

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: false,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 700,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [loading, pulse]);
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     onRefresh();
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, []);

  // When component mounts or booking changes we look for the start-ride flag.
  // If it's present we know the user previously opened an external map link and may
  // have left the app.  Clearing the flag and refreshing here makes sure the
  // booking data is up‑to‑date and prevents the navigator from landing back on
  // the dashboard when the app comes back into the foreground.
  useEffect(() => {
    const checkIfStarted = async () => {
      try {
        const flag = await AsyncStorage.getItem(
          `startRide_done_${booking.BookingID}`
        );
        if (flag === "true") {
          await AsyncStorage.removeItem(`startRide_done_${booking.BookingID}`);
          navigation.reset({
            index: 0,
            routes: [
              { name: "CustomerTabNavigator", params: { screen: "Dashboard" } },
            ],
          });
        }
      } catch (error) {
        console.error("Error reading start ride flag", error);
      }
    };
    checkIfStarted();
  }, [booking.BookingID, onRefresh, navigation, booking]);

  // keep track of app state so we can detect when the user returns from the maps
  // application.  If the ride-start flag is still set we make sure the screen is
  // restored rather than letting the navigator default back to the dashboard.
  useEffect(() => {
    const listener = AppState.addEventListener("change", async (nextState) => {
      if (nextState === "active") {
        try {
          const flag = await AsyncStorage.getItem(`startRide_done_${booking.BookingID}`);
          if (flag === "true") {
            await AsyncStorage.removeItem(`startRide_done_${booking.BookingID}`);
            navigation.reset({
              index: 0,
              routes: [
                { name: "CustomerTabNavigator", params: { screen: "Dashboard" } },
              ],
            });
          }
        } catch (err) {
          console.error("AppState flag check error", err);
        }
      }
    });

    return () => listener.remove();
  }, [booking.BookingID, navigation, onRefresh, booking]);

  useEffect(() => {
    if (Array.isArray(booking) && booking.length > 0) {
      const sum = booking.reduce((total, b) => {
        const pkgSum = (b.Packages || []).reduce((pkgTotal, pkg) => {
          return pkgTotal + Number(pkg.EstimatedDurationMinutes || 0);
        }, 0);
        return total + pkgSum;
      }, 0);

      setTotalDuration(sum);
    }
  }, [booking]);

  // const handleStartRide = async () => {
  //   await updateTechnicianTracking("StartJourney");
  //   openGoogleMaps();
  //   setShowSecondButtons(true);
  // };
  // const Reached = async () => {
  //   await updateTechnicianTracking("Reached");
  //   navigation.navigate("ServiceStart", { booking });
  // };

  // const Latitude = booking.Latitude;
  // const Longitude = booking.Longitude;
  const rawLat = booking?.latitude ?? booking?.Latitude;
  const rawLng = booking?.longitude ?? booking?.Longitude;
  // Check if coordinates are valid (not null/undefined and are valid numbers)
  const hasValidCoordinates = rawLat != null && rawLng != null &&
    !isNaN(Number(rawLat)) && !isNaN(Number(rawLng)) &&
    Number.isFinite(Number(rawLat)) && Number.isFinite(Number(rawLng));
  const Latitude = hasValidCoordinates ? Number(rawLat) : null;
  const Longitude = hasValidCoordinates ? Number(rawLng) : null;

  const bookingId = booking.BookingID;
  const destination = hasValidCoordinates ? {
    Latitude: parseFloat(Latitude),
    Longitude: parseFloat(Longitude),
  } : null;

  const togglePackageExpanded = (packageId) => {
    setExpandedPackages((prev) => ({
      ...prev,
      [packageId]: !prev[packageId],
    }));
  };

  const toggleAddOnExpanded = (addOnId) => {
    setExpandedAddOns((prev) => ({
      ...prev,
      [addOnId]: !prev[addOnId],
    }));
  };

  const getNotePreview = (text, limit = 140) => {
    if (!text) return "No notes from customer";
    if (text.length <= limit || isNoteExpanded) return text;
    return text.slice(0, limit).trim() + "...";
  };

  useEffect(() => {
    let subscription = null;
    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location access is required.");
          return;
        }
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 1,
          },
          async (loc) => {
            const coords = {
              Latitude: loc.coords.latitude,
              Longitude: loc.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setLocation(coords);
            try {
              if (mapRef.current?.animateToRegion) {
                // Center on customer location (geocoded address) if available, otherwise on current location
                if (addressLocation) {
                  const region = {
                    latitude: addressLocation.Latitude,
                    longitude: addressLocation.Longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  };
                  mapRef.current.animateToRegion(region, 1000);
                } else {
                  mapRef.current.animateToRegion(coords, 1000);
                }
              }
            } catch (_) { }
            // Route will be fetched by the useEffect that watches location and addressLocation
          }
        );
      } catch (e) {
        console.error("watchPosition error", e?.message || e);
      }
    };

    startTracking();
    return () => {
      try {
        subscription && subscription.remove && subscription.remove();
      } catch (_) { }
      subscription = null;
    };
  }, []);

  // Geocode FullAddress when Lat/Long are null so map shows customer location from address
  useEffect(() => {
    if (!fullAddress || fullAddress.trim() === "") return;
    setAddressLocation(null); // reset so we re-geocode when address changes
    const geocodeAddressLocation = async () => {
      if (fullAddress && fullAddress.trim() !== "") {
        setIsGeocoding(true);
        try {
          const geocodedLocation = await geocodeAddress(fullAddress);
          setIsGeocoding(false);
          if (geocodedLocation) {
            setAddressLocation(geocodedLocation);
            // Center map on geocoded customer address location
            try {
              if (mapRef.current?.animateToRegion) {
                const region = {
                  ...geocodedLocation,
                  latitudeDelta: 0.05, // Show area around customer location
                  longitudeDelta: 0.05,
                };
                mapRef.current.animateToRegion(region, 1000);
              }
            } catch (error) {
              console.error("Error animating to address location:", error);
            }
          }
        } catch (error) {
          setIsGeocoding(false);
          console.error("Error geocoding address:", error);
        }
      }
    };

    // Start geocoding immediately when FullAddress is available
    geocodeAddressLocation();
  }, [fullAddress]);

  // Fetch route from current location to customer location when both are available
  useEffect(() => {
    if (location && addressLocation) {
      // Use geocoded address location as destination
      const customerDestination = {
        Latitude: addressLocation.Latitude,
        Longitude: addressLocation.Longitude,
      };
      fetchRoute(location, customerDestination);
    } else if (location && hasValidCoordinates && destination) {
      // Use booking coordinates as destination if available
      fetchRoute(location, destination);
    }
  }, [location, addressLocation, hasValidCoordinates]);

  const fetchRoute = async (origin, dest = null) => {
    try {
      if (
        !origin ||
        !Number.isFinite(origin.Latitude) ||
        !Number.isFinite(origin.Longitude)
      ) {
        return;
      }

      // Use provided destination or fallback to default destination
      const routeDestination = dest || destination;
      if (
        !routeDestination ||
        !Number.isFinite(routeDestination.Latitude) ||
        !Number.isFinite(routeDestination.Longitude)
      ) {
        return;
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${origin.Latitude},${origin.Longitude}`,
            destination: `${routeDestination.Latitude},${routeDestination.Longitude}`,
            key: GOOGLE_MAPS_APIKEY,
          },
        }
      );

      const { status, routes, error_message } = response?.data || {};
      if (status !== "OK" || !Array.isArray(routes) || routes.length === 0) {
        console.warn(
          "Directions API status:",
          status,
          error_message || "No routes"
        );
        setRouteCoords([]);
        return;
      }

      const points = routes[0]?.overview_polyline?.points;
      if (!points) {
        console.warn("Directions API: overview_polyline missing");
        setRouteCoords([]);
        return;
      }

      const decoded = decodePolyline(points);
      setRouteCoords(decoded);
    } catch (error) {
      console.error(
        "Google Directions API error:",
        error?.response?.data || error?.message || error
      );
      setRouteCoords([]);
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
        Latitude: lat / 1e5,
        Longitude: lng / 1e5,
      });
    }
    return points;
  };

  // Geocode address to get coordinates
  const geocodeAddress = async (address) => {
    if (!address || address.trim() === "") return null;

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: address,
            key: GOOGLE_MAPS_APIKEY,
          },
        }
      );

      if (response.data && response.data.status === "OK" && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          Latitude: location.lat,
          Longitude: location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error?.response?.data || error?.message || error);
      return null;
    }
  };
  const openGoogleMaps = async () => {
    try {
      let url = "";

      // Determine destination - prioritize geocoded address location, then coordinates, then address string
      let destinationCoords = null;
      if (addressLocation) {
        destinationCoords = addressLocation;
      } else if (hasValidCoordinates && destination) {
        destinationCoords = destination;
      }

      // If we have current location and destination coordinates, show route
      if (location && destinationCoords) {
        url = `https://www.google.com/maps/dir/?api=1&origin=${location.Latitude},${location.Longitude}&destination=${destinationCoords.Latitude},${destinationCoords.Longitude}&travelmode=driving`;
      }
      // If we have destination coordinates but no current location, just show destination
      else if (destinationCoords) {
        url = `https://www.google.com/maps/?api=1&q=${destinationCoords.Latitude},${destinationCoords.Longitude}`;
      }
      // If we have fullAddress but no coordinates, use address string
      else if (fullAddress && fullAddress.trim() !== "") {
        const encodedAddress = encodeURIComponent(fullAddress);
        url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
      }
      // If we have coordinates from booking
      else if (hasValidCoordinates) {
        url = `https://www.google.com/maps/?api=1&q=${Latitude},${Longitude}`;
      }

      if (url) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Error", "Google Maps not available on this device");
        }
      } else {
        Alert.alert("Error", "Location information not available");
      }
    } catch (error) {
      console.error("Error opening Google Maps:", error);
      Alert.alert("Error", "Failed to open Google Maps");
    }
  };


  const handleStartRidedirect = async () => {
    setLoadingNavigate(true);
    // we intentionally do not await onRefresh here so the user is not kept waiting
    // before the maps app opens; the request will still complete in the
    // background and the focus listener (below) will pick up any updates.
    onRefresh();
    try {
      await AsyncStorage.setItem(`startRide_done_${booking.BookingID}`, "true");
    } catch (error) {
      console.error("Error saving start ride flag", error);
    }
    // Background tracking should already be controlled by user via toggle
    // No need to start it here automatically
    setLoadingNavigate(false);
    await openGoogleMaps();
  };
  const handleStartRide = async () => {
    setLoadingStartRide(true);
    const techID = await AsyncStorage.getItem("techID");
    if (pickDropId) {
      try {
        await axios.post(
          `${API_BASE_URL}ServiceImages/InsertTracking`,
          { pickDropId, status: "pickup_started" },
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (e) {
        console.error("InsertTracking Error:", e?.response?.data ?? e);
      }
    }

    try {
      const statusPayload = {
        bookingID: Number(displayBooking?.BookingID || 0),
        serviceType: displayBooking?.ServiceType || "ServiceAtGarage",
        routeType:
          booking?.PickupDelivery?.[0]?.PickFrom?.RouteType ??
          booking?.PickupDelivery?.[0]?.DropAt?.RouteType ??
          booking?.PickupDelivery?.[0]?.RouteType ??
          routeType ??
          "CustomerToDealer",
        action: "pickup_started",
        updatedBy: Number(techID),
        role: "Technician",
      };
      // console.log("UpdateBookingStatus Payload (pickup_started):", statusPayload);
      await axios.post(
        `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
        statusPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      // console.log("UpdateBookingStatus posted for pickup_started");
    } catch (e) {
      console.error("UpdateBookingStatus Error:", e?.response?.data || e);
    }

    // Optimistic UI update
    const rawPD = booking?.PickupDelivery;
    const updatedPD = Array.isArray(rawPD)
      ? rawPD.map((leg, i) => i === 0 ? { ...leg, DriverStatus: "pickup_started" } : leg)
      : { ...rawPD, DriverStatus: "pickup_started" };
    const updatedBooking = { ...booking, PickupDelivery: updatedPD };
    navigation.navigate("customerInfo", { booking: updatedBooking });
    setUpdatedBookings(updatedBooking);

    try {
      await AsyncStorage.setItem(`startRide_done_${booking.BookingID}`, "true");
    } catch (error) {
      console.error("Error saving start ride flag", error);
    }
    setLoadingStartRide(false);
    // Fire onRefresh in background — don't block maps from opening
    onRefresh();
    await openGoogleMaps();
  };

  const Reached = async () => {
    setLoadingReached(true);
    const techID = await AsyncStorage.getItem("techID");
    if (pickDropId) {
      try {
        await axios.post(
          `${API_BASE_URL}ServiceImages/InsertTracking`,
          { pickDropId, status: "pickup_reached" },
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (e) {
        console.error("InsertTracking Error====================:", pickDropId);
      }
    }

    const pickupPhoneNumber = displayBooking?.PickupDelivery?.[0]?.PickFrom?.PersonNumber;
    const carPickupDeliveryIdValue = Number(pickDropId) || 0;
    if (!carPickupDeliveryIdValue) {
      if (__DEV__) console.warn("GenerateOTP skipped: CarPickupDeliveryId is missing for this booking.");
    } else {
      try {
        const generateOtpPayload = {
          CarPickupDeliveryId: carPickupDeliveryIdValue,
          carPickupDeliveryId: carPickupDeliveryIdValue,
          otpType: "Pickup",
          phoneNumber: String(pickupPhoneNumber || "").trim(),
        };
        const genOtpRes = await axios.post(
          `${API_BASE_URL}ServiceImages/GenerateOTP`,
          generateOtpPayload,
          { headers: { "Content-Type": "application/json" } }
        );
        // console.log("ServiceImages/GenerateOTP POST data:", JSON.stringify(generateOtpPayload, null, 2));
        // console.log("ServiceImages/GenerateOTP response:", JSON.stringify(genOtpRes?.data, null, 2));
      } catch (e) {
        console.error("GenerateOTP Error:", e?.response?.data ?? e);
      }
    }

    try {
      const statusPayload = {
        bookingID: Number(displayBooking?.BookingID || 0),
        serviceType: displayBooking?.ServiceType || "ServiceAtGarage",
        routeType:
          booking?.PickupDelivery?.[0]?.PickFrom?.RouteType ??
          booking?.PickupDelivery?.[0]?.DropAt?.RouteType ??
          booking?.PickupDelivery?.[0]?.RouteType ??
          routeType ??
          "CustomerToDealer",
        action: "pickup_reached",
        updatedBy: Number(techID),
        role: "Technician",
      };
      // console.log("ServiceImages/UpdateBookingStatus---:", statusPayload);
      await axios.post(
        `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
        statusPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      // console.log("UpdateBookingStatus posted for pickup_reached");
    } catch (e) {
      console.error("UpdateBookingStatus Error:", e?.response?.data || e);
    }

    // Requested removal of updateTechnicianTracking
    const rawPD2 = booking?.PickupDelivery;
    const updatedPD2 = Array.isArray(rawPD2)
      ? rawPD2.map((leg, i) => i === 0 ? { ...leg, DriverStatus: "pickup_reached" } : leg)
      : { ...rawPD2, DriverStatus: "pickup_reached" };
    const updatedBooking = { ...booking, PickupDelivery: updatedPD2 };
    navigation.navigate("customerInfo", { booking: updatedBooking });
    setUpdatedBookings(updatedBooking);
    onRefresh();
    try {
      await stopBackgroundTracking();
    } catch (_) { }
    setLoadingReached(false);
    navigation.navigate(updatedBooking.ServiceType === "ServiceAtGarage" ? "CarPickUp" : "ServiceStart", { booking: updatedBooking });
  };

  const isSameISTDate = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const istStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return istStr === today;
  };

  if (!hasValidCoordinates) {
    console.warn("Invalid booking coordinates, will use FullAddress for geocoding", {
      Latitude: rawLat,
      Longitude: rawLng,
      FullAddress: fullAddress,
    });
  }

  // Skeleton Components
  const SkeletonText = ({ width, height, style }) => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            backgroundColor: bg,
            borderRadius: 4,
          },
          style,
        ]}
      />
    );
  };

  const SkeletonAvatar = ({ size = 46 }) => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          backgroundColor: bg,
        }}
      />
    );
  };

  const SkeletonCustomerCard = () => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <View
        style={[
          globalStyles.bgwhite,
          globalStyles.radius,
          globalStyles.card,
          globalStyles.p3,
          globalStyles.mt3,
        ]}
      >
        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
          <SkeletonAvatar size={46} />
          <View style={[globalStyles.ml3, { flex: 1 }]}>
            <SkeletonText width={150} height={16} style={{ marginBottom: 8 }} />
            <SkeletonText width={120} height={12} />
          </View>
          <Animated.View
            style={[
              globalStyles.p2,
              globalStyles.bgprimary,
              globalStyles.borderRadiuslarge,
              { width: 40, height: 40, backgroundColor: bg },
            ]}
          />
        </View>
        <View style={[globalStyles.divider, globalStyles.mt2]} />
        <View style={[globalStyles.flexrow]}>
          <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter, globalStyles.w40]}>
            <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
            <SkeletonText width={80} height={12} style={{ marginLeft: 8 }} />
          </View>
          <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter]}>
            <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
            <SkeletonText width={60} height={12} style={{ marginLeft: 8 }} />
          </View>
        </View>
        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
          <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter]}>
            <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
            <SkeletonText width={100} height={12} style={{ marginLeft: 8 }} />
          </View>
        </View>
      </View>
    );
  };

  const SkeletonCarDetails = () => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <View style={[styles.blackcard]}>
        <View style={[styles.width60, globalStyles.borderRadiuslarge, globalStyles.alineItemscenter, globalStyles.bgwhite]}>
          <SkeletonText width={120} height={14} style={{ marginTop: 8, marginBottom: 8 }} />
          <View style={[styles.width60]}>
            <View>
              <Animated.View
                style={[
                  styles.imageContainer,
                  { backgroundColor: bg }
                ]}
              />
            </View>
          </View>
        </View>
        <View style={[styles.width30]}>
          <View style={{ marginBottom: 16 }}>
            <SkeletonText width={40} height={10} style={{ marginBottom: 4 }} />
            <SkeletonText width={60} height={12} />
          </View>
          <View style={{ marginBottom: 16 }}>
            <SkeletonText width={50} height={10} style={{ marginBottom: 4 }} />
            <SkeletonText width={70} height={12} />
          </View>
          <View>
            <SkeletonText width={60} height={10} style={{ marginBottom: 4 }} />
            <SkeletonText width={80} height={12} />
          </View>
        </View>
      </View>
    );
  };

  const SkeletonServiceCard = () => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <View
        style={[
          globalStyles.mt3,
          globalStyles.bgwhite,
          globalStyles.radius,
          globalStyles.p2,
          globalStyles.card,
        ]}
      >
        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.justifysb, globalStyles.p1]}>
          <View style={{ flex: 1 }}>
            <SkeletonText width={120} height={16} style={{ marginBottom: 4 }} />
            <SkeletonText width={80} height={12} />
          </View>
          <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
        </View>
      </View>
    );
  };

  const SkeletonTotalTimeCard = () => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <View
        style={[
          globalStyles.flexrow,
          globalStyles.justifysb,
          globalStyles.mt4,
          globalStyles.bgprimary,
          globalStyles.p4,
          globalStyles.borderRadiuslarge,
        ]}
      >
        <View style={globalStyles.alineSelfcenter}>
          <SkeletonText width={120} height={12} style={{ marginBottom: 8 }} />
          <SkeletonText width={80} height={24} />
        </View>
        <View style={styles.pricecard}>
          <SkeletonText width={40} height={12} style={{ marginBottom: 8 }} />
          <SkeletonText width={60} height={28} />
        </View>
      </View>
    );
  };

  const SkeletonCustomerNote = () => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <View style={[globalStyles.container, globalStyles.bgBlack, globalStyles.pb5]}>
        <SkeletonText width={120} height={16} style={{ marginTop: 8, marginBottom: 8 }} />
        <SkeletonText width={200} height={12} style={{ marginBottom: 4 }} />
        <SkeletonText width={180} height={12} style={{ marginBottom: 4 }} />
        <SkeletonText width={150} height={12} />
      </View>
    );
  };

  const SkeletonActionButtons = () => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <View style={[globalStyles.mt2]}>
        <Animated.View
          style={[
            styles.NextButton,
            { backgroundColor: bg, height: 48 }
          ]}
        />
      </View>
    );
  };

  const CustomerInfoSkeleton = () => (
    <ScrollView style={[globalStyles.bgcontainer]}>
      <StatusBar style="dark" />
      <View>
        <View style={[globalStyles.container, globalStyles.pb4]}>
          <SkeletonCustomerCard />
          <SkeletonText width={100} height={16} style={{ marginTop: 24, marginBottom: 8 }} />
          <SkeletonCarDetails />
          <View style={[globalStyles.divider, globalStyles.mt5]} />
          <SkeletonText width={120} height={16} style={{ marginTop: 8, marginBottom: 8 }} />
          <SkeletonServiceCard />
          <SkeletonServiceCard />
          <SkeletonTotalTimeCard />
        </View>
        <SkeletonCustomerNote />
        <View style={[globalStyles.container, globalStyles.bgBlack, globalStyles.pb5]}>
          <SkeletonActionButtons />
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return <CustomerInfoSkeleton />;
  }

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar backgroundColor='white' barStyle="dark-content" />
      <View>
        <View style={[globalStyles.container, globalStyles.pb4]}>
          {/* <AvailabilityHeader /> */}

          <View
            style={[
              globalStyles.bgwhite,
              globalStyles.radius,
              globalStyles.card,
              globalStyles.p3,
              globalStyles.mt3,
            ]}
          >
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              {/* <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  booking.CustomerName
                )}&background=E8E8E8`,
              }}
              style={{ width: 46, height: 46, borderRadius: 10 }}
            /> */}
              <Image
                source={
                  profileImage
                    ? {
                      uri: `https://api.mycarsbuddy.com/images/${profileImage}`,
                    }
                    : defaultAvatar
                }
                style={{ width: 46, height: 46, borderRadius: 10 }}
              />
              <View style={[globalStyles.ml3, { flex: 1 }]}>
                <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                  {customerName}
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Medium, globalStyles.neutral500]}
                >
                  Mobile: {pickupPhoneNumber || "N/A"}
                </CustomText>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate([0, 200, 100, 300]);

                  if (pickupPhoneNumber) {
                    Linking.openURL(`tel:${pickupPhoneNumber}`);
                  } else {
                    Alert.alert("Error", "Phone number not available");
                  }
                }}
              >
                <Ionicons
                  style={[
                    globalStyles.p2,
                    globalStyles.bgprimary,
                    globalStyles.borderRadiuslarge,
                  ]}
                  name="call"
                  size={20}
                  color={color.white}
                />
              </TouchableOpacity>
            </View>
            <View style={[globalStyles.divider, globalStyles.mt2]} />
            {(() => {
              const display = getBookingDisplayData(booking);
              return (
                <>
                  {/* Row 1: Booking ID | Date */}
                  <View style={[globalStyles.flexrow, globalStyles.mt2]}>
                    <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.w40]}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={16} color={color.primary} style={{ marginRight: 6 }} />
                      <View>
                        <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>{display.bookingTrackID}</CustomText>
                      </View>
                    </View>

                    <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
                      <Ionicons name="calendar" size={16} color={color.primary} style={{ marginRight: 6 }} />
                      <View>
                        <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>{display.bookingDate}</CustomText>
                      </View>
                    </View>
                  </View>

                  {/* Row 2: Vehicle | Time Slot */}
                  <View style={[globalStyles.flexrow, globalStyles.mt2]}>
                    <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.w40]}>
                      <Ionicons name="car" size={16} color={color.primary} style={{ marginRight: 6 }} />
                      <View>
                        <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>{display.vehicleDisplay}</CustomText>
                      </View>
                    </View>

                    <View style={[globalStyles.flexrow, { flex: 1, minWidth: 0, alignItems: "flex-start" }]}>
                      <Ionicons name="time-outline" size={16} color={color.primary} style={{ marginRight: 6, marginTop: 2 }} />
                      <View style={{ flexDirection: "column" }}>
                          <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>{assignTime}</CustomText>
                      </View>
                    </View>
                  </View>

                  {/* Row 3: Address (full width) */}
                  <View style={[globalStyles.flexrow, globalStyles.mt2, { alignItems: "flex-start" }]}>
                    <Ionicons name="home" size={16} color={color.primary} style={{ marginRight: 6, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>{display.fullAddress}</CustomText>
                    </View>
                  </View>
                </>
              );
            })()}

          </View>

          {(modelName || vehicleNumber || brandName || fuelTypeName) && (
            <>
              <CustomText
                style={[globalStyles.f16Bold, globalStyles.black, globalStyles.mt3]}
              >
                Car Details
              </CustomText>
              <View
                style={[
                  globalStyles.bgwhite,
                  globalStyles.radius,
                  globalStyles.card,
                  globalStyles.p3,
                  globalStyles.mt2,
                ]}
              >
                <View style={[globalStyles.flexrow, { flexWrap: "wrap" }]}>
                  {modelName && (
                    <View
                      style={[
                        {
                          width: "50%",
                          paddingRight: 8,
                          marginBottom: 16,
                        },
                      ]}
                    >
                      <View
                        style={[
                          globalStyles.flexrow,
                          globalStyles.alineItemscenter,
                          globalStyles.mb1,
                        ]}
                      >
                        <Ionicons
                          name="car"
                          size={16}
                          color={color.primary}
                          style={{ marginRight: 6 }}
                        />
                        <CustomText
                          style={[
                            globalStyles.f10Medium,
                            globalStyles.neutral500,
                          ]}
                        >
                          Model Name
                        </CustomText>
                      </View>
                      <CustomText
                        style={[globalStyles.f14Bold, globalStyles.black]}
                      >
                        {modelName}
                      </CustomText>
                    </View>
                  )}
                  {vehicleNumber && (
                    <View
                      style={[
                        {
                          width: "50%",
                          paddingLeft: 8,
                          marginBottom: 16,
                        },
                      ]}
                    >
                      <View
                        style={[
                          globalStyles.flexrow,
                          globalStyles.alineItemscenter,
                          globalStyles.mb1,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="card-account-details-outline"
                          size={16}
                          color={color.primary}
                          style={{ marginRight: 6 }}
                        />
                        <CustomText
                          style={[
                            globalStyles.f10Medium,
                            globalStyles.neutral500,
                          ]}
                        >
                          Reg No
                        </CustomText>
                      </View>
                      <CustomText
                        style={[globalStyles.f14Bold, globalStyles.black]}
                      >
                        {vehicleNumber}
                      </CustomText>
                    </View>
                  )}
                  {brandName && (
                    <View
                      style={[
                        {
                          width: "50%",
                          paddingRight: 8,
                          marginBottom: 16,
                        },
                      ]}
                    >
                      <View
                        style={[
                          globalStyles.flexrow,
                          globalStyles.alineItemscenter,
                          globalStyles.mb1,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="factory"
                          size={16}
                          color={color.primary}
                          style={{ marginRight: 6 }}
                        />
                        <CustomText
                          style={[
                            globalStyles.f10Medium,
                            globalStyles.neutral500,
                          ]}
                        >
                          Manufacturer
                        </CustomText>
                      </View>
                      <CustomText
                        style={[globalStyles.f14Bold, globalStyles.black]}
                      >
                        {brandName}
                      </CustomText>
                    </View>
                  )}
                  {fuelTypeName && (
                    <View
                      style={[
                        {
                          width: "50%",
                          paddingLeft: 8,
                          marginBottom: 16,
                        },
                      ]}
                    >
                      <View
                        style={[
                          globalStyles.flexrow,
                          globalStyles.alineItemscenter,
                          globalStyles.mb1,
                        ]}
                      >
                        <Ionicons
                          name="flash"
                          size={16}
                          color={color.primary}
                          style={{ marginRight: 6 }}
                        />
                        <CustomText
                          style={[
                            globalStyles.f10Medium,
                            globalStyles.neutral500,
                          ]}
                        >
                          Fuel Type
                        </CustomText>
                      </View>
                      <CustomText
                        style={[globalStyles.f14Bold, globalStyles.black]}
                      >
                        {fuelTypeName}
                      </CustomText>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Map Section - Always show, display map when coordinates or geocoded address available */}
          {/* <View style={[globalStyles.mt3]}>
            <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
              Location
            </CustomText>
            {(hasValidCoordinates || addressLocation) ? (
              <View style={[globalStyles.mt2, { height: 200, borderRadius: 10, overflow: 'hidden' }]}>
                <MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  initialRegion={
                    addressLocation
                      ? {
                          latitude: addressLocation.Latitude,
                          longitude: addressLocation.Longitude,
                          latitudeDelta: 0.05, 
                          longitudeDelta: 0.05,
                        }
                      : hasValidCoordinates
                      ? {
                          latitude: Latitude,
                          longitude: Longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }
                      : {
                          latitude: 0,
                          longitude: 0,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }
                  }
                  showsUserLocation={!!location}
                  showsMyLocationButton={!!location}
                >
                  {addressLocation && (
                    <Marker
                      coordinate={{
                        latitude: addressLocation.Latitude,
                        longitude: addressLocation.Longitude,
                      }}
                      title="Customer Location"
                      description={fullAddress}
                      pinColor="red"
                    />
                  )}

                  {hasValidCoordinates && (
                    <Marker
                      coordinate={{
                        latitude: Latitude,
                        longitude: Longitude,
                      }}
                      title="Destination"
                      description={booking.CustomerName}
                      pinColor={addressLocation ? "orange" : "red"}
                    />
                  )}

                  {routeCoords && routeCoords.length > 0 && location && addressLocation && (
                    <Polyline
                      coordinates={routeCoords.map(coord => ({
                        latitude: coord.Latitude,
                        longitude: coord.Longitude,
                      }))}
                      strokeColor="#0000FF"
                      strokeWidth={3}
                    />
                  )}
                </MapView>
              </View>
            ) : isGeocoding ? (
              <View style={[globalStyles.mt2, { height: 200, borderRadius: 10, overflow: 'hidden', backgroundColor: color.neutral[200], justifyContent: 'center', alignItems: 'center' }]}>
                <CustomText style={[globalStyles.f14Medium, globalStyles.neutral500]}>
                  Loading location...
                </CustomText>
              </View>
            ) : fullAddress && fullAddress.trim() !== "" ? (
              <View style={[globalStyles.mt2]}>
                <View
                  style={[
                    globalStyles.bgwhite,
                    globalStyles.radius,
                    globalStyles.card,
                    globalStyles.p3,
                  ]}
                >
                  <CustomText
                    style={[globalStyles.f12Medium, globalStyles.neutral500, globalStyles.mb2]}
                  >
                    {fullAddress}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f12Regular, globalStyles.neutral500]}
                  >
                    Map will be available shortly...
                  </CustomText>
                </View>
              </View>
            ) : (
              <View style={[globalStyles.mt2]}>
                <View
                  style={[
                    globalStyles.bgwhite,
                    globalStyles.radius,
                    globalStyles.card,
                    globalStyles.p3,
                  ]}
                >
                  <CustomText style={[globalStyles.f12Medium, globalStyles.neutral500]}>
                    Location information not available
                  </CustomText>
                </View>
              </View>
            )}
          </View> */}

          <View>
            <CustomText style={[globalStyles.f16Bold, globalStyles.black, globalStyles.mt3]}>
              Service Details
            </CustomText>

            {/* Service Details Card with point-wise services, pickup/delivery, and price */}
            <View
              style={[
                globalStyles.mt3,
                globalStyles.bgwhite,
                globalStyles.radius,
                globalStyles.p4,
                globalStyles.card,
              ]}
            >
              {/* Service Details - Point-wise */}
              <View>
                <CustomText
                  style={[
                    globalStyles.f14Bold,
                    globalStyles.black,
                    globalStyles.mb2,
                  ]}
                >
                  Services:
                </CustomText>

                {/* Packages - Point-wise */}
                {/* {booking.Packages && booking.Packages.length > 0 && booking.Packages.map((pkg) => (
                  <View key={pkg.PackageID} style={[globalStyles.mb3]}>
                    <CustomText
                      style={[
                        globalStyles.f12Bold,
                        globalStyles.primary,
                      ]}
                    >
                      • {pkg.PackageName}
                    </CustomText>
                    {pkg.Description && (
                      <CustomText
                        style={[
                          globalStyles.f12Regular,
                          globalStyles.neutral500,
                          globalStyles.mt1,
                          globalStyles.ml3,
                        ]}
                      >
                        {pkg.Description}
                      </CustomText>
                    )}
                    {pkg.Category && (
                      <View style={[globalStyles.ml3, globalStyles.mt1]}>
                        {pkg.Category.SubCategories?.map((sub) => (
                          <View key={sub.SubCategoryID} style={[globalStyles.mb1]}>
                            <CustomText
                              style={[
                                globalStyles.f12Medium,
                                globalStyles.black,
                                globalStyles.mb1,
                              ]}
                            >
                              {sub.SubCategoryName}
                            </CustomText>
                            {sub.Includes?.map((inc) => (
                              <CustomText
                                key={inc.IncludeID}
                                style={[
                                  globalStyles.f12Regular,
                                  globalStyles.neutral500,
                                  globalStyles.ml2,
                                ]}
                              >
                                - {inc.IncludeName}
                              </CustomText>
                            ))}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))} */}

                {/* BookingAddOns - Point-wise */}
                {booking.PickupDelivery?.[0]?.AddOns && booking.PickupDelivery?.[0]?.AddOns?.length > 0 && booking.PickupDelivery?.[0]?.AddOns?.map((addOn) => (
                  <View key={addOn.AddOnID} style={[globalStyles.mb3]}>
                    <CustomText
                      style={[
                        globalStyles.f12Bold,
                        globalStyles.primary,
                      ]}
                    >
                      • {addOn.ServiceName}
                    </CustomText>
                    {/* {addOn.Description && (
                      <CustomText
                        style={[
                          globalStyles.f12Regular,
                          globalStyles.neutral500,
                          globalStyles.mt1,
                         
                        ]}
                      >
                        {addOn.Description}
                      </CustomText>
                    )} */}
                    {addOn.Includes && addOn.Includes.length > 0 && (
                      <View style={[globalStyles.ml3, globalStyles.mt1]}>
                        {addOn.Includes.map((inc) => (
                          <CustomText
                            key={inc.AddOnID}
                            style={[
                              globalStyles.f12Regular,
                              globalStyles.neutral500,
                            ]}
                          >
                            - {inc.IncludeName}
                          </CustomText>
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                {(!booking.Packages || booking.Packages.length === 0) &&
                  (!booking.BookingAddOns || booking.BookingAddOns.length === 0) && (
                    <CustomText
                      style={[globalStyles.f12Regular, globalStyles.neutral500]}
                    >
                      No services available
                    </CustomText>
                  )}
              </View>

              {/* Pickup and Delivery Details */}
              {booking.PickupDelivery && booking.PickupDelivery.length > 0 ? (
                <View style={[globalStyles.mb3]}>


                </View>
              ) : (
                <View style={[globalStyles.mb3]}>
                  <CustomText
                    style={[globalStyles.f12Medium, globalStyles.neutral500]}
                  >
                    No pickup/delivery scheduled
                  </CustomText>
                </View>
              )}



            </View>
          </View>
        </View>
        {booking.Notes && booking.Notes.length > 140 && (
          <View style={[globalStyles.container, globalStyles.pt2]}>
            <TouchableOpacity onPress={() => setIsNoteExpanded((v) => !v)}>
              <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500]}>
                {isNoteExpanded ? "Show less" : "Show more"}
              </CustomText>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            globalStyles.container,
            globalStyles.pb5,
            { backgroundColor: color.background || "#f5f5f5" },
          ]}
        >
          <View >
            <View>

              {driverStatus &&
                driverStatus !== "ServiceComplete" &&
                driverStatus !== "completed" && (
                  <>
                    {driverStatus === "assigned" && (
                      <TouchableOpacity
                        style={[styles.startButton, loadingStartRide && { opacity: 0.7 }]}
                        onPress={handleStartRide}
                        disabled={loadingStartRide}
                      >
                        {loadingStartRide ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons
                              name="rocket"
                              size={20}
                              color="white"
                              style={{ marginRight: 8 }}
                            />
                            <CustomText
                              style={[globalStyles.f14Bold, globalStyles.textWhite]}
                            >
                              Start Ride
                            </CustomText>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {(driverStatus === "pickup_started" ||
                      driverStatus === "ServiceStart") && (
                        <View style={styles.startreach}>
                          <TouchableOpacity
                            style={[styles.startButton, { flex: 1 }, loadingNavigate && { opacity: 0.7 }]}
                            onPress={handleStartRidedirect}
                            disabled={loadingNavigate}
                          >
                            {loadingNavigate ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons
                                  name="navigate"
                                  size={20}
                                  color="#fff"
                                  style={{ marginRight: 8 }}
                                />
                                <CustomText
                                  style={[globalStyles.f14Bold, globalStyles.textWhite]}
                                >
                                  Navigate
                                </CustomText>
                              </>
                            )}
                          </TouchableOpacity>

                          {driverStatus === "pickup_started" && (
                            <TouchableOpacity
                              style={[styles.ReachedButton, { flex: 1 }, loadingReached && { opacity: 0.7 }]}
                              onPress={Reached}
                              disabled={loadingReached}
                            >
                              {loadingReached ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <>
                                  <Ionicons
                                    name="flag"
                                    size={20}
                                    color="white"
                                    style={{ marginRight: 8 }}
                                  />
                                  <CustomText
                                    style={[globalStyles.f14Bold, globalStyles.textWhite]}
                                  >
                                    Reached
                                  </CustomText>
                                </>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                  </>
                )}
              {/* </View> */}
              {/* )} */}
            </View>
            {(() => {
              const currentBooking = displayBooking;
              if (driverStatus === "pickup_reached") {
                return (
                  <TouchableOpacity
                    onPress={() => ServiceStart(currentBooking)}
                    style={[styles.NextButton, globalStyles.mb3, loadingNext && { opacity: 0.7 }]}
                    disabled={loadingNext}
                  >
                    {loadingNext ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <CustomText
                          style={[
                            globalStyles.f14Bold,
                            globalStyles.mr1,
                            globalStyles.textWhite,
                          ]}
                        >
                          Next
                        </CustomText>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                );
              }
              if (driverStatus === "car_picked") {
                return (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("CustomerToGarageMap", {
                        booking: currentBooking,
                      })
                    }
                    style={[styles.NextButton, globalStyles.mb3, loadingNext && { opacity: 0.7 }]}
                    disabled={loadingNext}
                  >
                    {loadingNext ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <CustomText
                          style={[
                            globalStyles.f14Bold,
                            globalStyles.mr1,
                            globalStyles.textWhite,
                          ]}
                        >
                          Next
                        </CustomText>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                );
              }
              if (driverStatus === "ServiceStart") {
                return (
                  <TouchableOpacity
                    onPress={() => ServiceEnd(currentBooking)}
                    style={[styles.NextButton, globalStyles.mb3, loadingNext && { opacity: 0.7 }]}
                    disabled={loadingNext}
                  >
                    {loadingNext ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <CustomText
                          style={[
                            globalStyles.f14Bold,
                            globalStyles.mr1,
                            globalStyles.textWhite,
                          ]}
                        >
                          Next
                        </CustomText>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                );
              }
              return null;
            })()}

            {(updatedBookings.PaymentStatus == null || updatedBookings.PaymentStatus === "PartialPaid")
              && (updatedBookings?.PickupDelivery?.[0]?.DriverStatus === "completed" ||
                updatedBookings?.PickupDelivery?.[0]?.DriverTracking?.some((t) => t.Status === "completed")) &&
              (
                <TouchableOpacity
                  onPress={() => CollectPayment(updatedBookings)}
                  style={[styles.NextButton, loadingCollectCash && { opacity: 0.7 }]}
                  disabled={loadingCollectCash}
                >
                  {loadingCollectCash ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <CustomText
                        style={[
                          globalStyles.f14Bold,
                          globalStyles.mr1,
                          globalStyles.textWhite,
                        ]}
                      >
                        Collect Cash
                      </CustomText>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  arrowButton: {
    paddingHorizontal: 8,
  },
  imageWrapper: {
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  playButton: {
    position: "absolute",
    top: "40%",
    right: 5,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 3,
  },
  cancelButton: {
    backgroundColor: color.fullredLight,
    width: "46%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  NextButton: {
    backgroundColor: color.yellow,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    marginTop: 10,
  },
  callButton: {
    backgroundColor: color.primary,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  callIcon: {
    marginRight: 8,
  },
  startRideWrapper: {
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    marginTop: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  startRideButton: {
    backgroundColor: "#767676",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },

  pricecard: {
    backgroundColor: color.white,
    paddingVertical: 3,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 10,
  },
  blackcard: {
    borderRadius: 20,
    backgroundColor: color.black,
    justifyContent: "space-between",
    flexDirection: "row",
    paddingBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1.4,
    overflow: "hidden",
  },

  avatar: {
    width: "100%",
    height: "65%",
    marginTop: 10,
  },

  width60: {
    width: "60%",
  },
  width70: {
    width: "70%",
  },
  width30: {
    width: "30%",
  },
  startreach: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
    gap: 10,
  },
  ReachedButton: {
    backgroundColor: color.yellow,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  startride: {
    backgroundColor: color.yellow,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: color.alertInfo,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  // Skeleton styles
  skelIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});