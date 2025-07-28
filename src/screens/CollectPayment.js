import React from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import globalStyles from "../styles/globalStyles";
import CustomText from "../components/CustomText";
import { Ionicons } from "@expo/vector-icons";
import QRImage from "../../assets/images/QRImage.png";

export default function CollectPayment() {
  return (
    <ScrollView style={globalStyles.bgcontainer}>
      <View style={[globalStyles.container, globalStyles.alineItemscenter]}>
        <CustomText
          style={[
            globalStyles.f16Medium,
            globalStyles.textac,
            globalStyles.mt4,
          ]}
        >
          Collect
        </CustomText>
        <CustomText
          style={[
            globalStyles.f28Bold,
            globalStyles.textac,
            globalStyles.mt1,
            globalStyles.black,
          ]}
        >
          600₹
        </CustomText>

        <View
          style={[
            globalStyles.mt4,
            globalStyles.bgprimary,
            globalStyles.p4,
            globalStyles.radius,
            globalStyles.mb6,
          ]}
        >
          <Image
            source={QRImage}
            style={{
              width: 250,
              height: 250,
            }}
            resizeMode="contain"
          />
        </View>

        <CustomText
          style={[
            globalStyles.f16Medium,
            globalStyles.neutral500,
            globalStyles.mb2,
            globalStyles.alineSelfstart,
          ]}
        >
          Payment Method
        </CustomText>

        <TouchableOpacity
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.alineItemscenter,
            globalStyles.p3,
            { width: "100%" },
          ]}
        >
          <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
            <CustomText style={globalStyles.f16Regular}>Apple Pay</CustomText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.alineItemscenter,
            globalStyles.p3,
            { width: "100%" },
          ]}
        >
          <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
            {/* <Image
              source={RazorPayLogo}
              style={{ width: 24, height: 24, marginRight: 10 }}
              resizeMode="contain"
            /> */}
            <CustomText style={globalStyles.f16Regular}>Razor Pay</CustomText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={[globalStyles.blackButton, { width: "100%" }]}>
          <CustomText style={[globalStyles.textWhite, globalStyles.f14Bold]}>
            Collect Cash
          </CustomText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
