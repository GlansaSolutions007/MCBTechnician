import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Pressable,
  Animated,
  Easing,
  Alert,
  Linking,
  Vibration,
  ActivityIndicator,
} from "react-native";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome,
} from "@expo/vector-icons";
import CustomText from "../components/CustomText";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import defaultAvatar from "../../assets/images/buddy.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { API_BASE_URL_IMAGE } from "@env";
import { RefreshControl } from "react-native";
import { getBookingDisplayData } from "../utils/bookingDisplay";
import BookingPickDropRow from "../components/BookingPickDropRow";
export default function Dashboard() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pulse] = useState(new Animated.Value(0));
  const [gearSpin] = useState(new Animated.Value(0));

  const getLastPaymentStatus = (item) => {
    const payments = item?.Payments || [];
    const lastPayment = payments.length ? payments[payments.length - 1] : null;
    return lastPayment?.PaymentStatus;
  };

  const isActiveService = (item) => {
    const lastPaymentStatus = getLastPaymentStatus(item);
    const driverStatus = item?.PickupDelivery?.[0]?.DriverStatus;
    return (
      (driverStatus === "pickup_started" ||
        driverStatus === "pickup_reached" ||
        driverStatus === "ServiceStart" ||
        driverStatus === "car_picked" ||
        driverStatus === "in_transit" ||
        driverStatus === "drop_reached") &&
      lastPaymentStatus !== "Pending"
    );
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
      const bookingDate = new Date(dateString);
      if (isNaN(bookingDate.getTime())) return false;
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate > today;
    } catch {
      return false;
    }
  };
  const isBookingCompleted = (booking) => {
    const status = booking?.PickupDelivery?.[0]?.DriverStatus;
    return (
      status === "completed" ||
      status === "ServiceComplete" ||
      status === "car_picked" ||
      status === "in_transit" ||
      status === "drop_reached"
    );
  };

  const getAssignDate = (booking) => {
    const pd = booking?.PickupDelivery;
    if (!pd) return booking?.BookingDate || booking?.TechAssignDate || null;
    if (Array.isArray(pd) && pd.length > 0) {
      const sorted = [...pd].sort(
        (a, b) => new Date(b.AssignDate) - new Date(a.AssignDate),
      );
      return (
        sorted[0]?.AssignDate ||
        booking?.BookingDate ||
        booking?.TechAssignDate ||
        null
      );
    }
    return (
      pd?.AssignDate || booking?.BookingDate || booking?.TechAssignDate || null
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        try {
          await Promise.all([fetchActiveServices()]);
          setInitialLoading(false);
        } catch (error) {
          console.error("Error refreshing data:", error);
        }
      };

      const checkStartRideFlag = async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const rideKeys = keys.filter((k) => k.startsWith("startRide_done_"));
          // simply remove any existing flag(s); dashboard is already visible
          await Promise.all(rideKeys.map((k) => AsyncStorage.removeItem(k)));
        } catch (e) {
          console.error("Error clearing startRide flag on dashboard:", e);
        }
      };

      // run refresh first, then look for flag so that bookings array is populated
      refreshData().then(() => checkStartRideFlag());
    }, [bookings]),
  );

  const Booking = () => {
    navigation.navigate("Booking", { bookings });
  };

  const [bookings, setBookings] = useState([]);
  const [assignedBookingsCount, setAssignedBookingsCount] = useState(0);
  const [schedulesCount, setSchedulesCount] = useState(0);
  const [reportsListCount, setReportsListCount] = useState(0);
  const [activeServices, setActiveServices] = useState([]);

  const CollectPayment = (item, amount) => {
    navigation.navigate("CollectPayment", { booking: item, amount });
  };
  const CustomerInfo = async (item) => {
    navigation.navigate("customerInfo", { booking: item });
  };

 const openBooking = (item) => {
    const estimatedTime = item.TotalEstimatedDurationMinutes
      ? item.TotalEstimatedDurationMinutes * 60
      : 0;

    let actualTime = 0;
    

    const driverStatus = getDriverStatus(item);

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
    
  };


  const Schedules = () => {
    navigation.navigate("Schedules");
  };
  const Reports = () => {
    navigation.navigate("Reports");
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const techID = await AsyncStorage.getItem("techID");
        const token = await AsyncStorage.getItem("token");
        if (techID) {
          const res = await axios.get(
            `${API_BASE_URL}Bookings/GetTechTodayBookings?Id=${techID}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const allBookingsData = Array.isArray(res.data) ? res.data : [];
          setBookings(allBookingsData);
        } else {
          console.warn("No technicianId found");
        }
      } catch (err) {
        console.error("Fetch error", err);
      }
    };

    fetchBookings();
  }, []);

  const [techID, setTechID] = useState(null);
  const [count, setCount] = useState(0);
  const [assignedTasks, setAssignedTasks] = useState([]);

  useEffect(() => {
    const loadTechID = async () => {
      const id = await AsyncStorage.getItem("techID");
      setTechID(Number(id));
    };
    loadTechID();
  }, []);

  useEffect(() => {
    if (techID && bookings?.length) {
      const taskCount =
        bookings.reduce((total, booking) => {
          const pkgCount =
            booking.Packages?.reduce((pkgTotal, pkg) => {
              const matchCount =
                pkg.Category?.SubCategories?.filter((sub) => sub.id === techID)
                  .length || 0;
              return pkgTotal + matchCount;
            }, 0) || 0;
          return total + pkgCount;
        }, 0) || 0;

      const tasks =
        bookings.flatMap(
          (booking) =>
            booking.Packages?.flatMap(
              (pkg) =>
                pkg.Category?.SubCategories?.filter(
                  (sub) => sub.id === techID,
                ) || [],
            ) || [],
        ) || [];

      setCount(taskCount);
      setAssignedTasks(tasks);
    }
  }, [techID, bookings]);

  const fetchActiveServices = async () => {
    try {
      const techID = await AsyncStorage.getItem("techID");
      const token = await AsyncStorage.getItem("token");
      if (!techID) {
        setActiveServices([]);
        return;
      }
      const baseUrl = API_BASE_URL?.endsWith("/")
        ? API_BASE_URL
        : `${API_BASE_URL}/`;
      const res = await axios.get(`${baseUrl}Bookings/GetAssignedBookings`, {
        params: { Id: techID, techId: techID },
        headers: { Authorization: `Bearer ${token}` },
      });
      const allAssignedBookings = Array.isArray(res.data)
        ? res.data
        : res?.data?.data || [];
      const completedCount =
        allAssignedBookings.filter(isBookingCompleted).length;
      setReportsListCount(completedCount);
      const futureCount = allAssignedBookings.filter((b) =>
        isFutureDate(getAssignDate(b)),
      ).length;
      setSchedulesCount(futureCount);
      const nonFutureBookings = allAssignedBookings.filter((booking) => {
        const serviceDate = getAssignDate(booking);
        if (!serviceDate) return true;
        return !isFutureDate(serviceDate);
      });
      const pendingCount = nonFutureBookings.filter(
        (b) => !isBookingCompleted(b),
      ).length;
      setAssignedBookingsCount(pendingCount);
      const activeBookings = allAssignedBookings.filter(isActiveService);
      setActiveServices(activeBookings);
    } catch (err) {
      console.error("fetchActiveServices error", err);
      setAssignedBookingsCount(0);
      setSchedulesCount(0);
      setReportsListCount(0);
      setActiveServices([]);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    await Promise.all([fetchActiveServices()]);
  };

  useEffect(() => {
    refreshData();

    const interval = setInterval(() => {
      refreshData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialLoading) {
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
        ]),
      ).start();
    }
  }, [initialLoading, pulse]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(gearSpin, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(gearSpin, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [gearSpin]);

  const gearRotation = gearSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const gearRotationreverse = gearSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  const bg = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [color.neutral[200], color.neutral[100]],
  });

  const SkeletonStatCard = ({ wide }) => (
    <View
      style={[
        globalStyles.borderRadiuslarge,
        wide ? { width: "48%" } : { width: "48%" },
      ]}
    >
      <View
        style={[
          styles.skelCard,
          globalStyles.borderRadiuslarge,
          globalStyles.ph4,
          globalStyles.pv2,
          globalStyles.mb3,
        ]}
      >
        <Animated.View
          style={[styles.skelLineSmall, { backgroundColor: bg, width: 100 }]}
        />
        <View
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.alineItemscenter,
            globalStyles.mt3,
          ]}
        >
          <Animated.View style={[styles.skelIconLg, { backgroundColor: bg }]} />
          <Animated.View style={[styles.skelNumber, { backgroundColor: bg }]} />
        </View>
      </View>
      <View
        style={[
          styles.skelCard,
          globalStyles.borderRadiuslarge,
          globalStyles.flexrow,
          globalStyles.alineItemscenter,
          globalStyles.justifysb,
          globalStyles.ph4,
          globalStyles.pv3,
        ]}
      >
        <Animated.View
          style={[styles.skelWideNumber, { backgroundColor: bg }]}
        />
      </View>
    </View>
  );

  const SkeletonRightCard = () => (
    <View
      style={[
        globalStyles.borderRadiuslarge,
        { width: "48%", justifyContent: "space-between" },
      ]}
    >
      <View
        style={[
          styles.skelCard,
          globalStyles.borderRadiuslarge,
          globalStyles.ph4,
          globalStyles.pv2,
        ]}
      >
        <Animated.View
          style={[styles.skelLineSmall, { backgroundColor: bg, width: 80 }]}
        />
        <View
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.alineItemscenter,
            globalStyles.mt3,
          ]}
        >
          <Animated.View style={[styles.skelIconLg, { backgroundColor: bg }]} />
          <Animated.View style={[styles.skelNumber, { backgroundColor: bg }]} />
        </View>
      </View>
    </View>
  );

  const SkeletonTodayCard = () => (
    <View
      style={[
        globalStyles.card,
        globalStyles.cardwidth,
        globalStyles.bgwhite,
        globalStyles.p4,
        globalStyles.mt5,
      ]}
    >
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <View style={[styles.Pcicon]}>
          <Animated.View
            style={[styles.skelIconSquare, { backgroundColor: bg }]}
          />
        </View>
        <View style={[globalStyles.ml50, globalStyles.flex1]}>
          <Animated.View
            style={[
              styles.skelLineSmall,
              { backgroundColor: bg, alignSelf: "flex-end", width: 160 },
            ]}
          />
          <Animated.View
            style={[
              styles.skelHero,
              { backgroundColor: bg, alignSelf: "flex-end", marginTop: 8 },
            ]}
          />
        </View>
      </View>
      <View style={globalStyles.divider} />
      <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
          <Animated.View style={[styles.skelIconSm, { backgroundColor: bg }]} />
          <Animated.View
            style={[
              styles.skelLineTiny,
              { backgroundColor: bg, marginLeft: 6, width: 120 },
            ]}
          />
        </View>
      </View>
    </View>
  );

  const SkeletonActiveItem = () => (
    <View
      style={[
        styles.skelCard,
        globalStyles.p4,
        globalStyles.card,
        globalStyles.mt2,
      ]}
    >
      <View style={[globalStyles.flexrow]}>
        <Animated.View style={[styles.activeAvatar, { backgroundColor: bg }]} />
        <View style={[globalStyles.ml3, { flex: 1 }]}>
          <Animated.View
            style={[styles.skelLineMedium, { backgroundColor: bg, width: 180 }]}
          />
          <Animated.View
            style={[
              styles.skelLineTiny,
              { backgroundColor: bg, marginTop: 6, width: 140 },
            ]}
          />
          <Animated.View
            style={[
              styles.skelLineTiny,
              { backgroundColor: bg, marginTop: 6, width: "90%" },
            ]}
          />
        </View>
      </View>
      <View style={globalStyles.divider} />
      <View
        style={[
          globalStyles.flexrow,
          globalStyles.justifysb,
          globalStyles.alineItemscenter,
          styles.card,
        ]}
      >
        <Animated.View
          style={[styles.skelLineSmall, { backgroundColor: bg, width: 100 }]}
        />
        <Animated.View style={[styles.skelCircle, { backgroundColor: bg }]} />
      </View>
    </View>
  );

  if (initialLoading) {
    return (
      <ScrollView
        style={[globalStyles.bgcontainer]}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={[globalStyles.container]}>
          <View
            style={[
              globalStyles.flexrow,
              globalStyles.justifysb,
              globalStyles.mt5,
            ]}
          >
            <SkeletonStatCard wide />
            <SkeletonRightCard />
          </View>
          <SkeletonTodayCard />
          <View style={[globalStyles.mt4]}>
            <Animated.View
              style={[
                styles.skelLineMedium,
                { backgroundColor: bg, width: 140 },
              ]}
            />
            <View style={[globalStyles.mt3]}>
              <SkeletonActiveItem />
              <SkeletonActiveItem />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={refreshing} />}
    >
      <View style={[globalStyles.container]}>
        <View
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.mt5,
          ]}
        >
          <View style={{ width: "48%" }}>
            <Pressable
              onPress={Schedules}
              style={[
                globalStyles.bgprimary,
                globalStyles.borderRadiuslarge,
                globalStyles.ph4,
                globalStyles.pv2,
                globalStyles.mb3,
              ]}
            >
              <CustomText
                style={[globalStyles.f16Bold, globalStyles.textWhite]}
              >
                Schedules
              </CustomText>

              <View
                style={[
                  globalStyles.flexrow,
                  globalStyles.justifysb,
                  globalStyles.alineItemscenter,
                  globalStyles.mt3,
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={35}
                  color={color.white}
                />

                <CustomText
                  style={[globalStyles.f32Bold, globalStyles.textWhite]}
                >
                  {schedulesCount}
                </CustomText>
              </View>
            </Pressable>
          </View>

          <View style={{ width: "48%" }}>
            <Pressable
              onPress={Reports}
              style={[
                globalStyles.bgprimary,
                globalStyles.borderRadiuslarge,
                globalStyles.ph4,
                globalStyles.pv2,
                globalStyles.mb3,
              ]}
            >
              <CustomText
                style={[globalStyles.f16Bold, globalStyles.textWhite]}
              >
                Reports
              </CustomText>

              <View
                style={[
                  globalStyles.flexrow,
                  globalStyles.justifysb,
                  globalStyles.alineItemscenter,
                  globalStyles.mt3,
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={35}
                  color={color.white}
                />

                <CustomText
                  style={[globalStyles.f32Bold, globalStyles.textWhite]}
                >
                  {reportsListCount}
                </CustomText>
              </View>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={Booking}
          style={[
            globalStyles.card,
            globalStyles.cardwidth,
            globalStyles.bgwhite,
            globalStyles.p4,
            globalStyles.mt5,
          ]}
        >
          <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
            <View style={[styles.Pcicon]}>
              <MaterialIcons name="touch-app" size={40} color={color.primary} />
            </View>
            <View style={[globalStyles.ml50, globalStyles.flex1]}>
              <CustomText
                style={[globalStyles.f14Bold, globalStyles.alineSelfend]}
              >
                Todays Service Bookings
              </CustomText>

              <CustomText
                style={[
                  globalStyles.f44Bold,
                  globalStyles.primary,
                  globalStyles.mb2,
                  globalStyles.alineSelfend,
                ]}
              >
                {assignedBookingsCount}
              </CustomText>
            </View>
          </View>

          <View style={globalStyles.divider} />

          <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              <IconLabel icon="people-outline" />
              <CustomText style={globalStyles.f16Bold}>
                {assignedBookingsCount} customers
              </CustomText>
            </View>
          </View>
        </Pressable>

        <View style={[globalStyles.mt4]}>
          <View
            style={[
              globalStyles.flexrow,
              globalStyles.alineItemscenter,
              globalStyles.justifysb,
            ]}
          >
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              <Ionicons
                name="flash-outline"
                size={20}
                color={color.primary}
                style={{ marginRight: 8 }}
              />
              <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                Active Services
              </CustomText>
            </View>
            {(activeServices || []).length > 0 ? (
              <View
                style={[
                  globalStyles.flexrow,
                  globalStyles.alineItemscenter,
                  {
                    backgroundColor: color.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    shadowColor: color.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  },
                ]}
              >
                <View
                  style={[
                    {
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: color.white,
                      marginRight: 6,
                    },
                  ]}
                />
                <CustomText
                  style={[
                    globalStyles.f14Bold,
                    globalStyles.textWhite,
                    { letterSpacing: 0.5 },
                  ]}
                >
                  {(activeServices || []).length}
                </CustomText>
              </View>
            ) : (
              <View
                style={[
                  globalStyles.flexrow,
                  globalStyles.alineItemscenter,
                  {
                    backgroundColor: color.neutral[200],
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                  },
                ]}
              >
                <CustomText
                  style={[globalStyles.f12Medium, globalStyles.neutral500]}
                >
                  0
                </CustomText>
              </View>
            )}
          </View>
          {(
            Array.isArray(activeServices) ? activeServices.length > 0 : false
          ) ? (
            <View style={[globalStyles.mt3]}>
              {(activeServices || []).map((item, index) => {
                const driverStatus = getDriverStatus(item);
                const lastPaymentStatus = getLastPaymentStatus(item);
                const totalPaid = (item?.Payments || []).reduce(
                  (sum, p) =>
                    p?.PaymentStatus === "Success" ||
                    p?.PaymentStatus === "Partialpaid"
                      ? sum + Number(p?.AmountPaid || 0)
                      : sum,
                  0,
                );
                const totalPrice = Number(item?.TotalPrice) || 0;
                const amountPending = totalPrice - totalPaid;
                const display = getBookingDisplayData(item);

                return (
                  <View>
                    {item.ServiceType === "ServiceAtGarage" &&
                      item.PickupDelivery?.[0] && (
                        <Pressable
                        onPress={() => openBooking(item)}
                  // key={item.BookingID?.toString() || `idx-${index}`}
                          key={`${item.BookingID ?? "active"}-${index}`}
                          style={[
                            driverStatus === "completed"
                              ? globalStyles.bgneutral100
                              : globalStyles.bgwhite,
                            globalStyles.p4,
                            globalStyles.mt4,
                            globalStyles.card,
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
                                style={styles.bookingAvatar}
                              />
                              <View style={[globalStyles.ml3, { flex: 1 }]}>
                                <CustomText
                                  style={[
                                    globalStyles.f16Bold,
                                    globalStyles.black,
                                  ]}
                                >
                                  {item.CustomerName ||
                                    display.customerName ||
                                    "N/A"}
                                </CustomText>

                                <View
                                  style={[
                                    globalStyles.flexrow,
                                    globalStyles.alineItemscenter,
                                    { flexWrap: "wrap", gap: 8 },
                                  ]}
                                >
                                  <CustomText
                                    style={[
                                      globalStyles.f12Bold,
                                      globalStyles.secondary,
                                    ]}
                                  >
                                    {item.ServiceType
                                      ? item.ServiceType.replace(
                                          /([A-Z])/g,
                                          " $1",
                                        ).trim()
                                      : "N/A"}
                                  </CustomText>
                                </View>
                                <View>
                                  <View
                                    style={[
                                      styles.cardMetaItem,
                                      { marginTop: 0 },
                                    ]}
                                  >
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
                                      {display.bookingTrackID}
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
                                      {display.vehicleDisplay}
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
                                      style={[
                                        globalStyles.f10Regular,
                                        globalStyles.black,
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {display.bookingDate}
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
                                    >
                                      {(display.timeSlot || "")
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                        .join("\n") || "N/A"}
                                    </CustomText>
                                  </View>
                                </View>
                              </View>

                              <View
                                style={{ marginRight: -16, marginTop: -10 }}
                              >
                                {(item?.PickupDelivery?.[0]?.DriverStatus ===
                                  "ServiceStart" ||
                                  item?.PickupDelivery?.[0]?.DriverStatus ===
                                    "ServiceComplete") && (
                                  <View style={[globalStyles.alineItemscenter]}>
                                    <Animated.View
                                      style={{
                                        marginRight: 8,
                                        transform: [{ rotate: gearRotation }],
                                      }}
                                    >
                                      <FontAwesome
                                        name="gear"
                                        size={50}
                                        color={color.primary}
                                      />
                                    </Animated.View>
                                    <Animated.View
                                      style={{
                                        marginRight: 35,
                                        marginTop: -14,
                                        transform: [
                                          { rotate: gearRotationreverse },
                                        ],
                                      }}
                                    >
                                      <FontAwesome
                                        name="gear"
                                        size={30}
                                        color={color.primary}
                                      />
                                    </Animated.View>
                                  </View>
                                )}
                              </View>
                            </View>

                            <View style={styles.fromToCard}>
                              <TouchableOpacity
                                onPress={() => {
                                  Vibration.vibrate([0, 200, 100, 300]);
                                  const phoneNumber =
                                    item.PickupDelivery?.[0]?.PickFrom
                                      ?.PersonNumber;
                                  if (phoneNumber)
                                    Linking.openURL(`tel:${phoneNumber}`);
                                  else
                                    Alert.alert(
                                      "Error",
                                      "Phone number not available",
                                    );
                                }}
                                style={[
                                  styles.callbutton,
                                  globalStyles.flexrow,
                                  globalStyles.justifysb,
                                  { backgroundColor: color.primary },
                                ]}
                              >
                                <CustomText
                                  style={[
                                    globalStyles.f12Bold,
                                    globalStyles.textWhite,
                                    globalStyles.ml2,
                                  ]}
                                >
                                  Car Pickup call
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
                              <View style={styles.addressLine}>
                                <View style={styles.addressIconWrap}>
                                  <MaterialCommunityIcons
                                    name="map-marker"
                                    size={18}
                                    color={color.primary}
                                  />
                                </View>
                                <CustomText
                                  style={styles.addressValue}
                                  numberOfLines={2}
                                >
                                  {item.PickupDelivery?.[0]?.PickFrom
                                    ?.Address || "N/A"}
                                </CustomText>
                              </View>
                              <View style={styles.addressUnderline} />
                              <View style={styles.addressLine}>
                                <View style={styles.addressIconWrap}>
                                  <MaterialCommunityIcons
                                    name="map-marker"
                                    size={18}
                                    color={color.primary}
                                  />
                                </View>
                                <CustomText
                                  style={styles.addressValue}
                                  numberOfLines={2}
                                >
                                  {item.PickupDelivery?.[0]?.DropAt?.Address ||
                                    "N/A"}
                                </CustomText>
                              </View>
                              <View
                                style={[
                                  globalStyles.flexrow,
                                  globalStyles.justifyend,
                                  globalStyles.alineItemscenter,
                                ]}
                              >
                                <TouchableOpacity
                                  onPress={() => {
                                    Vibration.vibrate([0, 200, 100, 300]);
                                    const phoneNumber =
                                      item.PickupDelivery?.[0]?.DropAt
                                        ?.PersonNumber;
                                    if (phoneNumber)
                                      Linking.openURL(`tel:${phoneNumber}`);
                                    else
                                      Alert.alert(
                                        "Error",
                                        "Phone number not available",
                                      );
                                  }}
                                  style={[
                                    styles.callbutton,
                                    globalStyles.flexrow,
                                    globalStyles.justifysb,
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
                                    size={20}
                                    color={color.white}
                                  />
                                  <CustomText
                                    style={[
                                      globalStyles.f12Bold,
                                      globalStyles.textWhite,
                                      globalStyles.mr2,
                                    ]}
                                  >
                                    Car Drop call
                                  </CustomText>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </Pressable>
                      )}


 {item.ServiceType === "ServiceAtHome" &&
                          item.PickupDelivery?.[0] && (
                    <Pressable
                      onPress={() => CustomerInfo(item)}
                      key={`${item.BookingID ?? "active"}-${index}`}
                      style={[
                        driverStatus === "completed"
                          ? globalStyles.bgneutral100
                          : globalStyles.bgwhite,
                        globalStyles.p4,
                        globalStyles.mt4,
                        globalStyles.card,
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
                            style={styles.bookingAvatar}
                          />
                          <View style={[globalStyles.ml3, { flex: 1 }]}>
                            <CustomText
                              style={[globalStyles.f16Bold, globalStyles.black]}
                            >
                              {item.CustomerName ||
                                display.customerName ||
                                "N/A"}
                            </CustomText>

                            <View
                              style={[
                                globalStyles.flexrow,
                                globalStyles.alineItemscenter,
                                { flexWrap: "wrap", gap: 8 },
                              ]}
                            >
                              <CustomText
                                style={[
                                  globalStyles.f12Bold,
                                  globalStyles.secondary,
                                ]}
                              >
                                {item.ServiceType
                                  ? item.ServiceType.replace(
                                      /([A-Z])/g,
                                      " $1",
                                    ).trim()
                                  : "N/A"}
                              </CustomText>
                            </View>
                            <View>
                              <View
                                style={[styles.cardMetaItem, { marginTop: 0 }]}
                              >
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
                                  {display.bookingTrackID}
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
                                  {display.vehicleDisplay}
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
                                  style={[
                                    globalStyles.f10Regular,
                                    globalStyles.black,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {display.bookingDate}
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
                                >
                                  {(display.timeSlot || "")
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                    .join("\n") || "N/A"}
                                </CustomText>
                              </View>
                            </View>
                          </View>

                          <View style={{ marginRight: -16, marginTop: -10 }}>
                            {(item?.PickupDelivery?.[0]?.DriverStatus ===
                              "ServiceStart" ||
                              item?.PickupDelivery?.[0]?.DriverStatus ===
                                "ServiceComplete") && (
                              <View style={[globalStyles.alineItemscenter]}>
                                <Animated.View
                                  style={{
                                    marginRight: 8,
                                    transform: [{ rotate: gearRotation }],
                                  }}
                                >
                                  <FontAwesome
                                    name="gear"
                                    size={50}
                                    color={color.primary}
                                  />
                                </Animated.View>
                                <Animated.View
                                  style={{
                                    marginRight: 35,
                                    marginTop: -14,
                                    transform: [
                                      { rotate: gearRotationreverse },
                                    ],
                                  }}
                                >
                                  <FontAwesome
                                    name="gear"
                                    size={30}
                                    color={color.primary}
                                  />
                                </Animated.View>
                              </View>
                            )}
                          </View>
                        </View>

                      

                       
                            <View style={styles.fromToCard}>
                              <View style={styles.addressLine}>
                                <View style={styles.addressIconWrap}>
                                  <MaterialCommunityIcons
                                    name="map-marker"
                                    size={18}
                                    color={color.primary}
                                  />
                                </View>
                                <CustomText
                                  style={styles.addressValue}
                                  numberOfLines={2}
                                >
                                  {item.PickupDelivery?.[0]?.PickFrom
                                    ?.Address || "N/A"}
                                </CustomText>
                              </View>
                              <View
                                style={[
                                  globalStyles.flexrow,
                                  globalStyles.mt3,
                                  globalStyles.justifysb,
                                  globalStyles.alineItemscenter,
                                ]}
                              >
                                <TouchableOpacity
                                  onPress={() => {
                                    Vibration.vibrate([0, 200, 100, 300]);
                                    const phoneNumber =
                                      item.PickupDelivery?.[0]?.PickFrom
                                        ?.PersonNumber;
                                    if (phoneNumber)
                                      Linking.openURL(`tel:${phoneNumber}`);
                                    else
                                      Alert.alert(
                                        "Error",
                                        "Phone number not available",
                                      );
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
                                      globalStyles.f12Bold,
                                      globalStyles.textWhite,
                                      globalStyles.mr2,
                                    ]}
                                  >
                                    Call customer
                                  </CustomText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => CustomerInfo(item)}
                                  key={`${item.BookingID ?? "active"}-${index}`}
                                  style={[
                                    styles.ViewCarDetails,
                                    globalStyles.flexrow,
                                  ]}
                                >
                                  <CustomText
                                    style={[
                                      globalStyles.f12Bold,
                                      globalStyles.textWhite,
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
                          

                        {/* <View style={[globalStyles.divider, globalStyles.mt3]} /> */}

                        {lastPaymentStatus !== "Success" &&
                          lastPaymentStatus !== "Partialpaid" &&
                          amountPending > 0 && (
                            <View
                              style={[
                                globalStyles.flexrow,
                                globalStyles.justifysb,
                                globalStyles.alineItemscenter,
                                globalStyles.p3,
                                {
                                  backgroundColor: color.alertWarning + "15",
                                  borderRadius: 8,
                                },
                              ]}
                            >
                              <View
                                style={[
                                  globalStyles.flexrow,
                                  globalStyles.justifysb,
                                  globalStyles.alineItemscenter,
                                  { flex: 1 },
                                ]}
                              >
                                <CustomText
                                  style={[
                                    globalStyles.f10Regular,
                                    globalStyles.f16Bold,
                                    globalStyles.neutral500,
                                  ]}
                                >
                                  Amount Pending:
                                </CustomText>
                                {(item?.PickupDelivery?.[0]?.DriverStatus ===
                                  "pickup_started" ||
                                  item?.PickupDelivery?.[0]?.DriverStatus ===
                                    "pickup_reached") && (
                                  <CustomText
                                    style={[
                                      globalStyles.f20Bold,
                                      globalStyles.primary,
                                      globalStyles.mt1,
                                    ]}
                                  >
                                    ₹{amountPending}
                                  </CustomText>
                                )}
                              </View>

                              {/* {(item.PaymentMode === "COS" || item.PaymentMode === "cos") &&
                              isBookingCompleted(item) && ( */}

                              {(item?.PickupDelivery?.[0]?.DriverStatus ===
                                "ServiceStart" ||
                                item?.PickupDelivery?.[0]?.DriverStatus ===
                                  "ServiceComplete") && (
                                <View
                                  style={[
                                    globalStyles.flexrow,
                                    globalStyles.alineItemscenter,
                                  ]}
                                >
                                  <TouchableOpacity
                                    onPress={() =>
                                      CollectPayment(item, amountPending)
                                    }
                                    style={[
                                      styles.actionButton,
                                      { backgroundColor: color.primary },
                                    ]}
                                  >
                                    <CustomText
                                      style={[
                                        globalStyles.f16Bold,
                                        globalStyles.mr2,
                                        globalStyles.textWhite,
                                      ]}
                                    >
                                      ₹ {amountPending}
                                    </CustomText>
                                    <Ionicons
                                      style={[
                                        globalStyles.p2,
                                        globalStyles.bgsecondary,
                                        globalStyles.borderRadiuslarge,
                                      ]}
                                      name="chevron-forward-outline"
                                      size={16}
                                      color={color.white}
                                    />
                                  </TouchableOpacity>
                                </View>
                              )}

                              {/* )} */}
                              {/* {isActiveService(item) && (
                              <TouchableOpacity
                                onPress={() => CustomerInfo(item)}
                                style={[styles.actionButton, { backgroundColor: color.primary }]}
                              >
                                <Ionicons name="navigate-outline" size={20} color={color.white} />
                              </TouchableOpacity>
                            )} */}
                            </View>
                          )}
                      </View>
                    </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View>
              <CustomText
                style={[globalStyles.f32Regular, globalStyles.neutral300]}
              >
                There are no{" "}
              </CustomText>
              <View style={[globalStyles.flexrow]}>
                <CustomText
                  style={[globalStyles.primary, globalStyles.f32Bold]}
                >
                  active services{" "}
                </CustomText>
                <CustomText
                  style={[globalStyles.f32Regular, globalStyles.neutral200]}
                >
                  yet....
                </CustomText>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function IconLabel({ icon, label }) {
  return (
    <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
      <Ionicons
        name={icon}
        size={18}
        color={color.primary}
        style={{ marginRight: 5 }}
      />
      <CustomText style={globalStyles.f14Bold}>{label}</CustomText>
    </View>
  );
}

const styles = StyleSheet.create({
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
  Pcicon: {
    width: 70,
    height: 70,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    top: 0,
    left: -50,
    zIndex: 1,
    borderRadius: 14,
    shadowColor: color.black,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    borderColor: color.white,
    backgroundColor: color.white,
    resizeMode: "cover",
  },
  Pcicons: {
    width: 50,
    height: 50,
  },
  icons: {
    width: 11,
    height: 16,
  },

  card: {
    borderRadius: 12,
    backgroundColor: color.white,
    padding: 10,
  },
  service: {
    position: "relative",
    top: -45,
  },
  avatar: {
    width: 70,
    height: 100,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: color.white,
  },
  // Bookings-style card (active services)
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
  cardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 20,
  },
  cardMetaIcon: {
    marginRight: 8,
    width: 20,
  },
  bookingAvatar: {
    width: 100,
    height: 120,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: color.white,
  },
  timeValue: {
    flex: 1,
    flexWrap: "wrap",
  },
  fromToCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: color.primary,
    backgroundColor: color.white,
  },
  addressLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
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
  callbutton: {
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 50,
    width: "58%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  startButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  denyButton: {
    backgroundColor: "#FDB827",
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  // Active Service Card Styles
  activeServiceCard: {
    position: "relative",
    overflow: "hidden",
  },
  statusIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  avatarContainer: {
    position: "relative",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: color.white,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "center",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  // Skeleton primitives
  skelLineSmall: { height: 12, borderRadius: 6 },
  skelLineMedium: { height: 14, borderRadius: 7 },
  skelLineTiny: { height: 10, borderRadius: 5 },
  skelNumber: { width: 40, height: 28, borderRadius: 6 },
  skelWideNumber: { width: 120, height: 24, borderRadius: 6 },
  skelIconLg: { width: 28, height: 28, borderRadius: 6 },
  skelIconSm: { width: 16, height: 16, borderRadius: 4 },
  skelIconSquare: { width: 50, height: 50, borderRadius: 8 },
  skelHero: { width: 90, height: 36, borderRadius: 8 },
  activeAvatar: { width: 70, height: 100, borderRadius: 8 },
  skelCircle: { width: 40, height: 40, borderRadius: 20 },
  skelCard: { backgroundColor: color.neutral[200] },
});
