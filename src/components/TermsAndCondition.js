import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import CustomText from "./CustomText";
import globalStyles from "../styles/globalStyles";
import {
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
  Entypo,
  Ionicons,
  Feather,
} from "@expo/vector-icons";

function TermsAndConditions() {
  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30, paddingTop: 20 }}
    >
      <View style={[globalStyles.container]}>
        <CustomText style={[globalStyles.f14Bold, globalStyles.mb3]}>
          Effective Date:
        </CustomText>
        <CustomText style={[globalStyles.f12Regular, globalStyles.mb3]}>
          Welcome to My Car Buddy. These Terms and Conditions govern your use of
          the Technician App and outline your responsibilities as a registered
          service provider on our platform.
        </CustomText>

        {/* Technician Responsibilities */}
        <View style={styles.section}>
          <View style={styles.row}>
            <FontAwesome5 name="user-cog" size={16} color="#333" />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Technician Responsibilities:
            </CustomText>
          </View>
          {[
            "You agree to provide services professionally, timely, and as described in the assigned job.",
            "You must maintain cleanliness, discipline, and a respectful attitude at all customer locations.",
            "You shall not directly accept offline jobs from customers contacted through the platform.",
            "Uniform and ID badge (if provided) must be worn during service visits.",
          ].map((item, i) => (
            <CustomText
              key={i}
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • {item}
            </CustomText>
          ))}
        </View>

        {/* Attendance & Booking */}
        <View style={styles.section}>
          <View style={styles.row}>
            <MaterialIcons name="event-note" size={16} color="#007aff" />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Attendance & Booking:
            </CustomText>
          </View>
          {[
            "You are expected to accept/reject service assignments within the response window.",
            "Job cancellations must be made at least 2 hours in advance unless in emergency.",
          ].map((item, i) => (
            <CustomText
              key={i}
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • {item}
            </CustomText>
          ))}
        </View>

        {/* Equipment & Conduct */}
        <View style={styles.section}>
          <View style={styles.row}>
            <MaterialCommunityIcons
              name="toolbox-outline"
              size={16}
              color="#e67e22"
            />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Equipment & Conduct:
            </CustomText>
          </View>
          {[
            "Tools provided to you remain the property of My Car Buddy unless otherwise specified.",
            "Any damage to customer property due to technician negligence will be investigated and may lead to penalty or deactivation.",
          ].map((item, i) => (
            <CustomText
              key={i}
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • {item}
            </CustomText>
          ))}
        </View>

        {/* Payment & Payout */}
        <View style={styles.section}>
          <View style={styles.row}>
            <FontAwesome5 name="wallet" size={16} color="#2ecc71" />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Payment & Payout:
            </CustomText>
          </View>
          {[
            "Earnings will be reflected after job completion and post-approval.",
            "Weekly/monthly payouts will be made to your registered bank account.",
            "Platform commission or service charges will be transparently deducted.",
          ].map((item, i) => (
            <CustomText
              key={i}
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • {item}
            </CustomText>
          ))}
        </View>

        {/* Termination */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Entypo name="circle-with-cross" size={16} color="#ff3b30" />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Termination:
            </CustomText>
          </View>
          {[
            "Repeated customer complaints, fraud, or violation of app policies may lead to temporary or permanent suspension.",
            "You may exit the platform by providing a 7-day prior written notice.",
          ].map((item, i) => (
            <CustomText
              key={i}
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • {item}
            </CustomText>
          ))}
        </View>

        {/* App Usage */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Ionicons name="phone-portrait-outline" size={16} color="#8e44ad" />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              App Usage:
            </CustomText>
          </View>
          {[
            "Do not misuse the app for unauthorized access or data scraping.",
            "All app content, job data, and customer details are confidential.",
          ].map((item, i) => (
            <CustomText
              key={i}
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • {item}
            </CustomText>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default TermsAndConditions;
