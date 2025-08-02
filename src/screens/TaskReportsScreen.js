import React from "react";
import { ScrollView, View, StyleSheet, TouchableOpacity } from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

const bookings = [
  {
    id: "TG234518",
    assignedOn: "29th July 2025",
    estHrs: "5hrs",
    category: "Interior Cleaning",
    package: "Spa Cleaning",
  },
  {
    id: "TG987654",
    assignedOn: "1st August 2025",
    estHrs: "3hrs",
    category: "Exterior Cleaning",
    package: "Deluxe Wash",
  },
];

function TaskReportsScreen() {
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
                {item.id}
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
                {item.assignedOn}
              </CustomText>
            </View>

            <View style={styles.infoRow}>
              <FontAwesome5
                style={[styles.icon, globalStyles.black]}
                name="clock"
                size={16}
              />
              <CustomText style={[globalStyles.f10Bold, styles.infoLabel]}>
                Est. Hrs:
              </CustomText>
              <CustomText style={globalStyles.f10Regular}>
                {item.estHrs}
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
                {item.category}
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
                {item.package}
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
