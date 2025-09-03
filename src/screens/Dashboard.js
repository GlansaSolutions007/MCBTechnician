import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Pressable,
} from "react-native";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomText from "../components/CustomText";
// import AvailabilityHeader from "../components/AvailabilityHeader";
import Pcicon from "../../assets/icons/Navigation/bookings 2.png";
import { useNavigation } from "@react-navigation/native";
import schedule from "../../assets/icons/Navigation/schedule.png";
import reports from "../../assets/icons/Navigation/reports.png";
import axios from "axios";
import defaultAvatar from "../../assets/images/buddy.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { API_BASE_URL_IMAGE } from "@env";
import { RefreshControl } from "react-native";
export default function Dashboard() {
  // const [isOnline, setIsOnline] = useState(true);
  const navigation = useNavigation();
  const [totalAmount, setTotalAmount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchTotalAmount = async () => {
      try {
        const techID = await AsyncStorage.getItem("techID");
        const token = await AsyncStorage.getItem("token");
        if (!techID) return;

        const res = await axios.get(
          `${API_BASE_URL}Dashboard/TechnicianPayments?techid=${techID}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (Array.isArray(res.data) && res.data.length > 0) {
          setTotalAmount(res.data[0].TotalAmountCollected || 0);
        }
      } catch (err) {
        // console.error("Error fetching total amount:", err);
      }
    };

    fetchTotalAmount();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        try {
          await Promise.all([
            fetchTotalAmount(),
            fetchBookingCounts(),
            fetchBookings(),
          ]);
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
    navigation.navigate("Tasks");
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

          setBookings(Array.isArray(res.data) ? res.data : []);
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
  // const count =
  //   bookings.reduce((total, booking) => {
  //     const pkgCount =
  //       booking.Packages?.reduce((pkgTotal, pkg) => {
  //         const matchCount =
  //           pkg.Category?.SubCategories?.filter((sub) => sub.id === techID)
  //             .length || 0;
  //         return pkgTotal + matchCount;
  //       }, 0) || 0;
  //     return total + pkgCount;
  //   }, 0) || 0;

  // const assignedTasks = bookings.flatMap(
  //   (booking) =>
  //     booking.Packages?.flatMap(
  //       (pkg) =>
  //         pkg.Category?.SubCategories?.filter((sub) => sub.id === techID) || []
  //     ) || []
  // );

  const fetchTotalAmount = async () => {
    try {
      const techID = await AsyncStorage.getItem("techID");
      const token = await AsyncStorage.getItem("token");
      if (!techID) return;

      const res = await axios.get(
        `${API_BASE_URL}Dashboard/TechnicianPayments?techid=${techID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (Array.isArray(res.data) && res.data.length > 0) {
        setTotalAmount(res.data[0].TotalAmountCollected || 0);
      }
    } catch (err) {
      // console.error("Error fetching total amount:", err);
    }
  };

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
        setBookings(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error("fetchBookings error", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTotalAmount(),
      fetchBookingCounts(),
      fetchBookings(),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const refreshData = async () => {
    await Promise.all([
      fetchTotalAmount(),
      fetchBookingCounts(),
      fetchBookings(),
    ]);
  };

  useEffect(() => {
    refreshData();

    const interval = setInterval(() => {
      refreshData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
                <Image
                  source={reports}
                  style={{ width: 20, height: 28, tintColor: "#fff" }}
                />

                <CustomText
                  style={[globalStyles.f32Bold, globalStyles.textWhite]}
                >
                  {bookingCounts.ScheduledBookingsCount}
                </CustomText>
              </View>
            </Pressable>

            <View
              style={[
                globalStyles.bgBlack,
                globalStyles.borderRadiuslarge,
                globalStyles.flexrow,
                globalStyles.alineItemscenter,
                globalStyles.justifysb,
                globalStyles.ph4,
                globalStyles.pv3,
              ]}
            >
              <CustomText
                style={[globalStyles.f24Bold, globalStyles.textWhite]}
              >
                ₹ {totalAmount.toFixed(2)}
              </CustomText>
            </View>
          </View>

          <Pressable
            onPress={Reports}
            style={[
              globalStyles.bgprimary,
              globalStyles.borderRadiuslarge,
              globalStyles.ph4,
              globalStyles.pv2,
              { width: "48%", justifyContent: "space-between" },
            ]}
          >
            <CustomText style={[globalStyles.f16Bold, globalStyles.textWhite]}>
              Reports
            </CustomText>

            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifysb,
                globalStyles.alineItemscenter,
              ]}
            >
              <Image
                source={schedule}
                style={{ width: 25, height: 25, tintColor: "#fff" }}
              />
              {/* <CustomText
                style={[globalStyles.f40Bold, globalStyles.textWhite]}
              >
                {assignedTasks}
              </CustomText> */}
              <View>
                <CustomText
                  style={[globalStyles.f40Bold, globalStyles.textWhite]}
                >
                  {bookingCounts.TotalBookingsCount}
                </CustomText>
              </View>
            </View>
          </Pressable>
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
              <Image source={Pcicon} style={[styles.Pcicons]} />
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
                {bookingCounts.TodayAssignedBookingsCount}
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
                {bookingCounts.TodayCustomerCount} customers
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
          <CustomText style={[globalStyles.f14Bold]}>Active Service</CustomText>
          {bookings.some(
            (item) =>
              item.BookingStatus === "StartJourney" ||
              item.BookingStatus === "ServiceStarted" ||
              item.BookingStatus === "Reached" ||
              item.PaymentStatus !== "Pending"
          ) ? (
            <View style={[globalStyles.mt3]}>
              {bookings
                .filter(
                  (item) =>
                    item.BookingStatus === "ServiceStarted" ||
                    item.BookingStatus === "StartJourney" ||
                    item.BookingStatus === "Reached" ||
                    item.Payments?.[0]?.PaymentStatus === "Pending"
                )
                .map((item, index) => (
                  <View
                    key={index}
                    style={[
                      globalStyles.bgprimary,
                      globalStyles.p4,
                      globalStyles.card,
                      globalStyles.mt2,
                    ]}
                  >
                    <View style={[globalStyles.flexrow]}>
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
                          style={[globalStyles.f24Bold, globalStyles.textWhite]}
                        >
                          {item.CustomerName}
                        </CustomText>
                        <CustomText
                          style={[
                            globalStyles.f12Regular,
                            globalStyles.textWhite,
                          ]}
                        >
                          Mobile: {item.PhoneNumber}
                        </CustomText>
                        <CustomText
                          style={[
                            globalStyles.f10Light,
                            globalStyles.neutral100,
                          ]}
                        >
                          {item.FullAddress}
                        </CustomText>
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
                      <CustomText
                        style={[globalStyles.f16Bold, globalStyles.black]}
                      >
                        {item.TimeSlot}
                      </CustomText>
                      {/* {(item.BookingStatus === "Reached") && (
                      <TouchableOpacity
                        key={index}
                        onPress={() => ServiceStart(item)}
                      >
                        <View
                            style={{
                              backgroundColor: color.yellow,
                              borderRadius: 50,
                              padding: 8,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons
                              name="time-outline"
                              size={24}
                              color={color.white}
                            />
                          </View>
                        </TouchableOpacity>
                      )} */}

                      {(item.BookingStatus === "Confirmed" ||
                        item.BookingStatus === "StartJourney" ||
                        item.BookingStatus === "ServiceStarted" ||
                        item.BookingStatus === "Reached") && (
                        <TouchableOpacity onPress={() => CustomerInfo(item)}>
                          <View
                            style={{
                              backgroundColor: color.primary,
                              borderRadius: 50,
                              padding: 8,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons
                              name="navigate-outline"
                              size={24}
                              color={color.white}
                            />
                          </View>
                        </TouchableOpacity>
                      )}

                      {(item.PaymentMode === "COS" ||
                        item.PaymentMode === "cos") &&
                        item.BookingStatus === "Completed" && (
                          <TouchableOpacity
                            onPress={() => CollectPayment(item)}
                          >
                            <View
                              style={{
                                backgroundColor: color.primary,
                                borderRadius: 50,
                                padding: 8,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <MaterialCommunityIcons
                                name="currency-inr"
                                size={24}
                                color={color.white}
                              />
                            </View>
                          </TouchableOpacity>
                        )}
                    </View>
                  </View>
                ))}
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
});
