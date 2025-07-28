import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../../styles/theme";
import locationicon from "../../../assets/icons/Navigation/LocationsPin.png";
import person from "../../../assets/icons/Navigation/techProfile.png";
import { useNavigation } from "@react-navigation/native";
import AvailabilityHeader from "../../components/AvailabilityHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    let isMounted = true;
    const fetchTechnicianDetails = async () => {
      try {
        const storedTechId = await AsyncStorage.getItem("technicianid");
        const techId = storedTechId || "78";

        const fetchPromise = axios.get(
          `https://api.mycarsbuddy.com/api/TechniciansDetails/technicianid?technicianid=${techId}`,
          { timeout: 2000 }
        );

        const response = await fetchPromise;

        if (isMounted && response.data?.status && response.data?.data) {
          setProfileData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch technician details:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTechnicianDetails();
    return () => { isMounted = false; };
  }, []);

  const review = () => navigation.navigate("reviews");

  if (loading) {
    return (
      <View
        style={[
          globalStyles.container,
          globalStyles.justifycenter,
          globalStyles.alineItemscenter,
        ]}
      >
        <ActivityIndicator size="large" color={color.primary} />
        <CustomText style={[globalStyles.mt3]}>Loading...</CustomText>
      </View>
    );
  }

  return (
    <ScrollView style={[globalStyles.bgcontainer]}>
      <View style={globalStyles.container}>
        <AvailabilityHeader />
        <View style={[globalStyles.flexrow, globalStyles.mv5]}>
          <View
            style={[
              globalStyles.alineItemscenter,
              globalStyles.mb3,
              globalStyles.mr4,
            ]}
          >
            <Image
              source={
                  require("../../../assets/images/persontwo.jpg")
              }
              style={styles.avatar}
            />
            {/* <Image
              source={
                profileData?.ProfileImage
                  ? {
                      uri: `https://api.mycarsbuddy.com/${profileData.ProfileImage}`,
                    }
                  : require("../../../assets/images/persontwo.jpg")
              }
              style={styles.avatar}
            /> */}
          </View>
          <View>
            <CustomText style={[globalStyles.f24Bold, globalStyles.primary]}>
              {profileData?.TechnicianName ?? "Name Unavailable"}
            </CustomText>
            <CustomText style={[globalStyles.f12Medium]}>
              Mobile: {profileData?.PhoneNumber ?? "-"}
            </CustomText>
            <CustomText style={[globalStyles.f12Medium]}>
              Email: {profileData?.Email ?? "-"}
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
                {profileData?.StateName}, {profileData?.CityName}
              </CustomText>
            </View>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.mt1,
                globalStyles.alineItemscenter,
              ]}
            >
              <View style={styles.iconbg}>
                <Image source={person} style={styles.icons} />
              </View>
              <CustomText style={globalStyles.f12Bold}>
                Dealer: {profileData?.DealerName ?? "-"}
              </CustomText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={[globalStyles.flexrow, globalStyles.justifycenter]}>
          {[1, 2, 3].map((_, i) => (
            <Ionicons
              key={i}
              name="star"
              size={18}
              color={color.primary}
              style={globalStyles.mr2}
            />
          ))}
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <CustomText
              style={[
                globalStyles.f40Bold,
                globalStyles.alineSelfcenter,
                globalStyles.primary,
              ]}
            >
              {profileData?.ServiceCompleted ?? "0"}
            </CustomText>
            <CustomText>Services Completed</CustomText>
          </View>
          <View style={styles.gridItem}>
            <TouchableOpacity onPress={review}>
              <CustomText
                style={[
                  globalStyles.f40Bold,
                  globalStyles.alineSelfcenter,
                  globalStyles.primary,
                ]}
              >
                {profileData?.Rating ?? "0.0"}
              </CustomText>
              <CustomText>Review Ratings</CustomText>
            </TouchableOpacity>
          </View>
          <View style={styles.gridItem}>
            <CustomText
              style={[
                globalStyles.f40Bold,
                globalStyles.alineSelfcenter,
                globalStyles.primary,
              ]}
            >
              {profileData?.ServedCustomers ?? "0+"}
            </CustomText>
            <CustomText>Served Customers</CustomText>
          </View>
          <View style={styles.gridItem}>
            <CustomText
              style={[
                globalStyles.f40Bold,
                globalStyles.alineSelfcenter,
                globalStyles.primary,
              ]}
            >
              {profileData?.KilometersTravelled ?? "0"}
            </CustomText>
            <CustomText>Kilometers Traveled</CustomText>
          </View>
        </View>

        <View style={globalStyles.mt4}>
          {[
            { label: "Leave Request List", route: "leaveRequestList" },
            { label: "Leave Request", route: "leaveRequest" },
            { label: "About App" },
            { label: "Technician Privacy Policy", route: "privacyPolicy" },
            { label: "Terms & Conditions", route: "termsAndConditions" },
            { label: "Inventory Items Request" },
          ].map((item, idx) => (
            <View key={idx}>
              <TouchableOpacity
                onPress={() => item.route && navigation.navigate(item.route)}
                style={[
                  globalStyles.flexrow,
                  globalStyles.justifysb,
                  globalStyles.mv3,
                ]}
              >
                <CustomText>{item.label}</CustomText>
                <Ionicons name="chevron-forward" size={16} color="#333" />
              </TouchableOpacity>
              {idx < 5 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: color.neutral[100],
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
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 0,
    padding: 16,
  },
  gridContainer: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "45%",
    alignItems: "center",
    marginBottom: 16,
  },
});
