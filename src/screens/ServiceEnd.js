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
  console.log("booking=================", booking);

  // Merge booking data with Leads data for missing fields (same as ServiceStart.js)
  const customerName = booking.CustomerName || booking.Leads?.FullName || "";
  const phoneNumber = booking.PhoneNumber || booking.Leads?.PhoneNumber || "";
  const profileImage = booking.ProfileImage || null;
  const vehicleNumber = booking.VehicleNumber || booking.Leads?.Vehicle?.RegistrationNumber || "";
  const brandName = booking.BrandName || booking.Leads?.Vehicle?.BrandName || "";
  const modelName = booking.ModelName || booking.Leads?.Vehicle?.ModelName || "";
  const fuelTypeName = booking.FuelTypeName || booking.Leads?.Vehicle?.FuelTypeName || "";
  // const [services, setServices] = useState(booking?.Packages || []);
  const [services, setServices] = useState(() => {
    const servicesList = [];
    
    // Handle Packages
    if (booking?.Packages && Array.isArray(booking.Packages)) {
      booking.Packages.forEach((pkg, pkgIndex) => {
        if (pkg.Category?.SubCategories && Array.isArray(pkg.Category.SubCategories)) {
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
        if (addOn.Includes && Array.isArray(addOn.Includes)) {
          addOn.Includes.forEach((inc, incIndex) => {
            servicesList.push({
              ...inc,
              completed: true,
              uniqueKey: `addon-${addOnIndex}-${incIndex}-${inc.IncludeID}`,
            });
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
        startCooldownTimer(); // Start 3-minute cooldown
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

    // Check payment mode and navigate accordingly
    if (booking.PaymentMode === "Razorpay" || booking.PaymentMode === "razorpay") {
      setShowPaymentModal(true);
    } else {
      navigation.navigate("CollectPayment", { booking });
    }
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
                  {modelName || vehicleNumber || "N/A"}
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

            {Array.isArray(services) && services.map((service) => (
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
              globalStyles.mt2,
              globalStyles.neutral500,
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
                  {isLoading ? "Sending OTP" : "Resend OTP"}  
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
                  Resend in {Math.floor(otpCooldown / 60)}:{(otpCooldown % 60).toString().padStart(2, '0')}
                </CustomText>
              </View>
            )}
          </View>

          {error ? (
            <CustomText style={{ color: "red"}}>
              {error}
            </CustomText>
          ) : null}
          {/* </> */}
          {/* )} */}

          {/* {(booking.PaymentMode == "COS" || booking.PaymentMode == "cos") && otpSent && ( */}
          <TouchableOpacity
            onPress={Completedservice}
            disabled={isLoading}
            style={[
              globalStyles.blackButton,
              {
                marginTop: 16,
                marginBottom: keyboardVisible ? 130 : 80,
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
          >
            <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>
              {isLoading ? "Verifying..." : "Completed"}
            </CustomText>
          </TouchableOpacity>
          {/* )} */}
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
                  globalStyles.f14Regular,
                  globalStyles.textac,
                  globalStyles.neutral500,
                  { marginBottom: 24, textAlign: "center" },
                ]}
              >
                Your service has been completed successfully. Payment has been processed through Razorpay.
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
    fontSize: 18,
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
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
  },
  metricValue: {
    fontSize: 16,
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
    fontSize: 10,
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  totalTimeSubLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  totalTimeValueContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  totalTimeValue: {
    fontSize: 28,
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
    fontSize: 12,
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
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
});
