import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Pressable,
  Platform,
} from "react-native";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import profilepic from "../../assets/images/person.jpg";
import CustomText from "../components/CustomText";
import AvailabilityHeader from "../components/AvailabilityHeader";
import Pcicon from "../../assets/icons/Navigation/bookings 2.png";
import { useNavigation } from "@react-navigation/native";
import schedule from "../../assets/icons/Navigation/schedule.png";
import reports from "../../assets/icons/Navigation/reports.png";
import MiniMapRoute from "../components/MiniMapRoute";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { API_BASE_URL_IMAGE } from "@env";

export default function Dashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const navigation = useNavigation();
  const customerInfo = () => {
    navigation.navigate("customerInfo");
  };
  const CollectPayment = () => {
    navigation.navigate("CollectPayment");
  };
  const LiveTrackingMap = () => {
    navigation.navigate("LiveTrackingMap");
  };
  const Booking = () => {
    navigation.navigate("Booking", { bookings });
  };

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const techID = await AsyncStorage.getItem("techID");
        console.log(API_BASE_URL, "URLLLLL");
        const token = await AsyncStorage.getItem("token");
        console.log("techhhhh:", techID);
        if (techID) {
          const res = await axios.get(
            `${API_BASE_URL}Bookings/GetAssignedBookings?Id=${techID}`,
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

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={[globalStyles.container]}>
        <AvailabilityHeader />
        <View
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.mt5,
          ]}
        >
          <View style={{ width: "48%" }}>
            <View
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
                  source={schedule}
                  style={{ width: 20, height: 20, tintColor: "#fff" }}
                />
                <CustomText
                  style={[globalStyles.f32Bold, globalStyles.textWhite]}
                >
                  02
                </CustomText>
              </View>
            </View>

            <View
              style={[
                globalStyles.bgBlack,
                globalStyles.borderRadiuslarge,
                globalStyles.flexrow,
                globalStyles.alineItemscenter,
                globalStyles.justifysb,
                globalStyles.ph4,
                globalStyles.pv2,
              ]}
            >
              <Image
                source={schedule}
                style={{ width: 20, height: 20, tintColor: "#fff" }}
              />
              <CustomText
                style={[globalStyles.f32Bold, globalStyles.textWhite]}
              >
                2k
              </CustomText>
            </View>
          </View>

          <View
            style={[
              globalStyles.bgprimary,
              globalStyles.borderRadiuslarge,
              globalStyles.ph4,
              globalStyles.pv2,
              { width: "48%", justifyContent: "space-between" },
            ]}
          >
            <CustomText style={[globalStyles.f16Bold, globalStyles.textWhite]}>
              Tasks Assigned
            </CustomText>

            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifysb,
                globalStyles.alineItemscenter,
              ]}
            >
              <Image
                source={reports}
                style={{ width: 20, height: 28, tintColor: "#fff" }}
              />
              {/* <CustomText
                style={[globalStyles.f40Bold, globalStyles.textWhite]}
              >
                {assignedTasks}
              </CustomText> */}
              <View>
                <CustomText
                  style={[globalStyles.f10Bold, globalStyles.textWhite]}
                >
                  {assignedTasks}
                </CustomText>
              </View>
            </View>
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
                {count}
              </CustomText>
            </View>
          </View>

          <View style={globalStyles.divider} />

          <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
            <IconLabel icon="time-outline" label="8 hrs" />
            <IconLabel icon="people-outline" label="2 customers" />
            <IconLabel icon="checkmark-circle-outline" label="2 Active" />
          </View>
        </Pressable>

        <View style={[globalStyles.mt4]}>
          <CustomText style={[globalStyles.f14Bold, globalStyles.mb2]}>
            Next Active Service
          </CustomText>

          <CustomText
            style={[globalStyles.f28Regular, globalStyles.neutral300]}
          >
            There are no{" "}
          </CustomText>
          <View style={[globalStyles.flexrow]}>
            <CustomText style={[globalStyles.primary, globalStyles.f28Bold]}>
              active services{" "}
            </CustomText>
            <CustomText
              style={[globalStyles.f28Regular, , globalStyles.neutral300]}
            >
              yet....
            </CustomText>
          </View>
          {bookings.map((item, index) => (
            <View
              style={[
                globalStyles.bgprimary,
                globalStyles.p4,
                globalStyles.mt5,
                globalStyles.card,
              ]}
            >
              <View style={[globalStyles.flexrow]}>
                <Image
                  source={
                    item.ProfileImage
                      ? {
                          uri: `${API_BASE_URL_IMAGE}${item.ProfileImage}`,
                        }
                      : profilepic
                  }
                  style={styles.avatar}
                  onError={() =>
                    console.log("Image load failed for:", item.ProfileImage)
                  }
                />

                <View style={[globalStyles.ml3, { flex: 1 }]}>
                  <CustomText
                    style={[globalStyles.f24Bold, globalStyles.textWhite]}
                  >
                    {item.CustomerName}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f12Regular, globalStyles.textWhite]}
                  >
                    Mobile: {item.PhoneNumber}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f10Light, globalStyles.neutral100]}
                  >
                    {item.FullAddress}
                  </CustomText>
                </View>
              </View>

              <View style={globalStyles.divider} />
              {/* <CustomText
                style={[
                  globalStyles.f12Medium,
                  globalStyles.textWhite,
                  globalStyles.alineSelfcenter,
                  globalStyles.mb1,
                ]}
              >
                <CustomText style={globalStyles.f14Bold}>Service:</CustomText>{" "}
                Leather Fabric Seat Polishing
              </CustomText> */}
              <TouchableOpacity
              // onPress={LiveTrackingMap}
              >
                <MiniMapRoute
                  origin={{
                    latitude: 17.4445,
                    longitude: 78.3772,
                  }}
                  destination={{
                    latitude: 17.36191607830754,
                    longitude: 78.47466965365447,
                  }}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={[globalStyles.mt3]}>
          {bookings.map((item, index) => (
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
                      : profilepic
                  }
                  style={styles.avatar}
                  onError={() =>
                    console.log("Image load failed for:", item.ProfileImage)
                  }
                />

                <View style={[globalStyles.ml3, { flex: 1 }]}>
                  <CustomText
                    style={[globalStyles.f24Bold, globalStyles.textWhite]}
                  >
                    {item.CustomerName}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f12Regular, globalStyles.textWhite]}
                  >
                    Mobile: {item.PhoneNumber}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f10Light, globalStyles.neutral100]}
                  >
                    {item.FullAddress}
                  </CustomText>
                </View>
              </View>

              <View style={globalStyles.divider} />

              {/* <CustomText
                style={[
                  globalStyles.f12Medium,
                  globalStyles.textWhite,
                  globalStyles.alineSelfcenter,
                  globalStyles.mb4,
                ]}
              >
                <CustomText style={globalStyles.f14Bold}>Service:</CustomText>{" "}
                Leather Fabric Seat Polishing
              </CustomText> */}
              <View
                style={[
                  globalStyles.flexrow,
                  globalStyles.justifysb,
                  globalStyles.alineItemscenter,
                  styles.card,
                ]}
              >
                <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                  {item.TimeSlot}
                </CustomText>
                <TouchableOpacity onPress={LiveTrackingMap}>
                  <View
                    style={{
                      backgroundColor: color.black,
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
              </View>
            </View>
          ))}
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
