import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { useNavigation, useRoute } from "@react-navigation/native";
import buddy from "../../assets/images/buddy.png";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { API_BASE_URL_IMAGE } from "@env";
import axios from "axios";
const initialServices = [
  { id: 1, label: "Leather Fabric Seat Polishing", completed: true },
  { id: 2, label: "AC Vent Sanitization", completed: true },
  { id: 3, label: "Mat Washing & Vacuuming", completed: true },
];

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
  const [services, setServices] = useState(initialServices);
  const [reason, setReason] = useState("");
  const [selectedReason2, setSelectedReason2] = useState("Customer Pending");
  const [selectedReason, setSelectedReason] = useState(null);
  const anyServicePending = services.some((service) => !service.completed);
  const MAX_TIME = 5;
  const bookingId = booking.BookingID;
  console.log(booking);
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

  const toggleService = (id) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const extendedTime =
    actualTime > estimatedTime ? actualTime - estimatedTime : 0;

  const reasonsList = [];

  const pendingservices = [
    "Material Shortage",
    "Customer said not to do",
    "Unable to do that service part",
  ];

  // const CollectPayment = () => {
  //   navigation.navigate("CollectPayment");
  // };
  const updateTechnicianTracking = async (actionType) => {
    try {
      await axios.post(
        "https://api.mycarsbuddy.com/api/TechnicianTracking/UpdateTechnicianTracking",
        {
          bookingID: bookingId,
          actionType: actionType,
        }
      );
      console.log("=================", bookingId);

      console.log(`${actionType} action sent successfully`);
    } catch (error) {
      console.error(`Error sending ${actionType} action:`, error.message);
      Alert.alert("Error", `Failed to send ${actionType} action.`);
    }
  };

  return (
    <ScrollView style={globalStyles.bgcontainer}>
      <View style={[globalStyles.container]}>
        <CustomText style={[globalStyles.f24Bold, globalStyles.primary]}>
          Booking ID:{" "}
          <CustomText style={[globalStyles.black]}>TG234518</CustomText>
        </CustomText>

        <View style={{ marginTop: 12 }}>
          <CustomText style={[globalStyles.f14Bold, globalStyles.mb2]}>
            Please check completed services
          </CustomText>

          {services.map((service) => (
            <View
              key={service.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <TouchableOpacity onPress={() => toggleService(service.id)}>
                <Ionicons
                  name={service.completed ? "checkbox" : "square-outline"}
                  size={24}
                  color={service.completed ? "#0D9276" : "#999"}
                />
              </TouchableOpacity>
              <CustomText style={[globalStyles.ml2]}>
                {service.label}
              </CustomText>
            </View>
          ))}

          {/* Show this if any checkbox is not checked */}
          {anyServicePending && (
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
          )}
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
            <CustomText style={{ color: "white", fontWeight: "600" }}>
              Estimated Time
            </CustomText>
            <CustomText
              style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
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
            <CustomText style={{ color: "white", fontWeight: "600" }}>
              Extended Time
            </CustomText>
            <CustomText
              style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
            >
              {extendedTime > 0 ? formatReadableTime(extendedTime) : "0 min"}
            </CustomText>
          </View>
        </View>

        {/* Buddy image */}
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <Image
            source={buddy}
            resizeMode="contain"
            style={{ width: 200, height: 200 }}
          />
        </View>

        {/* Total Time */}
        <View
          style={{
            backgroundColor: "#000",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <CustomText style={{ color: "white", fontSize: 16 }}>
            Total Hours
          </CustomText>
          <CustomText
            style={{ color: "white", fontSize: 20, fontWeight: "bold" }}
          >
            {formatReadableTime(actualTime)}
          </CustomText>
        </View>

        {/* Reason for extended time */}
        {extendedTime > 0 && (
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
            >
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

              {leads.map((item, index) => (
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
        )}

        <TouchableOpacity
          // onPress={CollectPayment}
          onPress={async () => {
            await updateTechnicianTracking("ServiceEnded");
            navigation.navigate("CollectPayment");
          }}
          style={globalStyles.blackButton}
        >
          <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>
            Completed
          </CustomText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
