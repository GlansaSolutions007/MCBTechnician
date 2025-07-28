import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import profilepic from "../../assets/images/person.jpg";
import CustomText from "../components/CustomText";
import locationicon from "../../assets/icons/Navigation/LocationsPin.png";
import dateicon from "../../assets/icons/Navigation/schedule.png";
import dashboardicon from "../../assets/icons/Navigation/techhom.png";
import reportsicon from "../../assets/icons/Navigation/reports.png";
import AvailabilityHeader from "../components/AvailabilityHeader";
import Pcicon from "../../assets/icons/Navigation/bookings 2.png";
import { useNavigation } from "@react-navigation/native";

export default function Dashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const navigation = useNavigation();
  const customerInfo = () => {
    navigation.navigate("customerInfo");
  };
  const LiveTrackingMap = () => {
    navigation.navigate("LiveTrackingMap");
  };
  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={[globalStyles.container]}>
        <AvailabilityHeader />

        <View
          style={[
            globalStyles.card,
            globalStyles.cardwidth,
            globalStyles.bgwhite,
            globalStyles.p4,
            globalStyles.mt5,
          ]}
        >
          <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
            <View style={[styles.Pcicon]}>
              <Image source={Pcicon} style={[styles.Pcicons]} />
            </View>
            <View style={[globalStyles.ml50, globalStyles.flex1]}>
              <Text style={[globalStyles.f16Bold, globalStyles.alineSelfend]}>
                Todays Service Bookings
              </Text>

              <Text
                style={[
                  globalStyles.f44Bold,
                  globalStyles.primary,
                  globalStyles.mb2,
                  globalStyles.alineSelfend,
                ]}
              >
                04
              </Text>
            </View>
          </View>

          <View style={globalStyles.divider} />

          <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
            <IconLabel icon="time-outline" label="8 hrs" />
            <IconLabel icon="people-outline" label="2 customers" />
            <IconLabel icon="checkmark-circle-outline" label="2 Active" />
          </View>
        </View>

        <View style={[globalStyles.mt4]}>
          <Text style={[globalStyles.f14Bold, globalStyles.mb2]}>
            Next Active Service
          </Text>

          <Text style={[globalStyles.f32Regular, globalStyles.neutral300]}>
            There are no{" "}
          </Text>
          <View style={[globalStyles.flexrow]}>
            <Text style={[globalStyles.primary, globalStyles.f32Bold]}>
              active services{" "}
            </Text>
            <Text style={[globalStyles.f32Regular, , globalStyles.neutral200]}>
              yet....
            </Text>
          </View>

          {/* carddddd11111111111 */}
          <View
            style={[
              globalStyles.bgprimary,
              globalStyles.p4,
              globalStyles.card,
              globalStyles.mt5,
            ]}
          >
            <View style={[globalStyles.flexrow]}>
              <Image source={profilepic} style={styles.avatar} />

              <View style={[globalStyles.ml3, { flex: 1 }]}>
                <Text style={[globalStyles.f28Bold, globalStyles.textWhite]}>
                  Jhon Dio
                </Text>
                <Text style={[globalStyles.f16Medium, globalStyles.textWhite]}>
                  Mobile: 7780290335
                </Text>
                <Text style={[globalStyles.f12Light, globalStyles.neutral100]}>
                  #B1 Spaces & More Business Park #M3 Dr.No.#1-89/A/8, C/2,
                  Vittal Rao Nagar Rd, Madhapur, Telangana 500081
                </Text>
              </View>
            </View>

            <View style={globalStyles.divider} />

            <Text
              style={[
                globalStyles.f16Medium,
                globalStyles.textWhite,
                globalStyles.alineSelfcenter,
                globalStyles.mb35,
              ]}
            >
              <Text style={globalStyles.f16Bold}>Service:</Text> Leather Fabric
              Seat Polishing
            </Text>
          </View>

          <View
            style={[
              globalStyles.flexrow,
              globalStyles.justifysb,
              globalStyles.ph4,
              globalStyles.mt4,
              styles.service,
            ]}
          >
            <TouchableOpacity onPress={LiveTrackingMap} style={styles.startButton}>
              <Text style={[globalStyles.f14Bold, globalStyles.textWhite]}>
                Start The Service
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.denyButton}>
              <Text style={[globalStyles.f14Bold, globalStyles.black]}>
                Deny service
              </Text>
            </TouchableOpacity>
          </View>

          {/* carddddd2222222222222 */}

          <View
            style={[globalStyles.bgprimary, globalStyles.p4, globalStyles.card]}
          >
            <View style={[globalStyles.flexrow]}>
              <Image source={profilepic} style={styles.avatar} />

              <View style={[globalStyles.ml3, { flex: 1 }]}>
                <Text style={[globalStyles.f28Bold, globalStyles.textWhite]}>
                  Jhon Dio
                </Text>
                <Text style={[globalStyles.f16Medium, globalStyles.textWhite]}>
                  Mobile: 7780290335
                </Text>
                <Text style={[globalStyles.f12Light, globalStyles.neutral100]}>
                  #B1 Spaces & More Business Park #M3 Dr.No.#1-89/A/8, C/2,
                  Vittal Rao Nagar Rd, Madhapur, Telangana 500081
                </Text>
              </View>
            </View>

            <View style={globalStyles.divider} />

            <Text
              style={[
                globalStyles.f16Medium,
                globalStyles.textWhite,
                globalStyles.alineSelfcenter,
                globalStyles.mb4,
              ]}
            >
              <Text style={globalStyles.f16Bold}>Service:</Text> Leather Fabric
              Seat Polishing
            </Text>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifysb,
                globalStyles.alineItemscenter,
                styles.card,
              ]}
            >
              <View>
                <Text style={[globalStyles.f16Bold]}>Est: 8hrs</Text>
                <Text style={[globalStyles.f28Bold, globalStyles.primary]}>
                  00:02:01
                </Text>
              </View>

              <View style={[globalStyles.flexrow]}>
                <TouchableOpacity
                  style={[styles.pauseButton, globalStyles.mr2]}
                >
                  <Text style={[globalStyles.f14Bold, globalStyles.textWhite]}>
                    Pause
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.completedButton}>
                  <Text style={[globalStyles.f14Bold, globalStyles.textWhite]}>
                    Completed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* carddddd333333333333333 */}

          <View
            style={[
              globalStyles.bgprimary,
              globalStyles.p4,
              globalStyles.mt5,
              globalStyles.card,
            ]}
          >
            <View style={[globalStyles.flexrow]}>
              <Image source={profilepic} style={styles.avatar} />

              <View style={[globalStyles.ml3, { flex: 1 }]}>
                <Text style={[globalStyles.f28Bold, globalStyles.textWhite]}>
                  Jhon Dio
                </Text>
                <Text style={[globalStyles.f16Medium, globalStyles.textWhite]}>
                  Mobile: 7780290335
                </Text>
                <Text style={[globalStyles.f12Light, globalStyles.neutral100]}>
                  #B1 Spaces & More Business Park #M3 Dr.No.#1-89/A/8, C/2,
                  Vittal Rao Nagar Rd, Madhapur, Telangana 500081
                </Text>
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
                      2KM From
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
                      AULTO
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
                      TGE131998
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
                      16/07/2025
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
                      At 06:00 Pm
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
                      Leather Fabric
                    </CustomText>
                  </View>
                </View>
              </View>

              <View style={globalStyles.alineSelfend}>
                <TouchableOpacity style={[styles.cancelButton]}>
                  <Text style={[globalStyles.f14Bold, globalStyles.textWhite]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={customerInfo}
                  style={[styles.viewButton, globalStyles.mt3]}
                >
                  <Text style={[globalStyles.f14Bold, globalStyles.primary]}>
                    View
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function IconLabel({ icon, label }) {
  return (
    <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
      <Ionicons
        name={icon}
        size={18}
        color={color.primary}
        style={{ marginRight: 5 }}
      />
      <Text style={globalStyles.f14Bold}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  Pcicon: {
    width: 70,
    height: 70,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    top: 0,
    left: -50,
    zIndex: 1,
    borderRadius: 14,
    shadowColor: color.black,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    borderColor: color.white,
    backgroundColor: color.white,
    resizeMode: "cover",
  },
  Pcicons: {
    width: 50,
    height: 50,
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
  cardWrapper: {
    borderRadius: 16,
  },

  timerCard: {
    backgroundColor: color.white,
    borderRadius: 16,
    padding: 16,
  },
  pauseButton: {
    backgroundColor: color.black,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  completedButton: {
    backgroundColor: color.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
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
  card: {
    borderRadius: 12,
    backgroundColor: color.white,
    padding: 10,
  },
  service: {
    position: "relative",
    top: -45,
  },
  avatar: {
    width: 70,
    height: 100,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: color.white,
  },

  startButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  denyButton: {
    backgroundColor: "#FDB827",
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
});
