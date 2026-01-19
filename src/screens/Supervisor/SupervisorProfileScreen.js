import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SupervisorProfileScreen() {
  const navigation = useNavigation();
  const [supervisorPhone, setSupervisorPhone] = useState("");

  React.useEffect(() => {
    loadSupervisorInfo();
  }, []);

  const loadSupervisorInfo = async () => {
    try {
      const phone = await AsyncStorage.getItem("supervisorPhone");
      if (phone) {
        setSupervisorPhone(phone);
      }
    } catch (error) {
      console.error("Error loading supervisor info:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("isSupervisor");
      await AsyncStorage.removeItem("supervisorPhone");
      navigation.reset({
        index: 0,
        routes: [{ name: "SupervisorLogin" }],
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={[globalStyles.container]}>
        {/* Profile Header */}
        <View
          style={[
            globalStyles.bgprimary,
            globalStyles.p4,
            globalStyles.borderRadiuslarge,
            globalStyles.mt3,
            { alignItems: "center" },
          ]}
        >
          <View
            style={[
              {
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: color.white,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 15,
              },
            ]}
          >
            <Ionicons name="person" size={50} color={color.primary} />
          </View>
          <CustomText
            style={[globalStyles.f20Bold, globalStyles.textWhite]}
          >
            Supervisor
          </CustomText>
          {supervisorPhone ? (
            <CustomText
              style={[
                globalStyles.f14Regular,
                globalStyles.textWhite,
                { marginTop: 5, opacity: 0.9 },
              ]}
            >
              {supervisorPhone}
            </CustomText>
          ) : null}
        </View>

        {/* Profile Options */}
        <View
          style={[
            globalStyles.bgwhite,
            globalStyles.radius,
            globalStyles.card,
            globalStyles.p3,
            globalStyles.mt4,
          ]}
        >
          <TouchableOpacity
            style={[
              globalStyles.flexrow,
              globalStyles.alineItemscenter,
              globalStyles.p3,
              {
                borderBottomWidth: 1,
                borderBottomColor: color.neutral[200],
              },
            ]}
          >
            <Ionicons name="person-outline" size={24} color={color.primary} />
            <CustomText
              style={[globalStyles.f14Bold, globalStyles.black, globalStyles.ml3]}
            >
              Profile Information
            </CustomText>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={color.neutral[400]}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              globalStyles.flexrow,
              globalStyles.alineItemscenter,
              globalStyles.p3,
              {
                borderBottomWidth: 1,
                borderBottomColor: color.neutral[200],
              },
            ]}
          >
            <Ionicons name="settings-outline" size={24} color={color.primary} />
            <CustomText
              style={[globalStyles.f14Bold, globalStyles.black, globalStyles.ml3]}
            >
              Settings
            </CustomText>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={color.neutral[400]}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              globalStyles.flexrow,
              globalStyles.alineItemscenter,
              globalStyles.p3,
              {
                borderBottomWidth: 1,
                borderBottomColor: color.neutral[200],
              },
            ]}
          >
            <Ionicons name="help-circle-outline" size={24} color={color.primary} />
            <CustomText
              style={[globalStyles.f14Bold, globalStyles.black, globalStyles.ml3]}
            >
              Help & Support
            </CustomText>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={color.neutral[400]}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              globalStyles.flexrow,
              globalStyles.alineItemscenter,
              globalStyles.p3,
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={color.alertError} />
            <CustomText
              style={[globalStyles.f14Bold, globalStyles.alertError, globalStyles.ml3]}
            >
              Logout
            </CustomText>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={color.neutral[400]}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View
          style={[
            globalStyles.bgwhite,
            globalStyles.radius,
            globalStyles.card,
            globalStyles.p3,
            globalStyles.mt3,
            { alignItems: "center" },
          ]}
        >
          <CustomText
            style={[
              globalStyles.f12Regular,
              globalStyles.neutral500,
            ]}
          >
            Supervisor Portal v1.0
          </CustomText>
        </View>
      </View>
    </ScrollView>
  );
}

