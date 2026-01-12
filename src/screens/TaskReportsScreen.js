import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { color } from "../styles/theme";
import { useNavigation } from "@react-navigation/native";
import schedule from "../../assets/icons/Navigation/schedule.png";

const { width } = Dimensions.get("window");

function TaskReportsScreen() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pulse] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchBookings();
  }, []);

  // Start skeleton pulse when loading
  useEffect(() => {
    if (loading) {
      Animated.loop(
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
      ).start();
    }
  }, [loading, pulse]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const techID = await AsyncStorage.getItem("techID");
      const token = await AsyncStorage.getItem("token");
      if (!techID) return;

      const response = await axios.get(
        `${API_BASE_URL}Bookings/GetAssignedBookings?Id=${techID}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBookings(response.data || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const customerInfo = (booking) => {
    if (navigation && navigation.navigate) {
      navigation.navigate("customerInfo", { booking });
    }
  };

  // Helper function to check if a date is in the future
  const isFutureDate = (dateString) => {
    if (!dateString) return false;
    
    try {
      // Get today's date - set to start of day for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      today.setMilliseconds(0);
      
      // Parse the date string (handles formats like "2026-02-01" or "2026-01-10T18:01:27.640")
      const bookingDate = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(bookingDate.getTime())) {
        return false;
      }
      
      // Set to start of day for comparison (ignore time)
      bookingDate.setHours(0, 0, 0, 0);
      bookingDate.setMilliseconds(0);
      
      // Return true if booking date is greater than today (future date)
      return bookingDate > today;
    } catch (error) {
      console.error("Error parsing date:", dateString, error);
      return false;
    }
  };

  // Show all bookings with future BookingDate (tomorrow and beyond)
  const upcomingBookings = Array.isArray(bookings)
    ? bookings.filter((booking) => {
        // Prioritize BookingDate over TechAssignDate for filtering
        const serviceDate = booking.BookingDate || booking.TechAssignDate;
        if (!serviceDate) return false;

        // Use the helper function to check if date is future
        return isFutureDate(serviceDate);
      })
    : [];

  const renderBookingCard = ({ item, index }) => (
    <TouchableOpacity
      key={item.BookingID?.toString() || index.toString()}
      onPress={() => customerInfo(item)}
      style={[styles.cardContainer, index !== 0 && { marginTop: 20 }]}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <CustomText style={globalStyles.f16Bold}>
          <CustomText style={[globalStyles.primary, globalStyles.f16Bold]}>
            Booking ID:
          </CustomText>{" "}
          {item.BookingTrackID}
        </CustomText>
        <Ionicons name="chevron-forward" size={20} color="#000" />
      </View>

      <View style={globalStyles.dividerWhite} />

      {/* Date */}
      <View style={styles.infoRow}>
        <FontAwesome5 style={[styles.icon]} name="calendar-alt" size={16} />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Assigned on:
        </CustomText>
        <CustomText style={[globalStyles.f10Regular, styles.infoValue]}>
          {item.BookingDate
            ? new Date(item.BookingDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "N/A"}
        </CustomText>
      </View>

      {/* Time Slot */}
      <View style={styles.infoRow}>
        <FontAwesome5 style={[styles.icon]} name="clock" size={16} />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Time Slot:
        </CustomText>
        <CustomText style={[globalStyles.f10Regular, styles.infoValue]}>
          {item.TimeSlot || "N/A"}
        </CustomText>
      </View>

      {/* Category */}
      {/* <View style={styles.infoRow}>
        <FontAwesome5 style={[styles.icon]} name="th-list" size={16} />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Category:
        </CustomText>
        <View style={{ flex: 1 }}>
          {item.Packages?.map((pkg, idx) => (
            <CustomText
              key={`category-${item.BookingID}-${idx}`}
              style={globalStyles.f10Regular}
            >
              {pkg?.Category?.CategoryName || "N/A"}
            </CustomText>
          ))}
        </View>
      </View> */}

      {/* Package */}
      {/* <View style={styles.infoRow}>
        <FontAwesome5 style={[styles.icon]} name="spa" size={16} />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Package:
        </CustomText>
        <View style={{ flex: 1 }}>
          {item.Packages?.map((pkg, idx) => (
            <CustomText
              key={`package-${item.BookingID}-${idx}`}
              style={globalStyles.f10Regular}
            >
              {pkg?.PackageName || "N/A"}
            </CustomText>
          ))}
        </View>
      </View> */}
    </TouchableOpacity>
  );

  const SkeletonCard = ({ index }) => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <View style={[styles.cardContainer, index !== 0 && { marginTop: 20 }]}>
        {/* Header skeleton */}
        <View style={styles.header}>
          <Animated.View
            style={[styles.skelLineMedium, { backgroundColor: bg }]}
          />
          <Animated.View
            style={[styles.skelCircleSm, { backgroundColor: bg }]}
          />
        </View>

        <View style={globalStyles.dividerWhite} />

        {/* Date row */}
        <View style={styles.infoRow}>
          <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
          <Animated.View
            style={[styles.skelLineSmall, { backgroundColor: bg }]}
          />
          <Animated.View
            style={[styles.skelFlexLine, { backgroundColor: bg }]}
          />
        </View>

        {/* Time Slot row */}
        <View style={styles.infoRow}>
          <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
          <Animated.View
            style={[styles.skelLineSmall, { backgroundColor: bg }]}
          />
          <Animated.View
            style={[styles.skelFlexLine, { backgroundColor: bg }]}
          />
        </View>

        {/* Category row */}
        <View style={styles.infoRow}>
          <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
          <Animated.View
            style={[styles.skelLineSmall, { backgroundColor: bg }]}
          />
          <View style={{ flex: 1 }}>
            <Animated.View
              style={[styles.skelLineLong, { backgroundColor: bg }]}
            />
            <Animated.View
              style={[
                styles.skelLineLonger,
                { backgroundColor: bg, marginTop: 6 },
              ]}
            />
          </View>
        </View>

        {/* Package row */}
        <View style={styles.infoRow}>
          <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
          <Animated.View
            style={[styles.skelLineSmall, { backgroundColor: bg }]}
          />
          <View style={{ flex: 1 }}>
            <Animated.View
              style={[styles.skelLineLong, { backgroundColor: bg }]}
            />
            <Animated.View
              style={[
                styles.skelLineLonger,
                { backgroundColor: bg, marginTop: 6 },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: color.white, paddingHorizontal: 16 }}
    >
      {loading ? (
        <FlatList
          data={[...Array(6).keys()]}
          keyExtractor={(i) => `skeleton-${i}`}
          renderItem={({ item, index }) => <SkeletonCard index={index} />}
          contentContainerStyle={{ paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : error ? (
        <View
          style={[
            globalStyles.container,
            globalStyles.alineSelfcenter,
            globalStyles.justifycenter,
            { flex: 1 },
          ]}
        >
          <View
            style={[
              globalStyles.alineItemscenter,
              globalStyles.justifycenter,
              globalStyles.flexrow,
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={color.alertError}
            />
            <CustomText
              style={[
                globalStyles.f16Medium,
                globalStyles.neutral500,
                globalStyles.ml1,
                globalStyles.textac,
              ]}
            >
              {error}
            </CustomText>
          </View>
          <TouchableOpacity
            style={[
              globalStyles.bgprimary,
              globalStyles.p3,
              globalStyles.alineItemscenter,
              globalStyles.borderRadiuslarge,
              globalStyles.mt4,
            ]}
            onPress={fetchBookings}
          >
            <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>
              Try Again
            </CustomText>
          </TouchableOpacity>
        </View>
      ) : upcomingBookings.length === 0 ? (
        <View
          style={[
            globalStyles.container,
            globalStyles.alineSelfcenter,
            globalStyles.justifycenter,
            globalStyles.alineItemscenter,
            { flex: 1 },
          ]}
        >
        <Ionicons name="calendar-outline" size={64} color={color.neutral[300]} />
          <CustomText
            style={[
              globalStyles.f16Medium,
              globalStyles.neutral500,
              globalStyles.mt3,
              globalStyles.textac,
            ]}
          >
            No upcoming bookings found
          </CustomText>
          <CustomText
            style={[
              globalStyles.f12Regular,
              globalStyles.neutral500,
              globalStyles.mt2,
              globalStyles.textac,
            ]}
          >
            Your assigned services will appear here
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={upcomingBookings}
          keyExtractor={(item, index) =>
            item.BookingID?.toString() || index.toString()
          }
          renderItem={renderBookingCard}
          contentContainerStyle={{ paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: color.neutral[200],
    borderRadius: 16,
    padding: 16,
  },
  // skeleton primitives
  skelLineMedium: {
    width: 160,
    height: 14,
    borderRadius: 7,
  },
  skelCircleSm: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  skelIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  skelLineSmall: {
    width: 70,
    height: 12,
    borderRadius: 6,
  },
  skelFlexLine: {
    flex: 1,
    height: 12,
    borderRadius: 6,
  },
  skelLineLong: {
    width: "70%",
    height: 12,
    borderRadius: 6,
  },
  skelLineLonger: {
    width: "85%",
    height: 12,
    borderRadius: 6,
  },
  icon: {
    marginRight: 4,
    color: color.black,
  },
  header: {
    ...globalStyles.flexrow,
    ...globalStyles.justifysb,
    ...globalStyles.alineItemscenter,
  },
  infoRow: {
    ...globalStyles.flexrow,
    ...globalStyles.alineItemscenter,
    marginTop: 10,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  infoLabel: {
    marginLeft: 4,
    marginRight: 4,
  },
  infoValue: {
    flex: 1,
    flexWrap: "wrap",
  },
});

export default TaskReportsScreen;
