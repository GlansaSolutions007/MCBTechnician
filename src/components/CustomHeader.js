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

export default function CustomHeader({ screenName }) {
  const [name, setName] = useState("");
  const [nameFallback, setNameFallback] = useState("Buddy"); // "Buddy" | "Supervisor" for initial/fallback
  const navigation = useNavigation();
  const Notifications = () => {
    navigation.navigate("Notifications");
  };
  const insets = useSafeAreaInsets();

  useEffect(() => {
    AsyncStorage.getItem("isSupervisor").then((v) => {
      setNameFallback(v === "true" ? "Supervisor" : "Buddy");
    });
  }, []);

  useEffect(() => {
    const fetchName = async () => {
      try {
        const isSupervisor = await AsyncStorage.getItem("isSupervisor");

        if (isSupervisor === "true") {
          // Supervisor: fetch from Employee/Id
          const supervisorId = await AsyncStorage.getItem("supervisorId");
          const supervisorToken = await AsyncStorage.getItem("supervisorToken");

          if (!supervisorId) {
            setName("Supervisor");
            return;
          }

          const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
          const res = await axios.get(
            `${baseUrl}Employee/Id?Id=${supervisorId}`,
            {
              headers: supervisorToken
                ? { Authorization: `Bearer ${supervisorToken}` }
                : {},
            }
          );

          const data = res?.data;
          let profile = null;
          if (Array.isArray(data) && data.length > 0) {
            profile = data[0];
          } else if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
            profile = data.data[0];
          } else if (data && typeof data === "object" && (data.Id != null || data.Name != null)) {
            profile = data;
          }

          const fetchedName = profile?.Name?.trim();
          setName(fetchedName && fetchedName !== "" ? fetchedName : "Supervisor");
        } else {
          // Technician: fetch from TechniciansDetails
          const techId = await AsyncStorage.getItem("techID");
          const token = await AsyncStorage.getItem("token");

          if (!techId) {
            setName("Buddy");
            return;
          }

          const res = await axios.get(
            `${API_BASE_URL}TechniciansDetails/technicianid?technicianid=${techId}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );

          const fetchedName = res.data.data?.[0]?.TechnicianName?.trim();
          setName(fetchedName && fetchedName !== "" ? fetchedName : "Buddy");
        }
      } catch (err) {
        console.error("CustomHeader fetch error", err);
        const isSupervisor = await AsyncStorage.getItem("isSupervisor").catch(() => null);
        setName(isSupervisor === "true" ? "Supervisor" : "Buddy");
      }
    };

    fetchName();
  }, []);

  return (
    <View style={styles.headerWrapper}>
      <View
        style={[
          styles.headerContainer,
          { paddingTop: insets.top + 10 },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingSection}>
            <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite]}>
              Hello, {name || nameFallback}
            </CustomText>
            <CustomText style={[globalStyles.f12Regular, globalStyles.textWhite, { opacity: 0.9 }]}>
            Welcome back! Here's your {screenName || "Dashboard"}
            </CustomText>
          </View>

          {/* <View style={styles.notificationSection}>
            <NotificationBadge 
              onPress={Notifications} 
              size={24} 
              color={color.white}
              style={styles.notificationButton}
            />
          </View> */}
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
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
