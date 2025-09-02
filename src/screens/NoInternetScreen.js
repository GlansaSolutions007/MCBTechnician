import React from "react";
import { View, Image } from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import NoInternetImage from "../../assets/icons/NetworkProvider.png";

export default function NoInternetScreen() {
  return (
    <View
      style={[
        globalStyles.flex1,
        globalStyles.justifycenter,
        globalStyles.alineItemscenter,
        globalStyles.bgwhite,
      ]}
    >
      <Image
        style={{ width: 220, height: 220, resizeMode: "contain" }}
        source={NoInternetImage}
      />
      <CustomText
        style={[globalStyles.f14Bold, globalStyles.primary, globalStyles.mt2]}
      >
        No Internet Connection
      </CustomText>
    </View>
  );
}
