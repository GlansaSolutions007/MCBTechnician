import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomText from "../../components/CustomText";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "@env";
import axios from "axios";

export default function SupervisorDashboard() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [supervisorPhone, setSupervisorPhone] = useState("");
  const [usersCount, setUsersCount] = useState(0);
  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [issuesCount, setIssuesCount] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const fetchDashboardCounts = useCallback(async () => {
    try {
      setDashboardLoading(true);
      const supervisorId = await AsyncStorage.getItem("supervisorId");
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");
      const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

      const config = {};
      if (supervisorToken) {
        config.headers = { Authorization: `Bearer ${supervisorToken}` };
      }

      // 1. Total Users (technicians) – TechniciansDetails
      let technicians = [];
      try {
        const techRes = await axios.get(`${baseUrl}TechniciansDetails`, config);
        const techData = techRes?.data;
        if (techData?.jsonResult && Array.isArray(techData.jsonResult)) {
          technicians = techData.jsonResult;
        } else if (Array.isArray(techData)) {
          technicians = techData;
        }
      } catch (e) {
        console.error("Error fetching technicians:", e);
      }
      setUsersCount(technicians.length);

      // 2. Bookings – Supervisor/AssingedBookings (active, pending, issues)
      if (!supervisorId) {
        setActiveServicesCount(0);
        setPendingCount(0);
        setIssuesCount(0);
        return;
      }

      let bookingsData = [];
      try {
        const bookingsRes = await axios.get(
          `${baseUrl}Supervisor/AssingedBookings?SupervisorID=${supervisorId}`,
          config
        );
        const res = bookingsRes?.data;
        if (Array.isArray(res)) {
          bookingsData = res;
        } else if (res?.data && Array.isArray(res.data)) {
          bookingsData = res.data;
        } else if (res?.jsonResult && Array.isArray(res.jsonResult)) {
          bookingsData = res.jsonResult;
        } else if (res?.result && Array.isArray(res.result)) {
          bookingsData = res.result;
        } else if (res && typeof res === "object" && (res.BookingID != null || res.BookingTrackID != null)) {
          bookingsData = [res];
        }
      } catch (e) {
        console.error("Error fetching supervisor bookings:", e);
      }

      const validBookings = (Array.isArray(bookingsData) ? bookingsData : []).filter(
        (b) => b && b.BookingID != null
      );

      const statusLower = (s) => (s ? String(s).toLowerCase().trim() : "");

      const active = validBookings.filter((b) => {
        const s = statusLower(b.BookingStatus);
        return s === "confirmed" || s === "assigned" || s === "in progress" || s === "inprogress";
      });
      const pending = validBookings.filter((b) => statusLower(b.BookingStatus) === "pending");
      const issues = validBookings.filter((b) => {
        const s = statusLower(b.BookingStatus);
        return s === "cancelled" || s === "failed" || s === "rejected" || s === "issue";
      });

      setActiveServicesCount(active.length);
      setPendingCount(pending.length);
      setIssuesCount(issues.length);
    } catch (error) {
      console.error("Error fetching dashboard counts:", error);
      setUsersCount(0);
      setActiveServicesCount(0);
      setPendingCount(0);
      setIssuesCount(0);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadSupervisorInfo = useCallback(async () => {
    try {
      const phone = await AsyncStorage.getItem("supervisorPhone");
      if (phone) setSupervisorPhone(phone);
    } catch (error) {
      console.error("Error loading supervisor info:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSupervisorInfo();
      fetchDashboardCounts();
    }, [loadSupervisorInfo, fetchDashboardCounts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSupervisorInfo();
    await fetchDashboardCounts();
    setRefreshing(false);
  }, [loadSupervisorInfo, fetchDashboardCounts]);

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
        {dashboardLoading ? (
          <View style={[globalStyles.mt4, { alignItems: "center", paddingVertical: 24 }]}>
            <ActivityIndicator size="large" color={color.primary} />
            <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500, globalStyles.mt2]}>
              Loading counts...
            </CustomText>
          </View>
        ) : (
          <>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifysb,
                globalStyles.mt4,
              ]}
            >
              <TouchableOpacity
                style={[styles.statCard, { backgroundColor: color.primary }]}
                onPress={() => navigation.navigate("Bookings", { filter: "users" })}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="account-group"
                  size={32}
                  color={color.white}
                />
                <CustomText
                  style={[globalStyles.f24Bold, globalStyles.textWhite, globalStyles.mt2]}
                >
                  {usersCount}
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Regular, globalStyles.textWhite, { opacity: 0.9 }]}
                >
                  Total Users
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statCard, { backgroundColor: color.alertSuccess }]}
                onPress={() => navigation.navigate("Bookings", { filter: "active" })}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="briefcase-check"
                  size={32}
                  color={color.white}
                />
                <CustomText
                  style={[globalStyles.f24Bold, globalStyles.textWhite, globalStyles.mt2]}
                >
                  {activeServicesCount}
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Regular, globalStyles.textWhite, { opacity: 0.9 }]}
                >
                  Active Services
                </CustomText>
              </TouchableOpacity>
            </View>

            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifysb,
                globalStyles.mt3,
              ]}
            >
              <TouchableOpacity
                style={[styles.statCard, { backgroundColor: color.yellow || color.pending || "#E6B800" }]}
                onPress={() => navigation.navigate("Bookings", { filter: "pending" })}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={32}
                  color={color.white}
                />
                <CustomText
                  style={[globalStyles.f24Bold, globalStyles.textWhite, globalStyles.mt2]}
                >
                  {pendingCount}
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Regular, globalStyles.textWhite, { opacity: 0.9 }]}
                >
                  Pending
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statCard, { backgroundColor: color.alertError }]}
                onPress={() => navigation.navigate("Bookings", { filter: "issues" })}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={32}
                  color={color.white}
                />
                <CustomText
                  style={[globalStyles.f24Bold, globalStyles.textWhite, globalStyles.mt2]}
                >
                  {issuesCount}
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Regular, globalStyles.textWhite, { opacity: 0.9 }]}
                >
                  Issues
                </CustomText>
              </TouchableOpacity>
            </View>
          </>
        )}

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
          <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
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
          <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
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

