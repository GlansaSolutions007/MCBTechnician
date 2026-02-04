import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { Ionicons } from "@expo/vector-icons";

const DISCLOSURE_KEY = "permissions_disclosure_accepted";

export { DISCLOSURE_KEY };

export default function PermissionsDisclosureScreen({ onAccept, onDecline }) {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={color.white} barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={56} color={color.primary} />
        </View>
        <CustomText style={[globalStyles.f20Bold, globalStyles.black, styles.title]}>
          Data & Permissions Disclosure
        </CustomText>
        <CustomText style={[globalStyles.f14Regular, styles.subtitle]}>
          My Car Buddy Technician uses the following data only for the purposes described below. By continuing, you consent to these uses.
        </CustomText>

        <View style={styles.section}>
          <View style={styles.bulletRow}>
            <Ionicons name="location" size={22} color={color.primary} style={styles.bulletIcon} />
            <View style={styles.bulletText}>
              <CustomText style={[globalStyles.f14Bold, globalStyles.black]}>
                Location
              </CustomText>
              <CustomText style={[globalStyles.f12Regular, styles.bodyText]}>
                We use your device location to show your live position to the customer during the service visit, to navigate you to the job site, and to record that you reached the customer. This is core to the technician service experience.
              </CustomText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.bulletRow}>
            <Ionicons name="camera" size={22} color={color.primary} style={styles.bulletIcon} />
            <View style={styles.bulletText}>
              <CustomText style={[globalStyles.f14Bold, globalStyles.black]}>
                Camera & Photos
              </CustomText>
              <CustomText style={[globalStyles.f12Regular, styles.bodyText]}>
                We use the camera and photo library only to capture and upload images of the vehicle and service work for your job records. No other use is made of your photos or camera.
              </CustomText>
            </View>
          </View>
        </View>

        <CustomText style={[globalStyles.f12Regular, styles.footer]}>
          You can change or revoke these permissions in your device settings at any time.
        </CustomText>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={onAccept}
          activeOpacity={0.85}
        >
          <CustomText style={[globalStyles.f16Bold, globalStyles.textWhite]}>
            I Understand and Accept
          </CustomText>
        </TouchableOpacity>

        {typeof onDecline === "function" && (
          <TouchableOpacity
            style={styles.declineButton}
            onPress={onDecline}
            activeOpacity={0.85}
          >
            <CustomText style={[globalStyles.f14Bold, globalStyles.neutral500]}>
              Decline
            </CustomText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  iconWrap: {
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: color.neutral[500],
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  section: {
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: color.backgroundLight || "#F5F5F5",
    borderRadius: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
  },
  bodyText: {
    color: color.neutral[500],
    marginTop: 4,
    lineHeight: 20,
  },
  footer: {
    color: color.neutral[500],
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 18,
  },
  acceptButton: {
    backgroundColor: color.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
});
