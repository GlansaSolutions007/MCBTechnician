import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  Pressable,
  Animated,
  StatusBar,
  Modal,
  TouchableOpacity,
} from "react-native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { API_BASE_URL } from "@env";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function SupervisorBookings() {
  const navigation = useNavigation();
  const route = useRoute();
  const filterFromDashboard = route.params?.filter; // "users" | "active" | "pending" | "issues"
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  const pulse = useRef(new Animated.Value(0)).current;

  // Assign modal state
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [bookingForAssign, setBookingForAssign] = useState(null);
  const [assignType, setAssignType] = useState("Technician"); // "Field Advisor" | "Technician"
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showTimeSlotPicker, setShowTimeSlotPicker] = useState(false);
  const [showTechnicianPicker, setShowTechnicianPicker] = useState(false);
  const [techniciansList, setTechniciansList] = useState([]);
  const [techniciansLoading, setTechniciansLoading] = useState(false);
  const [employeesList, setEmployeesList] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedFieldAdvisor, setSelectedFieldAdvisor] = useState(null);
  const [showFieldAdvisorPicker, setShowFieldAdvisorPicker] = useState(false);
  const [assigningInProgress, setAssigningInProgress] = useState(false);

  const [assignError, setAssignError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");
      const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
      const url = `${baseUrl}Employee`;
      const config = {};
      if (supervisorToken) {
        config.headers = { Authorization: `Bearer ${supervisorToken}` };
      }
      const response = await axios.get(url, config);
      const data = response?.data;
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data?.jsonResult && Array.isArray(data.jsonResult)) {
        list = data.jsonResult;
      } else if (data?.data && Array.isArray(data.data)) {
        list = data.data;
      }
      setEmployeesList(list);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployeesList([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fieldAdvisorsList = React.useMemo(() => {
    if (!Array.isArray(employeesList)) return [];
    return employeesList.filter(
      (e) => e.RoleName && String(e.RoleName).trim().toLowerCase() === "field advisor"
    );
  }, [employeesList]);

  const fetchTechnicians = async () => {
    try {
      setTechniciansLoading(true);
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");
      const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
      const url = `${baseUrl}TechniciansDetails`;
      const config = {};
      if (supervisorToken) {
        config.headers = { Authorization: `Bearer ${supervisorToken}` };
      }
      const response = await axios.get(url, config);
      const data = response?.data;
      let list = [];
      if (data?.jsonResult && Array.isArray(data.jsonResult)) {
        list = data.jsonResult;
      } else if (Array.isArray(data)) {
        list = data;
      }
      setTechniciansList(list);
    } catch (err) {
      console.error("Error fetching technicians:", err);
      setTechniciansList([]);
    } finally {
      setTechniciansLoading(false);
    }
  };

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => {
      try {
        loop.stop();
      } catch (_) {}
    };
  }, [pulse]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const supervisorId = await AsyncStorage.getItem("supervisorId");
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");

      if (!supervisorId) {
        setBookings([]);
        setError("Please log in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
      const url = `${baseUrl}Supervisor/AssingedBookings?SupervisorID=${supervisorId}`;
      const config = {};

      // Add authorization header if token exists
      if (supervisorToken) {
        config.headers = {
          Authorization: `Bearer ${supervisorToken}`,
        };
      }

      const response = await axios.get(url, config);
      const res = response?.data;
      let bookingsData = [];
      if (Array.isArray(res)) {
        bookingsData = res;
      } else if (res?.data && Array.isArray(res.data)) {
        bookingsData = res.data;
      } else if (res?.jsonResult && Array.isArray(res.jsonResult)) {
        bookingsData = res.jsonResult;
      } else if (res?.result && Array.isArray(res.result)) {
        bookingsData = res.result;
      } else if (res?.Result && Array.isArray(res.Result)) {
        bookingsData = res.Result;
      } else if (res?.Data && Array.isArray(res.Data)) {
        bookingsData = res.Data;
      } else if (res && typeof res === "object" && (res.BookingID != null || res.BookingTrackID != null)) {
        // Single booking object – has BookingID or BookingTrackID
        bookingsData = [res];
      }
      const validBookings = (Array.isArray(bookingsData) ? bookingsData : []).filter(
        (booking) => booking && booking.BookingID != null
      );
      setBookings(validBookings);
      setError(null);
    } catch (error) {
      if (__DEV__) {
        console.error("Error fetching supervisor bookings:", error?.response?.data ?? error.message);
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        "Failed to fetch bookings. Please try again.";
      setError(errorMessage);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleAssignTechnician = async () => {
    setAssignError(null);

    if (!bookingForAssign || bookingForAssign.BookingID == null) {
      setAssignError("No booking selected. Please try again.");
      return;
    }

    const isTechnician = assignType === "Technician";
    if (isTechnician) {
      if (selectedTechnician == null || selectedTechnician === "") {
        setAssignError("Please select a technician.");
        return;
      }
    } else {
      if (selectedFieldAdvisor == null || selectedFieldAdvisor === "") {
        setAssignError("Please select a field advisor.");
        return;
      }
    }

    try {
      setAssigningInProgress(true);
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");
      const supervisorId = await AsyncStorage.getItem("supervisorId");
      const supervisorHeadId = await AsyncStorage.getItem("supervisorHeadId");

      if (!supervisorToken) {
        setAssignError("Session expired. Please log in again.");
        setAssigningInProgress(false);
        return;
      }
      if (assignType !== "Technician") {
        const headId = supervisorHeadId != null ? Number(supervisorHeadId) : (supervisorId != null ? Number(supervisorId) : null);
        if (headId == null || isNaN(headId)) {
          setAssignError("Unable to assign: supervisor session missing. Please log in again.");
          setAssigningInProgress(false);
          return;
        }
      }
      const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
      const config = {
        headers: {
          "Content-Type": "application/json",
          ...(supervisorToken ? { Authorization: `Bearer ${supervisorToken}` } : {}),
        },
      };

      if (isTechnician) {
        // PUT api/Bookings/assign-technician
        // Payload: { bookingID, role: "Technician", techID, assignedTimeSlot }
        const bookingTs = bookingForAssign?.TimeSlot ?? bookingForAssign?.timeSlot ?? "";
        const assignedTimeSlot = typeof bookingTs === "string"
          ? (bookingTs.split(",").map((s) => s.trim()).find((s) => /^\d{1,2}:\d{2}:\d{2}\s*-\s*\d{1,2}:\d{2}:\d{2}$/.test(s)) || "")
          : "";
        const url = `${baseUrl}Bookings/assign-technician`;
        const payload = {
          bookingID: Number(bookingForAssign.BookingID),
          role: "Technician",
          techID: Number(selectedTechnician),
          assignedTimeSlot: assignedTimeSlot || "",
        };
        await axios.put(url, payload, config);
      } else {
        // POST api/Supervisor/AssignToFieldAdvisor
        // Payload: { bookingIds: [id], fieldAdvisorId, supervisorHeadId }
        const headId = supervisorHeadId != null ? Number(supervisorHeadId) : (supervisorId != null ? Number(supervisorId) : null);
        const url = `${baseUrl}Supervisor/AssignToFieldAdvisor`;
        const payload = {
          bookingIds: [Number(bookingForAssign.BookingID)],
          fieldAdvisorId: Number(selectedFieldAdvisor),
          supervisorHeadId: headId,
        };
        await axios.post(url, payload, config);
      }

      setAssignModalVisible(false);
      setBookingForAssign(null);
      setSelectedTechnician(null);
      setSelectedFieldAdvisor(null);
      fetchBookings();
    } catch (err) {
      console.error("Assign error:", err?.response?.data ?? err);
      setAssignError(
        err?.response?.data?.message ?? err?.response?.data?.error ?? err.message ?? "Failed to assign. Try again."
      );
    } finally {
      setAssigningInProgress(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return color.neutral[400];
    
    const statusLower = status.toLowerCase().trim();
    
    switch (statusLower) {
      case "completed":
        return color.alertSuccess;
      case "confirmed":
        return color.primary;
      case "pending":
        return color.yellow || color.pending || "#FFC107"; // Yellow color for pending
      default:
        return color.neutral[400];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const statusLower = (s) => (s ? String(s).toLowerCase().trim() : "");
  const filteredBookings = React.useMemo(() => {
    if (!filterFromDashboard || !Array.isArray(bookings)) return bookings;
    switch (filterFromDashboard) {
      case "active":
        return bookings.filter((b) => {
          const s = statusLower(b.BookingStatus);
          return s === "confirmed" || s === "assigned" || s === "in progress" || s === "inprogress";
        });
      case "pending":
        return bookings.filter((b) => statusLower(b.BookingStatus) === "pending");
      case "issues":
        return bookings.filter((b) => {
          const s = statusLower(b.BookingStatus);
          return s === "cancelled" || s === "failed" || s === "rejected" || s === "issue";
        });
      case "users":
      default:
        return bookings;
    }
  }, [bookings, filterFromDashboard]);

  // Unique customers derived from bookings (for "users" filter) – same card style as bookings
  const customersList = React.useMemo(() => {
    if (!Array.isArray(bookings) || bookings.length === 0) return [];
    const seen = new Map();
    bookings.forEach((b) => {
      const leadId = b.LeadId ?? b.LeadID ?? b.Leads?.Id ?? b.Leads?.ID;
      const name = (b.CustomerName ?? b.Leads?.FullName ?? b.FullName ?? "").trim() || "N/A";
      const phone = (b.PhoneNumber ?? b.Leads?.PhoneNumber ?? "").trim() || "";
      const key = leadId ?? `${name}|${phone}`;
      if (!seen.has(key)) {
        seen.set(key, {
          id: key,
          customerName: name,
          phoneNumber: phone,
          bookingCount: 1,
          firstBooking: b,
        });
      } else {
        const c = seen.get(key);
        seen.set(key, { ...c, bookingCount: c.bookingCount + 1 });
      }
    });
    return Array.from(seen.values());
  }, [bookings]);

  const SkeletonBookingCard = ({ index }) => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [
        color.neutral[200],
        color.neutral[100],
      ],
    });

    return (
      <View style={styles.skeletonCardContainer}>
        <Animated.View
          style={[
            styles.skeletonAccent,
            { backgroundColor: color.neutral[300] },
          ]}
        />
        <View style={styles.skeletonCardContent}>
          <View style={styles.skeletonLeftSection}>
            <Animated.View
              style={[
                styles.skeletonLine,
                { height: 18, width: "70%", backgroundColor: bg, marginBottom: 12 },
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonLine,
                { height: 14, width: "50%", backgroundColor: bg },
              ]}
            />
          </View>
          <Animated.View
            style={[
              styles.skeletonButton,
              { backgroundColor: bg },
            ]}
          />
        </View>
      </View>
    );
  };

  if (loading && bookings.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <StatusBar backgroundColor={color.primary} barStyle="light-content" />
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View>
              <CustomText
                style={[globalStyles.f24Bold, globalStyles.textWhite]}
              >
                Supervisor Bookings
              </CustomText>
              <CustomText
                style={[globalStyles.f14Regular, globalStyles.textWhite, { marginTop: 4, opacity: 0.9 }]}
              >
                Loading bookings...
              </CustomText>
            </View>
          </View>
        </View>

        <ScrollView
          style={[globalStyles.bgcontainer]}
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 20 }}
        >
          <View style={[globalStyles.container]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonBookingCard key={`skeleton-${i}`} index={i} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <StatusBar backgroundColor={color.primary} barStyle="light-content" />
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View>
            <CustomText
              style={[globalStyles.f24Bold, globalStyles.textWhite]}
            >
              {filterFromDashboard === "users" ? "Customers" : "Supervisor Bookings"}
            </CustomText>
            <CustomText
              style={[globalStyles.f12Regular, globalStyles.textWhite, { marginTop: 4, opacity: 0.9 }]}
            >
              {filterFromDashboard === "users"
                ? `${customersList.length} ${customersList.length === 1 ? "customer" : "customers"}`
                : `${filteredBookings.length} ${filteredBookings.length === 1 ? "booking" : "bookings"} assigned`}
            </CustomText>
          </View>
        </View>
      </View>

      <ScrollView
        style={[globalStyles.bgcontainer]}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[globalStyles.container]}>
        <View >

          {error ? (
            <View
              style={[
                globalStyles.alineItemscenter,
                globalStyles.justifycenter,
                { paddingVertical: 60 },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={64}
                color={color.error || color.alertError}
              />
              <CustomText
                style={[
                  globalStyles.f16Medium,
                  { color: color.error || color.alertError },
                  globalStyles.mt3,
                  globalStyles.textac,
                ]}
              >
                {error}
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f12Regular,
                  globalStyles.neutral500,
                  globalStyles.mt2,
                  globalStyles.textac,
                ]}
              >
                Please check your connection and try again
              </CustomText>
            </View>
          ) : (filterFromDashboard === "users" ? customersList.length === 0 : filteredBookings.length === 0) ? (
            <View
              style={[
                globalStyles.alineItemscenter,
                globalStyles.justifycenter,
                { paddingVertical: 60 },
              ]}
            >
              <Ionicons
                name={filterFromDashboard === "users" ? "people-outline" : "document-text-outline"}
                size={64}
                color={color.neutral[300]}
              />
              <CustomText
                style={[
                  globalStyles.f16Medium,
                  globalStyles.neutral500,
                  globalStyles.mt3,
                  globalStyles.textac,
                ]}
              >
                {filterFromDashboard === "users" ? "No customers found" : "No bookings found"}
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f12Regular,
                  globalStyles.neutral500,
                  globalStyles.mt2,
                  globalStyles.textac,
                ]}
              >
                {filterFromDashboard === "users"
                  ? "Customers from assigned bookings will appear here"
                  : "Assigned bookings will appear here"}
              </CustomText>
            </View>
            ) : filterFromDashboard === "users" ? (
              <Animated.View style={{ opacity: fadeAnim }}>
                {customersList.map((customer, index) => (
                  <Pressable
                    key={customer.id}
                    style={styles.cardContainer}
                    onPress={() =>
                      navigation.navigate("SupervisorBookingDetails", {
                        booking: customer.firstBooking,
                      })
                    }
                    android_ripple={{ color: color.neutral[100] }}
                  >
                    <View
                      style={[styles.accent, { backgroundColor: color.primary }]}
                    />
                    <View style={styles.cardContent}>
                      <View style={styles.leftSection}>
                        <View style={styles.bookingIdRow}>
                          <MaterialCommunityIcons
                            name="account-outline"
                            size={20}
                            color={color.primary}
                            style={styles.bookingIcon}
                          />
                          <CustomText
                            style={[globalStyles.f15Bold, { color: color.primary }]}
                            numberOfLines={1}
                          >
                            {customer.customerName}
                          </CustomText>
                        </View>
                        <View style={styles.statusRow}>
                          {customer.phoneNumber ? (
                            <CustomText
                              style={[globalStyles.f13Regular, globalStyles.black]}
                              numberOfLines={1}
                            >
                              {customer.phoneNumber}
                            </CustomText>
                          ) : null}
                          {customer.bookingCount > 1 ? (
                            <CustomText
                              style={[globalStyles.f12Regular, globalStyles.neutral500, { marginLeft: 8 }]}
                            >
                              • {customer.bookingCount} bookings
                            </CustomText>
                          ) : null}
                        </View>
                      </View>
                      <Pressable
                        style={styles.viewButton}
                        onPress={() =>
                          navigation.navigate("SupervisorBookingDetails", {
                            booking: customer.firstBooking,
                          })
                        }
                      >
                        <Ionicons name="chevron-forward" size={18} color={color.white} />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
              </Animated.View>
            ) : (
              <Animated.View style={{ opacity: fadeAnim }}>
                {filteredBookings.map((item, index) => (
                  <View
                    key={`${item.BookingID ?? "booking"}-${index}`}
                    style={styles.cardContainer}
                  >
                    <View
                      style={[
                        styles.accent,
                        {
                          backgroundColor: getStatusColor(item.BookingStatus),
                        },
                      ]}
                    />
                    <View style={styles.cardContent}>
                      <Pressable
                        style={styles.leftSection}
                        onPress={() =>
                          navigation.navigate("SupervisorBookingDetails", {
                            booking: item,
                          })
                        }
                        android_ripple={{ color: color.neutral[100] }}
                      >
                        <View style={styles.bookingIdRow}>
                          <MaterialCommunityIcons
                            name="card-account-details-outline"
                            size={20}
                            color={color.primary}
                            style={styles.bookingIcon}
                          />
                          <CustomText
                            style={[globalStyles.f14Bold, { color: color.primary }]}
                            numberOfLines={1}
                          >
                            {item.BookingTrackID || "N/A"}
                          </CustomText>
                        </View>
                        <View style={styles.statusRow}>
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor: getStatusColor(item.BookingStatus),
                              },
                            ]}
                          />
                          <CustomText
                            style={[globalStyles.f13Regular, globalStyles.black]}
                          >
                            {item.BookingStatus || "Pending"}
                          </CustomText>
                        </View>
                      </Pressable>
                      <View style={styles.cardActions}>
                        <Pressable
                          style={styles.assignIconButton}
                          onPress={() => {
                            setBookingForAssign(item);
                            setAssignType("Technician");
                            setSelectedTechnician(null);
                            setSelectedFieldAdvisor(null);
                            setAssignError(null);
                            setAssignModalVisible(true);
                          }}
                        >
                          <MaterialCommunityIcons
                            name="account-plus-outline"
                            size={22}
                            color={color.primary}
                          />
                        </Pressable>
                        <Pressable
                          style={styles.viewButton}
                          onPress={() =>
                            navigation.navigate("SupervisorBookingDetails", {
                              booking: item,
                            })
                          }
                        >
                          <Ionicons name="chevron-forward" size={18} color={color.white} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}
        </View>
        </View>
      </ScrollView>

      {/* Assign Modal */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAssignModalVisible(false)}
        >
          <Pressable style={styles.assignModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.assignModalHeader}>
              <CustomText style={[globalStyles.f18SemiBold, globalStyles.black]}>
                Assign
              </CustomText>
              <Pressable
                onPress={() => setAssignModalVisible(false)}
                hitSlop={12}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={color.neutral[600]} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.assignModalScroll}
              contentContainerStyle={styles.assignModalScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
            {/* Field Advisor / Technician */}
            <View style={styles.assignTypeRow}>
              <Pressable
                style={[
                  styles.assignTypeOption,
                  assignType === "Field Advisor" && styles.assignTypeOptionSelected,
                ]}
                onPress={() => {
                  setAssignType("Field Advisor");
                  setSelectedTechnician(null);
                  setShowTechnicianPicker(false);
                  setShowFieldAdvisorPicker(false);
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    assignType === "Field Advisor" && styles.checkboxSelected,
                  ]}
                >
                  {assignType === "Field Advisor" && (
                    <Ionicons name="checkmark" size={14} color={color.white} />
                  )}
                </View>
                <CustomText
                  style={[
                    globalStyles.f14Regular,
                    assignType === "Field Advisor" ? globalStyles.f14Bold : globalStyles.neutral600,
                  ]}
                >
                  Field Advisor
                </CustomText>
              </Pressable>
              <Pressable
                style={[
                  styles.assignTypeOption,
                  assignType === "Technician" && styles.assignTypeOptionSelected,
                ]}
                onPress={() => {
                  setAssignType("Technician");
                  setSelectedFieldAdvisor(null);
                  setShowFieldAdvisorPicker(false);
                  setShowTechnicianPicker(false);
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    assignType === "Technician" && styles.checkboxSelected,
                  ]}
                >
                  {assignType === "Technician" && (
                    <Ionicons name="checkmark" size={14} color={color.white} />
                  )}
                </View>
                <CustomText
                  style={[
                    globalStyles.f14Regular,
                    assignType === "Technician" ? globalStyles.f14Bold : globalStyles.neutral600,
                  ]}
                >
                  Technician
                </CustomText>
              </Pressable>
            </View>

            {/* Time Slot – only for Technician, dropdown with no data */}
            {assignType === "Technician" && (
              <View style={styles.assignField}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.assignLabel]}>
                  Time Slot
                </CustomText>
                <Pressable
                  style={styles.dropdownField}
                  onPress={() => {
                    setShowTechnicianPicker(false);
                    setShowFieldAdvisorPicker(false);
                    setShowTimeSlotPicker(!showTimeSlotPicker);
                  }}
                >
                  <CustomText style={[globalStyles.f14Regular, globalStyles.neutral500]}>
                    Select time slot
                  </CustomText>
                  <Ionicons name="chevron-down" size={20} color={color.neutral[500]} />
                </Pressable>
                {showTimeSlotPicker && (
                  <View style={styles.dropdownList}>
                    <View style={styles.dropdownItem}>
                      <CustomText style={[globalStyles.f14Regular, globalStyles.neutral500]}>
                        No time slots
                      </CustomText>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Select Technician or Field Advisor */}
            <View style={styles.assignField}>
              <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.assignLabel]}>
                {assignType === "Technician" ? "Select Technician" : "Select Field Advisor"}
              </CustomText>
              <Pressable
                style={styles.dropdownField}
                onPress={() => {
                  setShowTimeSlotPicker(false);
                  if (assignType === "Technician") {
                    setShowFieldAdvisorPicker(false);
                    setShowTechnicianPicker(!showTechnicianPicker);
                  } else {
                    setShowTechnicianPicker(false);
                    setShowFieldAdvisorPicker(!showFieldAdvisorPicker);
                  }
                }}
              >
                <CustomText
                  style={[
                    globalStyles.f14Regular,
                    (assignType === "Technician" ? selectedTechnician != null : selectedFieldAdvisor != null)
                      ? globalStyles.neutral700
                      : globalStyles.neutral500,
                  ]}
                >
                  {assignType === "Technician"
                    ? (selectedTechnician != null
                        ? techniciansList.find((t) => t.TechID === selectedTechnician)?.TechnicianName ?? "Select Technician"
                        : techniciansLoading ? "Loading..." : "Select Technician")
                    : (selectedFieldAdvisor != null
                        ? fieldAdvisorsList.find((e) => e.Id === selectedFieldAdvisor)?.Name ?? "Select Field Advisor"
                        : employeesLoading ? "Loading..." : "Select Field Advisor")}
                </CustomText>
                <Ionicons name="chevron-down" size={20} color={color.neutral[500]} />
              </Pressable>
              {assignType === "Technician" && showTechnicianPicker && (
                <View style={styles.dropdownList}>
                  {techniciansLoading ? (
                    <View style={styles.dropdownItem}>
                      <CustomText style={[globalStyles.f14Regular, globalStyles.neutral500]}>
                        Loading...
                      </CustomText>
                    </View>
                  ) : techniciansList.length === 0 ? (
                    <View style={styles.dropdownItem}>
                      <CustomText style={[globalStyles.f14Regular, globalStyles.neutral500]}>
                        No technicians found
                      </CustomText>
                    </View>
                  ) : (
                    techniciansList.map((t) => (
                      <Pressable
                        key={t.TechID}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedTechnician(t.TechID);
                          setShowTechnicianPicker(false);
                          setAssignError(null);
                        }}
                      >
                        <CustomText style={[globalStyles.f14Regular, globalStyles.neutral700]}>
                          {t.TechnicianName}
                        </CustomText>
                      </Pressable>
                    ))
                  )}
                </View>
              )}
              {assignType === "Field Advisor" && showFieldAdvisorPicker && (
                <View style={styles.dropdownList}>
                  {employeesLoading ? (
                    <View style={styles.dropdownItem}>
                      <CustomText style={[globalStyles.f14Regular, globalStyles.neutral500]}>
                        Loading...
                      </CustomText>
                    </View>
                  ) : fieldAdvisorsList.length === 0 ? (
                    <View style={styles.dropdownItem}>
                      <CustomText style={[globalStyles.f14Regular, globalStyles.neutral500]}>
                        No Field Advisors found
                      </CustomText>
                    </View>
                  ) : (
                    fieldAdvisorsList.map((e) => (
                      <Pressable
                        key={e.Id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedFieldAdvisor(e.Id);
                          setShowFieldAdvisorPicker(false);
                          setAssignError(null);
                        }}
                      >
                        <CustomText style={[globalStyles.f14Regular, globalStyles.neutral700]}>
                          {e.Name}
                        </CustomText>
                      </Pressable>
                    ))
                  )}
                </View>
              )}
            </View>

            {assignError ? (
              <CustomText style={[globalStyles.f12Regular, { color: color.alertError, marginTop: 12, textAlign: "center" }]}>
                {assignError}
              </CustomText>
            ) : null}
            </ScrollView>

            {/* Cancel & Assign */}
            <View style={styles.assignModalActions}>
              <TouchableOpacity
                style={styles.assignCancelButton}
                onPress={() => setAssignModalVisible(false)}
                disabled={assigningInProgress}
              >
                <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>
                  Cancel
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.assignSubmitButton,
                  (assignType === "Technician" ? !selectedTechnician : !selectedFieldAdvisor) || assigningInProgress
                    ? styles.assignSubmitButtonDisabled
                    : null,
                ]}
                onPress={handleAssignTechnician}
                disabled={
                  (assignType === "Technician" ? !selectedTechnician : !selectedFieldAdvisor) || assigningInProgress
                }
              >
                <CustomText
                  style={[
                    globalStyles.f14Bold,
                    (assignType === "Technician" ? selectedTechnician : selectedFieldAdvisor) && !assigningInProgress
                      ? globalStyles.neutral700
                      : globalStyles.neutral400,
                  ]}
                >
                  {assigningInProgress ? "Assigning..." : "Assign"}
                </CustomText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: color.primary,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: color.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardContainer: {
    backgroundColor: color.white,
    borderRadius: 12,
    marginTop: 12,
    marginHorizontal: 4,
    overflow: "hidden",
    position: "relative",
    shadowColor: color.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: color.neutral[100],
  },
  cardWrapper: {
    position: "relative",
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingLeft: 20,
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  bookingIdRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  bookingIcon: {
    marginRight: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 2,
    borderColor: color.white,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assignIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.neutral[100],
  },
  viewButton: {
    backgroundColor: color.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: color.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  assignModalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: color.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  assignModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  assignModalScroll: {
    maxHeight: 320,
  },
  assignModalScrollContent: {
    paddingBottom: 8,
  },
  modalCloseButton: {
    padding: 4,
  },
  assignTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
  },
  assignTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  assignTypeOptionSelected: {},
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: color.neutral[300],
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  assignField: {
    marginBottom: 16,
  },
  assignLabel: {
    marginBottom: 8,
  },
  dropdownField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: color.neutral[200],
    borderRadius: 10,
    backgroundColor: color.white,
  },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: color.neutral[200],
    borderRadius: 10,
    backgroundColor: color.white,
    maxHeight: 180,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: color.neutral[100],
  },
  assignModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  assignCancelButton: {
    flex: 1,
    backgroundColor: color.neutral[600],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  assignSubmitButton: {
    flex: 1,
    backgroundColor: color.neutral[200],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  assignSubmitButtonDisabled: {
    backgroundColor: color.neutral[100],
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.neutral[200],
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeValue: {
    flex: 1,
    flexWrap: "wrap",
  },
  skeletonCardContainer: {
    backgroundColor: color.white,
    borderRadius: 12,
    marginTop: 12,
    marginHorizontal: 4,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: color.neutral[200],
  },
  skeletonAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderRadius: 12,
  },
  skeletonCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingLeft: 20,
  },
  skeletonLeftSection: {
    flex: 1,
    marginRight: 12,
  },
  skeletonLine: {
    borderRadius: 4,
  },
  skeletonButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
