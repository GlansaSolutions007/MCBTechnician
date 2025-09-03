import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  TouchableOpacity,
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
          setLoading(false);
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
        setName(res.data.data?.[0]?.TechnicianName ?? null);
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianDetails();
  }, []);

  return (
    <View
      style={[
        styles.headerContainer,
        globalStyles.bgcontainer,
        { paddingTop: insets.top + 10 },
      ]}
    >
      <View style={styles.topRow}>
        <View>
          <CustomText style={[globalStyles.f14Bold, globalStyles.mt1]}>
            Hello, {name}
          </CustomText>
          {/* <Pressable>
            <CustomText style={[globalStyles.f10Regular, globalStyles.mt1]}>
              Hyderabad, Telangana <Ionicons name="chevron-down" size={14} />
            </CustomText>
          </Pressable> */}
        </View>

        <NotificationBadge onPress={Notifications} size={24} color={color.black} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    fontFamily: "Manrope-Medium",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 0,
    backgroundColor: "#fff",
    // borderBottomColor: "#eee",
    // borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
  },
});
