import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../styles/theme";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LeaveRequestList() {
  const navigation = useNavigation();
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      const techID = await AsyncStorage.getItem("techID");
        const token = await AsyncStorage.getItem("token");

      if (!techID) {
        console.warn("No techID found in AsyncStorage");
        return;
      }

      const response = await axios.get(
        `https://api.mycarsbuddy.com/api/LeaveRequest/Techid?TechId=${techID}`,
        {
            headers: {
              Authorization: `Bearer ${token}`, // <-- Correct header
            },
          }
      );

      setLeaveData(response.data);
    } catch (error) {
      console.error("Error fetching leave data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (statusCode) => {
    switch (statusCode) {
      case 1:
        return "Approved";
      case 0:
        return "Pending";
      case 2:
        return "Denied";
      default:
        return "Unknown";
    }
  };

  const getStatusStyle = (statusCode) => {
    switch (statusCode) {
      case 1:
        return {
          container: styles.approved,
          text: styles.approvedText,
        };
      case 0:
        return {
          container: styles.pending,
          text: styles.pendingText,
        };
      case 2:
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
          <TouchableOpacity
            onPress={() => navigation.navigate("leaveRequest")}
            style={styles.addButton}
          >
            <CustomText style={styles.addButtonText}>Add Request</CustomText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={24} color={color.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={color.black} size="large" />
        ) : leaveData.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CustomText style={globalStyles.neutral500}>
              No leave requests found
            </CustomText>
          </View>
        ) : (
          leaveData.map((item, index) => {
            const statusStyle = getStatusStyle(item.Status);
            return (
              <View key={index} style={styles.card}>
                <CustomText style={[globalStyles.f20Bold, globalStyles.mb3]}>
                  Leave Requests
                </CustomText>
                <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
                  <View style={globalStyles.flex1}>
                    <CustomText
                      style={[
                        globalStyles.f16Bold,
                        styles.subjectText,
                        globalStyles.mb1,
                      ]}
                    >
                      {item.LeaveReason || "Leave subject here"}
                    </CustomText>
                    <CustomText style={[globalStyles.f12Regular]}>
                      From {moment(item.FromDate).format("Do MMMM YYYY")} to{" "}
                      {moment(item.ToDate).format("Do MMM YYYY")}
                    </CustomText>
                  </View>
                  <View style={[styles.statusBadge, statusStyle.container]}>
                    <CustomText style={[styles.statusText, statusStyle.text]}>
                      {getStatusText(item.Status)}
                    </CustomText>
                  </View>
                </View>

                <View style={[globalStyles.mt2, globalStyles.alineItemsEnd]}>
                  <CustomText
                    style={[globalStyles.f10Regular, globalStyles.neutral300]}
                  >
                    {moment(item.FromDate).format("hh:mm A")}
                  </CustomText>
                </View>
              </View>
            );
          })
        )}
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
