import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
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
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "upcoming", title: "Upcoming" },
    { key: "past", title: "Past" },
  ]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
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
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    }
  };

  const customerInfo = (booking) => {
    navigation.navigate("customerInfo", { booking });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.BookingDate);
    const today = new Date();

    bookingDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return bookingDate > today;
  });
  const pastBookings = bookings.filter((b) => new Date(b.BookingDate) < today);

  const renderBookingCard = (item, index) => (
    <TouchableOpacity
      key={index}
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

      <View style={styles.infoRow}>
        <FontAwesome5
          style={[styles.icon, globalStyles.black]}
          name="calendar-alt"
          size={16}
        />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Assigned on:
        </CustomText>
        <CustomText style={globalStyles.f10Regular}>
          {new Date(item.BookingDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </CustomText>
      </View>

      <View style={styles.infoRow}>
        <FontAwesome5
          style={[styles.icon, globalStyles.black]}
          name="clock"
          size={16}
        />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Time Slot:
        </CustomText>
        <CustomText style={globalStyles.f10Regular}>{item.TimeSlot}</CustomText>
      </View>

      <View style={styles.infoRow}>
        <FontAwesome5
          style={[styles.icon, globalStyles.black]}
          name="th-list"
          size={16}
        />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Category:
        </CustomText>
        <CustomText style={globalStyles.f10Regular}>
          {item.CategoryNames}
        </CustomText>
      </View>

      <View style={styles.infoRow}>
        <FontAwesome5
          style={[styles.icon, globalStyles.black]}
          name="spa"
          size={16}
        />
        <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
          Package:
        </CustomText>
        <CustomText style={globalStyles.f10Regular}>
          {item.PackageNames}
        </CustomText>
      </View>
    </TouchableOpacity>
  );

  const UpcomingRoute = () => (
    <View style={{ flex: 1, padding: 16 }}>
      {upcomingBookings.length > 0 ? (
        upcomingBookings.map(renderBookingCard)
      ) : (
        <CustomText>No upcoming bookings</CustomText>
      )}
    </View>
  );

  const PastRoute = () => (
    <View style={{ flex: 1, padding: 16 }}>
      {pastBookings.length > 0 ? (
        pastBookings.map(renderBookingCard)
      ) : (
        <CustomText>No past bookings</CustomText>
      )}
    </View>
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={SceneMap({
        upcoming: UpcomingRoute,
        past: PastRoute,
      })}
      onIndexChange={setIndex}
      initialLayout={{ width }}
      swipeEnabled={true}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          indicatorStyle={{
            backgroundColor: color.primary,
            height: 4,
            borderRadius: 50,
          }}
          style={{ backgroundColor: color.white }}
          labelStyle={[globalStyles.f12Bold]}
          activeColor={color.primary}
          inactiveColor={color.black}
          pressColor="transparent"
          pressOpacity={1}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: color.neutral[200],
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  icon: {
    marginRight: 4,
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
