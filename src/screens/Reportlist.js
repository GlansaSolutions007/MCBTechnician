import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
  Pressable,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, API_BASE_URL_IMAGE } from "@env";
import { color } from "../styles/theme";
import { useNavigation } from "@react-navigation/native";
import reports from "../../assets/icons/Navigation/reports.png";
import defaultAvatar from "../../assets/images/buddy.png";
import { getBookingDisplayData } from "../utils/bookingDisplay";
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

  // Helper function to get unique categories
  const getUniqueCategories = (packages) => {
    if (!packages || !Array.isArray(packages)) return [];
    const uniqueCategories = new Set();
    packages.forEach(pkg => {
      if (pkg?.Category?.CategoryName) {
        uniqueCategories.add(pkg.Category.CategoryName);
      }
    });
    return Array.from(uniqueCategories);
  };

  // Helper function to get unique packages
  const getUniquePackages = (packages) => {
    if (!packages || !Array.isArray(packages)) return [];
    const uniquePackages = new Set();
    packages.forEach(pkg => {
      if (pkg?.PackageName) {
        uniquePackages.add(pkg.PackageName);
      }
    });
    return Array.from(uniquePackages);
  };

  const todayIST = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const getAssignDate = (booking) => {
    const pd = booking?.PickupDelivery;
    if (!pd) return booking?.BookingDate || booking?.TechAssignDate || null;
    if (Array.isArray(pd) && pd.length > 0) {
      const sorted = [...pd].sort((a, b) => new Date(b.AssignDate) - new Date(a.AssignDate));
      return sorted[0]?.AssignDate || booking?.BookingDate || booking?.TechAssignDate || null;
    }
    return pd?.AssignDate || booking?.BookingDate || booking?.TechAssignDate || null;
  };

  const isDateCompleted = (dateString) => {
    if (!dateString) return false;
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return false;
      const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      return dateStr <= todayIST;
    } catch (e) {
      return false;
    }
  };

  const getDriverStatus = (booking) => {
    const pd = booking?.PickupDelivery;
    if (!pd) return null;
    if (Array.isArray(pd)) {
      const found = pd.find((p) => p?.DriverStatus);
      return found?.DriverStatus ?? pd[0]?.DriverStatus ?? null;
    }
    return pd?.DriverStatus ?? null;
  };

  const isBookingCompleted = (booking) => {
    const status = booking?.BookingStatus;
    if (status === "Completed" || status === "ServiceComplete") return true;
    const driverStatus = getDriverStatus(booking);
    return driverStatus === "completed" || driverStatus === "ServiceComplete";
  };

  // Show only completed bookings (status completed and AssignDate in the past/today)
  const pastBookings = Array.isArray(bookings)
    ? bookings.filter((booking) => {
      const assignDate = getAssignDate(booking);
      if (!isDateCompleted(assignDate)) return false;
      return isBookingCompleted(booking);
    })
    : [];

  const renderBookingCard = ({ item, index }) => {
    const driverStatus = getDriverStatus(item);
    const assignDateTime = item?.PickupDelivery?.[0]?.AssignDate;

    const assignDate = assignDateTime
      ? new Date(assignDateTime).toLocaleDateString("en-IN")
      : "";

    const assignTime = assignDateTime
      ? new Date(assignDateTime).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
      : "";

    return (
      <Pressable
        onPress={() => customerInfo(item)}
        style={[
          driverStatus === "completed" ? globalStyles.bgneutral100 : globalStyles.bgwhite,
          globalStyles.p4,
          globalStyles.mt4,
          styles.cardWrapper,
          index !== 0 && { marginTop: 4 },
        ]}
      >
        <View
          style={[
            styles.accent,
            {
              backgroundColor:
                driverStatus === "completed" ? color.primary : color.alertError,
            },
          ]}
        />
        <View style={styles.cardContent}>
          <View
            style={[
              globalStyles.flexrow,
              globalStyles.alineItemscenter,
              globalStyles.mb3,
              { flexWrap: "wrap", gap: 8 },
            ]}
          >
            <View style={[styles.serviceTypeChip, { backgroundColor: color.primary }]}>
              <MaterialCommunityIcons
                name="wrench-outline"
                size={14}
                color={color.white}
                style={{ marginRight: 6 }}
              />
              <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>
                {(() => {
                  const pickServiceType = item.PickupDelivery?.[0]?.PickServiceType ?? item.ServiceType;
                  return pickServiceType
                    ? pickServiceType
                      .replace(/([A-Z])/g, " $1")
                      .replace(/\bAt\b/g, "at")
                      .trim()
                    : "N/A";
                })()}
              </CustomText>
            </View>
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor:
                    driverStatus === "completed"
                      ? color.alertSuccess
                      : driverStatus === "pickup_reached"
                        ? color.alertInfo
                        : color.primary,
                },
              ]}
            >
              <CustomText style={[globalStyles.f10Bold, globalStyles.textWhite, { marginBottom: 2 }]}>
                {(driverStatus || "No Status").charAt(0).toUpperCase() +
                  (driverStatus || "No Status").slice(1)}
              </CustomText>
            </View>
          </View>
          <View style={globalStyles.flexrow}>
            <Image
              source={
                item.ProfileImage
                  ? { uri: `${API_BASE_URL_IMAGE}${item.ProfileImage}` }
                  : defaultAvatar
              }
              style={styles.avatar}
            />
            <View style={[globalStyles.ml3, { flex: 1 }]}>
              <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                {item.CustomerName || item.Leads?.FullName || "N/A"}
              </CustomText>
              <CustomText
                style={[globalStyles.f12Medium, globalStyles.neutral500, globalStyles.mt1]}
              >
                Mobile:{" "}
                <CustomText style={globalStyles.black}>
                  {item.PhoneNumber || item.Leads?.PhoneNumber || "N/A"}
                </CustomText>
              </CustomText>
              <CustomText
                style={[globalStyles.f12Medium, globalStyles.neutral500, globalStyles.mt1]}
              >
                Route Type:{" "}
                <CustomText style={globalStyles.black}>
                  {(item?.PickupDelivery?.[0]?.PickFrom?.[0]?.RouteType ||
                    item?.PickupDelivery?.[0]?.DropAt?.RouteType ||
                    "N/A")?.replace(/([A-Z])/g, " $1")
                    .replace(/\bTo\b/g, "to")
                    .trim()}
                </CustomText>
              </CustomText>
              <CustomText
                style={[globalStyles.f10Regular, globalStyles.neutral500, globalStyles.mt1]}
                numberOfLines={2}
              >
                {item.FullAddress ||
                  item.Leads?.City ||
                  item.Leads?.FullAddress ||
                  "N/A"}
              </CustomText>
            </View>
          </View>

          <View style={globalStyles.divider} />

          <View style={styles.cardMetaRow}>
            <View style={styles.cardMetaCol}>
              <View style={styles.cardMetaItem}>
                <MaterialCommunityIcons
                  name="card-account-details-outline"
                  size={16}
                  color={color.primary}
                  style={styles.cardMetaIcon}
                />
                <CustomText
                  style={[globalStyles.f10Regular, globalStyles.black]}
                  numberOfLines={1}
                >
                  {getBookingDisplayData(item).bookingTrackID}
                </CustomText>
              </View>
              <View style={styles.cardMetaItem}>
                <FontAwesome5
                  name="car"
                  size={14}
                  color={color.primary}
                  style={styles.cardMetaIcon}
                />
                <CustomText
                  style={[globalStyles.f10Regular, globalStyles.black]}
                  numberOfLines={1}
                >
                  {getBookingDisplayData(item).vehicleDisplay}
                </CustomText>
              </View>
            </View>
            <View style={styles.cardMetaCol}>
              <View style={styles.cardMetaItem}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={16}
                  color={color.primary}
                  style={styles.cardMetaIcon}
                />
                <CustomText
                  style={[globalStyles.f10Regular, globalStyles.black]}
                >
                  {getBookingDisplayData(item).bookingDate} ({getBookingDisplayData(item).timeSlot})
                </CustomText>
              </View>
              <View style={styles.cardMetaItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={color.primary}
                  style={styles.cardMetaIcon}
                />
                <CustomText
                  style={[
                    globalStyles.f10Regular,
                    globalStyles.black,
                    styles.timeValue,
                  ]}
                  numberOfLines={1}
                >
                {assignDate}, {assignTime}
                </CustomText>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

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
  cardWrapper: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: color.primary,
  },
  cardContent: {
    paddingLeft: 4,
  },
  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
    gap: 12,
  },
  cardMetaCol: {
    flex: 1,
    minWidth: 0,
  },
  cardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  cardMetaIcon: {
    marginRight: 6,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  serviceTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 70,
    height: 100,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: color.white,
  },
  timeValue: {
    flex: 1,
    flexWrap: "wrap",
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
