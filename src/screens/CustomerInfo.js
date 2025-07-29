import React from "react";
import {
  Image,
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import AvailabilityHeader from "../components/AvailabilityHeader";
import profilepic from "../../assets/images/person.jpg";
import carpic from "../../assets/images/Group 420.png";
import { color } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import SlideButton from "../components/SlideButton ";
import { useNavigation } from "@react-navigation/native";

export default function CustomerInfo() {
  const navigation = useNavigation();
  const ServiceStart = () => {
    navigation.navigate("ServiceStart");
  };
  return (
    <ScrollView style={[globalStyles.bgcontainer]}>
      <View style={[globalStyles.container, globalStyles.pb4]}>
        <AvailabilityHeader />

        <CustomText style={[globalStyles.f20Bold, globalStyles.primary]}>
          Booking ID:{" "}
          <CustomText style={globalStyles.black}>TG234518</CustomText>
        </CustomText>

        <View
          style={[
            globalStyles.cardwidth,
            globalStyles.bgwhite,
            globalStyles.p4,
            globalStyles.mt4,
          ]}
        >
          <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
            <Image source={profilepic} style={globalStyles.avatarside} />
            <View style={[globalStyles.ml50, globalStyles.flex1]}>
              <CustomText style={[globalStyles.f20Bold, globalStyles.black]}>
                Jhon Dio
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f12Bold,
                  globalStyles.primary,
                  globalStyles.mb2,
                ]}
              >
                Mobile: <CustomText>7780290335</CustomText>
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f12Regular,
                  globalStyles.neutral500,
                  globalStyles.primary,
                ]}
              >
                #81 Spaces & More Business Park #M3 Dr No.#1-89/A/8, C/2, Vittal
                Rao Nagar Rd, Madhapur, Telangana 500081
              </CustomText>
            </View>
          </View>

          <View style={[globalStyles.mt3, globalStyles.divider]} />

          <View
            style={[
              //   globalStyles.flexrow,
              globalStyles.ml50,
              globalStyles.justifysb,
            ]}
          >
            <CustomText style={globalStyles.f12Bold}>
              Slot Time:{" "}
              <CustomText style={globalStyles.black}>05:00 PM</CustomText>
            </CustomText>
            <CustomText style={globalStyles.f12Bold}>
              Booking Date:{" "}
              <CustomText style={globalStyles.black}>16/07/2025</CustomText>
            </CustomText>
          </View>
        </View>
        <CustomText
          style={[globalStyles.f16Bold, globalStyles.black, globalStyles.mt3]}
        >
          Car Details
        </CustomText>
        <View style={[styles.blackcard]}>
          <View
            style={[
              styles.width70,
              globalStyles.alineItemsEnd,
              globalStyles.pr30,
            ]}
          >
            <View style={[styles.width60]}>
              <View
                style={[
                  globalStyles.bgprimary,
                  globalStyles.pb5,
                  globalStyles.pt2,
                  globalStyles.borderRadiuslarge,
                  globalStyles.alineItemscenter,
                ]}
              >
                <CustomText
                  style={[globalStyles.f10Light, globalStyles.textWhite]}
                >
                  Modal Name
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textWhite]}
                >
                  Car Modal No 1
                </CustomText>
                <View style={styles.carimage}>
                  <Image source={carpic} />
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.width30]}>
            <View>
              <CustomText
                style={[globalStyles.f10Light, globalStyles.textWhite]}
              >
                Reg No
              </CustomText>
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textWhite]}
              >
                TGE130983
              </CustomText>
            </View>
            <View>
              <CustomText
                style={[globalStyles.f10Light, globalStyles.textWhite]}
              >
                Fuel Type
              </CustomText>
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textWhite]}
              >
                Petrol
              </CustomText>
            </View>
            <View>
              <CustomText
                style={[globalStyles.f10Light, globalStyles.textWhite]}
              >
                Manufacturer
              </CustomText>
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textWhite]}
              >
                Honda
              </CustomText>
            </View>
          </View>
        </View>
        <View style={[globalStyles.divider, globalStyles.mt5]} />
        <View>
          <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
            Service Details
          </CustomText>
          <View style={[globalStyles.mt2, globalStyles.ph4]}>
            <CustomText style={globalStyles.f18Medium}>
              • Leather Fabric Seat Polishing
            </CustomText>
            <CustomText style={globalStyles.f18Medium}>
              • AC Vent Sanitization
            </CustomText>
            <CustomText style={globalStyles.f18Medium}>
              • Mat Washing & Vacuuming
            </CustomText>
          </View>
        </View>

        <View
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.mt4,
            globalStyles.bgprimary,
            globalStyles.p4,
            globalStyles.borderRadiuslarge,
          ]}
        >
          <View style={globalStyles.alineSelfcenter}>
            <CustomText
              style={[globalStyles.f12Medium, globalStyles.textWhite]}
            >
              Estimated Time
            </CustomText>
            <CustomText style={[globalStyles.f32Bold, globalStyles.textWhite]}>
              1 hr 30 min
            </CustomText>
          </View>
          <View style={styles.pricecard}>
            <CustomText style={[globalStyles.f12Bold, globalStyles.black]}>
              Price
            </CustomText>
            <CustomText style={[globalStyles.f28Bold, globalStyles.primary]}>
              ₹899
            </CustomText>
          </View>
        </View>
      </View>

      <View
        style={[globalStyles.container, globalStyles.bgBlack, globalStyles.pb5]}
      >
        <CustomText
          style={[
            globalStyles.f16Bold,
            globalStyles.textWhite,
            globalStyles.mt2,
          ]}
        >
          Customer Note
        </CustomText>
        <View
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.mt2,
            globalStyles.bgwhite,
            globalStyles.p4,
            globalStyles.radius,
          ]}
        >
          <View style={globalStyles.alineSelfcenter}>
            <CustomText style={[globalStyles.f12Medium, globalStyles.black]}>
              Please focus on stain near back seat. Car was used for outstation
              last week.
            </CustomText>
          </View>
        </View>

        <View style={[globalStyles.mt2]}>
          <CustomText
            style={[
              globalStyles.f16Bold,
              globalStyles.textWhite,
              globalStyles.mt2,
            ]}
          >
            Reference Images
          </CustomText>

          <View
            style={{ height: 110, flexDirection: "row", alignItems: "center" }}
          >
            {/* <TouchableOpacity style={styles.arrowButton}>
    <Ionicons name="chevron-back-circle" size={28} color={color.primary}/>
  </TouchableOpacity> */}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
            >
              {[1, 2, 3, 4, 5].map((item, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={profilepic} style={styles.image} />
                </View>
              ))}
            </ScrollView>

            {/* <TouchableOpacity style={styles.arrowButton}>
    <Ionicons name="chevron-forward-circle" size={28} color={color.primary} />
  </TouchableOpacity> */}
          </View>

          {/* Buttons Row */}
          <View
            style={[
              globalStyles.mt4,
              globalStyles.flexrow,
              globalStyles.justifysb,
            ]}
          >
            <TouchableOpacity style={styles.cancelButton}>
              <CustomText
                style={[globalStyles.textWhite, globalStyles.f12Medium]}
              >
                Cancel Booking
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.callButton}>
              <Ionicons
                name="call"
                size={25}
                color="#fff"
                style={styles.callIcon}
              />
              <CustomText
                style={[globalStyles.textWhite, globalStyles.f12Medium]}
              >
                Call to customer
              </CustomText>
            </TouchableOpacity>
          </View>

          <SafeAreaView style={{ flex: 1 }}>
            <SlideButton onComplete={() => Alert.alert("✅ Ride Started")} />
          </SafeAreaView>
          <TouchableOpacity
            onPress={ServiceStart}
            style={globalStyles.yellowbutton}
          >
            <CustomText style={[globalStyles.f12Bold]}>
              Reached to the customer
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  arrowButton: {
    paddingHorizontal: 8,
  },
  imageWrapper: {
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  playButton: {
    position: "absolute",
    top: "40%",
    right: 5,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 3,
  },
  cancelButton: {
    backgroundColor: color.fullredLight,
    width: "46%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  callButton: {
    backgroundColor: color.primary,
    width: "46%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  callIcon: {
    marginRight: 8,
  },
  startRideWrapper: {
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    marginTop: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  startRideButton: {
    backgroundColor: "#767676",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  carimage: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 10,
    top: 45,
    left: -80,
  },
  pricecard: {
    backgroundColor: color.white,
    paddingVertical: 3,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 10,
  },
  blackcard: {
    borderRadius: 20,
    backgroundColor: color.black,
    justifyContent: "space-between",
    flexDirection: "row",
    paddingBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  width60: {
    width: "60%",
  },
  width70: {
    width: "70%",
  },
  width30: {
    width: "30%",
  },
});
