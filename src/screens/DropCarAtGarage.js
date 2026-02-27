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
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import helpcall from "../../assets/icons/Customer Care.png";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { API_BASE_URL, API_BASE_URL_IMAGE } from "@env";
import defaultAvatar from "../../assets/images/buddy.png";
import { getBookingDisplayData } from "../utils/bookingDisplay";
import BookingPickDropRow from "../components/BookingPickDropRow";

export default function DropCarAtGarage() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    booking,
    estimatedTime = 0,
    actualTime = 0,
    carRegistrationNumber: initialCarReg = "",
  } = route.params || {};

  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState("");
  const [carRegistrationNumber] = useState(initialCarReg || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [verifyingComplete, setVerifyingComplete] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const pd = booking?.PickupDelivery;
  const currentLeg = Array.isArray(pd) ? pd[0] : pd;
  const legId =
    currentLeg?.Id ??
    currentLeg?.ID ??
    currentLeg?.PickupDeliveryId ??
    (pd && !Array.isArray(pd) ? pd?.Id ?? pd?.ID ?? pd?.PickupDeliveryId : undefined);
  const fromArray =
    Array.isArray(pd) && pd.length > 0
      ? pd.reduce((acc, l) => acc ?? l?.Id ?? l?.ID ?? l?.PickupDeliveryId, null)
      : null;
  const carPickupDeliveryId = Number(
    legId ?? booking?.PickupDeliveryId ?? booking?.CarPickupDeliveryId ?? fromArray ?? 0
  );
  const [bookingParam, setBookingParam] = useState(route?.params?.booking || booking);

  useEffect(() => {
    let mounted = true;
    const fetchAssigned = async () => {
      try {
        const techId = booking?.TechID ?? route?.params?.booking?.TechID;
        if (!techId) return;
        const response = await axios.get(`${API_BASE_URL}Bookings/GetAssignedBookings?Id=${techId}`);
        if (response?.data && Array.isArray(response.data) && mounted) {
          const idToMatch = booking?.BookingID ?? route?.params?.booking?.BookingID;
          const found = response.data.find((b) => String(b.BookingID) === String(idToMatch));
          if (found) setBookingParam(found);
        }
      } catch (e) {
        console.error("Error fetching assigned bookings:", e);
      }
    };
    fetchAssigned();
    return () => {
      mounted = false;
    };
  }, [booking?.BookingID, booking?.TechID]);

  const customerName = bookingParam?.CustomerName || bookingParam?.Leads?.FullName || "";
  // const phoneNumber = bookingParam?.PhoneNumber || bookingParam?.Leads?.PhoneNumber || "";
  const pdParam = bookingParam?.PickupDelivery;
  const currentLegParam = Array.isArray(pdParam) ? pdParam[0] : pdParam;
  const phoneNumber = currentLegParam?.PickFrom?.PersonNumber || bookingParam?.PickupDelivery?.PickFrom?.PersonNumber || "";
  const DropAtphoneNumber = currentLegParam?.DropAt?.PersonNumber || bookingParam?.PickupDelivery?.DropAt?.PersonNumber || "";
  console.log("DropAtphoneNumber===-----=====-----===:", currentLegParam);
  const profileImage = bookingParam?.ProfileImage || null;

  useEffect(() => {
    const showListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
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
      const selected = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...selected].slice(0, 6));
      setImageError("");
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const sendDeliveryOTP = async () => {
    try {
      setIsLoading(true);
      setError("");
      if (!carPickupDeliveryId) {
        setModalMessage("Booking delivery info is missing. Cannot send OTP.");
        setModalVisible(true);
        setIsLoading(false);
        return;
      }
      const generateOtpPayload = {
        carPickupDeliveryId: Number(carPickupDeliveryId),
        otpType: "Delivery",
        phoneNumber: String(DropAtphoneNumber || "").trim(),
      };
      const response = await axios.post(
        `${API_BASE_URL}ServiceImages/GenerateOTP`,
        generateOtpPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      if (response?.data?.status === true || response?.data?.success === true) {
        setOtpCooldown(60);
        const t = setInterval(() => {
          setOtpCooldown((prev) => (prev <= 1 ? (clearInterval(t), 0) : prev - 1));
        }, 1000);
        setModalMessage("OTP sent successfully to customer!");
        setModalVisible(true);
      } else {
        setError(response?.data?.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyDeliveryOTP = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}ServiceImages/VerifyOTP`,
        {
          carPickupDeliveryId: Number(carPickupDeliveryId) || 0,
          otp: String(otp).trim(),
          otpType: "Delivery",
        },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response?.data?.status === false || response?.data?.isValid === false) {
        setError(response?.data?.message || "Invalid OTP.");
        return false;
      }
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP.");
      return false;
    }
  };

  const uploadDeliveryImages = async () => {
    const regNo = carRegistrationNumber?.trim() || "";
    for (let i = 0; i < images.length; i++) {
      const formData = new FormData();
      formData.append("CarPickupDeliveryId", Number(carPickupDeliveryId) || 0);
      formData.append("VehicleNumber", regNo);
      formData.append("BookingID", booking.BookingID);
      formData.append("UploadedBy", 1);
      formData.append("TechID", booking.TechID ?? "");
      formData.append("ImageUploadType", "Delivery");
      formData.append("ImagesType", "tech");
      formData.append("ImageURL1", {
        uri: images[i],
        type: "image/jpeg",
        name: `delivery_${i + 1}.jpg`,
      });
      await fetch(`${API_BASE_URL}ServiceImages/InsertPickupDeliveryImages`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "multipart/form-data" },
        body: formData,
      });
    }
  };

  const handleComplete = async () => {
    const regNo = carRegistrationNumber?.trim() || "";
    setImageError("");
    setError("");

    // At least one drop car image required
    if (!images || images.length < 1) {
      setImageError("At least one image is required.");
      return;
    }
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setVerifyingComplete(true);
    try {
      // Verify delivery OTP — if invalid, do not post images
      const valid = await verifyDeliveryOTP();
      if (!valid) {
        setVerifyingComplete(false);
        return;
      }

      // OTP valid — Post to InsertTracking with status "completed"
      await axios.post(
        `${API_BASE_URL}ServiceImages/InsertTracking`,
        { pickDropId: Number(carPickupDeliveryId) || 0, status: "completed" },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Completed status posted successfully");

      // Post to UpdateBookingStatus with action "completed"
      try {
        const statusPayload = {
          bookingID: Number(booking?.BookingID || 0),
          serviceType: booking?.ServiceType || "ServiceAtGarage",
          routeType: booking?.PickupDelivery[0].PickFrom.RouteType ,
          action: "completed",
          updatedBy: Number(booking?.TechID || 3),
          role: "Technician",
        };
        console.log("UpdateBookingStatus Payload (completed):",statusPayload);
        await axios.post(
          `${API_BASE_URL}ServiceImages/UpdateBookingStatus`,
          statusPayload,
          { headers: { "Content-Type": "application/json" } }
        );
        console.log("UpdateBookingStatus posted for completed");
      } catch (e) {
        console.error("UpdateBookingStatus Error:", e?.response?.data || e);
      }

      // Post images to api/ServiceImages/InsertPickupDeliveryImages (ImageUploadType=Delivery)
      setIsUploading(true);
      await uploadDeliveryImages();
      setIsUploading(false);

      // Flow finish — navigate to Dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: "CustomerTabNavigator", params: { screen: "Dashboard" } }],
      });
    } finally {
      setVerifyingComplete(false);
    }
  };

  if (!booking) {
    return (
      <View style={[globalStyles.bgcontainer, globalStyles.justifycenter, globalStyles.alineItemscenter]}>
        <CustomText style={globalStyles.f16Bold}>No booking data.</CustomText>
      </View>
    );
  }

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
          {/* Booking Summary - same as CarPickUp */}
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
                  {customerName || "N/A"}
                </CustomText>
                <CustomText style={[globalStyles.f12Medium, globalStyles.neutral500]}>
                  Mobile: {phoneNumber || "N/A"}
                </CustomText>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate([0, 200, 100, 300]);
                  if (phoneNumber) Linking.openURL(`tel:${phoneNumber}`);
                  else Alert.alert("Error", "Phone number not available");
                }}
              >
                <Ionicons
                  style={[globalStyles.p2, globalStyles.bgprimary, globalStyles.borderRadiuslarge]}
                  name="call"
                  size={20}
                  color={color.white}
                />
              </TouchableOpacity>
            </View>
            <View style={[globalStyles.divider, globalStyles.mt2]} />
            <BookingPickDropRow booking={bookingParam} style={globalStyles.mt2} />
            <View style={[globalStyles.flexrow]}>
              <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter, globalStyles.w40]}>
                <MaterialCommunityIcons name="card-account-details-outline" size={16} color={color.primary} style={{ marginRight: 6 }} />
                <CustomText style={[globalStyles.f10Regular, globalStyles.black, globalStyles.ml1]}>
                  {getBookingDisplayData(bookingParam).bookingTrackID}
                </CustomText>
              </View>
              <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter]}>
                <Ionicons name="calendar" size={16} color={color.primary} />
                <CustomText style={[globalStyles.f10Regular, globalStyles.black, globalStyles.ml1]}>
                  {getBookingDisplayData(bookingParam).bookingDate}
                </CustomText>
              </View>
            </View>
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter, globalStyles.w40]}>
                <Ionicons name="car" size={16} color={color.primary} />
                <CustomText style={[globalStyles.f10Regular, globalStyles.black, globalStyles.ml1]}>
                  {getBookingDisplayData(bookingParam).vehicleDisplay}
                </CustomText>
              </View>
              <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter]}>
                <Ionicons name="time-outline" size={16} color={color.primary} />
                <View style={{ flexDirection: "column" }}>
                  {(getBookingDisplayData(bookingParam).timeSlot || "").split(",").map((slot, index) => (
                    <CustomText key={index} style={[globalStyles.f10Regular, globalStyles.black, globalStyles.ml1]}>
                      {slot.trim()}
                    </CustomText>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Drop car at garage - image upload, OTP, Complete */}
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
              Drop car at garage
            </CustomText>
            <CustomText style={[globalStyles.f10Light, globalStyles.neutral500, globalStyles.mt1]}>
              Upload images (at least one required), enter Delivery OTP and tap Complete
            </CustomText>

            <TouchableOpacity
              style={[
                globalStyles.inputBox,
                globalStyles.mt3,
                { borderColor: imageError ? color.alertError : "#ccc", borderWidth: imageError ? 2 : 1 },
              ]}
              onPress={pickImage}
            >
              <CustomText style={[globalStyles.f16Light, globalStyles.neutral500]}>
                Choose Files
              </CustomText>
            </TouchableOpacity>
            {imageError ? (
              <CustomText style={[globalStyles.f12Regular, { color: color.alertError, marginTop: 4 }]}>
                {imageError}
              </CustomText>
            ) : null}

            {images.length > 0 && (
              <View>
                <View style={[globalStyles.flexrow, globalStyles.justifycenter, globalStyles.mt3, { flexWrap: "wrap" }]}>
                  {images.map((uri, index) => (
                    <View key={index} style={{ width: "32%", marginBottom: 10, position: "relative" }}>
                      <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 10 }} />
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

            <CustomText style={[globalStyles.f16Bold, globalStyles.mt3, globalStyles.black]}>
              Car Registration Number
            </CustomText>
            <TextInput
              style={[
                globalStyles.inputBox,
                globalStyles.mt2,
                { borderColor: "#ccc", borderWidth: 1, backgroundColor: color.neutral[100] },
              ]}
              placeholder="From pickup"
              placeholderTextColor={color.neutral[500]}
              value={bookingParam?.Leads?.Vehicle?.RegistrationNumber || ""}
              // value={"ABC123"}
              editable={false}
              autoCapitalize="characters"
            />

            <CustomText style={[globalStyles.f16Light, globalStyles.mt3, globalStyles.neutral500]}>
              Delivery OTP
            </CustomText>
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              <TextInput
                style={[
                  globalStyles.inputBox,
                  { flex: 1, borderColor: error ? "red" : "#ccc", borderWidth: 1 },
                ]}
                placeholder="Enter 6-digit OTP"
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
                  onPress={sendDeliveryOTP}
                  disabled={isLoading}
                  style={[styles.otpButton, { marginLeft: 10, opacity: isLoading ? 0.6 : 1 }]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>Resend OTP</CustomText>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={[styles.otpButton, { marginLeft: 10, backgroundColor: color.neutral[300], opacity: 0.6 }]}>
                  <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>
                    Resend in {otpCooldown}s
                  </CustomText>
                </View>
              )}
            </View>
            {error ? (
              <CustomText style={[globalStyles.f12Regular, { color: color.alertError, marginTop: 4 }]}>{error}</CustomText>
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
                  opacity: verifyingComplete ? 0.8 : 1,
                },
              ]}
              onPress={handleComplete}
              disabled={verifyingComplete}
            >
              {verifyingComplete ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <CustomText style={[globalStyles.f16Bold, globalStyles.textWhite]}>Complete</CustomText>
              )}
            </TouchableOpacity>
          </View>

          <View style={globalStyles.mt3}>
            <TouchableOpacity
              style={[
                globalStyles.flex1,
                globalStyles.bgBlack,
                globalStyles.borderRadiuslarge,
                globalStyles.p4,
                globalStyles.justifycenter,
                globalStyles.alineItemscenter,
              ]}
              onPress={() => {
                Vibration.vibrate([0, 200, 100, 300]);
                Linking.openURL(`tel:7075243939`);
              }}
            >
              <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
                <Image source={helpcall} />
                <CustomText style={[globalStyles.textWhite, globalStyles.ml2]}>Call help line</CustomText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalIconContainer}>
                <Ionicons
                  name={modalMessage.toLowerCase().includes("success") ? "checkmark-circle" : "alert-circle"}
                  size={48}
                  color={modalMessage.toLowerCase().includes("success") ? color.primary : color.alertError}
                />
              </View>
              <CustomText style={[globalStyles.f18SemiBold, globalStyles.textac, globalStyles.mb2]}>
                {modalMessage.toLowerCase().includes("success") ? "Success!" : "Notice"}
              </CustomText>
              <CustomText style={[globalStyles.f12Regular, globalStyles.textac, globalStyles.neutral500, globalStyles.mb4]}>
                {modalMessage}
              </CustomText>
              <TouchableOpacity style={styles.okButton} onPress={() => setModalVisible(false)}>
                <CustomText style={[globalStyles.textWhite, globalStyles.f14Bold]}>OK</CustomText>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
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
  modalIconContainer: { marginBottom: 16 },
  okButton: {
    marginTop: 20,
    backgroundColor: color.primary,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  imageupload: {
    backgroundColor: color.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    flexDirection: "row",
    marginTop: 8,
  },
  otpButton: {
    backgroundColor: color.yellow,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
