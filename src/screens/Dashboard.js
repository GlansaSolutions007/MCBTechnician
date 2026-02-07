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
} from "react-native";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomText from "../components/CustomText";
// import AvailabilityHeader from "../components/AvailabilityHeader";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import defaultAvatar from "../../assets/images/buddy.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { API_BASE_URL_IMAGE } from "@env";
import { RefreshControl } from "react-native";
import TrackingStatusIndicator from "../components/TrackingStatusIndicator";
export default function Dashboard() {
  // const [isOnline, setIsOnline] = useState(true);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pulse] = useState(new Animated.Value(0));

  const getLastPaymentStatus = (item) => {
    const payments = item?.Payments || [];
    const lastPayment = payments.length ? payments[payments.length - 1] : null;
    return lastPayment?.PaymentStatus;
  };

  const isActiveService = (item) => {
    const lastPaymentStatus = getLastPaymentStatus(item);
    return (
      item.BookingStatus === "ServiceStarted" ||
      item.BookingStatus === "Reached" ||
      item.BookingStatus === "StartJourney" ||
      lastPaymentStatus === "Pending"
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        try {
          await Promise.all([fetchBookingCounts(), fetchBookings(), fetchActiveServices()]);
          setInitialLoading(false);
        } catch (error) {
          console.error("Error refreshing data:", error);
        }
      };

      refreshData();
    }, [])
  );

  const Booking = () => {
    navigation.navigate("Booking", { bookings });
  };

  const [bookings, setBookings] = useState([]);
  const [activeServices, setActiveServices] = useState([]);
  console.log("activeServices===================",activeServices);
  const [bookingCounts, setBookingCounts] = useState({
    TodayAssignedBookingsCount: 0,
    ScheduledBookingsCount: 0,
    TodayCustomerCount: 0,
    CompletedBookingsCount: 0,
  });
  const CollectPayment = async (item) => {
    navigation.navigate("CollectPayment", { booking: item });
  };
  const CustomerInfo = async (item) => {
    navigation.navigate("customerInfo", { booking: item });
  };
  const ServiceStart = async (item) => {
    navigation.navigate("ServiceStart", { booking: item });
  };
  const Schedules = () => {
    navigation.navigate("Schedules");
  };
  const Reports = () => {
    navigation.navigate("Reports");
  };

  useEffect(() => {
    const fetchBookingCounts = async () => {
      try {
        const techID = await AsyncStorage.getItem("techID");
        // alert(`Tech ID: ${techID}`);
        const token = await AsyncStorage.getItem("token");

        if (techID) {
          try {
            const res = await axios.get(
              `${API_BASE_URL}Bookings/GetTechBookingCounts?techId=${techID}`,
              `${API_BASE_URL}Dashboard/TechnicianPayments?techid=${techID}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (Array.isArray(res.data) && res.data.length > 0) {
              setBookingCounts(res.data[0]);
            }
          } catch (error) {
            console.error("No bookings found for this technician");
          }
        }
      } catch (err) {
        console.error("Error fetching booking counts:", err);
      }
    };

    fetchBookingCounts();
  }, []);

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
            }
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
                  (sub) => sub.id === techID
                ) || []
            ) || []
        ) || [];

      setCount(taskCount);
      setAssignedTasks(tasks);
    }
  }, [techID, bookings]);

  // Fetch booking counts
  const fetchBookingCounts = async () => {
    try {
      const techID = await AsyncStorage.getItem("techID");
      const token = await AsyncStorage.getItem("token");

      if (techID) {
        const res = await axios.get(
          `${API_BASE_URL}Bookings/GetTechBookingCounts?techId=${techID}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (Array.isArray(res.data) && res.data.length > 0) {
          setBookingCounts(res.data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching booking counts:", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const techID = await AsyncStorage.getItem("techID");
      const token = await AsyncStorage.getItem("token");
      if (techID) {
        const res = await axios.get(
          `${API_BASE_URL}Bookings/GetTechTodayBookings?Id=${techID}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const allBookingsData = Array.isArray(res.data) ? res.data : [];
        setBookings(allBookingsData);
      }
    } catch (err) {
      console.error("fetchBookings error", err);
    }
  };

  // Fetch active services from GetAssignedBookings API
  const fetchActiveServices = async () => {
    try {
      const techID = await AsyncStorage.getItem("techID");
      const token = await AsyncStorage.getItem("token");
      if (techID) {
        const res = await axios.get(
          `${API_BASE_URL}Bookings/GetAssignedBookings?Id=${techID}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const allAssignedBookings = Array.isArray(res.data) ? res.data : [];
        // Filter only active services based on isActiveService logic
        const activeBookings = allAssignedBookings.filter(isActiveService);
        setActiveServices(activeBookings);
      }
    } catch (err) {
      console.error("fetchActiveServices error", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBookingCounts(), fetchBookings(), fetchActiveServices()]);
    setRefreshing(false);
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const refreshData = async () => {
    await Promise.all([fetchBookingCounts(), fetchBookings(), fetchActiveServices()]);
  };

  useEffect(() => {
    refreshData();

    const interval = setInterval(() => {
      refreshData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Start skeleton pulse for initial load
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
        ])
      ).start();
    }
  }, [initialLoading, pulse]);

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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[globalStyles.container]}>
        {/* <AvailabilityHeader /> */}

        {/* Location Tracking Status */}
        {/* <TrackingStatusIndicator technicianId={techID} /> */}

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
                  {bookingCounts.ScheduledBookingsCount}
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
                  {bookingCounts.CompletedBookingsCount}
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
                {bookingCounts.ReportsCount}
              </CustomText>
            </View>
          </View>

          <View style={globalStyles.divider} />

          <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
            {/* <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              <IconLabel icon="time-outline" />
              <CustomText style={globalStyles.f12Bold}>
                {bookingCounts.TodayCustomerCount} hrs
              </CustomText>
            </View> */}
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              <IconLabel icon="people-outline" />
              <CustomText style={globalStyles.f12Bold}>
                {bookingCounts.ReportsCount} customers
              </CustomText>
            </View>
            {/* <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              <IconLabel icon="checkmark-circle-outline" />
              <CustomText style={globalStyles.f12Bold}>
                {bookingCounts.CompletedBookingsCount} Active
              </CustomText>
            </View> */}
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
            {activeServices.length > 0 ? (
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
                  {activeServices.length}
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
                  style={[
                    globalStyles.f12Medium,
                    globalStyles.neutral500,
                  ]}
                >
                  0
                </CustomText>
              </View>
            )}
          </View>
          {activeServices.length > 0 ? (
            <View style={[globalStyles.mt3]}>












              {activeServices.map((item, index) => {
                  const lastPaymentStatus = getLastPaymentStatus(item);
                  const totalPaidAmount = (item?.Payments || []).reduce(
                    (sum, payment) =>
                      payment.PaymentStatus === "Success" || payment.PaymentStatus === "Partialpaid"
                        ? sum + Number(payment.AmountPaid || 0)
                        : sum,
                    0
                  );
                  const totalPrice =
                    item.TotalPrice ||
                    (item.BookingAddOns &&
                      item.BookingAddOns.reduce(
                        (sum, addOn) => sum + (Number(addOn.TotalPrice) || 0),
                        0
                      )) ||
                    0;
                  const amountPending = totalPrice - totalPaidAmount;

                  return (
                  <Pressable
                    onPress={() => CustomerInfo(item)}
                    key={index}
                    style={[
                      globalStyles.bgwhite,
                      globalStyles.p4,
                      globalStyles.card,
                      globalStyles.mt4,
                      styles.activeServiceCard,
                    ]}
                  >
                    {/* Status Indicator */}
                    <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.mb2]}>
                      <View style={[
                        globalStyles.p1,
                        globalStyles.ph2,
                        { 
                          borderRadius: 8,
                          backgroundColor: 
                            item.BookingStatus === "ServiceStarted" ? color.alertSuccess :
                            item.BookingStatus === "StartJourney" ? color.alertInfo :
                            item.BookingStatus === "Reached" ? color.primary :
                            lastPaymentStatus === "Pending" ? color.alertWarning :
                            color.neutral[300]
                        }
                      ]}>
                        <CustomText style={[globalStyles.f10Bold, globalStyles.textWhite]}>
                          {item.BookingStatus === "ServiceStarted" ? "In Progress" :
                           item.BookingStatus === "StartJourney" ? "On Journey" :
                           item.BookingStatus === "Reached" ? "Reached" :
                           lastPaymentStatus === "Pending" ? "Payment Pending" :
                           item.BookingStatus}
                        </CustomText>
                      </View>
                    </View>

                    <View style={[globalStyles.flexrow]}>
                      <View style={styles.avatarContainer}>
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
                      </View>

                      <View style={[globalStyles.ml3, { flex: 1 }]}>
                        <View
                          style={[
                            globalStyles.flexrow,
                            globalStyles.justifysb,
                            globalStyles.alineItemscenter,
                          ]}
                        >
                          <CustomText
                            style={[globalStyles.f16Bold, globalStyles.black]}
                          >
                            {item.CustomerName || item.Leads?.FullName || "N/A"}
                          </CustomText>
                        </View>

                        <View
                          style={[
                            globalStyles.flexrow,
                            globalStyles.alineItemscenter,
                            globalStyles.mt1,
                          ]}
                        >
                          <Ionicons
                            name="call-outline"
                            size={14}
                            color={color.neutral[500]}
                          />
                          <CustomText
                            style={[
                              globalStyles.f12Medium,
                              globalStyles.neutral500,
                              globalStyles.ml1,
                            ]}
                          >
                            {item.PhoneNumber || item.Leads?.PhoneNumber || "N/A"}
                          </CustomText>
                        </View>

                        <View
                          style={[
                            globalStyles.flexrow,
                            globalStyles.alineItemscenter,
                            globalStyles.mt1,
                          ]}
                        >
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color={color.neutral[500]}
                          />
                          <CustomText
                            style={[
                              globalStyles.f10Regular,
                              globalStyles.neutral500,
                              globalStyles.ml1,
                              { flex: 1 },
                            ]}
                            numberOfLines={1}
                          >
                            {item.FullAddress || item.Leads?.City || "N/A"}
                          </CustomText>
                        </View>
                      </View>
                    </View>

                    <View style={[globalStyles.divider, globalStyles.mt3]} />

                    {/* Payment Section - Show if payment is not completed */}
                    {(lastPaymentStatus !== "Success" && lastPaymentStatus !== "Partialpaid") &&
                      amountPending > 0 && (
                      <View
                        style={[
                          globalStyles.flexrow,
                          globalStyles.justifysb,
                          globalStyles.alineItemscenter,
                          globalStyles.mt3,
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
                            globalStyles.alineItemscenter,
                            { flex: 1 },
                          ]}
                        >
                        
                          <View>
                            <CustomText
                              style={[
                                globalStyles.f10Regular,
                                globalStyles.neutral500,
                              ]}
                            >
                              Amount Pending
                            </CustomText>
                            <CustomText
                              style={[
                                globalStyles.f16Bold,
                                globalStyles.primary,
                                globalStyles.mt1,
                              ]}
                            >
                              ₹{amountPending}
                            </CustomText>
                          </View>
                        </View>
                       
                        {(item.PaymentMode === "COS" ||
                          item.PaymentMode === "cos") &&
                          item.BookingStatus === "Completed" && (
                            <TouchableOpacity
                              onPress={() => CollectPayment(item)}
                              style={[
                                styles.actionButton,
                                { backgroundColor: color.primary },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name="currency-inr"
                                size={20}
                                color={color.white}
                              />
                            </TouchableOpacity>
                          )}

                        {(item.BookingStatus === "Confirmed" ||
                          item.BookingStatus === "StartJourney" ||
                          item.BookingStatus === "ServiceStarted" ||
                          item.BookingStatus === "Reached") && (
                          <TouchableOpacity
                            onPress={() => CustomerInfo(item)}
                            style={[
                              styles.actionButton,
                              { backgroundColor: color.primary },
                            ]}
                          >
                            <Ionicons
                              name="navigate-outline"
                              size={20}
                              color={color.white}
                            />
                          </TouchableOpacity>
                        )}

                      </View>
                    )}

                 
                  </Pressable>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
