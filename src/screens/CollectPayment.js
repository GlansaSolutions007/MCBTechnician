import React, { useEffect, useState } from "react";
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
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RAZORPAY_KEY, RAZORPAY_SECRET } from "@env";
import base64 from "react-native-base64";
import { API_BASE_URL } from "@env";
// import qrImage from "../../assets/images/QrCode.jpeg.jpg";
import { color } from "../styles/theme";
import { encode } from "base64-arraybuffer";

export default function CollectPayment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params;
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [qrId, setQrId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [successMessage, setSuccessMessage] = useState("Payment Successful");
console.log("qrId",qrId)
  const handleCompletePayment = async () => {
    try {
      const payload = {
        bookingID: booking?.BookingID,
        amountPaid: booking?.TotalPrice,
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

  // const Dashboard = async () => {
  //   navigation.reset({
  //     index: 0,
  //     routes: [
  //       {
  //         name: "CustomerTabNavigator",
  //         params: { screen: "Dashboard" },
  //       },
  //     ],
  //   });
  // };

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);

        const bookingID = booking?.BookingID;
        console.log("bookingID",bookingID)
        const amount = Math.round(Number(booking?.TotalPrice));

        const qrResponse = await axios.post(
          // `https://api.glansadesigns.com/test/qr-code.php?bookingID=${bookingID}&amount=${amount}`,
          `${API_BASE_URL}payments/qr`,
          {
            // responseType: "arraybuffer",
              bookingID: bookingID,
              amount: 1,
          }
        );
        console.log("qrResponse", qrResponse?.data);

        // Extract identifiers and URLs from response
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
          // Fallback: try extracting from booking payments array if present
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

        // Determine QR content/source
        const directImageUrl = responseData?.imageUrl || responseData?.qrImageUrl;
        const razorpayShortLink =
          responseData?.url ||
          responseData?.paymentUrl ||
          (typeof responseData === "string" ? responseData : null);

        // If backend returned a page/link (e.g., https://rzp.io/rzp/XXXX), generate a QR image from it
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
  }, [booking]);

  // Poll payment status by QR ID and open modal when captured
  useEffect(() => {
    if (!qrId) return;

    let isActive = true;
    const intervalId = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}Payments/status/${qrId}`);
        const status = res?.data?.status || res?.data?.Status;
        const success = res?.data?.success;
console.log("status",status);
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
        // keep polling on transient errors
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
              backgroundColor: "#f8f9fa",
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
            style={[globalStyles.f18, globalStyles.textac, globalStyles.gray]}
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
            ₹{booking?.TotalPrice}
          </CustomText>
        </View>

        <View
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
        </View>

        <TouchableOpacity
          style={styles.callButton}
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
            name="call"
            size={25}
            color="#fff"
            style={styles.callIcon}
          />
          <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>
            Call to customer
          </CustomText>
        </TouchableOpacity>

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
});
