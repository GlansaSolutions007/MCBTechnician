import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  Linking,
  Alert,
  Vibration,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
  Entypo,
} from "@expo/vector-icons";
import globalStyles from "../styles/globalStyles";
import CustomText from "../components/CustomText";
import { color } from "../styles/theme";
import { API_BASE_URL, API_BASE_URL_IMAGE } from "@env";
import defaultAvatar from "../../assets/images/buddy.png";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { getBookingDisplayData } from "../utils/bookingDisplay";
import BookingPickDropRow from "../components/BookingPickDropRow";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

export default function Bookings() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookings, techId: techIdFromParams } = route.params || {};

  const [todaysBookings, setTodaysBookings] = useState([]);

  const [refreshing, setRefreshing] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const [filterType, setFilterType] = useState("pending");
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);

      const techIDFromStorage = await AsyncStorage.getItem("techID");
      const techID = techIdFromParams ?? techIDFromStorage;

      if (!techID) {
        setTodaysBookings([]);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}Bookings/GetAssignedBookings`,
        {
          params: { Id: techID, techId: techID },
        },
      );

      // console.log('assigned bookingsssss', response?.data);

      const bookingsData = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];

      setTodaysBookings(bookingsData);
    } catch (error) {
      console.error(
        "Error fetching bookings:",
        error?.response || error.message,
      );
      setTodaysBookings([]);
    } finally {
      setLoading(false);
    }
  }, [techIdFromParams]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  useEffect(() => {
    const loop = Animated.loop(
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
      ]),
    );
    loop.start();
    return () => {
      try {
        loop.stop();
      } catch (_) { }
    };
  }, [pulse]);

  const bg = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [
      globalStyles.bgneutral200?.backgroundColor || "#D9D9D9",
      globalStyles.bgneutral100?.backgroundColor || "#E8E8E8",
    ],
  });

  const SkeletonBookingCard = ({ index }) => (
    <View
      key={`skeleton-${index}`}
      style={[
        globalStyles.bgwhite,
        globalStyles.p4,
        globalStyles.mt4,
        globalStyles.card,
        styles.cardWrapper,
      ]}
    >
      <View style={[styles.accent, { backgroundColor: color.neutral[200] }]} />
      <View style={globalStyles.flexrow}>
        <Animated.View style={[styles.skelAvatar, { backgroundColor: bg }]} />
        <View style={[globalStyles.ml3, { flex: 1 }]}>
          <Animated.View
            style={[styles.skelLineMedium, { backgroundColor: bg, width: 160 }]}
          />
          <Animated.View
            style={[
              styles.skelLineSmall,
              { backgroundColor: bg, width: 140, marginTop: 8 },
            ]}
          />
          <Animated.View
            style={[styles.skelFlexLine, { backgroundColor: bg, marginTop: 8 }]}
          />
        </View>
      </View>
      <View style={globalStyles.divider} />
      <View
        style={[
          globalStyles.flexrow,
          globalStyles.justifysb,
          globalStyles.alineItemscenter,
        ]}
      >
        <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
          <View style={globalStyles.mr3}>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt2,
                globalStyles.alineItemscenter,
              ]}
            >
              <Animated.View
                style={[styles.skelIcon, { backgroundColor: bg }]}
              />
              <Animated.View
                style={[
                  styles.skelLineSmall,
                  { backgroundColor: bg, width: 120, marginLeft: 8 },
                ]}
              />
            </View>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt2,
                globalStyles.alineItemscenter,
              ]}
            >
              <Animated.View
                style={[styles.skelIcon, { backgroundColor: bg }]}
              />
              <Animated.View
                style={[
                  styles.skelLineSmall,
                  { backgroundColor: bg, width: 100, marginLeft: 8 },
                ]}
              />
            </View>
          </View>
          <View>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt2,
                globalStyles.alineItemscenter,
              ]}
            >
              <Animated.View
                style={[styles.skelIcon, { backgroundColor: bg }]}
              />
              <Animated.View
                style={[
                  styles.skelLineSmall,
                  { backgroundColor: bg, width: 100, marginLeft: 8 },
                ]}
              />
            </View>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt2,
                globalStyles.alineItemscenter,
              ]}
            >
              <Animated.View
                style={[styles.skelIcon, { backgroundColor: bg }]}
              />
              <Animated.View
                style={[
                  styles.skelLineSmall,
                  { backgroundColor: bg, width: 80, marginLeft: 8 },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const customerInfo = (booking) => {
    navigation.navigate("customerInfo", { booking });
  };
  const openBooking = (item) => {
    const estimatedTime = item.TotalEstimatedDurationMinutes
      ? item.TotalEstimatedDurationMinutes * 60
      : 0;

    let actualTime = 0;
    if (item.ServiceStartedAt) {
      const startTime = new Date(item.ServiceStartedAt);
      actualTime = Math.floor((new Date() - startTime) / 1000);
    }

    const driverStatus = getDriverStatus(item);

    if (item.ServiceType === "ServiceAtGarage") {
      if (driverStatus === "car_picked" || driverStatus === "in_transit") {
        navigation.navigate("CustomerToGarageMap", {
          booking: item,
          estimatedTime,
          actualTime,
          carRegistrationNumber: item.CarRegistrationNumber || "",
        });
      } else if (driverStatus === "drop_reached") {
        navigation.navigate("DropCarAtGarage", {
          booking: item,
          estimatedTime,
          actualTime,
          carRegistrationNumber: item.CarRegistrationNumber || "",
        });
      } else {
        navigation.navigate("ServiceAtGarageMap", { booking: item });
      }
    } else {
      customerInfo(item);
    }
  };

  const getDriverStatus = (booking) => {
    const pd = booking?.PickupDelivery;
    if (!pd) return null;
    if (Array.isArray(pd)) {
      const found = pd.find((p) => p?.DriverStatus);
      return found?.DriverStatus ?? pd[0]?.DriverStatus ?? null;
    }
    return pd?.DriverStatus ?? null;
  };

  const isFutureDate = (dateString) => {
    if (!dateString) return false;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      today.setMilliseconds(0);

      const bookingDate = new Date(dateString);

      if (isNaN(bookingDate.getTime())) {
        return false;
      }
      bookingDate.setHours(0, 0, 0, 0);
      bookingDate.setMilliseconds(0);

      return bookingDate > today;
    } catch (error) {
      console.error("Error parsing date:", dateString, error);
      return false;
    }
  };

  const isBookingCompleted = (booking) => {
    const status = booking?.BookingStatus;
    if (status === "Completed" || status === "ServiceComplete") return true;
    const driverStatus = getDriverStatus(booking);
    return driverStatus === "completed" || driverStatus === "ServiceComplete";
  };

  const getFilteredBookings = () => {
    const nonFutureBookings = todaysBookings.filter((booking) => {
      let serviceDate = null;
      if (
        Array.isArray(booking.PickupDelivery) &&
        booking.PickupDelivery.length > 0
      ) {
        const sortedPD = [...booking.PickupDelivery].sort(
          (a, b) => new Date(b.AssignDate) - new Date(a.AssignDate),
        );
        serviceDate = sortedPD[0]?.AssignDate;
      }
      if (!serviceDate) return true;
      if (isFutureDate(serviceDate)) return false;
      return true;
    });

    switch (filterType) {
      case "all":
        return nonFutureBookings;
      case "completed":
        return nonFutureBookings.filter((b) => isBookingCompleted(b));
      case "pending":
        return nonFutureBookings.filter((b) => !isBookingCompleted(b));
      default:
        return nonFutureBookings;
    }
  };

  const filteredBookings = getFilteredBookings();

  const handleFilterChange = (newFilterType) => {
    if (newFilterType === filterType) return;

    setIsAnimating(true);

    // Start smooth transition animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change filter after fade out
      setFilterType(newFilterType);

      // Fade back in with new content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const getRouteIcons = (routeType) => {
    switch (routeType) {
      case "CustomerToDealer":
        return { pickIcon: "person-outline", dropIcon: "garage", pickLib: "Ionicons", dropLib: "MaterialCommunityIcons" };
      case "DealerToDealer":
        return { pickIcon: "garage", dropIcon: "garage", pickLib: "MaterialCommunityIcons", dropLib: "MaterialCommunityIcons" };
      case "DealerToCustomer":
        return { pickIcon: "garage", dropIcon: "person-outline", pickLib: "MaterialCommunityIcons", dropLib: "Ionicons" };
      default:
        return { pickIcon: "person-outline", dropIcon: "map-marker", pickLib: "Ionicons", dropLib: "MaterialCommunityIcons" };
    }
  };

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={
        todaysBookings.length === 0
          ? styles.noDataContainer
          : { paddingBottom: 30 }
      }
    >
      <StatusBar style="dark" />
      <View style={globalStyles.container}>
        {/* Filter Section */}
        {todaysBookings.length > 0 && (
          <View
            style={[styles.filterCard, globalStyles.card, globalStyles.mt3]}
          >
            {/* <CustomText style={[globalStyles.f16Bold, globalStyles.primary, globalStyles.mb3]}>
              Filter Bookings
            </CustomText> */}

            <View style={styles.filterButtons}>
              <TouchableOpacity
                onPress={() => handleFilterChange("all")}
                style={[
                  styles.filterButton,
                  filterType === "all" && styles.filterButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <CustomText
                  style={[
                    globalStyles.f12Medium,
                    filterType === "all"
                      ? globalStyles.textWhite
                      : globalStyles.neutral500,
                  ]}
                >
                  All
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleFilterChange("pending")}
                style={[
                  styles.filterButton,
                  filterType === "pending" && styles.filterButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <CustomText
                  style={[
                    globalStyles.f12Medium,
                    filterType === "pending"
                      ? globalStyles.textWhite
                      : globalStyles.neutral500,
                  ]}
                >
                  Pending
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleFilterChange("completed")}
                style={[
                  styles.filterButton,
                  filterType === "completed" && styles.filterButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <CustomText
                  style={[
                    globalStyles.f12Medium,
                    filterType === "completed"
                      ? globalStyles.textWhite
                      : globalStyles.neutral500,
                  ]}
                >
                  Completed
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          [0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonBookingCard key={`s-${i}`} index={i} />
          ))
        ) : filteredBookings.length === 0 ? (
          <View
            style={[
              globalStyles.alineItemscenter,
              globalStyles.justifycenter,
              { paddingVertical: 40 },
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={48}
              color={color.neutral[300]}
            />
            <CustomText
              style={[
                globalStyles.f16Medium,
                globalStyles.neutral500,
                globalStyles.mt2,
                globalStyles.textac,
              ]}
            >
              {todaysBookings.length === 0
                ? "No bookings assigned"
                : `No ${filterType === "all" ? "" : filterType} bookings found`}
            </CustomText>
          </View>
        ) : refreshing ? (
          [0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonBookingCard key={`s-${i}`} index={i} />
          ))
        ) : (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {filteredBookings.map((item, index) => {
              const driverStatus = getDriverStatus(item);
              const completed = isBookingCompleted(item);
              const carPicked = driverStatus === "car_picked" || driverStatus === "in_transit" || driverStatus === "drop_reached";

              return (
                <View
                  key={`${item.BookingID ?? "booking"}-${index}`}
                  style={[
                    driverStatus === "completed"
                      ? globalStyles.bgneutral100
                      : globalStyles.bgwhite,
                    globalStyles.p4,
                    globalStyles.mt4,
                    isAnimating ? globalStyles.radius : globalStyles.card,
                    styles.cardWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.accent,
                      {
                        backgroundColor:
                          driverStatus === "completed"
                            ? color.primary
                            : color.alertError,
                      },
                    ]}
                  />
                  <View style={styles.cardContent}>

                    <View style={globalStyles.flexrow}>
                      <Image
                        source={
                          item.ProfileImage
                            ? {
                              uri: `${API_BASE_URL_IMAGE}${item.ProfileImage}`,
                            }
                            : defaultAvatar
                        }
                        style={styles.avatar}
                      />
                      <View style={[globalStyles.ml3, { flex: 1 }]}>
                        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, { flexWrap: "wrap", gap: 8, alignItems: 'flex-end' }]}>
                          <CustomText
                            style={[globalStyles.f16Bold, globalStyles.black]}
                          >
                            {item.CustomerName || "N/A"}
                          </CustomText>
                          {completed && (
                            <View style={styles.completedBadge}>
                              <Ionicons name="checkmark-circle" size={14} color={color.white} />
                              <CustomText style={[globalStyles.f10Bold, globalStyles.textWhite, globalStyles.ml1, { marginBottom: 2 }]}>
                                Completed
                              </CustomText>
                            </View>
                          )}
                        </View>
                        <View
                          style={[
                            globalStyles.flexrow,
                            globalStyles.alineItemscenter,
                            { flexWrap: "wrap", gap: 8 },
                          ]}
                        >

                          <CustomText
                            style={[globalStyles.f12Bold, globalStyles.secondary]}
                          >
                            {(() => {
                              const pickServiceType = item.PickupDelivery?.[0]?.PickServiceType ?? item.ServiceType;
                              return pickServiceType
                                ? pickServiceType.replace(/([A-Z])/g, " $1")
                                  .replace(/\bAt\b/g, "at")
                                  .trim()
                                : "N/A";
                            })()}
                          </CustomText>

                          {/* {completed && (
                            <View style={styles.completedBadge}>
                              <Ionicons name="checkmark-circle" size={16} color={color.white} />
                              <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite, globalStyles.ml1]}>
                                Completed
                              </CustomText>
                            </View>
                          )} */}
                          <View >
                            <View style={[styles.cardMetaItem, { marginTop: 0 }]}>
                              <MaterialCommunityIcons
                                name="card-account-details-outline"
                                size={16}
                                color={color.primary}
                                style={styles.cardMetaIcon}
                              />
                              <CustomText
                                style={[globalStyles.f10Regular, globalStyles.black]}
                                numberOfLines={1}
                              >
                                {getBookingDisplayData(item).bookingTrackID}
                              </CustomText>
                            </View>
                            <View style={styles.cardMetaItem}>
                              <FontAwesome5
                                name="car"
                                size={14}
                                color={color.primary}
                                style={styles.cardMetaIcon}
                              />
                              <CustomText
                                style={[globalStyles.f10Regular, globalStyles.black]}
                                numberOfLines={1}
                              >
                                {getBookingDisplayData(item).vehicleDisplay}
                              </CustomText>
                            </View>
                            <View style={styles.cardMetaItem}>
                              <MaterialCommunityIcons
                                name="calendar"
                                size={16}
                                color={color.primary}
                                style={styles.cardMetaIcon}
                              />
                              <CustomText
                                style={[globalStyles.f10Regular, globalStyles.black]}
                                numberOfLines={2}
                              >
                                {getBookingDisplayData(item).bookingDate} ({getBookingDisplayData(item).timeSlot})
                              </CustomText>
                            </View>
                            <View style={styles.cardMetaItem}>
                              <Ionicons
                                name="time-outline"
                                size={16}
                                color={color.primary}
                                style={styles.cardMetaIcon}
                              />
                              <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>
                               {getBookingDisplayData(item).assignDate}, {getBookingDisplayData(item).assignTime}
                              </CustomText>

                            </View>

                          </View>

                          {/* <CustomText
                            style={[globalStyles.f12Bold, globalStyles.textblack,
                            globalStyles.mt1,
                          ]}
                        >
                          Mobile:{" "}
                          <CustomText style={globalStyles.textblack}>
                            {item.PhoneNumber || "N/A"}
                          </CustomText>
                        </CustomText> */}

                        </View>
                      </View>
                    </View>

                    {/* Start/Continue button - show for ServiceAtGarage only, after booking details */}
                    {!completed && item.ServiceType === "ServiceAtGarage" && (
                      <View style={[globalStyles.mt3, { width: "100%" }]}> 
                        <TouchableOpacity
                          onPress={() => openBooking(item)}
                          style={[
                            styles.startButton,
                            {
                              backgroundColor:
                                driverStatus === "assigned"
                                  ? color.primary
                                  : color.yellow,
                            },
                          ]}
                        >
                          <CustomText
                            style={[globalStyles.f12Bold, globalStyles.textWhite,{marginBottom: 2}]}
                          >
                            {driverStatus === "assigned" ? "Start" : "Continue"}
                          </CustomText>
                          <Ionicons
                            name="play"
                            size={16}
                            color={color.white}
                            style={{ marginLeft: 8 }}
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* From / Address / To / Drop card (per sketch) */}
                    {
                      (item.PickupDelivery?.[0]?.PickServiceType ?? item.ServiceType) === "ServiceAtGarage" && !completed &&
                      (
                        <View style={styles.fromToCard}>
                          <View style={[globalStyles.flexrow, globalStyles.justifysb, { marginBottom: 8 }]}>
                            <TouchableOpacity
                              onPress={() => {
                                Vibration.vibrate([0, 200, 100, 300]);

                                const phoneNumber = item.PickupDelivery[0].PickFrom?.PersonNumber;
                                if (phoneNumber) {
                                  Linking.openURL(`tel:${phoneNumber}`);
                                } else {
                                  Alert.alert("Error", "Phone number not available");
                                }
                              }}
                              style={[
                                styles.callbutton,
                                globalStyles.flexrow,
                                globalStyles.justifysb,
                                { backgroundColor: color.primary, width: "48%" },
                              ]}
                            >

                              <CustomText
                                style={[
                                  globalStyles.f12Bold, globalStyles.textWhite, globalStyles.ml2, { marginBottom: 2 }
                                ]}
                              >
                                Pickup
                              </CustomText>

                              <Ionicons
                                style={[
                                  globalStyles.p2,
                                  globalStyles.ml2,
                                  globalStyles.bgsecondary,
                                  globalStyles.borderRadiuslarge,
                                ]}
                                name="call"
                                size={20}
                                color={color.white}
                              />
                            </TouchableOpacity>

                          </View>

                          {(() => {
                            const routeType = item.PickupDelivery?.[0]?.PickFrom?.RouteType;
                            const { pickIcon, dropIcon, pickLib, dropLib } = getRouteIcons(routeType);

                            const PickIcon = pickLib === "Ionicons" ? Ionicons : MaterialCommunityIcons;
                            const DropIcon = dropLib === "Ionicons" ? Ionicons : MaterialCommunityIcons;

                            return (
                              <>
                                {/* Pickup */}
                                <View style={{ flex: 1, marginBottom: 8 }}>
                                  <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, { marginBottom: 2 }]}>
                                    <PickIcon name={pickIcon} size={13} color={color.primary} style={{ marginRight: 4 }} />
                                    <CustomText style={[globalStyles.f10Bold, globalStyles.black]}>
                                      {item.PickupDelivery?.[0]?.PickFrom?.PersonName || "N/A"}
                                    </CustomText>
                                  </View>
                                  <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, { alignItems: "flex-start" }]}>
                                    <MaterialCommunityIcons name="map-marker" size={14} color={color.primary} style={{ marginRight: 4, marginTop: 1 }} />
                                    <CustomText style={[styles.addressValue, { flex: 1 }]} numberOfLines={2}>
                                      {item.PickupDelivery?.[0]?.PickFrom?.Address || "N/A"}
                                    </CustomText>
                                  </View>
                                </View>

                                <View style={styles.addressUnderline} />

                                {/* Drop */}
                                <View style={{ flex: 1, marginTop: 8 }}>
                                  <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, { marginBottom: 2 }]}>
                                    <DropIcon name={dropIcon} size={13} color={color.primary} style={{ marginRight: 4 }} />
                                    <CustomText style={[globalStyles.f10Bold, globalStyles.black]}>
                                      {item.PickupDelivery?.[0]?.DropAt?.PersonName || "N/A"}
                                    </CustomText>
                                  </View>
                                  <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, { alignItems: "flex-start" }]}>
                                    <MaterialCommunityIcons name="map-marker" size={14} color={color.primary} style={{ marginRight: 4, marginTop: 1 }} />
                                    <CustomText style={[styles.addressValue, { flex: 1 }]} numberOfLines={2}>
                                      {item.PickupDelivery?.[0]?.DropAt?.Address || "N/A"}
                                    </CustomText>
                                  </View>
                                </View>
                              </>
                            );
                          })()}

                          <View style={[globalStyles.flexrow, globalStyles.justifyend, globalStyles.alineItemscenter]}>
                            <TouchableOpacity
                              disabled={!carPicked}
                              onPress={() => {
                                Vibration.vibrate([0, 200, 100, 300]);

                                const phoneNumber = item.PickupDelivery[0].DropAt?.PersonNumber;
                                if (phoneNumber) {
                                  Linking.openURL(`tel:${phoneNumber}`);
                                } else {
                                  Alert.alert("Error", "Phone number not available");
                                }
                              }}
                              style={[
                                styles.callbutton,
                                globalStyles.flexrow,
                                globalStyles.justifysb,
                                {
                                  backgroundColor: carPicked ? color.primary : color.neutral[300],
                                  opacity: carPicked ? 1 : 0.6,
                                },
                              ]}
                            >
                              <Ionicons
                                style={[
                                  globalStyles.p2,
                                  globalStyles.mr2,
                                  globalStyles.bgsecondary,
                                  globalStyles.borderRadiuslarge,
                                ]}
                                name="call"
                                size={20}
                                color={color.white}
                              />
                              <CustomText
                                style={[
                                  globalStyles.f12Bold, globalStyles.textWhite, globalStyles.mr2, { marginBottom: 2 }
                                ]}
                              >
                                Drop
                              </CustomText>


                            </TouchableOpacity>

                          </View>
                        </View>
                      )
                    }




                    {
                      item.ServiceType === "ServiceAtHome" && !completed && (
                        <View style={styles.fromToCard}>

                          <View style={{ flex: 1, marginBottom: 8 }}>
                            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, { marginBottom: 2 }]}>
                              <Ionicons name="person-outline" size={13} color={color.primary} style={{ marginRight: 4 }} />
                              <CustomText style={[globalStyles.f10Bold, globalStyles.black]}>
                                {item.PickupDelivery?.[0]?.PickFrom?.PersonName || "Customer"}
                              </CustomText>
                            </View>
                            <View style={[globalStyles.flexrow, { alignItems: "flex-start" }]}>
                              <MaterialCommunityIcons name="map-marker" size={14} color={color.primary} style={{ marginRight: 4, marginTop: 1 }} />
                              <CustomText style={[styles.addressValue, { flex: 1 }]} numberOfLines={2}>
                                {item.PickupDelivery?.[0]?.PickFrom?.Address || item.Leads?.City || "N/A"}
                              </CustomText>
                            </View>
                          </View>

                          <View style={[globalStyles.flexrow, globalStyles.mt3, globalStyles.justifysb, globalStyles.alineItemscenter]}>
                            <TouchableOpacity
                              onPress={() => {
                                Vibration.vibrate([0, 200, 100, 300]);

                                const phoneNumber = item.PickupDelivery[0].PickFrom?.PersonNumber;
                                if (phoneNumber) {
                                  Linking.openURL(`tel:${phoneNumber}`);
                                } else {
                                  Alert.alert("Error", "Phone number not available");
                                }
                              }}
                              style={[
                                styles.callbuttontocustomer,
                                globalStyles.flexrow,
                                { backgroundColor: color.primary },
                              ]}
                            >
                              <Ionicons
                                style={[
                                  globalStyles.p2,
                                  globalStyles.mr2,
                                  globalStyles.bgsecondary,
                                  globalStyles.borderRadiuslarge,
                                ]}
                                name="call"
                                size={16}
                                color={color.white}
                              />
                              <CustomText
                                style={[
                                  globalStyles.f12Bold, globalStyles.textWhite, globalStyles.mr2, { marginBottom: 2 }
                                ]}
                              >
                                Call Customer
                              </CustomText>


                            </TouchableOpacity>


                            <TouchableOpacity
                              onPress={() => openBooking(item)}
                              key={`${item.BookingID ?? "booking"}-${index}`}
                              style={[
                                styles.ViewCarDetails,
                                globalStyles.flexrow,
                              ]}
                            >

                              <CustomText
                                style={[
                                  globalStyles.f12Bold, globalStyles.textWhite
                                ]}
                              >
                                View
                              </CustomText>
                              <Ionicons
                                style={[
                                  globalStyles.p2,
                                  globalStyles.bgwhite,
                                  globalStyles.borderRadiuslarge,
                                ]}
                                name="chevron-forward-outline"
                                size={16}
                                color={color.yellow}
                              />

                            </TouchableOpacity>

                          </View>
                        </View>
                      )
                    }



                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}
      </View>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  noDataContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Filter Card
  filterCard: {
    backgroundColor: color.white,
    padding: 12,
    marginBottom: 0,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: color.neutral[100],
    alignItems: "center",
    marginHorizontal: 3,
    minHeight: 40,
  },
  filterButtonActive: {
    backgroundColor: color.primary,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardWrapper: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: color.primary,
  },
  cardContent: {
    paddingLeft: 4,
  },
  cardMetaBlock: {
    marginTop: 8,
  },
  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
    gap: 12,
  },
  cardMetaCol: {
    flex: 1,
    minWidth: 0,
  },
  cardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 20,
  },
  cardMetaIcon: {
    marginRight: 8,
    width: 20,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  serviceTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  callbutton: {
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 50,
    width: "38%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    marginVertical: 4
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    paddingHorizontal: 16,
  },
  callbuttontocustomer: {
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 50,
    width: "55%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  ViewCarDetails: {
    backgroundColor: color.yellow,
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 35,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: 50,
    width: "42%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  fromToCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: color.primary,
    backgroundColor: color.white,
  },
  fromToLabel: {
    fontSize: 12,
    color: color.neutral[500],
    marginBottom: 8,
  },
  fromToTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: color.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  fromToTagDrop: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: color.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fromToTagArrow: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.primary,
    marginHorizontal: 6,
  },
  fromToTagText: {
    fontSize: 14,
    fontWeight: "600",
    color: color.primary,
  },
  fromToTagIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  addressLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  addressLabel: {
    fontSize: 13,
    color: color.neutral[500],
    width: 72,
    marginRight: 8,
  },
  addressIconWrap: {
    marginRight: 8,
    justifyContent: "center",
  },
  addressValue: {
    flex: 1,
    fontSize: 13,
    color: color.black,
  },
  addressUnderline: {
    height: 1,
    backgroundColor: color.neutral[200],
    marginTop: 6,
    marginBottom: 4,
  },
  toRow: {
    marginTop: 14,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: color.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  avatar: {
    width: 100,
    height: 120,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: color.white,
  },
  // skeleton primitives
  skelAvatar: { width: 70, height: 100, borderRadius: 8 },
  skelLineMedium: { height: 14, borderRadius: 7 },
  skelLineSmall: { height: 12, borderRadius: 6 },
  skelFlexLine: { height: 12, borderRadius: 6, width: "90%" },
  skelIcon: { width: 16, height: 16, borderRadius: 8 },
  timeValue: {
    flex: 1,
    flexWrap: "wrap",
  },
});
