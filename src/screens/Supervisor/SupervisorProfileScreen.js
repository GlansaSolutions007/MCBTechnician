import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import axios from "axios";
import { StatusBar } from "expo-status-bar";

export default function SupervisorProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchProfile = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const supervisorId = await AsyncStorage.getItem("supervisorId");
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");
      if (!supervisorId) {
        setError("Session missing. Please log in again.");
        setProfile(null);
        return;
      }
      const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
      const url = `${baseUrl}Employee/Id?Id=${supervisorId}`;
      const config = {};
      if (supervisorToken) {
        config.headers = { Authorization: `Bearer ${supervisorToken}` };
      }
      const response = await axios.get(url, config);
      const data = response?.data;
      let profileData = null;
      if (Array.isArray(data) && data.length > 0) {
        profileData = data[0];
      } else if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        profileData = data.data[0];
      } else if (data && typeof data === "object" && (data.Id != null || data.Name != null)) {
        profileData = data;
      }
      setProfile(profileData);
    } catch (err) {
      console.error("Error fetching supervisor profile:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load profile.");
      setProfile(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const InfoItem = ({ icon, label, value }) => (
    <View style={styles.infoItem}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={color.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500]}>{label}</CustomText>
        <CustomText style={[globalStyles.f12Regular, globalStyles.black]} numberOfLines={2}>{value || "—"}</CustomText>
      </View>
    </View>
  );

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await AsyncStorage.multiRemove([
        "isSupervisor",
        "supervisorPhone",
        "supervisorEmail",
        "supervisorId",
        "supervisorToken",
        "supervisorHeadId",
      ]);
      navigation.reset({
        index: 0,
        routes: [{ name: "SupervisorLogin" }],
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading && !profile) {
    return (
      <View style={[globalStyles.container, globalStyles.justifycenter, globalStyles.alineItemscenter, { flex: 1 }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={color.primary} />
        <CustomText style={[globalStyles.f14Regular, globalStyles.neutral500, { marginTop: 12 }]}>
          Loading profile...
        </CustomText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {/* Top header: primary from top, curved bottom (same as CustomHeader) */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top + 24, paddingBottom: 28 }]}>
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            {profile?.ProfileImage ? (
              <Image source={{ uri: profile.ProfileImage }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={48} color={color.primary} />
            )}
          </View>
          <CustomText style={styles.heroName}>{profile?.Name?.trim() || "Supervisor"}</CustomText>
          {profile?.RoleName ? (
            <View style={styles.roleBadge}>
              <CustomText style={styles.roleBadgeText}>{profile.RoleName}</CustomText>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} colors={[color.primary]} />
        }
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={20} color={color.alertError} />
            <CustomText style={styles.errorText}>{error}</CustomText>
          </View>
        ) : null}

      {/* Profile Details Card */}
      {profile && (
        <View style={styles.card}>
          <CustomText style={styles.cardTitle}>Profile Information</CustomText>
          <View style={styles.infoGrid}>
            <InfoItem icon="person-outline" label="Name" value={profile.Name} />
            <InfoItem icon="mail-outline" label="Email" value={profile.Email} />
            <InfoItem icon="call-outline" label="Phone" value={profile.PhoneNumber} />
            <InfoItem icon="briefcase-outline" label="Role" value={profile.RoleName} />
            <InfoItem icon="business-outline" label="Department" value={profile.DepartmentName} />
            {profile.Address ? <InfoItem icon="location-outline" label="Address" value={profile.Address} /> : null}
            {profile.Reporting_To_Role ? (
              <InfoItem icon="people-outline" label="Reporting To" value={profile.Reporting_To_Role} />
            ) : null}
          </View>
        </View>
      )}

      {/* Menu */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuIconWrap}>
            <Ionicons name="settings-outline" size={22} color={color.primary} />
          </View>
          <CustomText style={styles.menuLabel}>Settings</CustomText>
          <Ionicons name="chevron-forward" size={20} color={color.neutral[400]} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} activeOpacity={0.7}>
          <View style={[styles.menuIconWrap, styles.menuIconWrapHelp]}>
            <Ionicons name="help-circle-outline" size={22} color={color.primary} />
          </View>
          <CustomText style={styles.menuLabel}>Help & Support</CustomText>
          <Ionicons name="chevron-forward" size={20} color={color.neutral[400]} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => setShowLogoutModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={22} color={color.alertError} />
        <CustomText style={styles.logoutText}>Logout</CustomText>
      </TouchableOpacity>

        <CustomText style={styles.version}>Supervisor Portal v1.0</CustomText>
      </ScrollView>

      {/* Logout confirmation modal */}
      <Modal
        animationType="fade"
        transparent
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <CustomText style={styles.modalTitle}>
              Are you sure you want to log out?
            </CustomText>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <CustomText style={[globalStyles.f14Bold, globalStyles.error]}>
                  Cancel
                </CustomText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirmLogoutButton]}
                onPress={handleLogout}
              >
                <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>
                  Log Out
                </CustomText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.neutral[50],
  },
  headerWrapper: {
    backgroundColor: color.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
    backgroundColor: color.neutral[50],
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.alertError + "18",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: color.alertError,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: color.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  heroName: {
    ...globalStyles.f20Bold,
    color: color.white,
    textAlign: "center",
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: {
    ...globalStyles.f12Bold,
    color: color.white,
  },
  card: {
    backgroundColor: color.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    ...globalStyles.f14Bold,
    color: color.black,
    marginBottom: 16,
  },
  infoGrid: {},
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.neutral[100],
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: color.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    marginTop: 2,
  },
  infoTextWrap: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: color.neutral[100],
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: color.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuIconWrapHelp: {
    backgroundColor: color.primary + "12",
  },
  menuLabel: {
    flex: 1,
    ...globalStyles.f14Bold,
    color: color.black,
    marginBottom: 4,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.white,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 10,
    borderWidth: 1.5,
    borderColor: color.alertError + "40",
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    ...globalStyles.f14Bold,
    color: color.alertError,
  },
  version: {
    ...globalStyles.f12Regular,
    color: color.neutral[400],
    textAlign: "center",
  },
  // Logout modal
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: color.white,
    padding: 24,
    borderRadius: 16,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
   ...globalStyles.f14Bold,
    color: color.black,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: color.neutral[100],
  },
  modalConfirmLogoutButton: {
    backgroundColor: color.alertError,
  },
});
