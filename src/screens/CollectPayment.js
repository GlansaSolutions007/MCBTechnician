import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import QRCode from "react-native-qrcode-svg";

export default function CollectPayment() {
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const amount = 600;

  useEffect(() => {
    const mockPaymentLink = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500)); 
        setPaymentUrl("https://paytm.me/your-test-link"); 
      } catch (error) {
        setErrorMessage("Failed to create payment link.");
      } finally {
        setLoading(false);
      }
    };

    mockPaymentLink();
  }, []);

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
          {amount}₹
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
            <ActivityIndicator size="large" color={color.black} />
          ) : paymentUrl ? (
            <QRCode value={paymentUrl} size={250} />
          ) : (
            <CustomText style={{ color: "red", textAlign: "center" }}>
              {errorMessage || "Failed to load QR"}
            </CustomText>
          )}
        </View>

        <TouchableOpacity style={[globalStyles.blackButton, globalStyles.w100]}>
          <CustomText style={[globalStyles.textWhite, globalStyles.f14Bold]}>
            Collect Cash
          </CustomText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
