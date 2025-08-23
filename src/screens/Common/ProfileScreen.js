import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../../styles/theme";
import locationicon from "../../../assets/icons/Navigation/LocationsPin.png";
import person from "../../../assets/icons/Navigation/techProfile.png";
import { useNavigation } from "@react-navigation/native";
// import AvailabilityHeader from "../../components/AvailabilityHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "@env";
import { API_BASE_URL_IMAGE } from "@env";
// import * as ImagePicker from "expo-image-picker";
// import * as FileSystem from "expo-file-system";

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { logout } = useAuth();
  const confirmLogout = () => {
    setShowLogoutModal(true);
  };
  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  // const [uploading, setUploading] = useState(false);

  // const pickImage = async () => {
  //   const permissionResult =
  //     await ImagePicker.requestMediaLibraryPermissionsAsync();
  //   if (!permissionResult.granted) {
  //     alert("Permission to access camera roll is required!");
  //     return;
  //   }

  //   const result = await ImagePicker.launchImageLibraryAsync({
  // mediaTypes: ImagePicker.MediaType,
  //     allowsEditing: true,
  //     aspect: [4, 3],
  //     quality: 0.7,
  //   });

  //   if (!result.cancelled) {
  //     const uri = result.assets[0].uri;
  //     setUploading(true);

  //     try {
  //       const token = await AsyncStorage.getItem("token");
  //       const techId = await AsyncStorage.getItem("techID");

  //       const formData = new FormData();
  //       formData.append("file", {
  //         uri,
  //         name: "profile.jpg",
  //         type: "image/jpeg",
  //       });

  //       formData.append("technicianId", techId);

  //       const response = await axios.post(
  //         `${API_BASE_URL}TechniciansDetails/UploadImage`,
  //         formData,
  //         {
  //           headers: {
  //             "Content-Type": "multipart/form-data",
  //             Authorization: `Bearer ${token}`,
  //           },
  //         }
  //       );

  //       if (response.data.success) {
  //         setProfileData((prev) => ({
  //           ...prev,
  //           ProfileImage: response.data.filename,
  //         }));
  //       } else {
  //         alert("Upload failed");
  //       }
  //     } catch (err) {
  //       console.error("Upload error:", err);
  //       alert("Error uploading image");
  //     } finally {
  //       setUploading(false);
  //     }
  //   }
  // };

  useEffect(() => {
    const fetchTechnicianDetails = async () => {
      try {
        const techId = await AsyncStorage.getItem("techID");
        const token = await AsyncStorage.getItem("token");

        if (!techId) {
          console.warn("No technicianId found");
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}TechniciansDetails/technicianid?technicianid=${techId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProfileData(res.data.data?.[0] ?? null);
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianDetails();
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
        <CustomText style={globalStyles.mt3}>Loading...</CustomText>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={[globalStyles.container, globalStyles.justifycenter]}>
        <CustomText>No Profile Found</CustomText>
        <CustomText>{techId}</CustomText>
      </View>
    );
  }

  return (
    <ScrollView style={[globalStyles.bgcontainer]}>
      <View style={globalStyles.container}>
        {/* <AvailabilityHeader /> */}
        <View style={[globalStyles.flexrow, globalStyles.mv5]}>
          <View
            style={[
              globalStyles.alineItemscenter,
              globalStyles.mb3,
              globalStyles.mr2,
            ]}
          >
            <Pressable
              // onPress={pickImage}
              style={{ position: "relative" }}
            >
              <Image
                source={
                  profileData?.ProfileImage
                    ? {
                        uri: `${API_BASE_URL_IMAGE}/${encodeURI(
                          profileData.ProfileImage
                        )}`,
                      }
                    : require("../../../assets/images/persontwo.jpg")
                }
                style={styles.avatar}
              />
              {/* {uploading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )} */}
            </Pressable>
          </View>
          <View style={[globalStyles.pr2, { flex: 1 }]}>
            <CustomText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[globalStyles.f24Bold, globalStyles.primary]}
            >
              {profileData.TechnicianName}
            </CustomText>
            <CustomText style={globalStyles.f12Medium}>
              Mobile: {profileData.PhoneNumber}
            </CustomText>
            <CustomText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[globalStyles.f12Medium, { flexShrink: 1, width: "100%" }]}
            >
              Email: {profileData.Email}
            </CustomText>
            <View
              style={[
                globalStyles.flexrow,
                { flexWrap: "wrap", width: "100%" },
              ]}
            >
              <View style={styles.iconbg}>
                <Image source={person} style={styles.icons} />
              </View>
              <CustomText
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[globalStyles.f12Medium, { flexShrink: 1 }]}
              >
                Dealer: {profileData.DealerName}
              </CustomText>
            </View>
            <View
              style={[
                globalStyles.flexrow,
                // { flexWrap: "wrap", width: "100%", marginTop: 2 },
              ]}
            >
              <View style={[styles.iconbg, globalStyles.mt1]}>
                <Image source={locationicon} style={styles.icons} />
              </View>
              <CustomText
                numberOfLines={4}
                ellipsizeMode="tail"
                style={[
                  globalStyles.f10Regular,
                  { flexShrink: 1, width: "100%" },
                ]}
              >
                {profileData.AddressLine1}
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
              {profileData.ServiceCompleted ?? "0"}
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
                {profileData.Rating ?? "0.0"}
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
              {profileData.ServedCustomers ?? "0+"}
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
              {profileData.KilometersTravelled ?? "0"}
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
                <CustomText style={[globalStyles.f12Bold]}>
                  {item.label}
                </CustomText>
                <Ionicons name="chevron-forward" size={16} color="#333" />
              </TouchableOpacity>
              {idx < 6 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={confirmLogout}
          style={[
            globalStyles.flexrow,
            globalStyles.justifysb,
            globalStyles.mt3,
          ]}
        >
          <CustomText style={[globalStyles.f12Bold, globalStyles.error]}>
            Log Out
          </CustomText>
          <Ionicons name="chevron-forward" size={16} color={color.error} />
        </TouchableOpacity>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable
              style={styles.closeIcon}
              onPress={() => setShowLogoutModal(false)}
            >
              <Ionicons
                name="close-circle"
                size={22}
                color={color.neutral[500]}
              />
            </Pressable>
            <CustomText style={globalStyles.f14Bold}>
              Are you sure you want to log out?
            </CustomText>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifysb,
                globalStyles.mt4,
              ]}
            >
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <CustomText
                  style={[globalStyles.textWhite, globalStyles.f12Bold]}
                >
                  No
                </CustomText>
              </Pressable>
              <Pressable
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout}
              >
                <CustomText
                  style={[globalStyles.textWhite, globalStyles.f12Bold]}
                >
                  Yes
                </CustomText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  closeIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 5,
    zIndex: 1,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: color.primary,
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: color.error,
  },

  divider: {
    height: 1,
    backgroundColor: color.neutral[100],
  },
  icons: {
    width: 10,
    height: 15,
  },
  iconbg: {
    height: 25,
    width: 25,
    borderRadius: 50,
    backgroundColor: color.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  avatar: {
    width: 120,
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
