import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { AnimatedCircularProgress } from "react-native-circular-progress";
// import AvailabilityHeader from "../components/AvailabilityHeader";
import { color } from "../styles/theme";
import helpcall from "../../assets/icons/Customer Care.png";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ServiceStart() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params;
  const [images, setImages] = useState([]);
  const [reason, setReason] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [MAX_TIME, setMaxTime] = useState(0);
  const bookingId = booking.BookingID;

  const calculateElapsedFromAPI = (serviceStartedAt) => {
    const start = new Date(serviceStartedAt);
    const now = new Date();
    return Math.floor((now - start) / 1000);
  };

  useEffect(() => {
    let interval = null;

    if (timerStarted && !timerCompleted) {
      interval = setInterval(() => {
        setElapsedTime((prev) => {
          const updatedTime = prev + 1;
          AsyncStorage.setItem(
            "serviceTimerState",
            JSON.stringify({
              timerStarted: true,
              elapsedTime: updatedTime,
              maxTime: MAX_TIME,
              timerCompleted: false,
              bookingId,
            })
          );

          return updatedTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerStarted, timerCompleted, MAX_TIME]);

  useEffect(() => {
    const loadTimerState = async () => {
      try {
        const storedState = await AsyncStorage.getItem(
          `timerState_${booking.BookingID}`
        );

        if (storedState) {
          const parsedState = JSON.parse(storedState);
          setElapsedTime(parsedState.elapsedTime);
          setMaxTime(parsedState.maxTime);
          setTimerStarted(parsedState.timerStarted);
          setTimerCompleted(parsedState.timerCompleted);
        }
        // ⬇ Fallback: No saved state, but API says service already started
        else if (booking.ServiceStartedAt) {
          const elapsedFromAPI = calculateElapsedFromAPI(
            booking.ServiceStartedAt
          );
          setElapsedTime(elapsedFromAPI);
          setMaxTime(booking.TotalEstimatedDurationMinutes * 60);
          setTimerStarted(true); // show that the timer is running
        }
      } catch (error) {
        console.error("Failed to load timer state", error);
      }
    };

    // const loadTimerState = async () => {
    //   try {
    //     const storedState = await AsyncStorage.getItem("serviceTimerState");
    //     if (storedState) {
    //       const {
    //         timerStarted,
    //         elapsedTime,
    //         maxTime,
    //         timerCompleted,
    //         bookingId: storedBookingId,
    //       } = JSON.parse(storedState);

    //       // Make sure it's for the same booking
    //       if (storedBookingId === bookingId) {
    //         setTimerStarted(timerStarted);
    //         setElapsedTime(elapsedTime);
    //         setMaxTime(maxTime);
    //         setTimerCompleted(timerCompleted);
    //       }
    //     }
    //   } catch (error) {
    //     console.error("Failed to load timer state:", error);
    //   }
    // };

    loadTimerState();
  }, [bookingId]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType,
      allowsMultipleSelection: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      const selected = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selected].slice(0, 6));
    }
  };

  const removeImage = (index) => {
    const filtered = images.filter((_, i) => i !== index);
    setImages(filtered);
  };

  const updateTechnicianTracking = async (actionType) => {
    try {
      await axios.post(
        "https://api.mycarsbuddy.com/api/TechnicianTracking/UpdateTechnicianTracking",
        {
          bookingID: bookingId,
          actionType: actionType,
        }
      );
      console.log("=================", bookingId);

      console.log(`${actionType} action sent successfully`);
    } catch (error) {
      console.error(`Error sending ${actionType} action:`, error.message);
      Alert.alert("Error", `Failed to send ${actionType} action.`);
    }
  };

  return (
    <ScrollView style={globalStyles.bgcontainer}>
      <View style={globalStyles.container}>
        {/* <AvailabilityHeader /> */}

        <CustomText style={[globalStyles.f20Bold, globalStyles.primary]}>
          Booking ID:{" "}
          <CustomText style={globalStyles.black}>
            {booking.BookingTrackID}
          </CustomText>
        </CustomText>

        <CustomText style={[globalStyles.f14Bold, globalStyles.mt4]}>
          Want to upload before service images?
        </CustomText>
        <CustomText
          style={[
            globalStyles.f10Light,
            globalStyles.neutral500,
            globalStyles.mt1,
          ]}
        >
          My dear buddy, upload maximum 4-5 images
        </CustomText>

        <TouchableOpacity
          style={[globalStyles.inputBox, globalStyles.mt3]}
          onPress={pickImage}
        >
          <CustomText style={[globalStyles.f16Light, globalStyles.neutral500]}>
            Choose Files
          </CustomText>
        </TouchableOpacity>

        {images.length > 0 && (
          <View
            style={[
              globalStyles.flexrow,
              globalStyles.justifysb,
              globalStyles.mt3,
              { flexWrap: "wrap" },
            ]}
          >
            {images.map((uri, index) => (
              <View
                key={index}
                style={{
                  width: "32%",
                  marginBottom: 10,
                  position: "relative",
                }}
              >
                <Image
                  source={{ uri }}
                  style={{ width: 100, height: 100, borderRadius: 10 }}
                />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 18,
                    backgroundColor: "#000",
                    borderRadius: 10,
                    padding: 2,
                    zIndex: 1,
                  }}
                >
                  <Ionicons name="close" color="#fff" size={15} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {timerStarted && (
          <View>
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
              <View
                style={[
                  globalStyles.alineSelfcenter,
                  globalStyles.flexrow,
                  globalStyles.alineItemscenter,
                ]}
              >
                <CustomText
                  style={[globalStyles.f24Bold, globalStyles.textWhite]}
                >
                  Estimated Time:
                </CustomText>
                <CustomText
                  style={[globalStyles.f24Bold, globalStyles.textWhite]}
                >
                  {" "}
                  {`${Math.floor(booking.TotalEstimatedDurationMinutes / 60)}:${
                    booking.TotalEstimatedDurationMinutes % 60
                  }m`}
                </CustomText>
              </View>
            </View>

            <View style={{ alignItems: "center", marginTop: 30 }}>
              <AnimatedCircularProgress
                size={240}
                width={10}
                fill={Math.min((elapsedTime / MAX_TIME) * 100, 100)}
                tintColor={elapsedTime > MAX_TIME ? "red" : color.primary}
                backgroundColor={color.neutral[200]}
                rotation={0}
                lineCap="round"
              >
                {() => (
                  <>
                    <CustomText
                      style={[globalStyles.f12Medium, { color: color.black }]}
                    >
                      {`${Math.floor(
                        booking.TotalEstimatedDurationMinutes / 60
                      )}:${booking.TotalEstimatedDurationMinutes % 60}m`}
                    </CustomText>
                    <CustomText
                      style={[globalStyles.f12Medium, { color: color.black }]}
                    >
                      Service Timing
                    </CustomText>
                    <CustomText
                      style={[globalStyles.f28ExtraBold, { marginTop: 5 }]}
                    >
                      {formatTime(elapsedTime)}
                    </CustomText>
                  </>
                )}
              </AnimatedCircularProgress>

              {timerCompleted && (
                <>
                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.w100,
                      globalStyles.justifysb,
                      globalStyles.mt4,
                      globalStyles.mb2,
                      globalStyles.bgprimary,
                      globalStyles.p4,
                      globalStyles.borderRadiuslarge,
                    ]}
                  >
                    <View
                      style={[
                        globalStyles.alineSelfcenter,
                        globalStyles.flexrow,
                        globalStyles.alineItemscenter,
                      ]}
                    >
                      <CustomText
                        style={[globalStyles.f24Bold, globalStyles.textWhite]}
                      >
                        Total Time Taken: {formatTime(elapsedTime)}
                      </CustomText>
                    </View>
                  </View>
                </>
              )}
            </View>

            <View>
              <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                Service Details
              </CustomText>

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
              {/* <View style={[globalStyles.mt2, globalStyles.ph4]}>
                <CustomText style={globalStyles.f18Medium}>
                  {booking.PackageNames?.split(", ").map((item, index) => (
                    <CustomText key={index}>
                      • {item}
                      {"\n"}
                    </CustomText>
                  ))}
                </CustomText>
                <CustomText style={globalStyles.f18Medium}>
                  {booking.IncludeNames?.split(", ").map((item, index) => (
                    <CustomText key={index}>
                      • {item}
                      {"\n"}
                    </CustomText>
                  ))}{" "}
                </CustomText>
              </View> */}
            </View>
            <TouchableOpacity
              onPress={async () => {
                navigation.navigate("ServiceEnd", {
                  estimatedTime: MAX_TIME,
                  actualTime: elapsedTime,
                  booking: booking,
                });
                setTimerCompleted(true);
                setTimeTaken(elapsedTime);
                await AsyncStorage.removeItem("serviceTimerState");
              }}
              style={globalStyles.blackButton}
            >
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textWhite]}
              >
                Next
              </CustomText>
            </TouchableOpacity>
          </View>
        )}

        {!timerStarted && (
          <View>
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
                  Estimated Time
                </CustomText>
                <CustomText
                  style={[globalStyles.f32Bold, globalStyles.textWhite]}
                >
                  {`${Math.floor(
                    booking.TotalEstimatedDurationMinutes / 60
                  )}h ${booking.TotalEstimatedDurationMinutes % 60}m`}
                </CustomText>
              </View>

              <TouchableOpacity
                style={styles.pricecard}
                // onPress={async () => {
                //   await updateTechnicianTracking("ServiceStarted");

                //   const totalSeconds =
                //     booking.TotalEstimatedDurationMinutes * 60;
                //   setMaxTime(totalSeconds);
                //   setTimerStarted(true);
                //   setElapsedTime(0);
                //   setTimerCompleted(false);

                //   await AsyncStorage.setItem(
                //     `serviceStarted_${booking.BookingID}`,
                //     "true"
                //   );
                // }}
                onPress={async () => {
                  await updateTechnicianTracking("ServiceStarted");

                  const totalSeconds =
                    booking.TotalEstimatedDurationMinutes * 60;
                  setMaxTime(totalSeconds);

                  // Calculate elapsed time from API time if it exists
                  const elapsedFromAPI = booking.ServiceStartedAt
                    ? calculateElapsedFromAPI(booking.ServiceStartedAt)
                    : 0;

                  setElapsedTime(elapsedFromAPI);
                  setTimerStarted(true);
                  setTimerCompleted(false);

                  await AsyncStorage.setItem(
                    `serviceStarted_${booking.BookingID}`,
                    "true"
                  );
                }}
              >
                <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                  Lets Start
                </CustomText>
              </TouchableOpacity>
            </View>
            <CustomText
              style={[
                globalStyles.f28Medium,
                globalStyles.neutral500,
                globalStyles.mt2,
              ]}
            >
              Hey{" "}
              <CustomText style={[globalStyles.f28Bold, globalStyles.primary]}>
                Buddy
              </CustomText>
            </CustomText>
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.neutral500,
                globalStyles.mt2,
              ]}
            >
              If the estimation time exceeded. Please feel free to mention the
              reason
            </CustomText>

            <TextInput
              style={[globalStyles.textArea, globalStyles.mt3]}
              placeholder="eg. Sick leave..., Going to village"
              value={reason}
              onChangeText={setReason}
              maxLength={100}
              multiline
            />
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifycenter,
                globalStyles.mt4,
              ]}
            >
              <TouchableOpacity
                style={[
                  globalStyles.flex1,
                  {
                    backgroundColor: color.fullredLight,
                    padding: 16,
                    borderRadius: 10,
                    marginRight: 8,
                  },
                ]}
              >
                <CustomText
                  style={[
                    globalStyles.textWhite,
                    globalStyles.textac,
                    globalStyles.flexrow,
                    globalStyles.justifycenter,
                    globalStyles.alineItemscenter,
                  ]}
                >
                  Cancel service
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  globalStyles.flex1,
                  {
                    backgroundColor: "#000",
                    padding: 16,
                    borderRadius: 10,
                    marginLeft: 8,
                  },
                ]}
              >
                <View
                  style={[globalStyles.flexrow, globalStyles.alineItemscenter]}
                >
                  <Image source={helpcall} />
                  <CustomText style={globalStyles.textWhite}>
                    Call help line
                  </CustomText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pricecard: {
    backgroundColor: color.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
});
