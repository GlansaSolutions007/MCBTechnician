import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Vibration,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { AnimatedCircularProgress } from "react-native-circular-progress";
// import AvailabilityHeader from "../components/AvailabilityHeader";
import { color } from "../styles/theme";
import helpcall from "../../assets/icons/Customer Care.png";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, API_BASE_URL_IMAGE } from "@env";
import defaultAvatar from "../../assets/images/buddy.png";

export default function ServiceStart() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params;
  console.log("booking", booking);

  const [images, setImages] = useState([]);
  const [reason, setReason] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [MAX_TIME, setMaxTime] = useState(0);
  const bookingId = booking.BookingID;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [otpValid, setOtpValid] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [carPickedUp, setCarPickedUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const showListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

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

  const handleUpload = async () => {
    try {
      if (!images.length) return;
      setIsUploading(true);

      for (let i = 0; i < images.length; i++) {
        const formData = new FormData();
        formData.append("BookingID", booking.BookingID);
        formData.append("UploadedBy", 1);
        formData.append("TechID", booking.TechID);
        formData.append("ImageUploadType", "before");
        formData.append("ImagesType", "tech");

        formData.append("ImageURL1", {
          uri: images[i],
          type: "image/jpeg",
          name: `upload_${i + 1}.jpg`,
        });

        const response = await fetch(
          `${API_BASE_URL}/ServiceImages/InsertServiceImages`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "multipart/form-data",
            },
            body: formData,
          }
        );

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        console.log(`Image ${i + 1} uploaded:`, data);
      }
      setIsUploading(false);
      setUploadDone(true);
      setImages([]);
      Alert.alert("Success", "Images uploaded successfully!");
    } catch (error) {
      setIsUploading(false);
      Alert.alert("Error", "Failed to upload images. Please try again.");
      console.error("Upload error:", error);
    }
  };

  const calculateElapsedFromAPI = (serviceStartedAt) => {
    const start = new Date(serviceStartedAt);
    const now = new Date();
    return Math.floor((now - start) / 1000);
  };

  // const calculateElapsedFromAPI = (serviceStartedAt) => {
  //   const startDate = new Date(serviceStartedAt);
  //   const start = startDate.toLocaleTimeString("en-GB", { hour12: false });
  //   console.log("...................>>>>>>>", start);
  //   const now = new Date();
  //   const diffInSeconds = Math.floor((now - startDate) / 1000);
  //   return diffInSeconds;
  // };

  useEffect(() => {
    let interval = null;

    if (booking.ServiceStartedAt && timerStarted && booking.TotalEstimatedDurationMinutes) {
      // set initial values
      const elapsedFromAPI = calculateElapsedFromAPI(booking.ServiceStartedAt);
      const maxTimeSeconds = booking.TotalEstimatedDurationMinutes * 60;
      setElapsedTime(elapsedFromAPI);
      setMaxTime(maxTimeSeconds);
      setTimerCompleted(elapsedFromAPI >= maxTimeSeconds);

      // keep calculating every second
      interval = setInterval(() => {
        const updated = calculateElapsedFromAPI(booking.ServiceStartedAt);
        setElapsedTime(updated);

        if (updated >= maxTimeSeconds) {
          setTimerCompleted(true);
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [booking.ServiceStartedAt, booking.TotalEstimatedDurationMinutes, timerStarted]);

  useEffect(() => {
    const loadTimerState = async () => {
      try {
        // Always check if service has started from API first
        if (booking.ServiceStartedAt) {
          const elapsedFromAPI = calculateElapsedFromAPI(booking.ServiceStartedAt);
          const maxTimeSeconds = booking.TotalEstimatedDurationMinutes ? booking.TotalEstimatedDurationMinutes * 60 : 0;
          setElapsedTime(elapsedFromAPI);
          setMaxTime(maxTimeSeconds);
          setTimerStarted(true);
          setTimerCompleted(maxTimeSeconds > 0 && elapsedFromAPI >= maxTimeSeconds);
          
          // Update stored state with current API data
          await AsyncStorage.setItem(
            `timerState_${booking.BookingID}`,
            JSON.stringify({
              timerStarted: true,
              elapsedTime: elapsedFromAPI,
              maxTime: maxTimeSeconds,
              timerCompleted: maxTimeSeconds > 0 && elapsedFromAPI >= maxTimeSeconds,
            })
          );
        } else {
          // Check stored state only if service hasn't started
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

  // Check if car has been picked up based on CarPickUpDate
  useEffect(() => {
    if (booking.CarPickUpDate) {
      setCarPickedUp(true);
    }
  }, [booking.CarPickUpDate]);

  // Refresh timer when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      if (booking.ServiceStartedAt && timerStarted && booking.TotalEstimatedDurationMinutes) {
        const elapsedFromAPI = calculateElapsedFromAPI(booking.ServiceStartedAt);
        setElapsedTime(elapsedFromAPI);
        const maxTimeSeconds = booking.TotalEstimatedDurationMinutes * 60;
        setTimerCompleted(elapsedFromAPI >= maxTimeSeconds);
      }
      // Check CarPickUpDate when screen comes into focus
      if (booking.CarPickUpDate) {
        setCarPickedUp(true);
      }
    }, [booking.ServiceStartedAt, timerStarted, booking.TotalEstimatedDurationMinutes, booking.CarPickUpDate])
  );

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

  const updateTechnicianTracking = async (actionType) => {
    try {
      const payload = {
        bookingID: Number(bookingId),
        actionType: actionType,
      };
      console.log("updateTechnicianTracking123333333", updateTechnicianTracking);
      console.log("actionType", actionType);
      console.log("bookingId", bookingId);
      // Only include OTP if it exists (for actions that require it)
      if (otp) {
        payload.bookingOTP = otp;
      }

      const response = await axios.post(
        `${API_BASE_URL}TechnicianTracking/UpdateTechnicianTracking`,
        payload
      );

      if (
        response?.data?.status === false ||
        response?.data?.isValid === false
      ) {
        // Only show OTP error for actions that require OTP
        if (actionType === "ServiceStarted") {
          setOtpValid(false);
          setModalMessage("Invalid OTP. Please try again.");
          setModalVisible(true);
        } else {
          setModalMessage(response?.data?.message || "Action failed. Please try again.");
          setModalVisible(true);
        }
        return false;
      }
      
      // Only set OTP valid for ServiceStarted action
      if (actionType === "ServiceStarted") {
        setOtpValid(true);
      }
      return true;
    } catch (error) {
      console.error(`Error sending ${actionType} action:`, error.message);
      if (actionType === "ServiceStarted") {
        setOtpValid(false);
        setModalMessage("Invalid OTP. Please try again.");
      } else {
        setModalMessage("Action failed. Please try again.");
      }
      setModalVisible(true);
      return false;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[globalStyles.flex1, globalStyles.bgcontainer]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 100}
    >
      <ScrollView 
        style={globalStyles.bgcontainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={globalStyles.container}>
        {/* <AvailabilityHeader /> */}

        {/* Booking Summary */}
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
                booking.ProfileImage
                  ? { uri: `${API_BASE_URL_IMAGE}${booking.ProfileImage}` }
                  : defaultAvatar
              }
              style={{ width: 46, height: 46, borderRadius: 10 }}
            />
            <View style={[globalStyles.ml3, { flex: 1 }]}>
              <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                {booking.CustomerName}
              </CustomText>
              <CustomText
                style={[globalStyles.f12Medium, globalStyles.neutral500]}
              >
                Mobile: {booking.PhoneNumber}
              </CustomText>
            </View>
            <TouchableOpacity
              onPress={() => {
                Vibration.vibrate([0, 200, 100, 300]);

                const phoneNumber = booking.PhoneNumber;
                if (phoneNumber) {
                  Linking.openURL(`tel:${phoneNumber}`);
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
          <View style={[globalStyles.flexrow]}>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt2,
                globalStyles.alineItemscenter,
                globalStyles.w40,
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
                  globalStyles.f10Regular,
                  globalStyles.black,
                  globalStyles.ml1,
                ]}
              >
                {booking.BookingTrackID}
              </CustomText>
            </View>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt2,
                globalStyles.alineItemscenter,
              ]}
            >
              <Ionicons name="calendar" size={16} color={color.primary} />
              <CustomText
                style={[
                  globalStyles.f10Regular,
                  globalStyles.black,
                  globalStyles.ml1,
                ]}
              >
                {booking.BookingDate}
              </CustomText>
            </View>
          </View>
          <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt2,
                globalStyles.alineItemscenter,
                globalStyles.w40,
              ]}
            >
              <Ionicons name="car" size={16} color={color.primary} />
              <CustomText
                style={[
                  globalStyles.f10Regular,
                  globalStyles.black,
                  globalStyles.ml1,
                ]}
              >
                {booking.VehicleNumber}
              </CustomText>
            </View>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt2,
                globalStyles.alineItemscenter,
              ]}
            >
              <Ionicons name="time-outline" size={16} color={color.primary} />
              <View style={{ flexDirection: "column" }}>
                {booking.TimeSlot?.split(",").map((slot, index) => (
                  <CustomText
                    key={index}
                    style={[
                      globalStyles.f10Regular,
                      globalStyles.black,
                      globalStyles.ml1,
                    ]}
                  >
                    {slot.trim()}
                  </CustomText>
                ))}
              </View>
            </View>
          </View>
        </View>

        {!timerStarted && booking.ServiceStartedAt === null && (
          <View>
            <View
              style={[
                globalStyles.mt3,
                globalStyles.bgwhite,
                globalStyles.radius,
                globalStyles.pt0,
                globalStyles.pb3,
                globalStyles.ph3,
                globalStyles.card,
              ]}
            >
              <CustomText style={[globalStyles.f14Bold, globalStyles.mt3]}>
                Pre-service checklist
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f10Light,
                  globalStyles.neutral500,
                  globalStyles.mt1,
                ]}
              >
                Upload up to 5 images and enter OTP to start
              </CustomText>
              <TouchableOpacity
                style={[globalStyles.inputBox, globalStyles.mt3]}
                onPress={pickImage}
              >
                <CustomText
                  style={[globalStyles.f16Light, globalStyles.neutral500]}
                >
                  Choose Files
                </CustomText>
              </TouchableOpacity>

              {images.length > 0 && (
                <View>
                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.justifycenter,
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

                  <TouchableOpacity
                    onPress={handleUpload}
                    style={styles.imageupload}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <CustomText
                      style={[globalStyles.f16Bold, globalStyles.textWhite]}
                    >
                      Upload Images
                    </CustomText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {!booking.CarPickUpDate && (
              <TouchableOpacity
                style={[
                  globalStyles.mt3,
                  globalStyles.bgprimary,
                  globalStyles.p4,
                  globalStyles.borderRadiuslarge,
                  globalStyles.justifycenter,
                  globalStyles.alineItemscenter,
                ]}
                onPress={async () => {
                  const success = await updateTechnicianTracking("CarPickUp");
                  if (success) {
                    setCarPickedUp(true);
                  }
                }}
                disabled={carPickedUp}
              >
                <View
                  style={[globalStyles.flexrow, globalStyles.alineItemscenter]}
                >
                  <Ionicons
                    name="car"
                    size={20}
                    color={color.white}
                    style={{ marginRight: 8 }}
                  />
                  <CustomText
                    style={[globalStyles.f16Bold, globalStyles.textWhite]}
                  >
                    Pickup Car
                  </CustomText>
                </View>
              </TouchableOpacity>
            )}

            {(booking.CarPickUpDate || carPickedUp) && !otpSent && (
              <TouchableOpacity
                style={[
                  globalStyles.mt3,
                  globalStyles.bgprimary,
                  globalStyles.p4,
                  globalStyles.borderRadiuslarge,
                  globalStyles.justifycenter,
                  globalStyles.alineItemscenter,
                ]}
                onPress={async () => {
                  const success = await updateTechnicianTracking("BookingStartOTP");
                  if (success) {
                    setOtpSent(true);
                  }
                }}
              >
                <View
                  style={[globalStyles.flexrow, globalStyles.alineItemscenter]}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={color.white}
                    style={{ marginRight: 8 }}
                  />
                  <CustomText
                    style={[globalStyles.f16Bold, globalStyles.textWhite]}
                  >
                    Send OTP
                  </CustomText>
                </View>
              </TouchableOpacity>
            )}

            {otpSent && (
              <>
                <CustomText
                  style={[
                    globalStyles.f16Light,
                    globalStyles.mt3,
                    globalStyles.neutral500,
                  ]}
                >
                  Enter OTP
                </CustomText>
                <TextInput
                  style={[
                    globalStyles.inputBox,
                    globalStyles.mt1,
                    {
                      borderColor: error ? "red" : "#ccc",
                      borderWidth: 1,
                    },
                  ]}
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={(text) => {
                    if (/^\d{0,6}$/.test(text)) {
                      setOtp(text);
                      setError("");
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />

                {error ? (
                  <CustomText style={{ color: "red", marginTop: 5 }}>
                    {error}
                  </CustomText>
                ) : null}
              </>
            )}

            {otpSent && (
              <TouchableOpacity
                style={[
                  globalStyles.mt4,
                  globalStyles.bgprimary,
                  globalStyles.p4,
                  globalStyles.borderRadiuslarge,
                  {
                    width: "100%",
                    minHeight: 50,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: keyboardVisible ? 20 : 0,
                  },
                ]}
                onPress={async () => {
                    if (!otp || otp.length !== 6) {
                      setError("Please enter a valid 6-digit OTP");
                      return;
                    }

                  const isValid = await updateTechnicianTracking(
                    "ServiceStarted"
                  );
                  if (!isValid) {
                    return;
                  }

                  handleUpload();
                  const totalSeconds = booking.TotalEstimatedDurationMinutes
                    ? booking.TotalEstimatedDurationMinutes * 60
                    : 0;
                  setMaxTime(totalSeconds);

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

                  // Store timer state for this specific booking
                  await AsyncStorage.setItem(
                    `timerState_${booking.BookingID}`,
                    JSON.stringify({
                      timerStarted: true,
                      elapsedTime: elapsedFromAPI,
                      maxTime: totalSeconds,
                      timerCompleted: false,
                    })
                  );

                  // Reload this screen with updated booking so timer starts immediately
                  const updatedBooking = {
                    ...booking,
                    ServiceStartedAt: new Date().toISOString(),
                  };
                  navigation.replace(route.name, { booking: updatedBooking });
                }}
              >
                <CustomText style={[globalStyles.f16Bold, globalStyles.textWhite]}>
                  Lets Start
                </CustomText>
              </TouchableOpacity>
            )}
            {/* <CustomText
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
            </View> */}
            <View>
              <TouchableOpacity
                style={[
                  globalStyles.flex1,
                  globalStyles.bgBlack,
                  globalStyles.borderRadiuslarge,
                  globalStyles.p4,
                  globalStyles.justifycenter,
                  globalStyles.alineItemscenter,
                  globalStyles.mt4,
                ]}
                onPress={() => {
                  Vibration.vibrate([0, 200, 100, 300]);

                  const phoneNumber = 7075243939;
                  if (phoneNumber) {
                    Linking.openURL(`tel:${phoneNumber}`);
                  } else {
                    Alert.alert("Error", "Phone number not available");
                  }
                }}
              >
                <View
                  style={[globalStyles.flexrow, globalStyles.alineItemscenter]}
                >
                  <Image source={helpcall} />
                  <CustomText
                    style={[globalStyles.textWhite, globalStyles.ml2]}
                  >
                    Call help line
                  </CustomText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {timerStarted && (
          <View>
            {/* <View
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
                  {booking.TotalEstimatedDurationMinutes
                    ? `${Math.floor(
                        booking.TotalEstimatedDurationMinutes / 60
                      )}h:${booking.TotalEstimatedDurationMinutes % 60}m`
                    : "N/A"}
                </CustomText>
              </View>
            </View> */}

            {/* <View style={{ alignItems: "center", marginTop: 30 }}>
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
                      {booking.TotalEstimatedDurationMinutes
                        ? `${Math.floor(
                            booking.TotalEstimatedDurationMinutes / 60
                          )}h:${booking.TotalEstimatedDurationMinutes % 60}m`
                        : "N/A"}
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
            </View> */}

            <View>
              <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                Service Details
              </CustomText>

              {booking.Packages && Array.isArray(booking.Packages) && booking.Packages.map((pkg) => (
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
                  {/* {pkg.EstimatedDurationMinutes && (
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
                  )} */}

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
                      {pkg.Category.SubCategories && Array.isArray(pkg.Category.SubCategories) && pkg.Category.SubCategories.map((sub) => (
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
                          {sub.Includes && Array.isArray(sub.Includes) && sub.Includes.map((inc) => (
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

              {/* Display BookingAddOns if available */}
              {booking.BookingAddOns && Array.isArray(booking.BookingAddOns) && booking.BookingAddOns.length > 0 && booking.BookingAddOns.map((addOn) => (
                <View
                  key={addOn.AddOnID}
                  style={[
                    globalStyles.mt3,
                    globalStyles.bgwhite,
                    globalStyles.radius,
                    globalStyles.p3,
                    globalStyles.card,
                  ]}
                >
                  {/* Service Name */}
                  <CustomText
                    style={[
                      globalStyles.f16Bold,
                      globalStyles.black,
                      globalStyles.mb1,
                    ]}
                  >
                    {addOn.ServiceName}
                  </CustomText>

                  {/* Price and Garage */}
                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.alineItemscenter,
                      globalStyles.mb2,
                    ]}
                  >
                    <CustomText
                      style={[globalStyles.f12Medium, globalStyles.primary]}
                    >
                      ₹{addOn.TotalPrice}
                    </CustomText>
                    {addOn.GarageName && (
                      <CustomText
                        style={[globalStyles.f12Medium, globalStyles.neutral500, globalStyles.ml2]}
                      >
                        • {addOn.GarageName}
                      </CustomText>
                    )}
                  </View>

                  {/* Description */}
                  {addOn.Description && (
                    <CustomText
                      style={[
                        globalStyles.f12Regular,
                        globalStyles.neutral500,
                        globalStyles.mb2,
                      ]}
                    >
                      {addOn.Description}
                    </CustomText>
                  )}

                  {/* Price Breakdown */}
                  <View style={[globalStyles.mt2]}>
                    <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.mb1]}>
                      <CustomText style={[globalStyles.f12Medium, globalStyles.neutral500]}>
                        Service Price:
                      </CustomText>
                      <CustomText style={[globalStyles.f12Bold, globalStyles.black]}>
                        ₹{addOn.ServicePrice}
                      </CustomText>
                    </View>

                    {addOn.LabourCharges > 0 && (
                      <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.mb1]}>
                        <CustomText style={[globalStyles.f12Medium, globalStyles.neutral500]}>
                          Labour Charges:
                        </CustomText>
                        <CustomText style={[globalStyles.f12Bold, globalStyles.black]}>
                          ₹{addOn.LabourCharges}
                        </CustomText>
                      </View>
                    )}

                    {addOn.GSTPercent > 0 && (
                      <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.mb1]}>
                        <CustomText style={[globalStyles.f12Medium, globalStyles.neutral500]}>
                          GST ({addOn.GSTPercent}%):
                        </CustomText>
                        <CustomText style={[globalStyles.f12Bold, globalStyles.black]}>
                          ₹{addOn.GSTPrice}
                        </CustomText>
                      </View>
                    )}

                    <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.mt2, globalStyles.pt2, { borderTopWidth: 1, borderTopColor: color.neutral[200] }]}>
                      <CustomText style={[globalStyles.f14Bold, globalStyles.black]}>
                        Total Price:
                      </CustomText>
                      <CustomText style={[globalStyles.f14Bold, globalStyles.primary]}>
                        ₹{addOn.TotalPrice}
                      </CustomText>
                    </View>
                  </View>

                  {/* Includes */}
                  {addOn.Includes && Array.isArray(addOn.Includes) && addOn.Includes.length > 0 && (
                    <View style={[globalStyles.mt3]}>
                      <CustomText
                        style={[
                          globalStyles.f14Bold,
                          globalStyles.primary,
                          globalStyles.mb2,
                        ]}
                      >
                        Includes:
                      </CustomText>
                      {addOn.Includes.map((inc) => (
                        <View
                          key={inc.IncludeID}
                          style={[
                            globalStyles.mt1,
                            globalStyles.bgneutral100,
                            globalStyles.radius,
                            globalStyles.p2,
                          ]}
                        >
                          <CustomText
                            style={[
                              globalStyles.f12Regular,
                              globalStyles.primary,
                              globalStyles.ml1,
                            ]}
                          >
                            • {inc.IncludeName}
                          </CustomText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
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
              style={[globalStyles.blackButton, globalStyles.mb3]}
            >
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textWhite]}
              >
                Next
              </CustomText>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <CustomText
                style={[
                  globalStyles.f16Bold,
                  globalStyles.textac,
                  { marginTop: 10 },
                ]}
              >
                {modalMessage}
              </CustomText>

              <TouchableOpacity
                style={styles.okButton}
                onPress={() => setModalVisible(false)}
              >
                <CustomText
                  style={[globalStyles.textWhite, globalStyles.f14Bold]}
                >
                  OK
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  okButton: {
    marginTop: 20,
    backgroundColor: color.primary,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  pricecard: {
    backgroundColor: color.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    minHeight: 50,
    minWidth: 100,
  },
  imageupload: {
    backgroundColor: color.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    flexDirection: "row",
  },
});
