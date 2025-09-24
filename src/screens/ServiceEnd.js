import React, { useEffect, useState } from "react";
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
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { useNavigation, useRoute } from "@react-navigation/native";
import buddy from "../../assets/images/buddy.png";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL, API_BASE_URL_IMAGE } from "@env";
import defaultAvatar from "../../assets/images/buddy.png";
import { color } from "../styles/theme";

const formatReadableTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs > 0 ? `${hrs} hr ` : ""}${mins} min${
    secs > 0 ? ` ${secs} sec` : ""
  }`;
};

export default function ServiceEnd() {
  const navigation = useNavigation();
  const route = useRoute();
  const { estimatedTime = 0, actualTime = 0 } = route.params || {};
  const [leads, setLeads] = useState([]);
  const { booking } = route.params;
  // const [services, setServices] = useState(booking?.Packages || []);
  const [services, setServices] = useState(
    booking?.Packages.flatMap((pkg, pkgIndex) =>
      pkg.Category.SubCategories?.flatMap((sub, subIndex) =>
        sub.Includes?.map((inc, incIndex) => ({
          ...inc,
          completed: true,
          uniqueKey: `${pkgIndex}-${subIndex}-${incIndex}-${inc.IncludeID}`,
        }))
      )
    ) || []
  );

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

  const sendOTP = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}TechnicianTracking/UpdateTechnicianTracking`,
        {
          // loginId: booking.PhoneNumber,
          bookingID: Number(bookingId),
          actionType: "SendOTP",
        }
      );

      if (response?.data?.status === true || response?.data?.success === true) {
        setOtpSent(true);
        setModalMessage("OTP sent successfully to customer!");
        setModalVisible(true);
      } else {
        setModalMessage("Failed to send OTP. Please try again.");
        setModalVisible(true);
      }
    } catch (error) {
      setModalMessage("Failed to send OTP. Please try again.");
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}TechnicianTracking/UpdateTechnicianTracking`,
        {
          bookingID: Number(bookingId),
          actionType: "VerifyOTP",
          bookingOTP: otp,
          // loginId: booking.PhoneNumber,
          // otp: otp,
          // deviceToken: "dummy",
          // deviceId: "dummy",
        }
      );

      if (
        response?.data?.status === true ||
        response?.data?.success === true ||
        response?.data?.isValid === true
      ) {
        setOtpValid(true);
        return true;
      } else {
        setOtpValid(false);
        setModalMessage("Invalid OTP. Please try again.");
        setModalVisible(true);
        return false;
      }
    } catch (error) {
      setOtpValid(false);
      setModalMessage("Invalid OTP. Please try again.");
      setModalVisible(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTechnicianTracking = async (actionType) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}TechnicianTracking/UpdateTechnicianTracking`,
        {
          bookingID: Number(bookingId),
          actionType: actionType,
          bookingOTP: otp,
        }
      );

      if (
        response?.data?.status === false ||
        response?.data?.isValid === false
      ) {
        setOtpValid(false);
        setModalMessage("Invalid OTP. Please try again.");
        setModalVisible(true);
        return false;
      }
      setOtpValid(true);
      return true;
    } catch (error) {
      setOtpValid(false);
      setModalMessage("Invalid OTP. Please try again.");
      setModalVisible(true);
      return false;
    }
  };

  const Completedservice = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    
    // First verify OTP with Auth API
    const otpValid = await verifyOTP();
    if (!otpValid) {
      return;
    }
    
    // After OTP verification, update technician tracking status
    const statusUpdated = await updateTechnicianTracking("Completed");
    if (!statusUpdated) {
      return;
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
        setLeads(res.data.map((item) => item));
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

          <View style={{ marginTop: 12 }}>
            <CustomText style={[globalStyles.f14Bold, globalStyles.mb2]}>
              Please check completed services
            </CustomText>

            {services.map((service) => (
              <View
                key={service.uniqueKey}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Pressable
                // onPress={() => toggleService(service.IncludeID)}
                >
                  <Ionicons
                    name={service.completed ? "checkbox" : "square-outline"}
                    size={30}
                    color={service.completed ? "#0D9276" : "#999"}
                  />
                </Pressable>
                <CustomText style={[globalStyles.ml2, globalStyles.f14Bold]}>
                  {service.IncludeName}
                </CustomText>
              </View>
            ))}

          </View>

          {/* Estimated and Extended Time */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 24,
            }}
          >
            <View
              style={{
                backgroundColor: "#1A9C8D",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flex: 1,
                marginRight: 8,
                alignItems: "center",
              }}
            >
              <CustomText
                style={[globalStyles.textWhite, globalStyles.f12Bold]}
              >
                Estimated Time
              </CustomText>
              <CustomText
                style={[globalStyles.textWhite, globalStyles.f14Bold]}
              >
                {formatReadableTime(estimatedTime)}
              </CustomText>
            </View>

            <View
              style={{
                backgroundColor: "#F4A100",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flex: 1,
                marginLeft: 8,
                alignItems: "center",
              }}
            >
              <CustomText
                style={[globalStyles.textWhite, globalStyles.f12Bold]}
              >
                Extended Time
              </CustomText>
              <CustomText
                style={[globalStyles.textWhite, globalStyles.f14Bold]}
              >
                {extendedTime > 0 ? formatReadableTime(extendedTime) : "0 min"}
              </CustomText>
            </View>
          </View>

          {/* Total Time */}
          <View
            style={[
              globalStyles.bgBlack,
              globalStyles.pv4,
              globalStyles.radius,
              globalStyles.mt4,
              globalStyles.alineItemscenter,
              globalStyles.p4,
            ]}
          >
            <CustomText style={[globalStyles.textWhite, globalStyles.f16Bold]}>
              Total Hours
            </CustomText>
            <CustomText style={[globalStyles.textWhite, globalStyles.f16Bold]}>
              {formatReadableTime(actualTime)}
            </CustomText>
          </View>

          {/* Get OTP Button */}
          {!otpSent && (
            <TouchableOpacity
              onPress={sendOTP}
              disabled={isLoading}
              style={[
                globalStyles.blackButton,
                { marginTop: 16, opacity: isLoading ? 0.6 : 1 },
              ]}
            >
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textWhite]}
              >
                {isLoading ? "Sending OTP..." : "Get OTP"}
              </CustomText>
            </TouchableOpacity>
          )}

          {/* OTP Section - Only show after OTP is sent */}
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
                  { borderColor: error ? "red" : "#ccc", borderWidth: 1 },
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

       
          {(booking.PaymentMode == "COS" || booking.PaymentMode == "cos") && otpSent && (
            <TouchableOpacity
              onPress={Completedservice}
              disabled={isLoading}
              style={[
                globalStyles.blackButton,
                { marginTop: 16, marginBottom: keyboardVisible ? 130 : 12, opacity: isLoading ? 0.6 : 1 },
              ]}
            >
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textWhite]}
              >
                {isLoading ? "Verifying..." : "Completed"}
              </CustomText>
            </TouchableOpacity>
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
                  style={[globalStyles.f16Bold, globalStyles.textac, { marginTop: 10 }]}
                >
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
});
