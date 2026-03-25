import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
  Vibration,
  Linking,
  Alert,
  BackHandler,
} from "react-native";
import CustomText from "../components/CustomText";
import CustomAlert from "../components/CustomAlert";
import globalStyles from "../styles/globalStyles";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { RAZORPAY_KEY, RAZORPAY_SECRET } from "@env";
import base64 from "react-native-base64";
import { API_BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import qrImage from "../../assets/images/QrCode.jpeg.jpg";
import { color } from "../styles/theme";
import { encode } from "base64-arraybuffer";
import helpcall from "../../assets/icons/Customer Care.png";
import { getBookingDisplayData } from "../utils/bookingDisplay";
import * as ImagePicker from "expo-image-picker";

export default function CollectPayment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking, amount: amountFromParams } = route.params || {};
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [qrId, setQrId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [successMessage, setSuccessMessage] = useState("Payment Successful");
  const [proofImages, setProofImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    status: "info",
    title: "",
    message: "",
  });

  const showCustomAlert = (title, message, status = "info") => {
    setAlertConfig({
      visible: true,
      title,
      message,
      status,
    });
  };
  // Amount: from params (Dashboard) or from booking (ServiceEnd etc.)
  const collectAmount =
    amountFromParams != null && amountFromParams !== ""
      ? Number(amountFromParams)
      : booking?.PickupDelivery?.[0]?.TotalPrice ??
      booking?.TotalPrice ??
      getBookingDisplayData(booking)?.totalPrice ??
      (booking?.BookingAddOns?.length
        ? booking.BookingAddOns.reduce((sum, a) => sum + Number(a?.TotalPrice || 0), 0)
        : null);
  const refreshBooking = useCallback(async () => {
    const currentBooking = route.params?.booking;
    if (!currentBooking?.BookingID) return;
    const techID = currentBooking.TechID ?? (await AsyncStorage.getItem("techID"));
    if (!techID) return;
    try {
      const res = await axios.get(`${API_BASE_URL}Bookings/GetAssignedBookings`, {
        params: { Id: techID, techId: techID },
      });
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
      const fromApi = list.find((b) => b.BookingID === currentBooking.BookingID);
      if (fromApi) {
        navigation.setParams({
          ...route.params,
          booking: fromApi,
        });
      }
    } catch (e) {
      if (__DEV__) console.warn("CollectPayment refreshBooking:", e?.response?.data ?? e?.message);
    }
  }, [route.params?.booking?.BookingID, navigation]);

  const MAX_IMAGES = 2;
  const MAX_SIZE_MB = 5;

  const pickImage = async () => {
    if (proofImages.length >= MAX_IMAGES) {
      showCustomAlert("Limit Reached", "You can upload maximum 2 images only");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showCustomAlert("Permission required", "Please allow access to upload images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const image = result.assets[0];

      // ✅ Type validation
      if (!image.mimeType?.startsWith("image/")) {
        showCustomAlert("Invalid File", "Only image files are allowed");
        return;
      }

      // ✅ Size validation
      const sizeInMB = image.fileSize / (1024 * 1024);
      if (sizeInMB > MAX_SIZE_MB) {
        showCustomAlert("File Too Large", "Image must be less than 5MB");
        return;
      }

      setProofImages((prev) => [...prev, image]);
    }
  };

  const removeImage = (index) => {
    const updated = [...proofImages];
    updated.splice(index, 1);
    setProofImages(updated);
  };

  const handleCashAddonPayment = async () => {
    if (proofImages.length === 0) {
      showCustomAlert("Error", "Please upload at least one proof image");
      return;
    }

    try {
      setUploading(true);

      const techID = await AsyncStorage.getItem("techID");

      const formData = new FormData();

      formData.append("bookingID", booking?.BookingID);
      formData.append("amountPaid", collectAmount);
      formData.append("paymentMode", "Cash");
      formData.append("paymentStatus", "Success");
      formData.append("paymentType", "Static");
      formData.append("couponAmount", 0);
      formData.append("couponCode", "");
      formData.append("createdBy", techID);

      // ✅ Append multiple images
      proofImages.forEach((img, index) => {
        formData.append("ProofAttachment", {
          uri: img.uri,
          name: `proof_${index}.jpg`,
          type: img.mimeType || "image/jpeg",
        });
      });

      const response = await axios.post(
        `${API_BASE_URL}Payments/InsertBookingAddOnsPayment`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response?.status === 200) {
        setSuccessMessage("Cash Payment Collected");
        setShowSuccessModal(true);
        setProofImages([]); // reset
      }
    } catch (error) {
      console.error("Cash Payment Error:", error?.response?.data || error);
      showCustomAlert("Error", "Failed to upload payment");
    } finally {
      setUploading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      refreshBooking();
    }, [refreshBooking])
  );

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "CustomerTabNavigator",
              params: { screen: "Dashboard" },
            },
          ],
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [navigation])
  );
  const handleCompletePayment = async () => {
    try {
      const payload = {
        bookingID: booking?.BookingID,
        amountPaid: collectAmount,
      };

      const response = await axios.post(
        `${API_BASE_URL}Bookings/finalize-cash-payment`,
        payload
      );

      if (response?.status === 200) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Finalize Payment Error:", error.response?.data || error);
    }
  };

  useEffect(() => {
    const generateQR = async () => {
      if (!booking?.BookingID) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const bookingID = booking.BookingID;
        const amount = Math.round(Number(collectAmount)) || 0;

        const qrResponse = await axios.post(
          // `https://api.glansadesigns.com/test/qr-code.php?bookingID=${bookingID}&amount=${amount}`,
          `${API_BASE_URL}payments/qr`,
          {
            // responseType: "arraybuffer",
            bookingID: bookingID,
            amount: amount,
          }
        );
        console.log("qrResponse", qrResponse?.data);

        const responseData = qrResponse?.data;
        const returnedQrId =
          responseData?.qrId ||
          responseData?.QRID ||
          responseData?.id ||
          qrResponse?.headers?.qrid ||
          qrResponse?.headers?.["x-qr-id"] ||
          qrResponse?.headers?.["qr-id"];

        if (returnedQrId) {
          setQrId(String(returnedQrId));
        } else {
          const pendingPaymentFromBooking = booking?.Payments?.find(
            (p) => p?.PaymentStatus === "Pending"
          );
          const bookingQrId =
            pendingPaymentFromBooking?.QRID ||
            pendingPaymentFromBooking?.qrId ||
            pendingPaymentFromBooking?.QrId;
          if (bookingQrId) {
            setQrId(String(bookingQrId));
          }
        }

        const directImageUrl = responseData?.imageUrl || responseData?.qrImageUrl;
        const razorpayShortLink =
          responseData?.url ||
          responseData?.paymentUrl ||
          (typeof responseData === "string" ? responseData : null);

        const qrImageUrl = directImageUrl
          ? directImageUrl
          : razorpayShortLink
            ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=2&data=${encodeURIComponent(
              razorpayShortLink
            )}`
            : null;

        setQrImage(qrImageUrl);
        console.log(qrImageUrl);
      } catch (error) {
        console.error("QR Generation Error:", error);
        console.log("Error", "Failed to generate QR code");
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [booking, collectAmount]);

  useEffect(() => {
    if (!qrId) return;

    let isActive = true;
    const intervalId = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}Payments/status/${qrId}`);
        const status = res?.data?.status || res?.data?.Status;
        const success = res?.data?.success;
        console.log("status==========", status);
        if (!isActive) return;
        if (status) {
          setPaymentStatus(status);
        }

        const normalized = typeof status === "string" ? status.toLowerCase() : status;
        if (normalized === "captured" || normalized === "closed") {
          const idToShow = res?.data?.bookingId ?? booking?.BookingID;
          setSuccessMessage(`Payment done successfully`);
          clearInterval(intervalId);
          setShowSuccessModal(true);
        }
      } catch (e) {
      }
    }, 3000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [qrId]);

  return (
    <ScrollView style={[globalStyles.bgcontainer, globalStyles.flex1]}>
      <View style={[globalStyles.container, globalStyles.alineItemscenter]}>
        <View
          style={[
            globalStyles.mt3,
            globalStyles.mb6,
            {
              backgroundColor: "#fff",
              paddingVertical: 16,
              paddingHorizontal: 28,
              borderRadius: 16,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 6,
              elevation: 4,
            },
          ]}
        >
          <CustomText
            style={[globalStyles.f12Bold, globalStyles.textac, globalStyles.gray]}
          >
            Collect Amount
          </CustomText>
          <CustomText
            style={[
              globalStyles.f32Bold,
              globalStyles.textac,
              globalStyles.primary,
              { marginTop: 4 },
            ]}
          >
            ₹{collectAmount != null && collectAmount !== "" ? Number(collectAmount) : "—"}
          </CustomText>
        </View>
        <View style={styles.sectionCard}>

          <View style={styles.sectionHeader}>

            <Ionicons name="qr-code-outline" size={20} color={color.primary} />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Scan & Pay (UPI / QR)
            </CustomText>
          </View>

          <View style={{ alignItems: "center" }}>
            {loading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : qrImage ? (
              <Image source={{ uri: qrImage }} style={{ width: 220, height: 220 }} />
            ) : (
              <CustomText style={[globalStyles.gray]}>
                Failed to load QR code
              </CustomText>
            )}
          </View>
        </View>

        {/* <View
          style={[
            globalStyles.mt2,
            globalStyles.mb6,
            {
              backgroundColor: "#fff",
              padding: 24,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 5,
              elevation: 3,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : qrImage ? (
            <Image
              source={{ uri: qrImage }}
              style={{ width: 260, height: 260 }}
            />
          ) : (
            <CustomText
              style={[
                globalStyles.f14Bold,
                globalStyles.textac,
                globalStyles.gray,
              ]}
            >
              Failed to load QR code
            </CustomText>
          )}
        </View> */}

        <View style={styles.orContainer}>
          <View style={styles.line} />
          <CustomText style={styles.orText}>OR</CustomText>
          <View style={styles.line} />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={20} color={color.primary} />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Cash Collection (Add-ons)
            </CustomText>
          </View>

          {/* Upload */}
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
              padding: 12,
              alignItems: "center",
              marginBottom: 12,
              backgroundColor: "#fafafa",
            }}
            onPress={pickImage}
          >
            <CustomText style={[globalStyles.f12Bold]}>
              {proofImages.length > 0 ? "Add Another Image" : "Upload Payment Proof"}
            </CustomText>
          </TouchableOpacity>

          {/* Preview */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {proofImages.map((img, index) => (
              <View key={index} style={{ marginRight: 10, marginBottom: 10 }}>
                <Image
                  source={{ uri: img.uri }}
                  style={{ width: 90, height: 90, borderRadius: 10 }}
                />

                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    backgroundColor: "red",
                    borderRadius: 20,
                    paddingHorizontal: 6,
                  }}
                >
                  <CustomText style={{ color: "#fff", fontSize: 12 }}>X</CustomText>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              globalStyles.blackButton,
              { marginTop: 10, opacity: uploading ? 0.6 : 1 },
            ]}
            onPress={handleCashAddonPayment}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>
                Confirm Cash Payment
              </CustomText>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={20} color={color.primary} />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Contact
            </CustomText>
          </View>

          {/* Call Customer */}
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => {
              Vibration.vibrate([0, 200, 100, 300]);

              const phoneNumber =
                booking?.PickupDelivery?.[0]?.PickFrom?.PersonNumber;

              if (phoneNumber) {
                Linking.openURL(`tel:${phoneNumber}`);
              } else {
                showCustomAlert("Error", "Phone number not available", "error");
              }
            }}
          >
            <Ionicons name="call" size={20} color="#fff" style={styles.callIcon} />
            <CustomText style={[globalStyles.textWhite]}>
              Call Customer
            </CustomText>
          </TouchableOpacity>

          {/* Help Line */}
          <TouchableOpacity
            style={[styles.callButton, { marginTop: 10, backgroundColor: "#000" }]}
            onPress={() => {
              Vibration.vibrate([0, 200, 100, 300]);
              Linking.openURL(`tel:7075243939`);
            }}
          >
            <Image source={helpcall} />
            <CustomText style={[globalStyles.textWhite, globalStyles.ml2]}>
              Call Help Line
            </CustomText>
          </TouchableOpacity>
        </View>
        {/* <TouchableOpacity
          onPress={handleCompletePayment}
          style={[
            globalStyles.blackButton,
            globalStyles.w100,
            { marginTop: 12, borderRadius: 12, paddingVertical: 14 },
          ]}
        >
          <CustomText style={[globalStyles.textWhite, globalStyles.f16Bold]}>
            Mark as Completed
          </CustomText>
        </TouchableOpacity> */}
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        status={alertConfig.status}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() =>
          setAlertConfig((prev) => ({ ...prev, visible: false }))
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Pressable style={styles.modalBackground}>
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <Ionicons
              name="gift"
              size={64}
              color={color.primary}
              style={{ alignSelf: "center", marginBottom: 8 }}
            />

            <CustomText
              style={[
                globalStyles.f20Bold,
                globalStyles.textac,
                { marginTop: 4 },
              ]}
            >
              {successMessage}
            </CustomText>


            <Pressable
              style={[styles.button, styles.doneButton]}
              onPress={() => {
                setShowSuccessModal(false);
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
                Home
              </CustomText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  doneButton: {
    backgroundColor: color.primary,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  callIcon: {
    marginRight: 8,
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
  closeIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 5,
    zIndex: 1,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 28,
    borderRadius: 20,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: color.primary,
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: color.error,
  },

  divider: {
    height: 1,
    backgroundColor: color.neutral[100],
  },
  icons: {
    width: 11,
    height: 16,
  },
  iconbg: {
    padding: 6,
    height: 30,
    width: 30,
    backgroundColor: color.white,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  avatar: {
    width: 130,
    height: 150,
    borderWidth: 8,
    borderColor: color.white,
    borderRadius: 8,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 0,
    padding: 16,
  },
  gridContainer: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "45%",
    alignItems: "center",
    marginBottom: 16,
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    width: "100%",
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },

  orText: {
    marginHorizontal: 10,
    color: "#888",
    ...globalStyles.f10Bold,
  },
});
