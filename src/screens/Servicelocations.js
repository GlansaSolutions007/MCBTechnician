import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import globalStyles from "../styles/globalStyles";
import CustomText from "../components/CustomText";

export default function Servicelocations() {
  const [showAlert, setShowAlert] = useState(false);
  return (
    <ScrollView>
      <View style={[globalStyles.container]}>
        {/* <CustomText style={globalStyles.titleBlack}>Services</CustomText>
        <CustomText style={globalStyles.text}>List of services will be displayed here</CustomText> */}

    
  <View  style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>tinyRegular-10:</CustomText>
        <CustomText style={globalStyles.f10Regular}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>smallRegular-12:</CustomText>
        <CustomText style={globalStyles.f12Regular}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>regularRegular-16:</CustomText>
        <CustomText style={globalStyles.f16Regular}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>mediumRegular-18:</CustomText>
        <CustomText style={globalStyles.f18Regular}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>largeRegular-20:</CustomText>
        <CustomText style={globalStyles.f20Regular}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xLargeRegular-24:</CustomText>
        <CustomText style={globalStyles.f24Regular}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xxLargeRegular-28:</CustomText>
        <CustomText style={globalStyles.f28Regular}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>titleRegular-32:</CustomText>
        <CustomText style={globalStyles.f32Regular}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>headingRegular-36:</CustomText>
        <CustomText style={globalStyles.f36Regular}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>displayRegular-40:</CustomText>
        <CustomText style={globalStyles.f40Regular}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>heroRegular-44:</CustomText>
        <CustomText style={globalStyles.f44Regular}>Hyderabad</CustomText>
      </View>

        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>tinyExtraBold-10:</CustomText>
        <CustomText style={globalStyles.f10ExtraBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>smallExtraBold-12:</CustomText>
        <CustomText style={globalStyles.f12ExtraBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>ExtraBoldExtraBold-16:</CustomText>
        <CustomText style={globalStyles.f16ExtraBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>mediumExtraBold-18:</CustomText>
        <CustomText style={globalStyles.f18ExtraBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>largeExtraBold-20:</CustomText>
        <CustomText style={globalStyles.f20ExtraBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xLargeExtraBold-24:</CustomText>
        <CustomText style={globalStyles.f24ExtraBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xxLargeExtraBold-28:</CustomText>
        <CustomText style={globalStyles.f28ExtraBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>titleExtraBold-32:</CustomText>
        <CustomText style={globalStyles.f32ExtraBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>headingExtraBold-36:</CustomText>
        <CustomText style={globalStyles.f36ExtraBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>displayExtraBold-40:</CustomText>
        <CustomText style={globalStyles.f40ExtraBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>heroExtraBold-44:</CustomText>
        <CustomText style={globalStyles.f44ExtraBold}>Hyderabad</CustomText>
      </View>

  <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>tinySemiBold-10:</CustomText>
        <CustomText style={globalStyles.f10SemiBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>smallSemiBold-12:</CustomText>
        <CustomText style={globalStyles.f12SemiBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>SemiBoldSemiBold-16:</CustomText>
        <CustomText style={globalStyles.f16SemiBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>mediumSemiBold-18:</CustomText>
        <CustomText style={globalStyles.f18SemiBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>largeSemiBold-20:</CustomText>
        <CustomText style={globalStyles.f20SemiBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xLargeSemiBold-24:</CustomText>
        <CustomText style={globalStyles.f24SemiBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xxLargeSemiBold-28:</CustomText>
        <CustomText style={globalStyles.f28SemiBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>titleSemiBold-32:</CustomText>
        <CustomText style={globalStyles.f32SemiBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>headingSemiBold-36:</CustomText>
        <CustomText style={globalStyles.f36SemiBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>displaySemiBold-40:</CustomText>
        <CustomText style={globalStyles.f40SemiBold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>heroSemiBold-44:</CustomText>
        <CustomText style={globalStyles.f44SemiBold}>Hyderabad</CustomText>
      </View>


  <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>tinyBold-10:</CustomText>
        <CustomText style={globalStyles.f10Bold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>smallBold-12:</CustomText>
        <CustomText style={globalStyles.f12Bold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>BoldBold-16:</CustomText>
        <CustomText style={globalStyles.f16Bold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>mediumBold-18:</CustomText>
        <CustomText style={globalStyles.f18Bold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>largeBold-20:</CustomText>
        <CustomText style={globalStyles.f20Bold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xLargeBold-24:</CustomText>
        <CustomText style={globalStyles.f24Bold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xxLargeBold-28:</CustomText>
        <CustomText style={globalStyles.f28Bold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>titleBold-32:</CustomText>
        <CustomText style={globalStyles.f32Bold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>headingBold-36:</CustomText>
        <CustomText style={globalStyles.f36Bold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>displayBold-40:</CustomText>
        <CustomText style={globalStyles.f40Bold}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>heroBold-44:</CustomText>
        <CustomText style={globalStyles.f44Bold}>Hyderabad</CustomText>
      </View>

        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>tinyMedium-10:</CustomText>
        <CustomText style={globalStyles.f10Medium}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>smallMedium-12:</CustomText>
        <CustomText style={globalStyles.f12Medium}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>MediumMedium-16:</CustomText>
        <CustomText style={globalStyles.f16Medium}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>mediumMedium-18:</CustomText>
        <CustomText style={globalStyles.f18Medium}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>largeMedium-20:</CustomText>
        <CustomText style={globalStyles.f20Medium}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xLargeMedium-24:</CustomText>
        <CustomText style={globalStyles.f24Medium}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xxLargeMedium-28:</CustomText>
        <CustomText style={globalStyles.f28Medium}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>titleMedium-32:</CustomText>
        <CustomText style={globalStyles.f32Medium}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>headingMedium-36:</CustomText>
        <CustomText style={globalStyles.f36Medium}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>displayMedium-40:</CustomText>
        <CustomText style={globalStyles.f40Medium}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>heroMedium-44:</CustomText>
        <CustomText style={globalStyles.f44Medium}>Hyderabad</CustomText>
      </View>


  <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>tinyLight-10:</CustomText>
        <CustomText style={globalStyles.f10Light}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>smallLight-12:</CustomText>
        <CustomText style={globalStyles.f12Light}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>LightLight-16:</CustomText>
        <CustomText style={globalStyles.f16Light}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>LightLight-18:</CustomText>
        <CustomText style={globalStyles.f18Light}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>largeLight-20:</CustomText>
        <CustomText style={globalStyles.f20Light}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xLargeLight-24:</CustomText>
        <CustomText style={globalStyles.f24Light}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xxLargeLight-28:</CustomText>
        <CustomText style={globalStyles.f28Light}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>titleLight-32:</CustomText>
        <CustomText style={globalStyles.f32Light}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>headingLight-36:</CustomText>
        <CustomText style={globalStyles.f36Light}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>displayLight-40:</CustomText>
        <CustomText style={globalStyles.f40Light}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>heroLight-44:</CustomText>
        <CustomText style={globalStyles.f44Light}>Hyderabad</CustomText>
      </View>


      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>tinyExtraLight-10:</CustomText>
        <CustomText style={globalStyles.f10ExtraLight}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>smallExtraLight-12:</CustomText>
        <CustomText style={globalStyles.f12ExtraLight}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>ExtraLightExtraLight-16:</CustomText>
        <CustomText style={globalStyles.f16ExtraLight}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>ExtraLightExtraLight-18:</CustomText>
        <CustomText style={globalStyles.f18ExtraLight}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>largeExtraLight-20:</CustomText>
        <CustomText style={globalStyles.f20ExtraLight}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xLargeExtraLight-24:</CustomText>
        <CustomText style={globalStyles.f24ExtraLight}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>xxLargeExtraLight-28:</CustomText>
        <CustomText style={globalStyles.f28ExtraLight}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>titleExtraLight-32:</CustomText>
        <CustomText style={globalStyles.f32ExtraLight}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>headingExtraLight-36:</CustomText>
        <CustomText style={globalStyles.f36ExtraLight}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>displayExtraLight-40:</CustomText>
        <CustomText style={globalStyles.f40ExtraLight}>Hyderabad</CustomText>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.mr2, globalStyles.w40]}>heroExtraLight-44:</CustomText>
        <CustomText style={globalStyles.f44ExtraLight}>Hyderabad</CustomText>
      </View>
      </View>
        
    </ScrollView>
  );
}
