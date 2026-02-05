import React, { useState } from "react";
import {
  ScrollView,
  TextInput,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
  StatusBar,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { useNavigation } from "@react-navigation/native";

export default function LeaveRequest() {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [errors, setErrors] = useState({});
  const [subject, setSubject] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const navigation = useNavigation();

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const showErrorModal = (message) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleSendRequest = async () => {
    let newErrors = {};
    if (!subject.trim()) newErrors.subject = "Please enter a subject";
    if (!fromDate) newErrors.fromDate = "Please select from date";
    if (!toDate) newErrors.toDate = "Please select to date";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate && fromDate <= today) {
      newErrors.fromDate = "From date must be a future date";
    }

    if (fromDate && toDate && toDate < fromDate) {
      newErrors.toDate = "To date cannot be before From date";
    }

    if (!leaveReason.trim())
      newErrors.leaveReason = "Please enter leave reason";
    else if (leaveReason.trim().length < 5)
      newErrors.leaveReason = "Leave reason must be at least 5 characters";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const techID = await AsyncStorage.getItem("techID");

      if (!techID) {
        showErrorModal("Technician ID not found");
        return;
      }

      const currentDateTime = new Date();
      console.log("currentDateTime-------------------------", currentDateTime);
      const payload = {
        techID: parseInt(techID),
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        leaveReason: leaveReason.trim(),
        requestedToId: 4,
        requestedDate: formatDateTime(currentDateTime),
      };

      const response = await axios.post(
        `${API_BASE_URL}LeaveRequest`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setFromDate(null);
        setToDate(null);
        setLeaveReason("");
        setErrors({});
        showErrorModal("Leave request sent successfully!");
      } else {
        showErrorModal("Failed to send request");
      }
    } catch (error) {
      console.error("Error:", error?.response?.data || error.message);
      showErrorModal("Something went wrong");
    }
  };
  const handleCancel = () => {
    setFromDate(null);
    setToDate(null);
    setLeaveReason("");
    setSubject("");
    setErrors({});
  };

  const leaveList = () => {
    setModalVisible(false);
    navigation.navigate("leaveRequestList");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={[globalStyles.bgcontainer]}
    >
      <StatusBar backgroundColor={color.primary} barStyle="light-content" />
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.mb3]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={color.white} />
          </TouchableOpacity>
          <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite, globalStyles.ml3]}>
            Add Leave Request
          </CustomText>
        </View>
        <CustomText style={[globalStyles.f12Regular, globalStyles.textWhite, globalStyles.ml3]}>
          Submit your leave request for approval
        </CustomText>
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>
        {/* Subject Field */}
        <View style={[globalStyles.w100, globalStyles.mb4]}>
          <CustomText
            style={[globalStyles.f16SemiBold, globalStyles.mb2, globalStyles.primary]}
          >
            Leave Subject
          </CustomText>
          <TextInput
            placeholder="Enter leave subject"
            placeholderTextColor={color.neutral[400]}
            style={[globalStyles.inputBox, errors.subject && styles.inputError]}
            value={subject}
            onChangeText={setSubject}
          />
          {errors.subject && (
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.error,
                globalStyles.mt1,
              ]}
            >
              {errors.subject}
            </CustomText>
          )}
        </View>

        {/* Date Range Section */}
        <View style={[globalStyles.mb4]}>
          <CustomText style={[globalStyles.f16SemiBold, globalStyles.mb3, globalStyles.primary]}>
            Leave Duration
          </CustomText>
          
          <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.alineItemscenter]}>
            {/* From Date */}
            <View style={styles.dateInputContainer}>
              <CustomText style={[globalStyles.f14SemiBold, globalStyles.mb2, globalStyles.neutral500]}>
                From Date
              </CustomText>
              <TouchableOpacity
                onPress={() => setShowFromPicker(true)}
                style={[styles.dateInput, errors.fromDate && styles.inputError]}
              >
                <Ionicons name="calendar-outline" size={20} color={color.primary} style={globalStyles.mr2} />
                <CustomText style={[globalStyles.f12Regular, fromDate ? globalStyles.black : globalStyles.neutral500]}>
                  {fromDate ? formatDate(fromDate) : "Select date"}
                </CustomText>
              </TouchableOpacity>
              {errors.fromDate && (
                <CustomText style={[globalStyles.f12Regular, globalStyles.error, globalStyles.mt1]}>
                  {errors.fromDate}
                </CustomText>
              )}
            </View>

            {/* Separator */}
            <View style={styles.dateSeparator}>
              <Ionicons name="arrow-forward" size={16} color={color.neutral[400]} />
            </View>

            {/* To Date */}
            <View style={styles.dateInputContainer}>
              <CustomText style={[globalStyles.f14SemiBold, globalStyles.mb2, globalStyles.neutral500]}>
                To Date
              </CustomText>
              <TouchableOpacity
                onPress={() => setShowToPicker(true)}
                style={[styles.dateInput, errors.toDate && styles.inputError]}
              >
                <Ionicons name="calendar-outline" size={20} color={color.primary} style={globalStyles.mr2} />
                <CustomText style={[globalStyles.f12Regular, toDate ? globalStyles.black : globalStyles.neutral500]}>
                  {toDate ? formatDate(toDate) : "Select date"}
                </CustomText>
              </TouchableOpacity>
              {errors.toDate && (
                <CustomText style={[globalStyles.f12Regular, globalStyles.error, globalStyles.mt1]}>
                  {errors.toDate}
                </CustomText>
              )}
            </View>
          </View>

          {/* Date Pickers */}
          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                setShowFromPicker(false);
                if (selectedDate) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const picked = new Date(selectedDate);
                  picked.setHours(0, 0, 0, 0);

                  if (picked <= today) {
                    setErrors((prev) => ({
                      ...prev,
                      fromDate: "From date must be a future date",
                    }));
                    return;
                  } else {
                    setErrors((prev) => ({ ...prev, fromDate: null }));
                  }

                  setFromDate(picked);

                  // Clear toDate if it's before new fromDate
                  if (toDate && picked > toDate) {
                    setToDate(null);
                  }
                }
              }}
            />
          )}

          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                setShowToPicker(false);
                if (selectedDate) {
                  const picked = new Date(selectedDate);
                  picked.setHours(0, 0, 0, 0);

                  if (fromDate && picked < fromDate) {
                    setErrors((prev) => ({
                      ...prev,
                      toDate: "To date cannot be before From date",
                    }));
                    return;
                  } else {
                    setErrors((prev) => ({ ...prev, toDate: null }));
                  }

                  setToDate(picked);
                }
              }}
            />
          )}
        </View>

        {/* Leave Reason Section */}
        <View style={[globalStyles.w100, globalStyles.mb4]}>
          <CustomText style={[globalStyles.f16SemiBold, globalStyles.mb2, globalStyles.primary]}>
            Leave Reason
          </CustomText>
          <TextInput
            placeholder="e.g., Sick leave, Personal emergency, Going to village..."
            placeholderTextColor={color.neutral[400]}
            multiline
            maxLength={200}
            style={[globalStyles.textArea, errors.leaveReason && styles.inputError]}
            value={leaveReason}
            onChangeText={setLeaveReason}
          />
          <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.alineItemscenter, globalStyles.mt1]}>
            {errors.leaveReason ? (
              <CustomText style={[globalStyles.f12Regular, globalStyles.error]}>
                {errors.leaveReason}
              </CustomText>
            ) : (
              <View />
            )}
            <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500]}>
              {leaveReason.length}/200
            </CustomText>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSendRequest}>
          <Ionicons name="send" size={20} color={color.white} style={globalStyles.mr2} />
          <CustomText style={[globalStyles.f16SemiBold, globalStyles.textWhite]}>
            Send Request
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
          <Ionicons name="close" size={20} color={color.neutral[600]} style={globalStyles.mr2} />
          <CustomText style={[globalStyles.f16SemiBold, globalStyles.neutral600]}>
            Cancel
          </CustomText>
        </TouchableOpacity>
      </View>
      {/* Success/Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalIconContainer}>
              <Ionicons 
                name={modalMessage.includes("successfully") ? "checkmark-circle" : "alert-circle"} 
                size={48} 
                color={modalMessage.includes("successfully") ? color.primary : color.error} 
              />
            </View>
            <CustomText style={[globalStyles.f18SemiBold, globalStyles.textac, globalStyles.mb2]}>
              {modalMessage.includes("successfully") ? "Success!" : "Notice"}
            </CustomText>
            <CustomText style={[globalStyles.f12Regular, globalStyles.textac, globalStyles.neutral500, globalStyles.mb4]}>
              {modalMessage}
            </CustomText>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={leaveList}
            >
              <CustomText style={[globalStyles.f16SemiBold, globalStyles.textWhite]}>
                OK
              </CustomText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Header Section
  headerSection: {
    backgroundColor: color.primary,
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    marginTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Form Card
  formCard: {
    backgroundColor: color.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Date Input Styles
  dateInputContainer: {
    flex: 1,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.neutral[200],
    borderRadius: 12,
    backgroundColor: color.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  dateSeparator: {
    marginHorizontal: 12,
    marginTop: 20,
  },
  inputError: {
    borderColor: color.error,
    borderWidth: 1,
  },

  // Action Buttons
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: color.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.neutral[300],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: color.white,
    padding: 28,
    borderRadius: 20,
    width: "85%",
    alignItems: "center",
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: color.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    minWidth: 120,
  },

  // Scroll Content
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
