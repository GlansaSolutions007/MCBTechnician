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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import profilepic from "../../assets/images/persontwo.jpg";
import locationicon from "../../assets/icons/Navigation/LocationsPin.png";
import { color } from "../styles/theme";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";

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

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
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

      const payload = {
        techID: parseInt(techID),
        fromDate: new Date(fromDate).toISOString(),
        toDate: new Date(toDate).toISOString(),
        leaveReason: leaveReason.trim(),
        requestedToId: 4,
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

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={[globalStyles.bgcontainer]}
    >
      <View style={[globalStyles.w100, globalStyles.mb4]}>
        <CustomText
          style={[globalStyles.f14Bold, globalStyles.mb2, globalStyles.primary]}
        >
          Leave Subject
        </CustomText>
        <TextInput
          placeholder="Enter here"
          style={[globalStyles.inputBox]}
          value={subject}
          onChangeText={setSubject}
        />
        {errors.subject && (
          <CustomText
            style={[
              globalStyles.f10Light,
              globalStyles.error,
              globalStyles.ml2,
            ]}
          >
            {errors.subject}
          </CustomText>
        )}
      </View>

      <View
        style={[
          globalStyles.flexrow,
          globalStyles.justifysb,
          globalStyles.mb4,
          globalStyles.alineItemscenter,
        ]}
      >
        <View style={styles.dateInputBox}>
          <CustomText style={[globalStyles.f16SemiBold, globalStyles.mb2]}>
            From date
          </CustomText>
          <TouchableOpacity
            onPress={() => setShowFromPicker(true)}
            style={[globalStyles.inputBox]}
          >
            <CustomText>
              {fromDate ? formatDate(fromDate) : "DD/MM/YYYY"}
            </CustomText>
          </TouchableOpacity>

          {errors.fromDate && (
            <CustomText
              style={[
                globalStyles.f10Light,
                globalStyles.error,
                globalStyles.ml2,
              ]}
            >
              {errors.fromDate}
            </CustomText>
          )}
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
        </View>

        <CustomText style={[globalStyles.f20Bold, globalStyles.mt4]}>
          –
        </CustomText>

        <View style={styles.dateInputBox}>
          <CustomText style={[globalStyles.f16SemiBold, globalStyles.mb2]}>
            To date
          </CustomText>
          <TouchableOpacity
            onPress={() => setShowToPicker(true)}
            style={[globalStyles.inputBox]}
          >
            <CustomText>
              {toDate ? formatDate(toDate) : "DD/MM/YYYY"}
            </CustomText>
          </TouchableOpacity>
          {errors.toDate && (
            <CustomText
              style={[
                globalStyles.f10Light,
                globalStyles.error,
                globalStyles.ml2,
              ]}
            >
              {errors.toDate}
            </CustomText>
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
      </View>

      <View style={styles.alertBox}>
        <CustomText style={[styles.alertText, globalStyles.f12SemiBold]}>
          ❗ You have bookings on the above selected dates.
          {"\n"}Please check with dealer
        </CustomText>
      </View>

      {/* <View style={styles.alertBox}>
        <CustomText style={[styles.alertText, globalStyles.f12SemiBold]}>
          ❗ You have bookings on the above selected dates.
        </CustomText>
        <TouchableOpacity style={styles.cancelButton}>
          <CustomText style={styles.cancelButtonText}>
            Cancel Bookings
          </CustomText>
        </TouchableOpacity>
      </View> */}

      <View style={[globalStyles.w100]}>
        <CustomText
          style={[globalStyles.f16Bold, globalStyles.primary, globalStyles.mb2]}
        >
          Leave reason
        </CustomText>
        <TextInput
          placeholder="eg. Sick leave...., Going to village"
          multiline
          maxLength={100}
          style={globalStyles.textArea}
          value={leaveReason}
          onChangeText={setLeaveReason}
        />
        {errors.leaveReason && (
          <CustomText
            style={[
              globalStyles.f10Light,
              globalStyles.error,
              globalStyles.ml2,
            ]}
          >
            {errors.leaveReason}
          </CustomText>
        )}
        {/* <CustomText style={[globalStyles.f12Regular, globalStyles.alineSelfend]}>
          100 / 100
        </CustomText> */}
      </View>

      <View style={[globalStyles.mv5]}>
        {/* <CustomText
          style={[globalStyles.f16Bold, globalStyles.primary, globalStyles.mb2]}
        >
          Requesting to
        </CustomText>
        <View style={[globalStyles.flexrow]}>
          <View
            style={[
              globalStyles.alineItemscenter,
              globalStyles.mb3,
              globalStyles.mr4,
            ]}
          >
            <Image source={profilepic} style={styles.avatar} />
          </View>
          <View>
            <CustomText style={[globalStyles.f24Bold, globalStyles.primary]}>
              Bhuvan Raj
            </CustomText>
            <CustomText style={[globalStyles.f12Medium]}>
              Mobile: 9988776655
            </CustomText>
            <CustomText style={[globalStyles.f12Medium]}>
              Email : bhuvan@carbuddy.com
            </CustomText>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt2,
                globalStyles.alineItemscenter,
              ]}
            >
              <View style={styles.iconbg}>
                <Image source={locationicon} style={styles.icons} />
              </View>
              <CustomText style={globalStyles.f12Bold}>
                Telangana, Hyderabad
              </CustomText>
            </View>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt1,
                globalStyles.alineItemscenter,
              ]}
            ></View>
          </View>
        </View> */}

        <View
          style={[
            globalStyles.flexrow,
            globalStyles.justifycenter,
            globalStyles.justifysb,
          ]}
        >
          <TouchableOpacity style={styles.btnone} onPress={handleSendRequest}>
            <CustomText style={styles.cancelButtonText}>
              Send Request
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btntwo}>
            <CustomText style={styles.cancelButtonText}>Cancel</CustomText>
          </TouchableOpacity>
        </View>
      </View>
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
            <CustomText style={globalStyles.f14Bold}>{modalMessage}</CustomText>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifycenter,
                globalStyles.mt4,
              ]}
            >
              <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={() => setModalVisible(false)}
              >
                <CustomText style={{ color: "white" }}>OK</CustomText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    width: "80%",
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: color.primary,
  },
  btnone: {
    backgroundColor: color.primary,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    width: "70%",
  },
  btntwo: {
    backgroundColor: color.black,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    width: "25%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  icons: {
    width: 11,
    height: 16,
  },
  iconbg: {
    padding: 6,
    height: 30,
    width: 30,
    backgroundColor: color.white,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  avatar: {
    width: 130,
    height: 150,
    borderWidth: 8,
    borderColor: color.white,
    borderRadius: 8,
  },
  dateInputBox: {
    width: "45%",
  },
  alertBox: {
    backgroundColor: "#ffe5e5",
    borderColor: "#ff4d4d",
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  alertText: {
    color: "#ff1a1a",
    lineHeight: 20,
  },
  cancelButton: {
    marginTop: 12,
    backgroundColor: "#ff1a1a",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
