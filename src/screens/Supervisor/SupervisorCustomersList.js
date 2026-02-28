import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  Pressable,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { API_BASE_URL } from "@env";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function SupervisorCustomersList() {
  const navigation = useNavigation();
  const parentState = navigation.getParent()?.getState();
  const isTabRoot = parentState?.type === "tab";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
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
      if (supervisorToken) {
        config.headers = { Authorization: `Bearer ${supervisorToken}` };
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
        bookingsData = [res];
      }

      const validBookings = (Array.isArray(bookingsData) ? bookingsData : []).filter(
        (b) => b && b.BookingID != null
      );
      setBookings(validBookings);
      setError(null);
    } catch (err) {
      if (__DEV__) {
        console.error("Error fetching supervisor bookings:", err?.response?.data ?? err.message);
      }
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Failed to fetch customers. Please try again."
      );
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, [fetchBookings]);

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

  if (loading && bookings.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <StatusBar backgroundColor={color.primary} barStyle="light-content" />
        <View style={styles.headerContainer}>
          {isTabRoot ? (
            <View style={styles.backButton} />
          ) : (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={24} color={color.white} />
            </TouchableOpacity>
          )}
          <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite]}>
            Customers
          </CustomText>
          <View style={styles.backButton} />
        </View>
        <View style={[globalStyles.flex1, globalStyles.alineItemscenter, globalStyles.justifycenter, { paddingVertical: 48 }]}>
          <CustomText style={[globalStyles.f14Regular, globalStyles.neutral500]}>
            Loading customers...
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <StatusBar backgroundColor={color.primary} barStyle="light-content" />
      <View style={styles.headerContainer}>
        {isTabRoot ? (
          <View style={styles.backButton} />
        ) : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={24} color={color.white} />
          </TouchableOpacity>
        )}
        <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite]}>
          Customers
        </CustomText>
        <View style={styles.backButton} />
      </View>
      {/* <View style={{ paddingHorizontal: 20, paddingBottom: 16, marginTop: -8 }}>
        <CustomText style={[globalStyles.f12Regular, globalStyles.textWhite, { opacity: 0.9 }]}>
          {customersList.length} {customersList.length === 1 ? "customer" : "customers"}
        </CustomText>
      </View> */}

      <ScrollView
        style={[globalStyles.bgcontainer]}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[globalStyles.container]}>
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
          ) : customersList.length === 0 ? (
            <View
              style={[
                globalStyles.alineItemscenter,
                globalStyles.justifycenter,
                { paddingVertical: 60 },
              ]}
            >
              <Ionicons name="people-outline" size={64} color={color.neutral[300]} />
              <CustomText
                style={[
                  globalStyles.f16Medium,
                  globalStyles.neutral500,
                  globalStyles.mt3,
                  globalStyles.textac,
                ]}
              >
                No customers found
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f12Regular,
                  globalStyles.neutral500,
                  globalStyles.mt2,
                  globalStyles.textac,
                ]}
              >
                Customers from assigned bookings will appear here
              </CustomText>
            </View>
          ) : (
            customersList.map((customer) => (
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
                        style={[globalStyles.f14Bold, { color: color.primary }]}
                        numberOfLines={1}
                      >
                        {customer.customerName}
                      </CustomText>
                    </View>
                    <View style={styles.statusRow}>
                      {customer.phoneNumber ? (
                        <CustomText
                          style={[globalStyles.f12Regular, globalStyles.black]}
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
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: color.primary,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSubtitle: {
    backgroundColor: color.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginTop: -8,
  },
  cardContainer: {
    backgroundColor: color.white,
    borderRadius: 12,
    marginTop: 12,
    marginHorizontal: 4,
    overflow: "hidden",
    position: "relative",
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: color.neutral[100],
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
  viewButton: {
    backgroundColor: color.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
