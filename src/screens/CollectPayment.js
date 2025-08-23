import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
// import { RAZORPAY_KEY, RAZORPAY_SECRET } from "@env";
// import base64 from "react-native-base64";
import { API_BASE_URL } from "@env";
import qrImage from "../../assets/images/QrCode.jpeg.jpg";
import { color } from "../styles/theme";

export default function CollectPayment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params;
  // const [qrImage, setQrImage] = useState(null);
  // const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  // useEffect(() => {
  //   const generateQR = async () => {
  //     try {
  //       setLoading(true);

  //       const auth =
  //         "Basic " + base64.encode(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`);
  //       console.log("Auth header:", auth);

  //       const amountInPaise = Math.round(Number(booking?.TotalPrice) * 100);

  //       const qrResponse = await axios.post(
  //         "https://api.razorpay.com/v1/qr_codes",
  //         {
  //           type: "upi_qr",
  //           name: `Booking ${booking?.BookingTrackID}`,
  //           usage: "single_use",
  //           fixed_amount: true,
  //           payment_amount: amountInPaise,
  //           description: `Payment for Booking ${booking?.BookingTrackID}`,
  //         },

  //         {
  //           headers: {
  //             "Content-Type": "application/json",
  //             Authorization: auth,
  //           },
  //         }
  //       );

  //       if (qrResponse.data && qrResponse.data.image_url) {
  //         setQrImage(qrResponse.data.image_url);
  //       } else {
  //         Alert.alert("Error", "Failed to generate QR code");
  //       }
  //     } catch (error) {
  //       console.error("QR Generation Error:", error.response?.data || error);
  //       Alert.alert(
  //         "Error",
  //         error.response?.data?.error?.description ||
  //           "Something went wrong while generating QR code"
  //       );
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   generateQR();
  // }, [booking]);

  return (
    <ScrollView style={[globalStyles.bgcontainer, globalStyles.flex1]}>
      <View style={[globalStyles.container, globalStyles.alineItemscenter]}>
        <CustomText
          style={[globalStyles.f14Bold, globalStyles.textac, globalStyles.mt4]}
        >
          Collect
        </CustomText>
        <CustomText
          style={[
            globalStyles.f32Bold,
            globalStyles.textac,
            globalStyles.black,
          ]}
        >
          ₹{booking?.TotalPrice}
        </CustomText>

        <View
          style={[
            globalStyles.mt4,
            globalStyles.bgprimary,
            globalStyles.p30,
            globalStyles.borderRadiuslarge,
            globalStyles.mb6,
          ]}
        >
          <Image source={qrImage} style={{ width: 250, height: 250 }} />
          {/* {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : qrImage ? (
            <Image
              source={{ uri: qrImage }}
              style={{ width: 250, height: 250 }}
            />
          ) : (
            <CustomText style={[globalStyles.textWhite, globalStyles.f14Bold]}>
              Failed to load QR code
            </CustomText>
          )} */}
        </View>
        <Pressable
          onPress={handleCompletePayment}
          style={[globalStyles.blackButton, globalStyles.w100]}
          // disabled={loading}
        >
          <CustomText style={[globalStyles.textWhite, globalStyles.f14Bold]}>
            Completed
          </CustomText>
        </Pressable>
        {/* <TouchableOpacity
          onPress={Dashboard}
          style={[globalStyles.blackButton, globalStyles.w100]}
        >
          <CustomText style={[globalStyles.textWhite, globalStyles.f14Bold]}>
            Completed
          </CustomText>
        </TouchableOpacity> */}
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Pressable
          style={styles.modalBackground}
        >
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <Ionicons
              name="checkmark-circle"
              size={60}
              color="green"
              style={{ alignSelf: "center" }}
            />

            <CustomText
              style={[
                globalStyles.f16Bold,
                globalStyles.textCenter,
                { marginTop: 12 },
              ]}
            >
              Payment Successful!
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
                Done
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
    padding: 24,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
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
