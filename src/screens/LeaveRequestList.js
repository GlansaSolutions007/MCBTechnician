import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
  StatusBar,
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
import { API_BASE_URL } from "@env";
export default function LeaveRequestList() {
  const navigation = useNavigation();
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // ✅ Added state
  const [pulse] = useState(new Animated.Value(0));

  // Start skeleton pulse when loading
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [loading, pulse]);

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
        `${API_BASE_URL}LeaveRequest/Techid?TechId=${techID}`,
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

  // Skeleton Components
  const SkeletonText = ({ width, height = 16, style = {} }) => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius: height / 2,
            backgroundColor: bg,
          },
          style,
        ]}
      />
    );
  };

  const SkeletonButton = ({ width, height = 44, style = {} }) => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius: 12,
            backgroundColor: bg,
          },
          style,
        ]}
      />
    );
  };

  const SkeletonRequestCard = () => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <View style={styles.requestCard}>
        <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.alineItemsstart]}>
          <View style={globalStyles.flex1}>
            {/* Subject line */}
            <Animated.View
              style={[
                styles.skeletonSubjectLine,
                { backgroundColor: bg, marginBottom: 8 }
              ]}
            />
            
            {/* Date row */}
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.mb2]}>
              <Animated.View style={[styles.skeletonIcon, { backgroundColor: bg, marginRight: 8 }]} />
              <Animated.View
                style={[
                  styles.skeletonDateLine,
                  { backgroundColor: bg }
                ]}
              />
            </View>

            {/* Time row */}
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              <Animated.View style={[styles.skeletonIcon, { backgroundColor: bg, marginRight: 8 }]} />
              <Animated.View
                style={[
                  styles.skeletonTimeLine,
                  { backgroundColor: bg }
                ]}
              />
            </View>
          </View>
          
          {/* Status badge */}
          <Animated.View
            style={[
              styles.skeletonStatusBadge,
              { backgroundColor: bg }
            ]}
          />
        </View>
      </View>
    );
  };

  const LeaveRequestSkeleton = () => (
    <ScrollView style={[globalStyles.bgcontainer]}>
           <View style={styles.contentSection2}>
        <View style={styles.requestsList}>
          {[1, 2, 3, 4, 5].map((item, index) => (
            <SkeletonRequestCard key={index} />
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar backgroundColor={color.primary} barStyle="light-content" />
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.mb3]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={color.white} />
          </TouchableOpacity>
          <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite, globalStyles.ml3]}>
            Leave Request
          </CustomText>
        </View>
        <CustomText style={[globalStyles.f12Regular, globalStyles.textWhite, globalStyles.ml3]}>
          View and manage your leave requests
        </CustomText>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.alineItemscenter]}>
          <TouchableOpacity
            onPress={() => navigation.navigate("leaveRequest")}
            style={styles.addButton}
          >
            <Ionicons name="add" size={20} color={color.white} style={globalStyles.mr2} />
            <CustomText style={[globalStyles.f16SemiBold, globalStyles.textWhite]}>
              Add Request
            </CustomText>
          </TouchableOpacity>

          <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, { gap: 8 }]}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={color.primary} />
            </TouchableOpacity>

            {selectedDate && (
              <TouchableOpacity
                onPress={clearFilter}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={color.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {selectedDate && (
          <View style={styles.selectedDateContainer}>
            <Ionicons name="calendar" size={16} color={color.primary} style={globalStyles.mr2} />
            <CustomText style={[globalStyles.f14SemiBold, globalStyles.primary]}>
              Filtered by: {moment(selectedDate).format("MMM DD, YYYY")}
            </CustomText>
          </View>
        )}
      </View>

      {/* Date Picker */}
      {showPicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Content Section */}
      <View style={styles.contentSection}>
        {loading ? (
          <LeaveRequestSkeleton />
        ) : leaveData.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="calendar-outline" size={64} color={color.neutral[300]} />
            <CustomText style={[globalStyles.f18SemiBold, globalStyles.neutral500, globalStyles.mt3, globalStyles.textac]}>
              No Leave Requests
            </CustomText>
            <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500, globalStyles.mt2, globalStyles.textac]}>
              {selectedDate 
                ? `No leave requests found for ${moment(selectedDate).format("MMM DD, YYYY")}`
                : "You haven't submitted any leave requests yet"
              }
            </CustomText>
            {!selectedDate && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate("leaveRequest")}
              >
                <Ionicons name="add" size={20} color={color.white} style={globalStyles.mr2} />
                <CustomText style={[globalStyles.f16SemiBold, globalStyles.textWhite]}>
                  Create First Request
                </CustomText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.requestsList}>
            {leaveData.map((item, index) => {
              const statusStyle = getStatusStyle(item.Status);
              return (
                <View key={index} style={styles.requestCard}>
                  <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.alineItemsstart]}>
                    <View style={globalStyles.flex1}>
                      <CustomText
                        style={[
                          globalStyles.f16SemiBold,
                          styles.subjectText,
                          globalStyles.mb2,
                        ]}
                      >
                        {item.LeaveReason || "Leave Request"}
                      </CustomText>
                      
                      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.mb2]}>
                        <Ionicons name="calendar" size={16} color={color.neutral[500]} style={globalStyles.mr2} />
                        <CustomText style={[globalStyles.f12Regular, globalStyles.neutral600]}>
                          {moment(item.FromDate).format("MMM DD")} - {moment(item.ToDate).format("MMM DD, YYYY")}
                        </CustomText>
                      </View>

                      {/* <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
                        <Ionicons name="time" size={16} color={color.neutral[500]} style={globalStyles.mr2} />
                        <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500]}>
                          Requested at {moment(item.FromDate).format("hh:mm A")}
                        </CustomText>
                      </View> */}
                    </View>
                    
                    <View style={[styles.statusBadge, statusStyle.container]}>
                      <CustomText style={[styles.statusText, statusStyle.text]}>
                        {getStatusText(item.Status)}
                      </CustomText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Header Section
  headerSection: {
    backgroundColor: color.primary,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerContainer: {
    backgroundColor: color.primary,
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Filter Section
  filterSection: {
    backgroundColor: color.white,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addButton: {
    backgroundColor: color.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: color.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.neutral[200],
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: color.error,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: color.neutral[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.neutral[200],
  },

  // Content Section

  contentSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  contentSection2: {
    paddingHorizontal: 0,
    marginHorizontal: 2,
    paddingBottom: 30,
  },

  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateButton: {
    backgroundColor: color.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Request Cards
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: color.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subjectText: {
    color: color.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    minWidth: 80,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  approved: {
    backgroundColor: color.primary,
  },
  approvedText: {
    color: color.white,
  },
  pending: {
    backgroundColor: color.pending || "#FFA500",
  },
  pendingText: {
    color: color.white,
  },
  denied: {
    backgroundColor: color.fullredLight || "#FF6B6B",
  },
  deniedText: {
    color: color.white,
  },

  // Skeleton Styles
  skeletonBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  skeletonSubjectLine: {
    width: "70%",
    height: 16,
    borderRadius: 8,
  },
  skeletonDateLine: {
    width: 120,
    height: 14,
    borderRadius: 7,
  },
  skeletonTimeLine: {
    width: 100,
    height: 12,
    borderRadius: 6,
  },
  skeletonStatusBadge: {
    width: 80,
    height: 28,
    borderRadius: 8,
  },
});
