import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { color } from "../styles/theme";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

function TaskReportsScreen() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter((booking) => {
    const assignDate = booking.BookingDate
      ? new Date(booking.BookingDate)
      : null;
    if (!assignDate || isNaN(assignDate)) return false;

    assignDate.setHours(0, 0, 0, 0);
    return assignDate > today;
  });

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
        <CustomText style={globalStyles.f10Regular}>
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
        <CustomText style={globalStyles.f10Regular}>
          {item.TimeSlot || "N/A"}
        </CustomText>
      </View>

      {/* Category */}
      <View style={styles.infoRow}>
        <FontAwesome5 style={[styles.icon]} name="th-list" size={16} />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Category:
        </CustomText>
        <View>
          {item.Packages?.map((pkg, idx) => (
            <CustomText key={idx} style={globalStyles.f10Regular}>
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
        <View>
          {item.Packages?.map((pkg, idx) => (
            <CustomText key={idx} style={globalStyles.f10Regular}>
              {pkg?.PackageName || "N/A"}
            </CustomText>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: color.white, paddingHorizontal: 16 }}
    >
      {loading ? (
        <ActivityIndicator
          size="large"
          color={color.primary}
          style={{ marginTop: 30 }}
        />
      ) : error ? (
        <CustomText>{error}</CustomText>
      ) : upcomingBookings.length === 0 ? (
        <View style={[globalStyles.container, globalStyles.alineSelfcenter]}>
          <CustomText style={globalStyles.neutral500}>
            {" "}
            No upcoming bookings
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
  },
  infoLabel: {
    marginLeft: 4,
    marginRight: 4,
  },
});

export default TaskReportsScreen;
