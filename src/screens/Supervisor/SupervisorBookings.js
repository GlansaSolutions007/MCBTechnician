import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  Pressable,
  Animated,
  StatusBar,
} from "react-native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { API_BASE_URL } from "@env";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function SupervisorBookings() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchBookings();
  }, []);

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
      console.log("Supervisor IDDDDD:", supervisorId);
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");

      console.log("Fetching bookings for SupervisorID:", supervisorId);

      if (!supervisorId) {
        console.log("Supervisor ID not found in AsyncStorage");
        setBookings([]);
        return;
      }

      const url = `${API_BASE_URL}Supervisor/AssingedBookings?SupervisorID=${supervisorId}`;
      // Create config object for axios request
      const config = {};

      // Add authorization header if token exists
      if (supervisorToken) {
        config.headers = {
          Authorization: `Bearer ${supervisorToken}`,
        };
      }

      const response = await axios.get(url, config);

      console.log("API Response:", response?.data);
      console.log("Response type:", typeof response?.data);
      console.log("Is array:", Array.isArray(response?.data));

      // Handle the response - it should be a direct array
      let bookingsData = [];
      if (Array.isArray(response?.data)) {
        bookingsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        bookingsData = response.data.data;
      } else if (response?.data) {
        // If it's a single object, wrap it in an array
        bookingsData = [response.data];
      }

      console.log("Processed bookings data:", bookingsData);
      console.log("Number of bookings:", bookingsData.length);

      // Filter out bookings with null BookingID (incomplete assignments)
      const validBookings = bookingsData.filter((booking) => booking.BookingID !== null);
      
      console.log("Valid bookings (after filter):", validBookings.length);

      setBookings(validBookings);
      setError(null);
    } catch (error) {
      console.error("Error fetching supervisor bookings:");
      console.error("Error message:", error.message);
      console.error("Error response:", error?.response?.data);
      console.error("Error status:", error?.response?.status);
      console.error("Full error:", error);
      
      const errorMessage = error?.response?.data?.message || 
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
              Supervisor Bookings
            </CustomText>
            <CustomText
              style={[globalStyles.f12Regular, globalStyles.textWhite, { marginTop: 4, opacity: 0.9 }]}
            >
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} assigned
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
          ) : bookings.length === 0 ? (
            <View
              style={[
                globalStyles.alineItemscenter,
                globalStyles.justifycenter,
                { paddingVertical: 60 },
              ]}
            >
              <Ionicons
                name="document-text-outline"
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
                No bookings found
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f12Regular,
                  globalStyles.neutral500,
                  globalStyles.mt2,
                  globalStyles.textac,
                ]}
              >
                Assigned bookings will appear here
              </CustomText>
            </View>
            ) : (
              <Animated.View style={{ opacity: fadeAnim }}>
                {bookings.map((item, index) => (
                  <Pressable
                    key={`${item.BookingID ?? "booking"}-${index}`}
                    style={styles.cardContainer}
                    onPress={() =>
                      navigation.navigate("SupervisorBookingDetails", {
                        booking: item,
                      })
                    }
                    android_ripple={{ color: color.neutral[100] }}
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
                      <View style={styles.leftSection}>
                        <View style={styles.bookingIdRow}>
                          <MaterialCommunityIcons
                            name="card-account-details-outline"
                            size={20}
                            color={color.primary}
                            style={styles.bookingIcon}
                          />
                          <CustomText
                            style={[globalStyles.f15Bold, { color: color.primary }]}
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
                      </View>
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
                  </Pressable>
                ))}
              </Animated.View>
            )}
        </View>
        </View>
      </ScrollView>
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
