import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import QRImage from "../../assets/images/QRImage.png"; 
import { useNavigation, useRoute } from "@react-navigation/native";

export default function CollectPayment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params;
  const Dashboard = () => {
    navigation.navigate("CustomerTabNavigator", { screen: "Dashboard" });
  };
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
          <Image source={QRImage} style={{ width: 250, height: 250 }} />
        </View>

        <TouchableOpacity
          onPress={Dashboard}
          style={[globalStyles.blackButton, globalStyles.w100]}
        >
          <CustomText style={[globalStyles.textWhite, globalStyles.f14Bold]}>
            Collect Cash
          </CustomText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
