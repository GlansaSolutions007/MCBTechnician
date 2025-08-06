import React, { useEffect, useState } from "react";
import { ScrollView, View, StyleSheet, TouchableOpacity } from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

function TaskReportsScreen() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
  try {
    const techID = await AsyncStorage.getItem("techID");
    if (!techID) {
      console.warn("Technician ID not found in AsyncStorage.");
      return;
    }

    const response = await axios.get(
      `https://api.mycarsbuddy.com/api/Bookings/GetAssignedBookings?Id=${techID}`
    );

    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0); 
    tomorrow.setDate(tomorrow.getDate() + 1); 

    const futureBookings = response.data.filter((item) => {
      const bookingDate = new Date(item.BookingDate);
      bookingDate.setHours(0, 0, 0, 0); 
      return bookingDate >= tomorrow;
    });

    setBookings(futureBookings);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
  }
};


  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={globalStyles.container}>
        {bookings.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.cardContainer, index !== 0 && { marginTop: 20 }]}
            activeOpacity={0.8}
          >
            <View style={styles.header}>
              <CustomText style={globalStyles.f16Bold}>
                <CustomText
                  style={[globalStyles.primary, globalStyles.f16Bold]}
                >
                  Booking ID:
                </CustomText>{" "}
                {item.BookingTrackID}
              </CustomText>
              <Ionicons name="chevron-forward" size={20} color="#000" />
            </View>

            <View style={globalStyles.divider} />

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
              <CustomText style={globalStyles.f10Regular}>
                {item.TimeSlot}
              </CustomText>
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
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
