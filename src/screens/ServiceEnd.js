import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Pressable,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Vibration,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { useNavigation, useRoute } from "@react-navigation/native";
import buddy from "../../assets/images/buddy.png";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL, API_BASE_URL_IMAGE } from "@env";
import defaultAvatar from "../../assets/images/buddy.png";
import { color } from "../styles/theme";

const formatReadableTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs > 0 ? `${hrs} hr ` : ""}${mins} min${
    secs > 0 ? ` ${secs} sec` : ""
  }`;
};

export default function ServiceEnd() {
  const navigation = useNavigation();
  const route = useRoute();
  const { estimatedTime = 0, actualTime = 0 } = route.params || {};
  const [leads, setLeads] = useState([]);
  const { booking } = route.params;
  // const [services, setServices] = useState(booking?.Packages || []);
  const [services, setServices] = useState(
    booking?.Packages.flatMap((pkg, pkgIndex) =>
      pkg.Category.SubCategories?.flatMap((sub, subIndex) =>
        sub.Includes?.map((inc, incIndex) => ({
          ...inc,
          completed: true,
          uniqueKey: `${pkgIndex}-${subIndex}-${incIndex}-${inc.IncludeID}`,
        }))
      )
    ) || []
  );

  const [reason, setReason] = useState("");
  const [selectedReason2, setSelectedReason2] = useState("Customer Pending");
  const [selectedReason, setSelectedReason] = useState(null);
  const anyServicePending = services.some((service) => !service.completed);
  const bookingId = booking.BookingID;

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const Completedservice = async () => {
    navigation.navigate("CollectPayment", { booking });
  };
  // const Dashboard = async () => {
  //   if (!otp || otp.length !== 6) {
  //     setError("Please enter a valid 6-digit OTP");
  //     return;
  //   }
  //   const isValid = await updateTechnicianTracking("Completed");
  //   if (!isValid) {
  //     return;
  //   }
  //   await updateTechnicianTracking("Completed");

  //   navigation.reset({
  //     index: 0,
  //     routes: [
  //       { name: "CustomerTabNavigator", params: { screen: "Dashboard" } },
  //     ],
  //   });
  // };

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}AfterServiceLeads`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLeads(res.data.map((item) => item));
      } catch (error) {
        console.log("Error fetching leads:", error);
      }
    };

    fetchLeads();
  }, []);

  // const toggleService = (id) => {
  //   setServices((prev) =>
  //     prev.map((s) =>
  //       s.IncludeID === id ? { ...s, completed: !s.completed } : s
  //     )
  //   );
  // };

  const extendedTime =
    actualTime > estimatedTime ? actualTime - estimatedTime : 0;

  const reasonsList = [];

  const pendingservices = [
    "Material Shortage",
    "Customer said not to do",
    "Unable to do that service part",
  ];
  

  return (
    <KeyboardAvoidingView
      style={[globalStyles.flex1, globalStyles.bgwhite]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        style={globalStyles.bgcontainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[globalStyles.container]}>
          <View
            style={[
              globalStyles.bgwhite,
              globalStyles.radius,
              globalStyles.card,
              globalStyles.p3,
              globalStyles.mt3,
            ]}
          >
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              {/* <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  booking.CustomerName
                )}&background=E8E8E8`,
              }}
              style={{ width: 46, height: 46, borderRadius: 10 }}
            /> */}
              <Image
                source={
                  booking.ProfileImage
                    ? { uri: `${API_BASE_URL_IMAGE}${booking.ProfileImage}` }
                    : defaultAvatar
                }
                style={{ width: 46, height: 46, borderRadius: 10 }}
              />
              <View style={[globalStyles.ml3, { flex: 1 }]}>
                <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                  {booking.CustomerName}
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Medium, globalStyles.neutral500]}
                >
                  Mobile: {booking.PhoneNumber}
                </CustomText>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate([0, 200, 100, 300]);

                  const phoneNumber = booking.PhoneNumber;
                  if (phoneNumber) {
                    Linking.openURL(`tel:${phoneNumber}`);
                  } else {
                    Alert.alert("Error", "Phone number not available");
                  }
                }}
              >
                <Ionicons
                  style={[
                    globalStyles.p2,
                    globalStyles.bgprimary,
                    globalStyles.borderRadiuslarge,
                  ]}
                  name="call"
                  size={20}
                  color={color.white}
                />
              </TouchableOpacity>
            </View>
            <View style={[globalStyles.divider, globalStyles.mt2]} />
            <View style={[globalStyles.flexrow]}>
              <View
                style={[
                  globalStyles.flexrow,
                  globalStyles.mt2,
                  globalStyles.alineItemscenter,
                  globalStyles.w40,
                ]}
              >
                <MaterialCommunityIcons
                  name="card-account-details-outline"
                  size={16}
                  color={color.primary}
                  style={{ marginRight: 6 }}
                />
                <CustomText
                  style={[
                    globalStyles.f10Regular,
                    globalStyles.black,
                    globalStyles.ml1,
                  ]}
                >
                  {booking.BookingTrackID}
                </CustomText>
              </View>
              <View
                style={[
                  globalStyles.flexrow,
                  globalStyles.mt2,
                  globalStyles.alineItemscenter,
                ]}
              >
                <Ionicons name="calendar" size={16} color={color.primary} />
                <CustomText
                  style={[
                    globalStyles.f10Regular,
                    globalStyles.black,
                    globalStyles.ml1,
                  ]}
                >
                  {booking.BookingDate}
                </CustomText>
              </View>
            </View>
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              <View
                style={[
                  globalStyles.flexrow,
                  globalStyles.mt2,
                  globalStyles.alineItemscenter,
                  globalStyles.w40,
                ]}
              >
                <Ionicons name="car" size={16} color={color.primary} />
                <CustomText
                  style={[
                    globalStyles.f10Regular,
                    globalStyles.black,
                    globalStyles.ml1,
                  ]}
                >
                  {booking.VehicleNumber}
                </CustomText>
              </View>
              <View
                style={[
                  globalStyles.flexrow,
                  globalStyles.mt2,
                  globalStyles.alineItemscenter,
                ]}
              >
                <Ionicons name="time-outline" size={16} color={color.primary} />
                <View style={{ flexDirection: "column" }}>
                  {booking.TimeSlot?.split(",").map((slot, index) => (
                    <CustomText
                      key={index}
                      style={[
                        globalStyles.f10Regular,
                        globalStyles.black,
                        globalStyles.ml1,
                      ]}
                    >
                      {slot.trim()}
                    </CustomText>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <CustomText style={[globalStyles.f14Bold, globalStyles.mb2]}>
              Please check completed services
            </CustomText>

            {services.map((service) => (
              <View
                key={service.uniqueKey}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Pressable
                // onPress={() => toggleService(service.IncludeID)}
                >
                  <Ionicons
                    name={service.completed ? "checkbox" : "square-outline"}
                    size={30}
                    color={service.completed ? "#0D9276" : "#999"}
                  />
                </Pressable>
                <CustomText style={[globalStyles.ml2, globalStyles.f14Bold]}>
                  {service.IncludeName}
                </CustomText>
              </View>
            ))}

            {/* Show this if any checkbox is not checked */}
            {/* {anyServicePending && (
            <View>
              <CustomText style={[globalStyles.f14Bold, globalStyles.mt2]}>
                Any obstacle for pending services?
              </CustomText>
              <View
                style={[
                  globalStyles.bgwhite,
                  globalStyles.p4,
                  globalStyles.borderRadiuslarge,
                  globalStyles.mt3,
                ]}
              >
                {pendingservices.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedReason2(item)}
                    style={[
                      globalStyles.mb2,
                      globalStyles.ph2,
                      globalStyles.pv4,
                      globalStyles.radius,
                      {
                        backgroundColor:
                          selectedReason2 === item ? "#0D6C62" : "#E9E9E9",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <CustomText
                      style={[
                        globalStyles.font16,
                        globalStyles.fontWeight600,
                        {
                          color: selectedReason2 === item ? "#fff" : "#000",
                        },
                      ]}
                    >
                      {item}
                    </CustomText>
                  </TouchableOpacity>
                ))}
                <View style={globalStyles.mt3}>
                  <CustomText
                    style={[globalStyles.font16, globalStyles.fontWeight600]}
                  >
                    Others
                  </CustomText>
                  <TextInput
                    style={[globalStyles.textArea, globalStyles.mt3]}
                    placeholder="eg. Sick leave..., Going to village"
                    value={reason}
                    onChangeText={setReason}
                    maxLength={100}
                    multiline
                  />
                </View>
              </View>
            </View>
          )} */}
          </View>

          {/* Estimated and Extended Time */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 24,
            }}
          >
            <View
              style={{
                backgroundColor: "#1A9C8D",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flex: 1,
                marginRight: 8,
                alignItems: "center",
              }}
            >
              <CustomText
                style={[globalStyles.textWhite, globalStyles.f12Bold]}
              >
                Estimated Time
              </CustomText>
              <CustomText
                style={[globalStyles.textWhite, globalStyles.f14Bold]}
              >
                {formatReadableTime(estimatedTime)}
              </CustomText>
            </View>

            <View
              style={{
                backgroundColor: "#F4A100",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flex: 1,
                marginLeft: 8,
                alignItems: "center",
              }}
            >
              <CustomText
                style={[globalStyles.textWhite, globalStyles.f12Bold]}
              >
                Extended Time
              </CustomText>
              <CustomText
                style={[globalStyles.textWhite, globalStyles.f14Bold]}
              >
                {extendedTime > 0 ? formatReadableTime(extendedTime) : "0 min"}
              </CustomText>
            </View>
          </View>

          {/* Buddy image */}
          {/* <View style={{ alignItems: "center", marginVertical: 20 }}>
            <Image
              source={buddy}
              resizeMode="contain"
              style={{ width: 200, height: 200 }}
            />
          </View> */}

          {/* Total Time */}
          <View
            style={[
              globalStyles.bgBlack,
              globalStyles.pv4,
              globalStyles.radius,
              globalStyles.mt4,
              globalStyles.alineItemscenter,
              globalStyles.p4,
            ]}
          >
            <CustomText style={[globalStyles.textWhite, globalStyles.f16Bold]}>
              Total Hours
            </CustomText>
            <CustomText style={[globalStyles.textWhite, globalStyles.f16Bold]}>
              {formatReadableTime(actualTime)}
            </CustomText>
          </View>

          {/* Reason for extended time */}
          {/* {extendedTime > 0 && (
          <View>
            <CustomText
              style={[
                globalStyles.f28Medium,
                globalStyles.neutral500,
                globalStyles.mt2,
              ]}
            >
              Hey{" "}
              <CustomText style={[globalStyles.f28Bold, globalStyles.primary]}>
                Buddy
              </CustomText>
            </CustomText>
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.neutral500,
                globalStyles.mt2,
              ]}
            >
              If the estimation time exceeded. Please feel free to mention the
              reason
            </CustomText>

            <View
              style={[
                globalStyles.bgwhite,
                globalStyles.p4,
                globalStyles.borderRadiuslarge,
                globalStyles.mt3,
              ]}
            > */}
          {/* {reasonsList.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedReason(item)}
                  style={[
                    globalStyles.mb2,
                    globalStyles.ph2,
                    globalStyles.pv4,
                    globalStyles.radius,
                    {
                      backgroundColor: selectedReason === item ? "#0D6C62" : "#E9E9E9",
                      alignItems: "center",
                    },
                  ]}
                >
                  <CustomText
                    style={[
                      globalStyles.font16,
                      globalStyles.fontWeight600,
                      {
                        color: selectedReason === item ? "#fff" : "#000",
                      },
                    ]}
                  >
                    {leads.Reason}
                  </CustomText>
                </TouchableOpacity>
              ))} */}

          {/* {leads.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedReason(item.ID)}
                  style={[
                    globalStyles.mb2,
                    globalStyles.ph2,
                    globalStyles.pv4,
                    globalStyles.radius,
                    {
                      backgroundColor:
                        selectedReason === item.ID ? "#0D6C62" : "#E9E9E9",
                      alignItems: "center",
                    },
                  ]}
                >
                  <CustomText
                    style={[
                      globalStyles.font16,
                      {
                        color: selectedReason === item.ID ? "#fff" : "#000",
                      },
                    ]}
                  >
                    {item.Reason}
                  </CustomText>
                </TouchableOpacity>
              ))}

              <View style={globalStyles.mt3}>
                <CustomText
                  style={[globalStyles.font16, globalStyles.fontWeight600]}
                >
                  Others
                </CustomText>
                <TextInput
                  style={[globalStyles.textArea, globalStyles.mt3]}
                  placeholder="eg. Sick leave..., Going to village"
                  value={reason}
                  onChangeText={setReason}
                  maxLength={100}
                  multiline
                />
              </View>
            </View>
          </View>
        )} */}

          

          {/* {(booking.PaymentMode == "COS" || booking.PaymentMode == "cos") && (
            <TouchableOpacity
              onPress={CollectPayment}
              style={[
                globalStyles.blackButton,
                { marginTop: 16, marginBottom: keyboardVisible ? 130 : 20 },
              ]}
            >
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textWhite]}
              >
                Collect cash
              </CustomText>
            </TouchableOpacity>
          )} */}
          {(booking.PaymentMode == "COS" || booking.PaymentMode == "cos") && (
            <TouchableOpacity
              onPress={Completedservice}
              style={[
                globalStyles.blackButton,
                { marginTop: 16, marginBottom: keyboardVisible ? 130 : 12 },
              ]}
            >
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textWhite]}
              >
                Completed
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
