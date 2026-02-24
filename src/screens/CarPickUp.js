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
import { getBookingDisplayData } from "../utils/bookingDisplay";
import BookingPickDropRow from "../components/BookingPickDropRow";

export default function CarPickUp() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params;
  // console.log("booking", booking);
const [isLoading, setIsLoading] = useState(false);
const [otpCooldown, setOtpCooldown] = useState(0);
const [cooldownTimer, setCooldownTimer] = useState(null);

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
  const [carRegistrationNumber, setCarRegistrationNumber] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [imageError, setImageError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [otpValid, setOtpValid] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [carPickedUp, setCarPickedUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);


  const bookingParam = route?.params?.booking;
  
  // Merge booking data with Leads data for missing fields
  const customerName = bookingParam.CustomerName || bookingParam.Leads?.FullName || "";
  const phoneNumber = bookingParam.PhoneNumber || bookingParam.Leads?.PhoneNumber || "";
  const profileImage = bookingParam.ProfileImage || null;
  const vehicleNumber = bookingParam.VehicleNumber || bookingParam.Leads?.Vehicle?.RegistrationNumber || "";
  const brandName = bookingParam.BrandName || bookingParam.Leads?.Vehicle?.BrandName || "";
  const modelName = bookingParam.ModelName || bookingParam.Leads?.Vehicle?.ModelName || "";
  const fuelTypeName = bookingParam.FuelTypeName || bookingParam.Leads?.Vehicle?.FuelTypeName || "";
  const vehicleImage = bookingParam.VehicleImage || null;
  const fullAddress = bookingParam.FullAddress || bookingParam.Leads?.FullAddress || bookingParam.Leads?.City || "";
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
      }
    };
  }, [cooldownTimer]);

  const startCooldownTimer = () => {
    setOtpCooldown(60); 
    
    const timer = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCooldownTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setCooldownTimer(timer);
  };


  // carPickupDeliveryId from booking (PickupDelivery.Id) for ServiceImages OTP APIs
  const carPickupDeliveryId = booking?.PickupDelivery?.Id ?? 0;

  const resendOTP = async () => {
    try {
      setIsLoading(true);
      const payload = {
        carPickupDeliveryId: Number(carPickupDeliveryId),
        otpType: "Pickup",
      };
      const response = await axios.post(
        `${API_BASE_URL}ServiceImages/GenerateOTP`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      if (response?.data?.status === true || response?.data?.success === true) {
        setOtpSent(true);
        setModalMessage("OTP sent successfully to customer!");
        setModalVisible(true);
        startCooldownTimer();
        await AsyncStorage.setItem(`otpSent_${booking.BookingID}`, "true");
      } else {
        setModalMessage(response?.data?.message || "Failed to send OTP. Please try again.");
        setModalVisible(true);
      }
    } catch (error) {
      setModalMessage(error?.response?.data?.message || "Failed to send OTP. Please try again.");
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

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
      setImageError("");
    }
  };

  const removeImage = (index) => {
    const filtered = images.filter((_, i) => i !== index);
    setImages(filtered);
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

  // Check if car has been picked up based on CarPickUpDate or AsyncStorage
  useEffect(() => {
    const checkCarPickupState = async () => {
      try {
        // First check API data
        if (booking.CarPickUpDate) {
          setCarPickedUp(true);
          await AsyncStorage.setItem(`carPickedUp_${booking.BookingID}`, "true");
          return;
        }
        
        // Then check AsyncStorage for persisted state
        const storedState = await AsyncStorage.getItem(`carPickedUp_${booking.BookingID}`);
        if (storedState === "true") {
          setCarPickedUp(true);
        }
      } catch (error) {
        console.error("Error checking car pickup state:", error);
      }
    };
    
    checkCarPickupState();
  }, [booking.CarPickUpDate, booking.BookingID]);

  // Check OTP sent state from AsyncStorage on mount
  useEffect(() => {
    const checkOtpSentState = async () => {
      try {
        const storedOtpSent = await AsyncStorage.getItem(`otpSent_${booking.BookingID}`);
        if (storedOtpSent === "true") {
          setOtpSent(true);
        }
      } catch (error) {
        console.error("Error checking OTP sent state:", error);
      }
    };
    
    checkOtpSentState();
  }, [booking.BookingID]);

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
      if (otp) payload.bookingOTP = otp;

      const response = await axios.post(
        `${API_BASE_URL}TechnicianTracking/UpdateTechnicianTracking`,
        payload
      );

      if (response?.data?.status === false || response?.data?.isValid === false) {
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
      if (actionType === "ServiceStarted") setOtpValid(true);
      return true;
    } catch (error) {
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
                profileImage
                  ? { uri: `${API_BASE_URL_IMAGE}${profileImage}` }
                  : defaultAvatar
              }
              style={{ width: 46, height: 46, borderRadius: 10 }}
            />
            <View style={[globalStyles.ml3, { flex: 1 }]}>
              <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                {customerName || "N/A"}
              </CustomText>
              <CustomText
                style={[globalStyles.f12Medium, globalStyles.neutral500]}
              >
                Mobile: {phoneNumber || "N/A"}
              </CustomText>
            </View>
            <TouchableOpacity
              onPress={() => {
                Vibration.vibrate([0, 200, 100, 300]);

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
          <BookingPickDropRow booking={bookingParam} style={globalStyles.mt2} />
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
                {getBookingDisplayData(bookingParam).bookingTrackID}
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
                {getBookingDisplayData(bookingParam).bookingDate}
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
                {getBookingDisplayData(bookingParam).vehicleDisplay}
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
                {(getBookingDisplayData(bookingParam).timeSlot || "").split(",").map((slot, index) => (
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
                Upload at least one image (up to 5) <CustomText style={{ color: color.alertError }}>*</CustomText> and enter OTP to start
              </CustomText>
              <TouchableOpacity
                style={[
                  globalStyles.inputBox,
                  globalStyles.mt3,
                  imageError ? { borderColor: color.alertError, borderWidth: 2 } : {},
                ]}
                onPress={() => { setImageError(""); pickImage(); }}
              >
                <CustomText
                  style={[globalStyles.f16Light, globalStyles.neutral500]}
                >
                  Choose Files {images.length > 0 ? `(${images.length} selected)` : ""}
                </CustomText>
              </TouchableOpacity>
              {imageError ? (
                <CustomText style={[globalStyles.f12Regular, { color: color.alertError, marginTop: 4 }]}>
                  {imageError}
                </CustomText>
              ) : null}

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
                </View>
              )}
            </View>
            {/* Images upload with Submit (after OTP success) — no separate Upload Images button */}
            {/* Registration number + OTP: show directly when page opens (no Pickup Car button) */}
            <>
                <CustomText
                  style={[
                    globalStyles.f16Bold,
                    globalStyles.mt3,
                    globalStyles.black,
                  ]}
                >
                  Car Registration Number <CustomText style={{ color: color.alertError }}>*</CustomText>
                  <CustomText style={[globalStyles.f12Regular, { color: color.alertError }]}> (Required)</CustomText>
                </CustomText>
                <TextInput
                  style={[
                    globalStyles.inputBox,
                    globalStyles.mt2,
                    {
                      borderColor: registrationError ? color.alertError : "#ccc",
                      borderWidth: registrationError ? 2 : 1,
                    },
                  ]}
                  placeholder="Enter vehicle registration number (required)"
                  placeholderTextColor={color.neutral[500]}
                  value={carRegistrationNumber}
                  onChangeText={(text) => {
                    setCarRegistrationNumber(text.trim().toUpperCase());
                    setRegistrationError("");
                  }}
                  autoCapitalize="characters"
                />
                {registrationError ? (
                  <CustomText style={[globalStyles.f12Regular, { color: color.alertError, marginTop: 4 }]}>
                    {registrationError}
                  </CustomText>
                ) : null}

                <CustomText
                  style={[
                    globalStyles.f16Light,
                    globalStyles.mt3,
                    globalStyles.neutral500,
                  ]}
                >
                  Enter OTP
                </CustomText>

<View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
  <TextInput
    style={[
      globalStyles.inputBox,
      {
        flex: 1,
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

  {otpCooldown === 0 ? (
    <TouchableOpacity
      onPress={resendOTP}
      disabled={isLoading}
      style={[
        {
          marginLeft: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
          backgroundColor: color.yellow,
          opacity: isLoading ? 0.6 : 1,
        },
      ]}
    >
      <CustomText
        style={[globalStyles.f12Bold, globalStyles.textWhite]}
      >
        {isLoading ? "Sending OTP" : "Resend OTP"}  
      </CustomText>
    </TouchableOpacity>
  ) : (
    <View
      style={[
        {
          marginLeft: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
          backgroundColor: color.neutral[300],
          opacity: 0.6,
        },
      ]}
    >
      <CustomText
        style={[globalStyles.f12Bold, globalStyles.textWhite]}
      >
        Resend in {Math.floor(otpCooldown / 60)}:{(otpCooldown % 60).toString().padStart(2, '0')}
      </CustomText>
    </View>
  )}
</View>

{error ? (
  <CustomText style={{ color: "red", marginTop: 5 }}>
    {error}
  </CustomText>
) : null}

   

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
                      marginBottom: keyboardVisible ? 10 : 0,
                    },
                  ]}
                  onPress={async () => {
                    // Validation: At least one image required (Pre-service checklist)
                    if (!images.length || images.length < 1) {
                      setImageError("Please upload at least one image");
                      return;
                    }
                    setImageError("");

                    // Validation: Car registration number is mandatory
                    const regNo = carRegistrationNumber?.trim() || "";
                    if (!regNo) {
                      setRegistrationError("Car registration number is mandatory");
                      return;
                    }
                    setRegistrationError("");

                    // Validation: Check OTP
                    if (!otp || otp.length !== 6) {
                      setError("Please enter a valid 6-digit OTP");
                      return;
                    }

                    // Verify OTP — if invalid: show error only; do not post images, do not remove selected images
                    try {
                      const verifyPayload = {
                        carPickupDeliveryId: Number(carPickupDeliveryId) || 0,
                        otp: String(otp).trim(),
                        otpType: "Pickup",
                      };
                      const verifyRes = await axios.post(
                        `${API_BASE_URL}ServiceImages/VerifyOTP`,
                        verifyPayload,
                        { headers: { "Content-Type": "application/json" } }
                      );
                      if (verifyRes?.data?.status === false || verifyRes?.data?.isValid === false) {
                        setOtpValid(false);
                        setModalMessage(verifyRes?.data?.message || "Invalid OTP. Please try again.");
                        setModalVisible(true);
                        return; // do not upload images, do not clear images
                      }
                      setOtpValid(true);
                    } catch (verifyErr) {
                      setOtpValid(false);
                      setModalMessage(verifyErr?.response?.data?.message || "Invalid OTP. Please try again.");
                      setModalVisible(true);
                      return; // do not upload images, do not clear images
                    }

                    // OTP is valid — post images to api/ServiceImages/InsertPickupDeliveryImages (ImageUploadType=Pickup)
                    try {
                      setIsUploading(true);
                      for (let i = 0; i < images.length; i++) {
                        const formData = new FormData();
                        formData.append("CarPickupDeliveryId", Number(carPickupDeliveryId) || 0);
                        formData.append("VehicleNumber", regNo);
                        formData.append("BookingID", booking.BookingID);
                        formData.append("UploadedBy", 1);
                        formData.append("TechID", booking.TechID ?? "");
                        formData.append("ImageUploadType", "Pickup");
                        formData.append("ImagesType", "tech");
                        formData.append("ImageURL1", {
                          uri: images[i],
                          type: "image/jpeg",
                          name: `pickup_${i + 1}.jpg`,
                        });
                        await fetch(
                          `${API_BASE_URL}ServiceImages/InsertPickupDeliveryImages`,
                          {
                            method: "POST",
                            headers: {
                              Accept: "application/json",
                              "Content-Type": "multipart/form-data",
                            },
                            body: formData,
                          }
                        );
                      }
                      setIsUploading(false);
                      setUploadDone(true);
                      setImages([]);
                    } catch (uploadErr) {
                      setIsUploading(false);
                      setModalMessage("Image upload failed. Please try again.");
                      setModalVisible(true);
                      return; // do not clear images so user can retry
                    }

                    // Then update tracking: CarPickUp, ServiceStarted
                    if (!booking.CarPickUpDate && !carPickedUp) {
                      const carPickUpOk = await updateTechnicianTracking("CarPickUp");
                      if (!carPickUpOk) return;
                      setCarPickedUp(true);
                      try {
                        await AsyncStorage.setItem(`carPickedUp_${booking.BookingID}`, "true");
                      } catch (e) {}
                    }
                    const isValid = await updateTechnicianTracking("ServiceStarted");
                    if (!isValid) return;

                    // Calculate estimated and actual time
                    const estimatedTime = booking.TotalEstimatedDurationMinutes
                      ? booking.TotalEstimatedDurationMinutes * 60
                      : 0;
                    
                    // Calculate actual time (service just started, so it's 0 or from API if already started)
                    let actualTime = 0;
                    const serviceStartTime = booking.ServiceStartedAt 
                      ? new Date(booking.ServiceStartedAt)
                      : new Date();
                    actualTime = Math.floor((new Date() - serviceStartTime) / 1000);

                    // Update booking with ServiceStartedAt if not already set
                    const updatedBooking = {
                      ...booking,
                      ServiceStartedAt: booking.ServiceStartedAt || new Date().toISOString(),
                    };

                    // Store timer state
                    await AsyncStorage.setItem(
                      `serviceStarted_${booking.BookingID}`,
                      "true"
                    );

                    await AsyncStorage.setItem(
                      `timerState_${booking.BookingID}`,
                      JSON.stringify({
                        timerStarted: true,
                        elapsedTime: actualTime,
                        maxTime: estimatedTime,
                        timerCompleted: false,
                      })
                    );

                    // Car Pick Up is garage flow only → always go to CustomerToGarageMap
                    navigation.navigate("CustomerToGarageMap", {
                      booking: updatedBooking,
                      estimatedTime: estimatedTime,
                      actualTime: actualTime,
                      carRegistrationNumber: carRegistrationNumber?.trim() || "",
                    });
                  }}
                >
                  <CustomText style={[globalStyles.f16Bold, globalStyles.textWhite]}>
                    Submit
                  </CustomText>
                </TouchableOpacity>
            </>
            
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

          
          


            <TouchableOpacity
              onPress={async () => {
                setTimerCompleted(true);
                setTimeTaken(elapsedTime);
                await AsyncStorage.removeItem("serviceTimerState");
                // Service at garage flow: no ServiceEnd — go to CustomerToGarageMap (drive to garage, then drop)
                const estimatedTime = booking.TotalEstimatedDurationMinutes
                  ? booking.TotalEstimatedDurationMinutes * 60
                  : 0;
                navigation.navigate("CustomerToGarageMap", {
                  booking: booking,
                  estimatedTime: estimatedTime,
                  actualTime: elapsedTime,
                  carRegistrationNumber: carRegistrationNumber?.trim() || "",
                });
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
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalIconContainer}>
                <Ionicons
                  name={modalMessage.toLowerCase().includes("successfully") ? "checkmark-circle" : "alert-circle"}
                  size={48}
                  color={modalMessage.toLowerCase().includes("successfully") ? color.primary : color.alertError}
                />
              </View>
              <CustomText style={[globalStyles.f18SemiBold, globalStyles.textac, globalStyles.mb2]}>
                {modalMessage.toLowerCase().includes("successfully") ? "Success!" : "Notice"}
              </CustomText>
              <CustomText style={[globalStyles.f12Regular, globalStyles.textac, globalStyles.neutral500, globalStyles.mb4]}>
                {modalMessage}
              </CustomText>
              <TouchableOpacity
                style={styles.okButton}
                onPress={() => setModalVisible(false)}
              >
                <CustomText style={[globalStyles.textWhite, globalStyles.f14Bold]}>
                  OK
                </CustomText>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
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
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  modalIconContainer: {
    marginBottom: 16,
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
