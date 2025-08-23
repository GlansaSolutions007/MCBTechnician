import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../styles/theme";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function LeaveRequestList() {
  const navigation = useNavigation();
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // ✅ Added state

  useEffect(() => {
    fetchLeaveData();
  }, [selectedDate]);

  // ✅ Corrected refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaveData();
    setRefreshing(false);
  };

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
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const allData = response.data;
      if (selectedDate) {
        const filteredData = allData.filter((item) => {
          const from = moment(item.FromDate).format("YYYY-MM-DD");
          return from === moment(selectedDate).format("YYYY-MM-DD");
        });
        setLeaveData(filteredData);
      } else {
        setLeaveData(allData);
      }
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
        return { container: styles.approved, text: styles.approvedText };
      case 0:
        return { container: styles.pending, text: styles.pendingText };
      case 2:
        return { container: styles.denied, text: styles.deniedText };
      default:
        return {};
    }
  };

  const handleDateChange = (event, date) => {
    setShowPicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const clearFilter = () => {
    setSelectedDate(null);
  };

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> // ✅ Correct way
      }
    >
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
            <CustomText style={[globalStyles.f16Bold, globalStyles.textWhite]}>
              Add Request
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="calendar-outline" size={25} color={color.white} />
          </TouchableOpacity>

          {selectedDate && (
            <TouchableOpacity
              onPress={clearFilter}
              style={styles.iconButtonclear}
            >
              <Ionicons name="close-circle" size={25} color={color.white} />
            </TouchableOpacity>
          )}
        </View>

        {showPicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

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
                <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
                  <View style={globalStyles.flex1}>
                    <CustomText
                      style={[
                        globalStyles.f12Bold,
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
    width: "60%",
    alignItems: "center",
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  iconButton: {
    alignItems: "center",
    width: "15%",
    backgroundColor: color.primary,
    padding: 10,
    borderRadius: 10,
  },
  iconButtonclear: {
    alignItems: "center",
    width: "15%",
    backgroundColor: color.fullredLight,
    padding: 10,
    borderRadius: 10,
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
    backgroundColor: color.primary,
  },
  approvedText: {
    color: color.white,
  },
  pending: {
    backgroundColor: color.pending,
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
