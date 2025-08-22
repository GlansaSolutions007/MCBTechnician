import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Text,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
// import AvailabilityHeader from "../components/AvailabilityHeader";
import { color } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { API_BASE_URL } from "@env";
import { API_BASE_URL_IMAGE } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import defaultAvatar from "../../assets/images/buddy.png";
import { RefreshControl } from "react-native";
export default function CustomerInfo() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params;

  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const mapRef = useRef(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const ServiceStart = async (item) => {
    navigation.navigate("ServiceStart", { booking: item });
  };
  const CollectPayment = async (booking) => {
    navigation.navigate("CollectPayment", { booking: booking });
  };
  const onRefresh = async () => {
    setRefreshing(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}Bookings/GetAssignedBookings?Id=${booking.TechID}`
      );

      if (response.data && response.data.length > 0) {
        const updatedBooking = response.data.find(
          (b) => b.BookingID === booking.BookingID
        );
        if (updatedBooking) {
          navigation.setParams({ booking: updatedBooking });
        }
      }
    } catch (error) {
      console.error("Error refreshing booking:", error);
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    const checkIfStarted = async () => {
      try {
        const flag = await AsyncStorage.getItem(
          `startRide_done_${booking.BookingID}`
        );
      } catch (error) {
        console.error("Error reading start ride flag", error);
      }
    };
    checkIfStarted();
  }, [booking.BookingID]);

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

  const latitude = booking.Latitude;
  const longitude = booking.Longitude;
  const bookingId = booking.BookingID;
  const destination = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
  };

  useEffect(() => {
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 1,
        },
        async (loc) => {
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setLocation(coords);

          if (mapRef.current) {
            mapRef.current.animateToRegion(coords, 1000);
          }

          fetchRoute(coords);
        }
      );
    };

    startTracking();
  }, []);

  const fetchRoute = async (origin) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${origin.latitude},${origin.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            key: "AIzaSyAC8UIiyDI55MVKRzNTHwQ9mnCnRjDymVo",
          },
        }
      );

      const points = response.data.routes[0].overview_polyline.points;
      const decoded = decodePolyline(points);
      setRouteCoords(decoded);
    } catch (error) {
      console.error("Google Directions API error:", error.message);
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
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return points;
  };
  const openGoogleMaps = async () => {
    if (location && destination) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;

      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Error", "Google Maps not available on this device");
        }
      } catch (error) {
        console.error("Error opening Google Maps:", error);
        Alert.alert("Error", "Failed to open Google Maps");
      }
    }
  };

  const updateTechnicianTracking = async (actionType) => {
    try {
      const payload = {
        bookingID: Number(bookingId),
        actionType: actionType,
      };
      await axios.post(
        `${API_BASE_URL}TechnicianTracking/UpdateTechnicianTracking`,
        payload
      );
      console.log(`${actionType} action sent successfully`);
    } catch (error) {
      console.error(`Error sending ${actionType} action:`, error.message);
      Alert.alert("Error", `Failed to send ${actionType} action.`);
    }
  };

  const handleStartRide = async () => {
    await updateTechnicianTracking("StartJourney");
    try {
      await AsyncStorage.setItem(`startRide_done_${booking.BookingID}`, "true");
    } catch (error) {
      console.error("Error saving start ride flag", error);
    }
    await openGoogleMaps();
  };

  const Reached = async () => {
    await updateTechnicianTracking("Reached");
    navigation.navigate("ServiceStart", { booking: booking });
  };

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View>
        <View style={[globalStyles.container, globalStyles.pb4]}>
          {/* <AvailabilityHeader /> */}

          <CustomText
            style={[
              globalStyles.f20Bold,
              globalStyles.primary,
              globalStyles.mt,
            ]}
          >
            Booking ID:{" "}
            <CustomText style={globalStyles.black}>
              {booking.BookingTrackID}
            </CustomText>
          </CustomText>

          <View
            style={[
              globalStyles.cardwidth,
              globalStyles.bgwhite,
              globalStyles.p4,
              globalStyles.mt4,
            ]}
          >
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              <Image
                // source={{
                //   uri: `${API_BASE_URL_IMAGE}${booking.VehicleImage}`,
                // }}
                source={
                  booking.ProfileImage
                    ? { uri: `${API_BASE_URL_IMAGE}${booking.ProfileImage}` }
                    : defaultAvatar
                }
                style={globalStyles.avatarside}
              />
              <View style={[globalStyles.ml50, globalStyles.flex1]}>
                <CustomText style={[globalStyles.f20Bold, globalStyles.black]}>
                  {booking.CustomerName}
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.primary]}
                >
                  Mobile: {booking.PhoneNumber}
                </CustomText>
                <CustomText
                  style={[
                    globalStyles.f10Regular,
                    globalStyles.neutral500,
                    globalStyles.primary,
                  ]}
                >
                  dfds
                  {booking.FullAddress}
                </CustomText>
              </View>
            </View>

            <View style={[globalStyles.mt3, globalStyles.divider]} />

            <View style={[globalStyles.ml50, globalStyles.justifysb]}>
              <CustomText style={globalStyles.f12Bold}>
                Slot Time:{" "}
                <CustomText style={globalStyles.black}>
                  {booking.TimeSlot}
                </CustomText>
              </CustomText>
              <CustomText style={globalStyles.f12Bold}>
                Booking Date:{" "}
                <CustomText style={globalStyles.black}>
                  {booking.BookingDate}
                </CustomText>
              </CustomText>
            </View>
          </View>

          <CustomText
            style={[globalStyles.f16Bold, globalStyles.black, globalStyles.mt3]}
          >
            Car Details
          </CustomText>
          <View style={[styles.blackcard]}>
            <View
              style={[
                styles.width60,
                globalStyles.borderRadiuslarge,
                globalStyles.alineItemscenter,
                globalStyles.bgwhite,
              ]}
            >
              <CustomText
                style={[
                  globalStyles.f10Bold,
                  globalStyles.mt1,
                  globalStyles.primary,
                ]}
              >
                Modal Name:{" "}
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.primary]}
                >
                  {booking.ModelName}
                </CustomText>
              </CustomText>
              <View style={[styles.width60]}>
                <View>
                  <View>
                    <Image
                      // source={carpic}
                      source={
                        booking.VehicleImage
                          ? {
                              uri: `${API_BASE_URL_IMAGE}${booking.VehicleImage}`,
                            }
                          : defaultAvatar
                      }
                      style={styles.avatar}
                    />
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.width30]}>
              <View>
                <CustomText
                  style={[globalStyles.f10Light, globalStyles.textWhite]}
                >
                  Reg No
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textWhite]}
                >
                  {booking.VehicleNumber}
                </CustomText>
              </View>
              <View>
                <CustomText
                  style={[globalStyles.f10Light, globalStyles.textWhite]}
                >
                  Fuel Type
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textWhite]}
                >
                  {booking.FuelTypeName}
                </CustomText>
              </View>
              <View>
                <CustomText
                  style={[globalStyles.f10Light, globalStyles.textWhite]}
                >
                  Manufacturer
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textWhite]}
                >
                  {booking.BrandName}
                </CustomText>
              </View>
            </View>
          </View>
          <View style={[globalStyles.divider, globalStyles.mt5]} />
          {/* <View>
            <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
              Service Details
            </CustomText>
            {booking.Packages.map((pkg) => (
              <View>
                <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                  {pkg.PackageName}
                </CustomText>

                {pkg.Category?.map((sub) => (
                  <View style={[globalStyles.mt2, globalStyles.ph4]}>
                    <CustomText>{sub.CategoryName}</CustomText>

                    {pkg.Category?.SubCategories?.map((sub) => (
                      <View style={[globalStyles.mt2, globalStyles.ph4]}>
                        <CustomText
                          style={globalStyles.f12Medium}
                          key={sub.SubCategoryID}
                        >
                          {sub.SubCategoryName}
                        </CustomText>
                        <CustomText style={globalStyles.f18Medium}></CustomText>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </View> */}
          <View>
            <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
              Service Details
            </CustomText>

            {/* {booking.Packages.map((pkg) => (
              <View key={pkg.PackageID} style={[globalStyles.mt2]}>
                <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                  {pkg.PackageName}
                </CustomText>
                <View
                  style={[globalStyles.flexrow, globalStyles.alineItemscenter]}
                >
                  <CustomText style={[globalStyles.f12Medium]}>
                    Estimated Time:
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f12Bold, globalStyles.black]}
                  >
                    {" "}
                    {`${Math.floor(pkg.EstimatedDurationMinutes / 60)}:${
                      pkg.EstimatedDurationMinutes % 60
                    }m`}
                  </CustomText>
                </View>

                {pkg.Category && (
                  <View style={[globalStyles.mt1, globalStyles.ph4]}>
                    <CustomText style={globalStyles.f16Medium}>
                      {pkg.Category.CategoryName}
                    </CustomText>

                    {pkg.Category.SubCategories?.map((sub) => (
                      <View
                        key={sub.SubCategoryID}
                        style={[globalStyles.mt2, globalStyles.ph4]}
                      >
                        <CustomText style={globalStyles.f12Medium}>
                          {sub.SubCategoryName}
                        </CustomText>

                        {sub.Includes?.map((inc) => (
                          <CustomText
                            key={inc.IncludeID}
                            style={globalStyles.f10Regular}
                          >
                            {inc.IncludeName}
                          </CustomText>
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))} */}
            {booking.Packages.map((pkg) => (
              <View
                key={pkg.PackageID}
                style={[
                  globalStyles.mt3,
                  globalStyles.bgwhite,
                  globalStyles.radius,
                  globalStyles.p3,
                  globalStyles.card,
                ]}
              >
                {/* Package Name */}
                <CustomText
                  style={[
                    globalStyles.f16Bold,
                    globalStyles.black,
                    globalStyles.mb1,
                  ]}
                >
                  {pkg.PackageName}
                </CustomText>

                {/* Estimated Time */}
                <View
                  style={[
                    globalStyles.flexrow,
                    globalStyles.alineItemscenter,
                    globalStyles.mb2,
                  ]}
                >
                  <CustomText
                    style={[globalStyles.f12Medium, globalStyles.neutral500]}
                  >
                    Estimated Time:{" "}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f12Bold, globalStyles.black]}
                  >
                    {`${Math.floor(pkg.EstimatedDurationMinutes / 60)}h ${
                      pkg.EstimatedDurationMinutes % 60
                    }m`}
                  </CustomText>
                </View>

                {/* Category */}
                {pkg.Category && (
                  <View style={globalStyles.mt1}>
                    <CustomText
                      style={[
                        globalStyles.f14Bold,
                        globalStyles.primary,
                        globalStyles.mb1,
                      ]}
                    >
                      {pkg.Category.CategoryName}
                    </CustomText>

                    {/* Subcategories */}
                    {pkg.Category.SubCategories?.map((sub) => (
                      <View
                        key={sub.SubCategoryID}
                        style={[
                          globalStyles.mt2,
                          globalStyles.bgneutral100,
                          globalStyles.radius,
                          globalStyles.p2,
                        ]}
                      >
                        <CustomText
                          style={[
                            globalStyles.f12Medium,
                            globalStyles.black,
                            globalStyles.mb1,
                          ]}
                        >
                          {sub.SubCategoryName}
                        </CustomText>

                        {/* Includes */}
                        {sub.Includes?.map((inc) => (
                          <CustomText
                            key={inc.IncludeID}
                            style={[
                              globalStyles.f12Regular,
                              globalStyles.primary,
                              globalStyles.ml2,
                            ]}
                          >
                            • {inc.IncludeName}
                          </CustomText>
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

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
              <CustomText
                style={[globalStyles.f12Medium, globalStyles.textWhite]}
              >
                Total Estimated Time
              </CustomText>
              <View>
                <CustomText
                  style={[globalStyles.f24Bold, globalStyles.textWhite]}
                >
                  {`${Math.floor(
                    booking.TotalEstimatedDurationMinutes / 60
                  )}h ${booking.TotalEstimatedDurationMinutes % 60}m`}
                </CustomText>
              </View>
            </View>
            <View style={styles.pricecard}>
              <CustomText style={[globalStyles.f12Bold, globalStyles.black]}>
                Price
              </CustomText>
              <CustomText style={[globalStyles.f28Bold, globalStyles.primary]}>
                {"₹"}
                {booking.TotalPrice}
              </CustomText>
            </View>
          </View>
        </View>

        <View
          style={[
            globalStyles.container,
            globalStyles.bgBlack,
            globalStyles.pb5,
          ]}
        >
          <CustomText
            style={[
              globalStyles.f16Bold,
              globalStyles.textWhite,
              globalStyles.mt2,
            ]}
          >
            Customer Note
          </CustomText>
          <CustomText style={[globalStyles.f12Regular, globalStyles.textWhite]}>
            {booking.Notes}
          </CustomText>
          <View
            style={[
              globalStyles.flexrow,
              globalStyles.justifysb,
              globalStyles.mt2,
              // globalStyles.p4,
            ]}
          ></View>

          <View style={[globalStyles.mt2]}>
            <View
              style={[
                globalStyles.mt4,
                globalStyles.flexrow,
                globalStyles.justifysb,
              ]}
            >
              {/* <TouchableOpacity style={styles.cancelButton}>
                <CustomText
                  style={[globalStyles.textWhite, globalStyles.f12Medium]}
                >
                  Cancel Booking
                </CustomText>
              </TouchableOpacity> */}

              <TouchableOpacity
                style={styles.callButton}
                onPress={() => {
                  const phoneNumber = booking.PhoneNumber;
                  if (phoneNumber) {
                    Linking.openURL(`tel:${phoneNumber}`);
                  } else {
                    Alert.alert("Error", "Phone number not available");
                  }
                }}
              >
                <Ionicons
                  name="call"
                  size={25}
                  color="#fff"
                  style={styles.callIcon}
                />
                <CustomText
                  style={[globalStyles.f14Bold, globalStyles.textWhite]}
                >
                  Call to customer
                </CustomText>
              </TouchableOpacity>
            </View>

            <View>
              {/* {booking.BookingStatus === "Confirmed" && (
                <TouchableOpacity
                  style={styles.startride}
                  onPress={handleStartRide}
                >
                  <Ionicons
                    name="rocket"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <CustomText style={styles.startButtonText}>
                    Start Ride
                  </CustomText>
                </TouchableOpacity>
              )} */}

              {/* {(booking.BookingStatus === "StartJourney" ||
                booking.BookingStatus === "ServiceStarted") && ( */}
              {/* <View style={styles.startreach}> */}
              {booking.BookingStatus !== "Completed" &&
                booking.BookingDate === today && (
                  <>
                    {(booking.BookingStatus === "Confirmed" ||
                      booking.BookingStatus === "StartJourney") &&
                      booking.BookingStatus !== "Reached" && (
                        <TouchableOpacity
                          style={styles.startButton}
                          onPress={handleStartRide}
                        >
                          <Ionicons
                            name="rocket"
                            size={20}
                            color="white"
                            style={{ marginRight: 8 }}
                          />
                          <CustomText
                            style={[
                              globalStyles.f14Bold,
                              globalStyles.textWhite,
                            ]}
                          >
                            Start Ride
                          </CustomText>
                        </TouchableOpacity>
                      )}
                    {booking.BookingStatus === "StartJourney" && (
                      <TouchableOpacity
                        style={styles.ReachedButton}
                        onPress={Reached}
                      >
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
                      </TouchableOpacity>
                    )}
                  </>
                )}
              {/* </View> */}
              {/* )} */}
            </View>
            {(booking.BookingStatus === "Reached" ||
              booking.BookingStatus === "ServiceStarted") && (
              <TouchableOpacity
                onPress={() => ServiceStart(booking)}
                style={styles.NextButton}
              >
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
              </TouchableOpacity>
            )}

             {(booking.BookingStatus === "Completed"  && booking.Payments?.some(
                  (payment) => payment.PaymentStatus !== "Success")) && (
              <TouchableOpacity
                onPress={() => CollectPayment(booking)}
                style={styles.NextButton}
              >
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
  avatar: {
    width: 135,
    height: 100,
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
});
