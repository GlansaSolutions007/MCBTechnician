import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
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
import { useEffect, useState, useRef } from "react";
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

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const techIDFromStorage = await AsyncStorage.getItem("techID");
      const techID = techIdFromParams ?? techIDFromStorage;

      if (!techID) {
        console.log("Tech ID not found");
        setTodaysBookings([]);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}Bookings/GetAssignedBookings`,
        {
          params: { Id: techID, techId: techID },
        },
      );

      // ✅ ALWAYS ensure array
      const bookingsData = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];

      setTodaysBookings(bookingsData);
      console.log("Bookings Data==============>", bookingsData);
      console.log("Bookings Data=> ServiceType ServiceAtGarage:", bookingsData);
    } catch (error) {
      console.error(
        "Error fetching bookings:",
        error?.response || error.message,
      );
      setTodaysBookings([]);
    } finally {
      setLoading(false);
    }
  };

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
      } catch (_) {}
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

  const getFilteredBookings = () => {
    const nonFutureBookings = todaysBookings.filter((booking) => {
      // const serviceDate = booking.BookingDate || booking.TechAssignDate;

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
      case "completed":
        return nonFutureBookings.filter(
          (booking) => booking.BookingStatus === "Completed",
        );
      case "pending":
        return nonFutureBookings.filter((booking) => {
          if (booking.BookingStatus === "Completed") return false;
          return true;
        });
      default:
        return nonFutureBookings.filter((booking) => {
          if (booking.BookingStatus === "Completed") return false;
          return true;
        });
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
              return (
                <Pressable
                  onPress={() => openBooking(item)}
                  // key={item.BookingID?.toString() || `idx-${index}`}
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
                            ? color.alertError
                            : color.primary,
                      },
                    ]}
                  />
                  <View style={styles.cardContent}>
                    <View
                      style={[
                        globalStyles.flexrow,
                        globalStyles.alineItemscenter,
                        globalStyles.mb3,
                        { flexWrap: "wrap", gap: 8 },
                      ]}
                    >
                      <View
                        style={[
                          styles.serviceTypeChip,
                          { backgroundColor: color.primary },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="wrench-outline"
                          size={14}
                          color={color.white}
                          style={{ marginRight: 6 }}
                        />
                        <CustomText
                          style={[globalStyles.f12Bold, globalStyles.textWhite]}
                        >
                          {item.ServiceType
                            ? item.ServiceType.replace(/([A-Z])/g, " $1").trim()
                            : "N/A"}
                        </CustomText>
                      </View>
                      <View
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor:
                              driverStatus === "completed"
                                ? color.alertSuccess
                                : driverStatus === "pickup_reached"
                                  ? color.alertInfo
                                  : color.primary,
                          },
                        ]}
                      >
                        <CustomText
                          style={[globalStyles.f10Bold, globalStyles.textWhite]}
                        >
                          {driverStatus || "No Status"}
                        </CustomText>
                      </View>
                     
                    </View>
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
                        <CustomText
                          style={[globalStyles.f16Bold, globalStyles.black]}
                        >
                          {item.CustomerName || item.Leads?.FullName || "N/A"}
                        </CustomText>
                        <CustomText
                          style={[
                            globalStyles.f12Medium,
                            globalStyles.neutral500,
                            globalStyles.mt1,
                          ]}
                        >
                          Mobile:{" "}
                          <CustomText style={globalStyles.black}>
                            {item.PhoneNumber ||
                              item.Leads?.PhoneNumber ||
                              "N/A"}
                          </CustomText>
                        </CustomText>
                        <CustomText
                          style={[
                            globalStyles.f12Medium,
                            globalStyles.neutral500,
                            globalStyles.mt1,
                          ]}
                        >
                          RouteType:{" "}
                          <CustomText style={globalStyles.black}>
                          {item?.PickupDelivery?.[0]?.PickFrom?.[0]?.RouteType ||
                            item?.PickupDelivery?.[0]?.DropAt?.RouteType ||
                            "N/A"}
                          </CustomText>
                        </CustomText>
                        <CustomText
                          style={[
                            globalStyles.f10Regular,
                            globalStyles.neutral500,
                            globalStyles.mt1,
                          ]}
                          numberOfLines={2}
                        >
                          {item.FullAddress ||
                            item.Leads?.City ||
                            item.Leads?.FullAddress ||
                            "N/A"}
                        </CustomText>
                      </View>
                    </View>

                    <View style={globalStyles.divider} />
                    {/* <BookingPickDropRow booking={item} />

                    <View style={globalStyles.divider} /> */}

                    <View style={styles.cardMetaRow}>
                      <View style={styles.cardMetaCol}>
                        <View style={styles.cardMetaItem}>
                          <MaterialCommunityIcons
                            name="card-account-details-outline"
                            size={16}
                            color={color.primary}
                            style={styles.cardMetaIcon}
                          />
                          <CustomText
                            style={[
                              globalStyles.f10Regular,
                              globalStyles.black,
                            ]}
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
                            style={[
                              globalStyles.f10Regular,
                              globalStyles.black,
                            ]}
                            numberOfLines={1}
                          >
                            {getBookingDisplayData(item).vehicleDisplay}
                          </CustomText>
                        </View>
                      </View>
                      <View style={styles.cardMetaCol}>
                        <View style={styles.cardMetaItem}>
                          <MaterialCommunityIcons
                            name="calendar"
                            size={16}
                            color={color.primary}
                            style={styles.cardMetaIcon}
                          />
                          <CustomText
                            style={[
                              globalStyles.f10Regular,
                              globalStyles.black,
                            ]}
                          >
                            {getBookingDisplayData(item).bookingDate}
                          </CustomText>
                        </View>
                        <View style={styles.cardMetaItem}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color={color.primary}
                            style={styles.cardMetaIcon}
                          />
                          <CustomText
                            style={[
                              globalStyles.f10Regular,
                              globalStyles.black,
                              styles.timeValue,
                            ]}
                            numberOfLines={1}
                          >
                            {getBookingDisplayData(item).timeSlot}
                          </CustomText>
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        )}
      </View>
    </ScrollView>
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
    marginTop: 8,
  },
  cardMetaIcon: {
    marginRight: 6,
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
  chipCompleted: { backgroundColor: "#4CAF50" },
  chipPending: { backgroundColor: color.primary },
  avatar: {
    width: 70,
    height: 100,
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
