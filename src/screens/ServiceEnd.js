import React, { useEffect, useState, useCallback } from "react";
import {
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Pressable,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Vibration,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import buddy from "../../assets/images/buddy.png";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL, API_BASE_URL_IMAGE } from "@env";
import defaultAvatar from "../../assets/images/buddy.png";
import { color } from "../styles/theme";
import { getBookingDisplayData } from "../utils/bookingDisplay";
import BookingPickDropRow from "../components/BookingPickDropRow";

const formatReadableTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs > 0 ? `${hrs} hr ` : ""}${mins} min${secs > 0 ? ` ${secs} sec` : ""
    }`;
};

export default function ServiceEnd() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    estimatedTime = 0,
    actualTime = 0,
    carRegistrationNumber: paramRegNo = "",
  } = route.params || {};
  const [leads, setLeads] = useState([]);
  const { booking } = route.params;

  const refreshBooking = useCallback(async () => {
    const currentBooking = route.params?.booking;
    if (!currentBooking?.BookingID) return;
    const techID =
      currentBooking.TechID ?? (await AsyncStorage.getItem("techID"));
    if (!techID) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}Bookings/GetAssignedBookings`,
        {
          params: { Id: techID, techId: techID },
        },
      );
      const list = Array.isArray(res?.data)
        ? res.data
        : (res?.data?.data ?? []);
      const fromApi = list.find(
        (b) => b.BookingID === currentBooking.BookingID,
      );
      if (fromApi) {
        navigation.setParams({
          ...route.params,
          booking: fromApi,
        });
      }
    } catch (e) {
      if (__DEV__)
        console.warn(
          "ServiceEnd refreshBooking:",
          e?.response?.data ?? e?.message,
        );
    }
  }, [route.params?.booking?.BookingID, navigation]);

  useFocusEffect(
    useCallback(() => {
      refreshBooking();
    }, [refreshBooking]),
  );

  // Merge booking data with Leads data for missing fields (same as ServiceStart.js)
  const customerName = booking.PickupDelivery[0]?.PickFrom?.PersonName;
  const phoneNumber = booking.PickupDelivery[0]?.PickFrom?.PersonNumber;
  const profileImage = booking.ProfileImage || null;
  const carRegistrationNumber =
    paramRegNo ||
    booking?.CarRegistrationNumber ||
    booking?.VehicleNumber ||
    booking?.Leads?.Vehicle?.RegistrationNumber ||
    "";
  const vehicleNumber =
    booking.VehicleNumber ||
    booking.Leads?.Vehicle?.RegistrationNumber ||
    carRegistrationNumber ||
    "";
  const address = booking.PickupDelivery[0]?.PickFrom?.Address ||
    booking.PickupDelivery[0]?.DropAt?.Address ||
    booking.FullAddress ||
    "N/A";
  const brandName =
    booking.BrandName || booking.Leads?.Vehicle?.BrandName || "";
  const modelName =
    booking.ModelName || booking.Leads?.Vehicle?.ModelName || "";
  const fuelTypeName =
    booking.FuelTypeName || booking.Leads?.Vehicle?.FuelTypeName || "";

  const assignDateTime = booking?.PickupDelivery?.[0]?.AssignDate;

  const assignDate = assignDateTime
    ? new Date(assignDateTime).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "";

  const assignTime = assignDateTime
    ? new Date(assignDateTime).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";
  // const [services, setServices] = useState(booking?.Packages || []);
  const [services, setServices] = useState(() => {
    const servicesList = [];

    // Handle Packages
    if (booking?.Packages && Array.isArray(booking.Packages)) {
      booking.Packages.forEach((pkg, pkgIndex) => {
        if (
          pkg.Category?.SubCategories &&
          Array.isArray(pkg.Category.SubCategories)
        ) {
          pkg.Category.SubCategories.forEach((sub, subIndex) => {
            if (sub.Includes && Array.isArray(sub.Includes)) {
              sub.Includes.forEach((inc, incIndex) => {
                servicesList.push({
                  ...inc,
                  completed: true,
                  uniqueKey: `${pkgIndex}-${subIndex}-${incIndex}-${inc.IncludeID}`,
                });
              });
            }
          });
        }
      });
    }

    // Handle BookingAddOns
    if (booking?.BookingAddOns && Array.isArray(booking.BookingAddOns)) {
      booking.BookingAddOns.forEach((addOn, addOnIndex) => {
        if (
          addOn.Includes &&
          Array.isArray(addOn.Includes) &&
          addOn.Includes.length > 0
        ) {
          addOn.Includes.forEach((inc, incIndex) => {
            servicesList.push({
              ...inc,
              ServiceName: inc.ServiceName ?? inc.IncludeName,
              completed: true,
              uniqueKey: `addon-${addOnIndex}-${incIndex}-${inc.IncludeID ?? incIndex}`,
            });
          });
        } else {
          // Add-on has no Includes; treat the add-on as the service (use ServiceName from API)
          servicesList.push({
            ServiceName:
              addOn.ServiceName ??
              addOn.IncludeName ??
              addOn.Description ??
              "Service",
            completed: true,
            uniqueKey: `addon-${addOnIndex}-${addOn.AddOnID ?? addOnIndex}`,
          });
        }
      });
    }

    return servicesList;
  });

  const [reason, setReason] = useState("");
  const [selectedReason2, setSelectedReason2] = useState("Customer Pending");
  const [selectedReason, setSelectedReason] = useState(null);
  const anyServicePending = services.some((service) => !service.completed);
  const bookingId = booking.BookingID;

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [otpValid, setOtpValid] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType,
      allowsMultipleSelection: true,
      quality: 0.5,
    });
    if (!result.canceled) {
      const selected = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selected].slice(0, 5));
      setImageError("");
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const pd = booking?.PickupDelivery;
  const currentLeg = Array.isArray(pd) ? pd[0] : pd;
  const legId =
    currentLeg?.Id ??
    currentLeg?.ID ??
    currentLeg?.PickupDeliveryId ??
    (pd && !Array.isArray(pd)
      ? (pd?.Id ?? pd?.ID ?? pd?.PickupDeliveryId)
      : undefined);
  const fromArray =
    Array.isArray(pd) && pd.length > 0
      ? pd.reduce(
        (acc, l) => acc ?? l?.Id ?? l?.ID ?? l?.PickupDeliveryId,
        null,
      )
      : null;
  const carPickupDeliveryId = Number(
    legId ??
    booking?.PickupDeliveryId ??
    booking?.CarPickupDeliveryId ??
    fromArray ??
    0,
  );
  const routeType =
    currentLeg?.PickFrom?.[0]?.RouteType ??
    currentLeg?.PickFrom?.RouteType ??
    currentLeg?.DropAt?.RouteType ??
    "CustomerToDealer";

  const uploadAfterServiceImages = async () => {
    if (!images.length) return;
    setIsUploadingImages(true);
    try {
      const baseUrl = API_BASE_URL?.endsWith("/")
        ? API_BASE_URL
        : `${API_BASE_URL}/`;
      const vehicleNum = carRegistrationNumber || vehicleNumber || "";
      for (let i = 0; i < images.length; i++) {
        const formData = new FormData();
        formData.append(
          "CarPickupDeliveryId",
          Number(carPickupDeliveryId) || 0,
        );
        formData.append("VehicleNumber", vehicleNum);
        formData.append("BookingID", booking.BookingID);
        formData.append("UploadedBy", 1);
        formData.append("TechID", String(booking.TechID ?? ""));
        formData.append("ImageUploadType", "Delivery");
        formData.append("ImagesType", "tech");
        formData.append("ImageURL1", {
          uri: images[i],
          type: "image/jpeg",
          name: `delivery_${i + 1}.jpg`,
        });
        const res = await fetch(
          `${baseUrl}ServiceImages/InsertPickupDeliveryImages`,
          {
            method: "POST",
            headers: { Accept: "application/json" },
            body: formData,
          },
        );
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Upload failed ${res.status}`);
        }
      }
      setImages([]);
      setModalMessage("Images uploaded successfully.");
      setModalVisible(true);
    } catch (err) {
      console.error("Upload after-service images error:", err);
      setModalMessage(
        err?.message ||
        err?.response?.data?.message ||
        "Failed to upload images. Please try again.",
      );
      setModalVisible(true);
    } finally {
      setIsUploadingImages(false);
    }
  };

  useEffect(() => {
    const showListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

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

  const sendOTP = async () => {
    try {
      setIsLoading(true);
      if (!carPickupDeliveryId) {
        setModalMessage(
          "Booking pickup/delivery info is missing. Cannot send OTP.",
        );
        setModalVisible(true);
        setIsLoading(false);
        return;
      }
      const payload = {
        carPickupDeliveryId: Number(carPickupDeliveryId),
        otpType: "Delivery",
        phoneNumber: String(phoneNumber || "").trim(),
      };
      const response = await axios.post(
        `${API_BASE_URL}ServiceImages/GenerateOTP`,
        payload,
        { headers: { "Content-Type": "application/json" } },
      );

      if (response?.data?.status === true || response?.data?.success === true) {
        setOtpSent(true);
        setModalMessage("OTP sent successfully to customer!");
        setModalVisible(true);
        startCooldownTimer();
      } else {
        setModalMessage(
          response?.data?.message || "Failed to send OTP. Please try again.",
        );
        setModalVisible(true);
      }
    } catch (error) {
      setModalMessage(
        error?.response?.data?.message ||
        "Failed to send OTP. Please try again.",
      );
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setIsLoading(true);
      const verifyPayload = {
        carPickupDeliveryId: Number(carPickupDeliveryId) || 0,
        otp: String(otp).trim(),
        otpType: "Delivery",
      };
      const response = await axios.post(
        `${API_BASE_URL}ServiceImages/VerifyOTP`,
        verifyPayload,
        { headers: { "Content-Type": "application/json" } },
      );
      const data = response?.data;
      const isInvalid =
        data?.status === false ||
        data?.isValid === false ||
        (data?.success === false && data?.isValid !== true);
      if (isInvalid) {
        setOtpValid(false);
        setModalMessage(data?.message || "Invalid OTP. Please try again.");
        setModalVisible(true);
        return false;
      }
      setOtpValid(true);
      return true;
    } catch (error) {
      setOtpValid(false);
      setModalMessage(
        error?.response?.data?.message || "Invalid OTP. Please try again.",
      );
      setModalVisible(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const Completedservice = async () => {
    setError("");
    setImageError("");

    if (!images || images.length < 1) {
      setImageError("At least one image is required.");
      return;
    }
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    if (!carPickupDeliveryId) {
      setModalMessage(
        "Booking pickup/delivery info is missing. Please go back and open this booking again.",
      );
      setModalVisible(true);
      return;
    }

    // Verify OTP first — only if valid, then upload images
    const otpValidResult = await verifyOTP();
    if (!otpValidResult) {
      return;
    }

    // OTP valid — upload after-service images (ImageUploadType=completedservice)
    try {
      await uploadAfterServiceImages(true);
    } catch (err) {
      return;
    }

    // Post status "ServiceComplete" via UpdateBookingStatus

    // const addOnsToUpdate = [
    //   ...(Array.isArray(booking?.PickupDelivery?.[0]?.AddOns)
    //     ? booking.PickupDelivery[0].AddOns
    //     : []),
    // ];
    // console.log("AddOnsToUpdate======:", addOnsToUpdate);

    // const completedBy = await AsyncStorage.getItem("techID");
    // console.log("completedBy======", completedBy);
    // let authToken = null;
    // try {
    //   authToken = await AsyncStorage.getItem("token");
    // } catch (_) {}

    // const addOnHeaders = {
    //   "Content-Type": "application/json",
    //   ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    // };

    // for (const addOn of addOnsToUpdate) {
    //   const addOnID = addOn.AddOnID;
    //   // if (addOnID !== null) continue;

    //   const addOnIdNum = Number(addOnID);
    //   if (!Number.isFinite(addOnIdNum)) continue;

    //   try {
    //     const response = await axios.post(
    //       `${API_BASE_URL}Supervisor/UpdateAddOnCompletion`,
    //       {
    //         addOnID: addOnIdNum,
    //         completedBy,
    //         completedRole: "Technician",
    //         is_Completed: true,
    //         statusName: "ServiceCompleted",
    //       },
    //       { headers: addOnHeaders },
    //     );

    //     console.log("UpdateAddOnCompletion Responseeeeeeeeee:", response.data);
    //   } catch (e) {
    //     if (__DEV__) {
    //       console.warn(
    //         "UpdateAddOnCompletion Error:",
    //         e?.response?.data ?? e?.message,
    //       );
    //     }
    //   }
    // }

    const addOnsToUpdate = booking?.PickupDelivery?.[0]?.AddOns ?? [];

    const completedBy = await AsyncStorage.getItem("techID");
    console.log("completedBy======", completedBy);

    let authToken = await AsyncStorage.getItem("token");
    console.log("authToken======", authToken);

    // const addOnHeaders = {
    //   "Content-Type": "application/json",
    //   ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    // };

    // for (const addOn of addOnsToUpdate) {
    //   const addOnIdNum = Number(addOn.AddOnID);
    //   console.log("addOnIdNum-------------",addOnIdNum)

    //   try {
    //     console.log("Calling API for AddOnID:", addOnIdNum);

    //     const response = await axios.put(
    //       `${API_BASE_URL}Supervisor/UpdateAddOnCompletion`,
    //       {
    //         addOnID: addOnIdNum,
    //         completedBy,
    //         completedRole: "Technician",
    //         is_Completed: true,
    //         statusName: "ServiceCompleted",
    //       },
    //       { headers: addOnHeaders }
    //     );

    //     console.log("UpdateAddOnCompletion Response:", response.data);
    //   } catch (e) {
    //     console.warn(
    //       "UpdateAddOnCompletion Error:",
    //       e?.response?.data ?? e?.message
    //     );
    //   }
    // }

    //  try {
    //       const statusPayload = {
    //         bookingID: Number(booking?.BookingID || 0),
    //         serviceType: booking?.ServiceType || "ServiceAtGarage",
    //         action: "ServiceComplete",
    //         routeType: booking?.PickupDelivery?.[0]?.DropAt?.RouteType,
    //         updatedBy: Number(booking?.TechID || 3),
    //         role: "Technician",
    //       };
    //       await axios.post(
    //         `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
    //         statusPayload,
    //         { headers: { "Content-Type": "application/json" } },
    //       );
    //     } catch (e) {
    //       console.error(
    //         "UpdateBookingStatus (ServiceComplete) Error:",
    //         e?.response?.data ?? e,
    //       );
    //     }

    const addOnHeaders = {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    // 1️⃣ Update all AddOns
    for (const addOn of addOnsToUpdate) {
      const addOnIdNum = Number(addOn.AddOnID);
      console.log("addOnIdNum-------------", addOnIdNum);

      try {
        console.log("Calling API for AddOnID:", addOnIdNum);

        const response = await axios.put(
          `${API_BASE_URL}Supervisor/UpdateAddOnCompletion`,
          {
            addOnID: addOnIdNum,
            completedBy,
            completedRole: "Technician",
            is_Completed: true,
            statusName: "ServiceCompleted",
          },
          { headers: addOnHeaders },
        );

        console.log("UpdateAddOnCompletion Response:", response.data);
      } catch (e) {
        console.warn(
          "UpdateAddOnCompletion Error:",
          e?.response?.data ?? e?.message,
        );
      }
    }



    try {
      await axios.post(
        `${API_BASE_URL}ServiceImages/InsertTracking`,
        {
          pickDropId: Number(carPickupDeliveryId),
          status: "completed",
        },
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (e) {
      console.error("InsertTracking Completed Error:", e);
    }

    // 2️⃣ After loop finishes, update booking status
    try {
      const statusPayload = {
        bookingID: Number(booking?.BookingID || 0),
        serviceType: booking?.ServiceType || "ServiceAtGarage",
        action: "ServiceComplete",
        routeType: booking?.PickupDelivery?.[0]?.DropAt?.RouteType,
        updatedBy: Number(completedBy),
        role: "Technician",
      };

      const statusResponse = await axios.post(
        `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
        statusPayload,
        { headers: { "Content-Type": "application/json" } },
      );

      console.log("UpdateBookingStatus Response:", statusResponse.data);
    } catch (e) {
      console.error(
        "UpdateBookingStatus (ServiceComplete) Error:",
        e?.response?.data ?? e,
      );
    }



    navigation.navigate("CollectPayment", { booking });
  };


  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}AfterServiceLeads`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLeads(Array.isArray(res.data) ? res.data.map((item) => item) : []);
      } catch (error) {
        console.log("Error fetching leads:", error);
      }
    };

    fetchLeads();
  }, []);
  const extendedTime =
    actualTime > estimatedTime ? actualTime - estimatedTime : 0;

  const reasonsList = [];

  const pendingservices = [
    "Material Shortage",
    "Customer said not to do",
    "Unable to do that service part",
  ];

  return (
    <KeyboardAvoidingView
      style={[globalStyles.flex1, globalStyles.bgwhite]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        style={globalStyles.bgcontainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[globalStyles.container]}>
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
                  {customerName}
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Medium, globalStyles.neutral500]}
                >
                  Mobile: {phoneNumber}
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
                  {getBookingDisplayData(booking).bookingTrackID}
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
                  {getBookingDisplayData(booking).bookingDate}
                </CustomText>
              </View>
            </View>
            <BookingPickDropRow booking={booking} style={globalStyles.mt2} />
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
                  {carRegistrationNumber || "—"}
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
                {/* <View style={{ flexDirection: "column" }}>
                  {(getBookingDisplayData(booking).timeSlot || "")
                    .split(",")
                    .map((slot, index) => (
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
                </View> */}
                <View style={{ flexDirection: "column" }}>
                  {booking?.ServiceType === "ServiceAtGarage" ? (
                    <CustomText
                      style={[
                        globalStyles.f10Regular,
                        globalStyles.black,
                        globalStyles.ml1,
                      ]}
                    >
                      {assignTime}
                    </CustomText>
                  ) : (
                    (getBookingDisplayData(booking).timeSlot || "")
                      .split(",")
                      .map((slot, index) => (
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
                      ))
                  )}
                </View>
              </View>
            </View>
            <View style={[globalStyles.flexrow, globalStyles.mt2, { alignItems: "flex-start" }]}>
              <Ionicons name="home" size={16} color={color.primary} style={{ marginRight: 6, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>
                  {address || "N/A"}
                </CustomText>
              </View>
            </View>
          </View>

          <View>
            <View>
              <CustomText
                style={[
                  globalStyles.f16Bold,
                  globalStyles.black,
                  globalStyles.mt3,
                ]}
              >
                Service Details
              </CustomText>

              <View
                style={[
                  globalStyles.mt3,
                  globalStyles.bgwhite,
                  globalStyles.radius,
                  globalStyles.p4,
                  globalStyles.card,
                ]}
              >
                <View>
                  <CustomText
                    style={[
                      globalStyles.f14Bold,
                      globalStyles.black,
                      globalStyles.mb2,
                    ]}
                  >
                    Services:
                  </CustomText>
                  {booking.Packages &&
                    booking.Packages.length > 0 &&
                    booking.Packages.map((pkg) => (
                      <View key={pkg.PackageID} style={[globalStyles.mb3]}>
                        {pkg.Category?.CategoryName && (
                          <CustomText
                            style={[
                              globalStyles.f12Bold,
                              globalStyles.primary,
                              globalStyles.mb1,
                            ]}
                          >
                            {pkg.Category.CategoryName}
                          </CustomText>
                        )}
                        {pkg.Category?.SubCategories?.map((sub) => (
                          <View
                            key={sub.SubCategoryID}
                            style={[globalStyles.ml2, globalStyles.mb1]}
                          >
                            {sub.Includes?.map((inc) => (
                              <CustomText
                                key={inc.IncludeID}
                                style={[
                                  globalStyles.f12Regular,
                                  globalStyles.neutral500,
                                  globalStyles.ml2,
                                ]}
                              >
                                - {inc.IncludeName}
                              </CustomText>
                            ))}
                          </View>
                        ))}
                      </View>
                    ))}

                  {booking.PickupDelivery?.[0]?.AddOns &&
                    booking.PickupDelivery?.[0]?.AddOns?.length > 0 &&
                    booking.PickupDelivery?.[0]?.AddOns?.map((addOn) => (
                      <View key={addOn.AddOnID} style={[globalStyles.mb3]}>
                        <CustomText
                          style={[globalStyles.f12Bold, globalStyles.primary]}
                        >
                          • {addOn.ServiceName}
                        </CustomText>
                        {/* {addOn.Description && (
                          <CustomText
                            style={[
                              globalStyles.f12Regular,
                              globalStyles.neutral500,
                              globalStyles.mt1,
                            ]}
                          >
                            {addOn.Description}
                          </CustomText>
                        )} */}
                        {addOn.Includes && addOn.Includes.length > 0 && (
                          <View style={[globalStyles.ml3, globalStyles.mt1]}>
                            {addOn.Includes.map((inc) => (
                              <CustomText
                                key={inc.IncludeID}
                                style={[
                                  globalStyles.f12Regular,
                                  globalStyles.neutral500,
                                ]}
                              >
                                - {inc.IncludeName}
                              </CustomText>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}

                  {!booking.PickupDelivery?.[0]?.AddOns.length === 0 &&
                    !booking.PickupDelivery?.[0]?.AddOns === 0 && (
                      <CustomText
                        style={[
                          globalStyles.f12Regular,
                          globalStyles.neutral500,
                        ]}
                      >
                        No services available
                      </CustomText>
                    )}
                </View>
              </View>
            </View>
          </View>

          {booking.PickupDelivery && booking.PickupDelivery.length > 0 ? (
            <View style={[globalStyles.mb3]}></View>
          ) : (
            <View style={[globalStyles.mb3]}>
              <CustomText
                style={[globalStyles.f12Medium, globalStyles.neutral500]}
              >
                No pickup/delivery scheduled
              </CustomText>
            </View>
          )}

          {/* After-service checklist — same UI as ServiceStart; images uploaded when Completed is pressed after OTP */}
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
              After-service checklist
            </CustomText>
            <CustomText
              style={[
                globalStyles.f10Regular,
                globalStyles.neutral500,
              ]}
            >
              At least one image required. Choose files, then enter OTP and tap
              Completed.
            </CustomText>

            <TouchableOpacity
              style={[
                globalStyles.inputBox,
                globalStyles.mt3,
                {
                  borderColor: imageError ? color.alertError || "#c00" : "#ccc",
                  borderWidth: imageError ? 2 : 1,
                },
              ]}
              onPress={pickImage}
            >
              <CustomText
                style={[globalStyles.f16Light, globalStyles.neutral500]}
              >
                Choose Files
              </CustomText>
            </TouchableOpacity>
            {imageError ? (
              <CustomText
                style={[
                  globalStyles.f12Regular,
                  { color: color.alertError || "#c00", marginTop: 4 },
                ]}
              >
                {imageError}
              </CustomText>
            ) : null}

            {images.length > 0 && (
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
            )}
          </View>

          {/* Time Summary Card */}
          {/* <View style={styles.timeSummaryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="analytics" size={24} color={color.primary} />
              </View>
              <CustomText style={styles.cardTitle}>
                Service Time Analytics
              </CustomText>
            </View>

            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, styles.estimatedCard]}>
                <View style={styles.metricIconContainer}>
                  <Ionicons name="time-outline" size={22} color="#4CAF50" />
                </View>
                <CustomText style={styles.metricLabel}>Estimated Time</CustomText>
                <CustomText style={styles.metricValue}>
                  {formatReadableTime(estimatedTime)}
                </CustomText>
                <View style={styles.metricBadge}>
                  <CustomText style={styles.badgeText}>Planned</CustomText>
                </View>
              </View>

              <View style={[styles.metricCard, styles.extendedCard]}>
                <View style={styles.metricIconContainer}>
                  <Ionicons name="timer-outline" size={22} color="#FF9800" />
                </View>
                <CustomText style={styles.metricLabel}>Extended Time</CustomText>
                <CustomText style={styles.metricValue}>
                  {extendedTime > 0 ? formatReadableTime(extendedTime) : "0 min"}
                </CustomText>
                <View style={[styles.metricBadge, extendedTime > 0 ? styles.overtimeBadge : styles.noOvertimeBadge]}>
                  <CustomText style={styles.badgeText}>
                    {extendedTime > 0 ? "Overtime" : "On Time"}
                  </CustomText>
                </View>
              </View>
            </View>

            <View style={styles.totalTimeHighlight}>
              <View style={styles.totalTimeHeader}>
                <View style={styles.totalTimeIconContainer}>
                  <Ionicons name="stopwatch" size={28} color={color.white} />
                </View>
                <View style={styles.totalTimeTextContainer}>
                  <CustomText style={styles.totalTimeLabel}>
                    Total Service Duration
                  </CustomText>
                  <CustomText style={styles.totalTimeSubLabel}>
                    {extendedTime > 0 ? "Including overtime" : "As planned"}
                  </CustomText>
                </View>
              </View>
              
              <View style={styles.totalTimeValueContainer}>
                <CustomText style={styles.totalTimeValue}>
                  {formatReadableTime(actualTime)}
                </CustomText>
                {extendedTime > 0 && (
                  <View style={styles.overtimeIndicator}>
                    <Ionicons name="trending-up" size={16} color={color.white} />
                    <CustomText style={styles.overtimeText}>
                      +{formatReadableTime(extendedTime)}
                    </CustomText>
                  </View>
                )}
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min((actualTime / estimatedTime) * 100, 100)}%`,
                        backgroundColor: actualTime > estimatedTime ? "#FF9800" : "#4CAF50"
                      }
                    ]} 
                  />
                </View>
                <CustomText style={styles.progressText}>
                  {actualTime > estimatedTime ? "Over estimated" : "Within estimate"}
                </CustomText>
              </View>
            </View>
          </View> */}

          {/* OTP Section - Only show after OTP is sent */}
          {/* {otpSent && ( */}
          {/* <> */}
          <CustomText
            style={[
              globalStyles.f16Light,
              globalStyles.mt3,
              globalStyles.neutral500,
            ]}
          >
            Car Registration Number
          </CustomText>
          <View
            style={[
              globalStyles.inputBox,
              globalStyles.mt2,
              {
                borderColor: "#ccc",
                borderWidth: 1,
                paddingVertical: 12,
                paddingHorizontal: 12,
              },
            ]}
          >
            <CustomText style={[globalStyles.f12Medium, globalStyles.black]}>
              {carRegistrationNumber || "—"}
            </CustomText>
          </View>
          <CustomText
            style={[
              globalStyles.f16Light,
              globalStyles.mt2,
              globalStyles.neutral500,
              globalStyles.mb1,
            ]}
          >
            Enter OTP
          </CustomText>
          <View
            style={[
              globalStyles.flexrow,
              globalStyles.alineItemscenter,
              { width: "100%" },
            ]}
          >
            {/* OTP Input */}
            <TextInput
              style={[
                globalStyles.inputBox,
                {
                  flex: 1,
                  borderColor: error ? "red" : "#ccc",
                  borderWidth: 1,
                  marginRight: 8,
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

            {/* OTP Button */}
            {otpCooldown === 0 ? (
              <TouchableOpacity
                onPress={sendOTP}
                disabled={isLoading}
                style={[
                  globalStyles.smallyellowButtonotp,
                  globalStyles.alineItemscenter,
                  globalStyles.justifyContentcenter,
                  globalStyles.pv4,
                  globalStyles.px3,
                  {
                    flex: 1,
                    opacity: isLoading ? 0.6 : 1,
                  },
                ]}
              >
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textWhite]}
                >
                  {isLoading ? "Sending OTP" : "Send OTP"}
                </CustomText>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  globalStyles.blackButtonotp,
                  globalStyles.alineItemscenter,
                  globalStyles.justifyContentcenter,
                  globalStyles.pv4,
                  globalStyles.px3,
                  {
                    flex: 1,
                    opacity: 0.6,
                    backgroundColor: color.neutral[300],
                  },
                ]}
              >
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textWhite]}
                >
                  Resend in {Math.floor(otpCooldown / 60)}:
                  {(otpCooldown % 60).toString().padStart(2, "0")}
                </CustomText>
              </View>
            )}
          </View>

          {error ? (
            <CustomText style={{ color: "red" }}>{error}</CustomText>
          ) : null}
          {/* </> */}
          {/* )} */}

          {/* {(booking.PaymentMode == "COS" || booking.PaymentMode == "cos") && otpSent && ( */}
          <TouchableOpacity
            onPress={Completedservice}
            disabled={isLoading || isUploadingImages}
            style={[
              globalStyles.blackButton,
              {
                marginTop: 16,
                marginBottom: keyboardVisible ? 130 : 80,
                opacity: isLoading || isUploadingImages ? 0.6 : 1,
              },
            ]}
          >
            <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>
              {isLoading
                ? "Verifying..."
                : isUploadingImages
                  ? "Uploading..."
                  : "Completed"}
            </CustomText>
          </TouchableOpacity>
          {/* )} */}
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
              <Pressable
                style={styles.modalBox}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalIconContainer}>
                  <Ionicons
                    name={
                      modalMessage.toLowerCase().includes("successfully")
                        ? "checkmark-circle"
                        : "alert-circle"
                    }
                    size={48}
                    color={
                      modalMessage.toLowerCase().includes("successfully")
                        ? color.primary
                        : color.alertError
                    }
                  />
                </View>
                <CustomText
                  style={[
                    globalStyles.f18SemiBold,
                    globalStyles.textac,
                    globalStyles.mb2,
                  ]}
                >
                  {modalMessage.toLowerCase().includes("successfully")
                    ? "Success!"
                    : "Notice"}
                </CustomText>
                <CustomText
                  style={[
                    globalStyles.f12Regular,
                    globalStyles.textac,
                    globalStyles.neutral500,
                    globalStyles.mb4,
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
              </Pressable>
            </Pressable>
          </Modal>

          {/* Payment Completion Modal for Razorpay */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showPaymentModal}
            onRequestClose={() => setShowPaymentModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color="#4CAF50"
                  style={{ alignSelf: "center", marginBottom: 16 }}
                />
                <CustomText
                  style={[
                    globalStyles.f20Bold,
                    globalStyles.textac,
                    { marginBottom: 8 },
                  ]}
                >
                  Payment Completed!
                </CustomText>
                <CustomText
                  style={[
                    globalStyles.f12Regular,
                    globalStyles.textac,
                    globalStyles.neutral500,
                    { marginBottom: 24, textAlign: "center" },
                  ]}
                >
                  Your service has been completed successfully. Payment has been
                  processed through Razorpay.
                </CustomText>
                <TouchableOpacity
                  style={styles.okButton}
                  onPress={() => {
                    setShowPaymentModal(false);
                    navigation.reset({
                      index: 0,
                      routes: [
                        {
                          name: "CustomerTabNavigator",
                          params: { screen: "Dashboard" },
                        },
                      ],
                    });
                  }}
                >
                  <CustomText
                    style={[globalStyles.textWhite, globalStyles.f14Bold]}
                  >
                    Go to Dashboard
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

  // Time Summary Card Styles
  timeSummaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    ...globalStyles.f12Regular,
    fontWeight: "bold",
    color: color.primary,
    flex: 1,
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  estimatedCard: {
    borderColor: "#4CAF50",
    backgroundColor: "#F8FFF8",
  },
  extendedCard: {
    borderColor: "#FF9800",
    backgroundColor: "#FFFBF5",
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  metricLabel: {
    ...globalStyles.f10Regular,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
  },
  metricValue: {
    ...globalStyles.f12Regular,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  metricBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#E8F5E8",
  },
  overtimeBadge: {
    backgroundColor: "#FFE0B2",
  },
  noOvertimeBadge: {
    backgroundColor: "#E8F5E8",
  },
  badgeText: {
    ...globalStyles.f10Regular,
    fontWeight: "600",
    color: "#4CAF50",
  },
  totalTimeHighlight: {
    backgroundColor: color.primary,
    borderRadius: 16,
    padding: 20,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  totalTimeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  totalTimeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  totalTimeTextContainer: {
    flex: 1,
  },
  totalTimeLabel: {
    ...globalStyles.f12Regular,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  totalTimeSubLabel: {
    ...globalStyles.f10Regular,
    color: "rgba(255,255,255,0.8)",
  },
  totalTimeValueContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  totalTimeValue: {
    ...globalStyles.f16Regular,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  overtimeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  overtimeText: {
    ...globalStyles.f10Regular,
    color: "#fff",
    marginLeft: 4,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    ...globalStyles.f10Regular,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
});
