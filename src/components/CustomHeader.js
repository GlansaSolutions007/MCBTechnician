import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "./CustomText";
import globalStyles from "../styles/globalStyles";
import { useNavigation } from "@react-navigation/native";
import { color } from "../styles/theme";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import NotificationBadge from "./NotificationBadge";

export default function CustomHeader() {
  const [name, setName] = useState("");
  const navigation = useNavigation();
  const Notifications = () => {
    navigation.navigate("Notifications");
  };
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchTechnicianDetails = async () => {
      try {
        const techId = await AsyncStorage.getItem("techID");
        const token = await AsyncStorage.getItem("token");

        if (!techId) {
          console.warn("No technicianId found");
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}TechniciansDetails/technicianid?technicianid=${techId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // ✅ Set technician name OR fallback to Buddy
        const fetchedName = res.data.data?.[0]?.TechnicianName;
        setName(fetchedName && fetchedName.trim() !== "" ? fetchedName : "Buddy");
      } catch (err) {
        console.error("Fetch error", err);
        setName("Buddy"); // fallback on error too
      }
    };

    fetchTechnicianDetails();
  }, []);

  return (
    <View style={styles.headerWrapper}>
      <View
        style={[
          styles.headerContainer,
          { paddingTop: insets.top + 30 },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingSection}>
            <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite, globalStyles.mb1]}>
              Hello, {name || "Buddy"}
            </CustomText>
            <CustomText style={[globalStyles.f14Regular, globalStyles.textWhite, { opacity: 0.9 }]}>
              Welcome back! Here's your dashboard
            </CustomText>
          </View>

          <View style={styles.notificationSection}>
            <NotificationBadge 
              onPress={Notifications} 
              size={24} 
              color={color.white}
              style={styles.notificationButton}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: color.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  headerContainer: {
    backgroundColor: color.primary,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
  },
  greetingSection: {
    flex: 1,
    paddingRight: 16,
  },
  notificationSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
