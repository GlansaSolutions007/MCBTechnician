import React, { useState } from "react";
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import CustomText from "../components/CustomText";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import globalStyles from "../styles/globalStyles";
import profile1 from "../../assets/images/person.jpg";
// import AvailabilityHeader from "../components/AvailabilityHeader";
import { color } from "../styles/theme";
const reviews = [
  {
    id: "1",
    name: "Jhon Dio",
    time: "3 hrs ago",
    image: profile1,
    text: "The technician was on time and very professional. My cars interior feels brand new. Super polite and made sure everything was spotless. Highly recommend!",
  },
  {
    id: "2",
    name: "Kapil Sharma",
    time: "16 July 2025",
    image: profile1,
    text: "The technician was on time and very professional. My cars interior feels brand new. Super polite and made sure everything was spotless. Highly recommend!.....",
  },
  {
    id: "3",
    name: "Jhon Dio",
    time: "3 hrs ago",
    image: profile1,
    text: "The technician was on time and very professional. My cars interior feels brand new. Super polite and made sure everything was spotless. Highly recommend!",
  },
  {
    id: "4",
    name: "Jhon Dio",
    time: "3 hrs ago",
    image: profile1,
    text: "The technician was on time and very professional. My cars interior feels brand new. Super polite and made sure everything was spotless. Highly recommend!",
  },
   {
    id: "5",
    name: "Kapil Sharma",
    time: "16 July 2025",
    image: profile1,
    text: "The technician was on time and very professional. My cars interior feels brand new. Super polite and made sure everything was spotless. Highly recommend!.....",
  },
  {
    id: "6",
    name: "Jhon Dio",
    time: "3 hrs ago",
    image: profile1,
    text: "The technician was on time and very professional. My cars interior feels brand new. Super polite and made sure everything was spotless. Highly recommend!",
  },
];

export default function Reviews() {
  const [expandedCardId, setExpandedCardId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedCardId((prevId) => (prevId === id ? null : id));
  };
  return (
    <View style={[globalStyles.container]}>
      {/* <AvailabilityHeader /> */}
      <View
        style={[
          globalStyles.flexrow,
          globalStyles.justifysb,
          globalStyles.alineItemscenter,
          globalStyles.mb3,
        ]}
      >
        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
          <CustomText style={[globalStyles.f28Bold]}>4.9</CustomText>
          <View
            style={[
              globalStyles.flexrow,
              globalStyles.ml1,
              globalStyles.alineSelfcenter,
            ]}
          >
            {[...Array(5)].map((_, i) => (
              <MaterialIcons
                key={i}
                name="star"
                size={18}
                color={color.primary}
              />
            ))}
          </View>
          <CustomText
            style={[
              globalStyles.ml2,
              globalStyles.f10Medium,
              { color: "#666" },
            ]}
          >
            3 Reviews
          </CustomText>
        </View>

        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
          <CustomText style={[globalStyles.f12Medium, globalStyles.neutral500]}>
            Sort by:{" "}
          </CustomText>
          <CustomText style={[globalStyles.f12Medium, globalStyles.black]}>
            Superb
          </CustomText>
          <MaterialIcons name="arrow-drop-down" size={30} color={color.black} />
        </View>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, globalStyles.mb5]}>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifysb,
                globalStyles.alineItemscenter,
              ]}
            >
              <View
                style={[globalStyles.flexrow, globalStyles.alineItemscenter]}
              >
                <View style={styles.avatharring}>
                  <Image source={item.image} style={styles.avatar} />
                </View>
                <View style={globalStyles.ml2}>
                  <CustomText
                    style={[globalStyles.primary, globalStyles.f20Bold]}
                  >
                    {item.name}
                  </CustomText>
                  <View style={[globalStyles.flexrow]}>
                    {[...Array(5)].map((_, i) => (
                      <MaterialIcons
                        key={i}
                        name="star"
                        size={14}
                        color={color.primary}
                      />
                    ))}
                  </View>
                </View>
              </View>
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.neutral500]}
              >
                {item.time}
              </CustomText>
            </View>

            <CustomText
              style={[
                globalStyles.mt2,
                globalStyles.f12Medium,
                { color: "#4B4B4B" },
              ]}
            >
              {item.text}
            </CustomText>

            {item.text.endsWith(".....") && (
              <TouchableOpacity
                onPress={() => toggleExpand(item.id)}
                style={styles.readMoreButton}
              >
                <MaterialIcons
                  name={
                    expandedCardId === item.id
                      ? "arrow-drop-up"
                      : "arrow-drop-down"
                  }
                  size={30}
                  color={color.white}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.white,
    borderRadius: 16,
    padding: 16,
    shadowRadius: 4,
    position: "relative",
  },
  avatharring: {
    padding: 3,
    backgroundColor: color.neutral[200],
    borderRadius: 50,
    marginRight: 5,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 50,
    resizeMode: "cover",
  },
  readMoreButton: {
    position: "absolute",
    bottom: -15,
    right: 30,
    height: 30,
    width: 30,
    backgroundColor: color.primary,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
