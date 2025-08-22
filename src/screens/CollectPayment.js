import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RAZORPAY_KEY, RAZORPAY_SECRET } from "@env";
import base64 from "react-native-base64";

export default function CollectPayment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params;
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const Dashboard = () => {
    navigation.reset({
      index: 0,
      routes: [
        { name: "CustomerTabNavigator", params: { screen: "Dashboard" } },
      ],
    });
  };

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);

        const auth =
          "Basic " + base64.encode(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`);
        console.log("Auth header:", auth);

        const amountInPaise = Math.round(Number(booking?.TotalPrice) * 100);

        const qrResponse = await axios.post(
          "https://api.razorpay.com/v1/qr_codes",
          {
            type: "upi_qr",
            name: `Booking ${booking?.BookingTrackID}`,
            usage: "single_use",
            fixed_amount: true,
            payment_amount: amountInPaise,
            description: `Payment for Booking ${booking?.BookingTrackID}`,
          },

          {
            headers: {
              "Content-Type": "application/json",
              Authorization: auth,
            },
          }
        );

        if (qrResponse.data && qrResponse.data.image_url) {
          setQrImage(qrResponse.data.image_url);
        } else {
          Alert.alert("Error", "Failed to generate QR code");
        }
      } catch (error) {
        console.error("QR Generation Error:", error.response?.data || error);
        Alert.alert(
          "Error",
          error.response?.data?.error?.description ||
            "Something went wrong while generating QR code"
        );
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [booking]);

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
          {loading ? (
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
          )}
        </View>

        <TouchableOpacity
          onPress={Dashboard}
          style={[globalStyles.blackButton, globalStyles.w100]}
        >
          <CustomText style={[globalStyles.textWhite, globalStyles.f14Bold]}>
            Completed
          </CustomText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
