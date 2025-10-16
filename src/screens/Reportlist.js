import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
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
import reports from "../../assets/icons/Navigation/reports.png";
function Reportlist() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pulse] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchBookings();
  }, []);

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

  const todayIST = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  // const pastBookings = Array.isArray(bookings)
  //   ? bookings.filter((booking) => {
  //       if (!booking.BookingDate) return false;

  //       const assignDateStr = new Date(booking.BookingDate).toLocaleDateString(
  //         "en-CA",
  //         { timeZone: "Asia/Kolkata" }
  //       );

  //       return assignDateStr < todayIST;
  //     })
  //   : [];
  const pastBookings = Array.isArray(bookings)
  ? bookings.filter((booking) => {
      if (!booking.BookingDate) return false;

      const bookingDateStr = new Date(booking.BookingDate).toLocaleDateString(
        "en-CA",
        { timeZone: "Asia/Kolkata" }
      );

      const isPastDate = bookingDateStr < todayIST;
      const isCompleted =
        booking.Status?.toLowerCase() === "completed" ||
        booking.BookingStatus?.toLowerCase() === "completed";

      return isPastDate || isCompleted;
    })
  : [];


  const renderBookingCard = ({ item, index }) => (
    <TouchableOpacity
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
      <View style={styles.infoRow}>
        <FontAwesome5 style={[styles.icon]} name="th-list" size={16} />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Category:
        </CustomText>
        <View style={{ flex: 1 }}>
          {item.Packages?.map((pkg, idx) => (
            <CustomText
              key={`cat-${item.BookingID ?? "x"}-${idx}`}
              style={globalStyles.f10Regular}
            >
              {pkg?.Category?.CategoryName || "N/A"}
            </CustomText>
          ))}
        </View>
      </View>

      {/* Package */}
      <View style={styles.infoRow}>
        <FontAwesome5 style={[styles.icon]} name="spa" size={16} />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Package:
        </CustomText>
        <View style={{ flex: 1 }}>
          {item.Packages?.map((pkg, idx) => (
            <CustomText
              key={`pkg-${item.BookingID ?? "x"}-${idx}`}
              style={globalStyles.f10Regular}
            >
              {pkg?.PackageName || "N/A"}
            </CustomText>
          ))}
        </View>
      </View>
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

  const renderList = () => {
    if (loading) {
      return (
        <FlatList
          data={[...Array(6).keys()]}
          keyExtractor={(i) => `report-skeleton-${String(i)}`}
          renderItem={({ item, index }) => <SkeletonCard index={index} />}
          contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (error) {
      return (
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
      );
    }

    if (pastBookings.length === 0) {
      return (
        <View
          style={[
            globalStyles.container,
            globalStyles.alineSelfcenter,
            globalStyles.justifycenter,
            globalStyles.alineItemscenter,
            { flex: 1 },
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
            No past bookings found
          </CustomText>
          <CustomText
            style={[
              globalStyles.f12Regular,
              globalStyles.neutral500,
              globalStyles.mt2,
              globalStyles.textac,
            ]}
          >
            Your completed services will appear here
          </CustomText>
        </View>
      );
    }

    return (
      <FlatList
        data={pastBookings}
        keyExtractor={(item, index) => {
          const id = item?.BookingID ?? "noid";
          const track = item?.BookingTrackID ?? "notrack";
          const date = item?.BookingDate ? String(item.BookingDate) : "nodate";
          return `past-${id}-${track}-${date}-${index}`;
        }}
        renderItem={renderBookingCard}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      {renderList()}
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

export default Reportlist;
