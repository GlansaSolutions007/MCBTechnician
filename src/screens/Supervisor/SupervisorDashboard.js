import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomText from "../../components/CustomText";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function SupervisorDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [supervisorPhone, setSupervisorPhone] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      loadSupervisorInfo();
    }, [])
  );

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

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadSupervisorInfo();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[globalStyles.container]}>
        {/* Header Section */}
        <View
          style={[
            globalStyles.bgprimary,
            globalStyles.p4,
            globalStyles.borderRadiuslarge,
            globalStyles.mt3,
          ]}
        >
          <View
            style={[
              globalStyles.flexrow,
              globalStyles.justifysb,
              globalStyles.alineItemscenter,
            ]}
          >
            <View>
              <CustomText
                style={[globalStyles.f20Bold, globalStyles.textWhite]}
              >
                Supervisor Dashboard
              </CustomText>
              <CustomText
                style={[globalStyles.f12Regular, globalStyles.textWhite, { marginTop: 4, opacity: 0.9 }]}
              >
                Welcome, Supervisor
              </CustomText>
              {supervisorPhone ? (
                <CustomText
                  style={[globalStyles.f10Regular, globalStyles.textWhite, { marginTop: 2, opacity: 0.8 }]}
                >
                  Phone: {supervisorPhone}
                </CustomText>
              ) : null}
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.mt4,
          ]}
        >
          <View style={[styles.statCard, { backgroundColor: color.primary }]}>
            <MaterialCommunityIcons
              name="account-group"
              size={32}
              color={color.white}
            />
            <CustomText
              style={[globalStyles.f24Bold, globalStyles.textWhite, globalStyles.mt2]}
            >
              0
            </CustomText>
            <CustomText
              style={[globalStyles.f12Regular, globalStyles.textWhite, { opacity: 0.9 }]}
            >
              Total Users
            </CustomText>
          </View>

          <View style={[styles.statCard, { backgroundColor: color.alertSuccess }]}>
            <MaterialCommunityIcons
              name="briefcase-check"
              size={32}
              color={color.white}
            />
            <CustomText
              style={[globalStyles.f24Bold, globalStyles.textWhite, globalStyles.mt2]}
            >
              0
            </CustomText>
            <CustomText
              style={[globalStyles.f12Regular, globalStyles.textWhite, { opacity: 0.9 }]}
            >
              Active Services
            </CustomText>
          </View>
        </View>

        <View
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.mt3,
          ]}
        >
          <View style={[styles.statCard, { backgroundColor: color.backgroundLight }]}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={32}
              color={color.white}
            />
            <CustomText
              style={[globalStyles.f24Bold, globalStyles.textWhite, globalStyles.mt2]}
            >
              0
            </CustomText>
            <CustomText
              style={[globalStyles.f12Regular, globalStyles.textWhite, { opacity: 0.9 }]}
            >
              Pending
            </CustomText>
          </View>

          <View style={[styles.statCard, { backgroundColor: color.alertError }]}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={32}
              color={color.white}
            />
            <CustomText
              style={[globalStyles.f24Bold, globalStyles.textWhite, globalStyles.mt2]}
            >
              0
            </CustomText>
            <CustomText
              style={[globalStyles.f12Regular, globalStyles.textWhite, { opacity: 0.9 }]}
            >
              Issues
            </CustomText>
          </View>
        </View>

        {/* Quick Actions */}
        <View
          style={[
            globalStyles.bgwhite,
            globalStyles.radius,
            globalStyles.card,
            globalStyles.p3,
            globalStyles.mt4,
          ]}
        >
          <CustomText style={[globalStyles.f18Bold, globalStyles.black]}>
            Quick Actions
          </CustomText>

          <TouchableOpacity
            style={[
              globalStyles.flexrow,
              globalStyles.alineItemscenter,
              globalStyles.mt3,
              globalStyles.p3,
              {
                backgroundColor: color.neutral[50],
                borderRadius: 10,
              },
            ]}
          >
            <Ionicons name="people-outline" size={24} color={color.primary} />
            <CustomText
              style={[globalStyles.f14Bold, globalStyles.black, globalStyles.ml3]}
            >
              Manage Users
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
              globalStyles.mt2,
              globalStyles.p3,
              {
                backgroundColor: color.neutral[50],
                borderRadius: 10,
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
              globalStyles.mt2,
              globalStyles.p3,
              {
                backgroundColor: color.neutral[50],
                borderRadius: 10,
              },
            ]}
          >
            <Ionicons name="document-text-outline" size={24} color={color.primary} />
            <CustomText
              style={[globalStyles.f14Bold, globalStyles.black, globalStyles.ml3]}
            >
              Reports
            </CustomText>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={color.neutral[400]}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View
          style={[
            globalStyles.bgwhite,
            globalStyles.radius,
            globalStyles.card,
            globalStyles.p3,
            globalStyles.mt3,
          ]}
        >
          <CustomText style={[globalStyles.f18Bold, globalStyles.black]}>
            Supervisor Information
          </CustomText>
          <CustomText
            style={[
              globalStyles.f12Regular,
              globalStyles.neutral500,
              globalStyles.mt2,
            ]}
          >
            This is a special supervisor dashboard for managing the technician application.
            Use the quick actions above to access different management features.
          </CustomText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statCard: {
    width: "48%",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
});

