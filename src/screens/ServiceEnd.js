import React, { useState } from "react";
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

const formatReadableTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hrs > 0 ? `${hrs} hr ` : ""}${mins} min${
    secs > 0 ? ` ${secs} sec` : ""
  }`;
};
const initialServices = [
  { id: 1, label: "Leather Fabric Seat Polishing", completed: false },
  { id: 2, label: "AC Vent Sanitization", completed: false },
  { id: 3, label: "Mat Washing & Vacuuming", completed: false },
];

export default function ServiceEnd() {
  const navigation = useNavigation();
  const CollectPayment = () => {
    navigation.navigate("CollectPayment");
  };
  const [reason, setReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("Customer Delayed");
  const [selectedReason2, setSelectedReason2] = useState("Customer Pending");

  const route = useRoute();
  const { estimatedTime = 0, actualTime = 0 } = route.params || {};
  const [services, setServices] = useState(initialServices);
  const toggleService = (id) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };
  const extendedTime =
    actualTime > estimatedTime ? actualTime - estimatedTime : 0;
  const reasonsList = [
    "Customer Delayed",
    "Took Break",
    "Argument or Discussion",
  ];
  const pendingservices = ["1", "2", "3"];
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 24,
          }}
        >
          {/* Estimated Time */}
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
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <Image
            source={buddy}
            resizeMode="contain"
            style={{ width: 200, height: 200 }}
          />
        </View>
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
          {reasonsList.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedReason(item)}
              style={[
                globalStyles.mb2,
                globalStyles.ph2,
                globalStyles.pv4,
                globalStyles.radius,
                {
                  backgroundColor:
                    selectedReason === item ? "#0D6C62" : "#E9E9E9",
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

        <TouchableOpacity
          onPress={CollectPayment}
          style={globalStyles.blackButton}
        >
          <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>
            Collect Payment
          </CustomText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
