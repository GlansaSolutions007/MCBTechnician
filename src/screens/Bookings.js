import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import globalStyles from "../styles/globalStyles";
import profilepic from "../../assets/images/person.jpg";
import CustomText from "../components/CustomText";
import locationicon from "../../assets/icons/Navigation/LocationsPin.png";
import dateicon from "../../assets/icons/Navigation/schedule.png";
import dashboardicon from "../../assets/icons/Navigation/techhom.png";
import reportsicon from "../../assets/icons/Navigation/reports.png";
import { color } from "../styles/theme";
import { useNavigation } from "@react-navigation/native";

const bookingsData = [
  {
    id: 1,
    name: "Jhon Dio",
    phone: "7780290335",
    address:
      "#B1 Spaces & More Business Park #M3 Dr.No.#1-89/A/8, C/2, Vittal Rao Nagar Rd, Madhapur, Telangana 500081",
    date: "16/07/2025",
    time: "06:00 PM",
    code: "TGE131998",
    location: "AULTO",
    distance: "2KM From",
    service: "Leather Fabric",
  },
  {
    id: 2,
    name: "Jhon Dio",
    phone: "7780290335",
    address:
      "#B1 Spaces & More Business Park #M3 Dr.No.#1-89/A/8, C/2, Vittal Rao Nagar Rd, Madhapur, Telangana 500081",
    date: "16/07/2025",
    time: "06:00 PM",
    code: "TGE131998",
    location: "AULTO",
    distance: "2KM From",
    service: "Leather Fabric",
  },
  {
    id: 3,
    name: "Jhon Dio",
    phone: "7780290335",
    address:
      "#B1 Spaces & More Business Park #M3 Dr.No.#1-89/A/8, C/2, Vittal Rao Nagar Rd, Madhapur, Telangana 500081",
    date: "16/07/2025",
    time: "06:00 PM",
    code: "TGE131998",
    location: "AULTO",
    distance: "2KM From",
    service: "Leather Fabric",
  },
];

export default function Bookings() {
  const navigation = useNavigation();

  const customerInfo = () => {
    navigation.navigate("customerInfo");
  };

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={globalStyles.container}>
       

        {bookingsData.map((item) => (
          <View
            key={item.id}
            style={[
              globalStyles.bgprimary,
              globalStyles.p4,
              globalStyles.mt5,
              globalStyles.card,
            ]}
          >
            <View style={globalStyles.flexrow}>
              <Image source={profilepic} style={styles.avatar} />

              <View style={[globalStyles.ml3, { flex: 1 }]}>
                <CustomText
                  style={[globalStyles.f24Bold, globalStyles.textWhite]}
                >
                  {item.name}
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Regular, globalStyles.textWhite]}
                >
                  Mobile: {item.phone}
                </CustomText>
                <CustomText
                  style={[globalStyles.f10Light, globalStyles.neutral100]}
                >
                  {item.address}
                </CustomText>
              </View>
            </View>

            <View style={globalStyles.divider} />

            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifysb,
                globalStyles.alineItemscenter,
              ]}
            >
              <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
                <View style={globalStyles.mr3}>
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
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      {item.distance}
                    </CustomText>
                  </View>

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
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      {item.location}
                    </CustomText>
                  </View>

                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.mt2,
                      globalStyles.alineItemscenter,
                    ]}
                  >
                    <View style={styles.iconbg}>
                      <Image source={dashboardicon} style={styles.icons} />
                    </View>
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      {item.code}
                    </CustomText>
                  </View>
                </View>

                <View>
                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.mt2,
                      globalStyles.alineItemscenter,
                    ]}
                  >
                    <View style={styles.iconbg}>
                      <Image source={dateicon} style={styles.icons} />
                    </View>
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      {item.date}
                    </CustomText>
                  </View>

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
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      At {item.time}
                    </CustomText>
                  </View>

                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.mt2,
                      globalStyles.alineItemscenter,
                    ]}
                  >
                    <View style={styles.iconbg}>
                      <Image source={reportsicon} style={styles.icons} />
                    </View>
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      {item.service}
                    </CustomText>
                  </View>
                </View>
              </View>

              <View style={globalStyles.alineSelfend}>
                <TouchableOpacity style={styles.cancelButton}>
                  <CustomText
                    style={[globalStyles.f12Bold, globalStyles.textWhite]}
                  >
                    Cancel
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={customerInfo}
                  style={[styles.viewButton, globalStyles.mt3]}
                >
                  <CustomText
                    style={[globalStyles.f12Bold, globalStyles.primary]}
                  >
                    View
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  cancelButton: {
    backgroundColor: color.black,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  viewButton: {
    backgroundColor: color.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 100,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: color.white,
  },
});
