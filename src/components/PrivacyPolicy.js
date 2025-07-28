import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import CustomText from "./CustomText";
import globalStyles from "../styles/globalStyles";
import { FontAwesome6, Feather, Ionicons } from "@expo/vector-icons";
import { color } from "../styles/theme";

function PrivacyPolicy() {
  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30, paddingTop: 20 }}
    >
      <View style={[globalStyles.container]}>
        <CustomText style={[globalStyles.f14Bold, globalStyles.mb3]}>
          At My Car Buddy, we value your privacy and are committed to protecting
          your personal and professional information.
        </CustomText>

        <View style={styles.section}>
          <View style={styles.row}>
            <Ionicons name="lock-closed-outline" size={16} color={color.black} />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              What We Collect:
            </CustomText>
          </View>
          <View style={styles.list}>
            {[
              "Personal data (name, phone number, address, profile image)",
              "Location data during service hours (for navigation and job tracking)",
              "Job performance and rating data",
              "Device identifiers and app activity logs",
            ].map((item, index) => (
              <CustomText
                key={index}
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

        <View style={styles.section}>
          <View style={styles.row}>
            <Feather name="target" size={16} color="#ff5e7d" />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Why We Collect:
            </CustomText>
          </View>
          <View style={styles.list}>
            {[
              "To assign jobs based on proximity and availability",
              "For attendance, earnings, and support",
              "To improve service quality and technician experience",
            ].map((item, index) => (
              <CustomText
                key={index}
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

        <View style={styles.section}>
          <View style={styles.row}>
            <FontAwesome6 name="handshake" size={16} color="#e6b400" />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Data Sharing:
            </CustomText>
          </View>
          <View style={styles.list}>
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • Your name, profile picture, and phone number are shared with the
              customer only for the assigned booking.
            </CustomText>
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • We do not sell your personal data to third parties.
            </CustomText>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#ffc107"
            />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Your Rights:
            </CustomText>
          </View>
          <View style={styles.list}>
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • You can request correction, export, or deletion of your personal
              data by contacting support.
            </CustomText>
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • You can logout or delete your account at any time.
            </CustomText>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Feather name="database" size={16} color="#ff4d4d" />
            <CustomText style={[globalStyles.f14Bold, globalStyles.ml2]}>
              Data Storage:
            </CustomText>
          </View>
          <View style={styles.list}>
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • Data is securely stored and encrypted.
            </CustomText>
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.mt1,
                globalStyles.textGray,
              ]}
            >
              • Only authorized personnel have access.
            </CustomText>
          </View>
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
  list: {
    marginTop: 8,
    paddingLeft: 6,
  },
});

export default PrivacyPolicy;
