import React from "react";
import { ScrollView, View, TouchableOpacity, StyleSheet } from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../styles/theme";
import { useNavigation } from "@react-navigation/native";

export default function LeaveRequestList() {
    const navigation = useNavigation();
  
  const leaveData = [
    {
      subject: "Leave subject here",
      from: "20th July",
      to: "25th July 2025",
      status: "Approved",
      time: "12:04 pm",
    },
    {
      subject: "Leave subject here",
      from: "29th July",
      to: "31st Aug 2025",
      status: "Pending",
      time: "12:04 pm",
    },
    {
      subject: "Leave subject here",
      from: "09th June",
      to: "1st July 2025",
      status: "Denied",
      time: "12:04 pm",
    },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case "Approved":
        return {
          container: styles.approved,
          text: styles.approvedText,
        };
      case "Pending":
        return {
          container: styles.pending,
          text: styles.pendingText,
        };
      case "Denied":
        return {
          container: styles.denied,
          text: styles.deniedText,
        };
      default:
        return {};
    }
  };

  return (
    <ScrollView style={[globalStyles.bgcontainer]}>
      <View style={[globalStyles.p4]}>
        <View
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.alineItemscenter,
            globalStyles.mb4,
          ]}
        >
          <TouchableOpacity   onPress={() => navigation.navigate("leaveRequest")} style={styles.addButton}>
            <CustomText style={styles.addButtonText}>Add Request</CustomText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={24} color={color.white} />
          </TouchableOpacity>
        </View>

        <CustomText style={[globalStyles.f20Bold, globalStyles.mb3]}>
          July 2025
        </CustomText>

        {leaveData.map((item, index) => {
          const statusStyle = getStatusStyle(item.status);
          return (
            <View key={index} style={styles.card}>
              <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
                <View style={globalStyles.flex1}>
                  <CustomText
                    style={[
                      globalStyles.f16Bold,
                      styles.subjectText,
                      globalStyles.mb1,
                    ]}
                  >
                    {item.subject}
                  </CustomText>
                  <CustomText style={[globalStyles.f12Regular]}>
                    From {item.from} to {item.to}
                  </CustomText>
                </View>
                <View style={[styles.statusBadge, statusStyle.container]}>
                  <CustomText style={[styles.statusText, statusStyle.text]}>
                    {item.status}
                  </CustomText>
                </View>
              </View>

              <View style={[globalStyles.mt2, globalStyles.alineItemsEnd]}>
                <CustomText
                  style={[globalStyles.f10Regular, globalStyles.neutral300]}
                >
                  {item.time}
                </CustomText>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: color.primary,
    paddingVertical: 14,
    width: "70%",
    alignItems: "center",
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  addButtonText: {
    color: color.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  iconButton: {
    width: "25%",
    alignItems: "center",
    backgroundColor: color.black,
    padding: 10,
    borderRadius: 10,
    elevation: 2,
  },
  card: {
    backgroundColor: color.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  subjectText: {
    color: color.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    minWidth: 70,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  approved: {
    backgroundColor: color.black,
  },
  approvedText: {
    color: color.white,
  },
  pending: {
    backgroundColor: "#FFD580",
  },
  pendingText: {
    color: color.black,
  },
  denied: {
    backgroundColor: color.fullredLight,
  },
  deniedText: {
    color: color.white,
  },
});
