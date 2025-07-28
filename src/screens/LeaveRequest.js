import React, { useState } from "react";
import {
  ScrollView,
  TextInput,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import person from "../../assets/icons/Navigation/techProfile.png";
import profilepic from "../../assets/images/persontwo.jpg";
import locationicon from "../../assets/icons/Navigation/LocationsPin.png";
import { color } from "../styles/theme";
export default function LeaveRequest() {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
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
        <TextInput placeholder="Enter here" style={[globalStyles.inputBox]} />
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
          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                setShowFromPicker(false);
                if (selectedDate) {
                  setFromDate(selectedDate);
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
          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                setShowToPicker(false);
                if (selectedDate) {
                  setToDate(selectedDate);
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

      <View style={styles.alertBox}>
        <CustomText style={[styles.alertText, globalStyles.f12SemiBold]}>
          ❗ You have bookings on the above selected dates.
        </CustomText>
        <TouchableOpacity style={styles.cancelButton}>
          <CustomText style={styles.cancelButtonText}>
            Cancel Bookings
          </CustomText>
        </TouchableOpacity>
      </View>

      <View style={[globalStyles.w100]}>
        <CustomText style={[globalStyles.f16Bold,globalStyles.primary, globalStyles.mb2]}>
          Leave reason
        </CustomText>
        <TextInput
          placeholder="eg. Sick leave...., Going to village"
          multiline
          maxLength={100}
          style={globalStyles.textArea}
        />
        {/* <CustomText style={[globalStyles.f12Regular, globalStyles.alineSelfend]}>
          100 / 100
        </CustomText> */}
      </View>

      <View style={[ globalStyles.mv5]}>
        <CustomText style={[globalStyles.f16Bold,globalStyles.primary, globalStyles.mb2]}>Requesting to</CustomText>
      <View style={[globalStyles.flexrow, ]}>
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
          >
          </View>
        </View>
      </View>
      <View style={[globalStyles.flexrow, globalStyles.justifycenter, globalStyles.justifysb]}>
       <TouchableOpacity style={styles.btnone}>
          <CustomText style={styles.cancelButtonText}>
            Send Request
          </CustomText>
        </TouchableOpacity>
       <TouchableOpacity style={styles.btntwo}>
          <CustomText style={styles.cancelButtonText}>
            Cancel
          </CustomText>
        </TouchableOpacity>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btnone:{
    backgroundColor: color.primary,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    width: "70%",
  },
  btntwo:{
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
