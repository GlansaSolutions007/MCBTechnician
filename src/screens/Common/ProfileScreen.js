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
  StatusBar,
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
import testNotifications from "../../utils/notificationTestUtils";
import testNotificationUtils from "../../utils/notificationTestUtils";
// import * as ImagePicker from "expo-image-picker";
// import * as FileSystem from "expo-file-system";

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [reviewData, setReviewData] = useState(null);

  const { logout } = useAuth();
  const sendTest = async () => {
    try {
      const techId = await AsyncStorage.getItem("techID");
      const id = techId ? Number(techId) : 0;
      if (!id) return;
      await axios.post(`${API_BASE_URL}Push/sendToTechnician`, {
        id,
        title: "Test Notification",
        body: "This is a test notification from the technician app.",
        data: { type: "test" },
      });
    } catch (e) {
      console.log('sendTest error (technician):', e?.response?.data || e?.message || e);
      alert(`Send failed: ${e?.response?.data?.message || e?.message || 'Unknown error'}`);
    }
  };

  const testLocalNotification = async () => {
    try {
      await testNotifications.testNewBooking();
      alert('Test notification sent successfully!');
    } catch (e) {
      console.log('Test notification error:', e);
      alert(`Test failed: ${e?.message || 'Unknown error'}`);
    }
  };

  const testAllNotifications = async () => {
    try {
      await testNotifications.testAllTypes();
      alert('All test notifications sent successfully!');
    } catch (e) {
      console.log('Test all notifications error:', e);
      alert(`Test failed: ${e?.message || 'Unknown error'}`);
    }
  };

  const clearTestNotifications = async () => {
    try {
      await testNotifications.clearAllTestNotifications();
      alert('All test notifications cleared!');
    } catch (e) {
      console.log('Clear notifications error:', e);
      alert(`Clear failed: ${e?.message || 'Unknown error'}`);
    }
  };

  // New FCM testing functions
  const testFCMTokenGeneration = async () => {
    try {
      const techId = await AsyncStorage.getItem("techID");
      const tokens = await testNotificationUtils.testFCMTokenGeneration();
      if (tokens) {
        alert(`FCM Test Results:\nExpo Token: ${tokens.expoPushToken ? '✅ Generated' : '❌ Null'}\nFCM Token: ${tokens.fcmToken ? '✅ Generated' : '❌ Null'}`);
      } else {
        alert('❌ FCM token generation failed');
      }
    } catch (e) {
      console.log('FCM token test error:', e);
      alert(`FCM test failed: ${e?.message || 'Unknown error'}`);
    }
  };

  const testTokenSaving = async () => {
    try {
      const techId = await AsyncStorage.getItem("techID");
      const result = await testNotificationUtils.testTokenSaving(techId);
      if (result) {
        alert('✅ Tokens saved to Firebase successfully!');
      } else {
        alert('❌ Token saving failed');
      }
    } catch (e) {
      console.log('Token saving test error:', e);
      alert(`Token saving test failed: ${e?.message || 'Unknown error'}`);
    }
  };

  const testFirebaseNotification = async () => {
    try {
      const techId = await AsyncStorage.getItem("techID");
      const result = await testNotificationUtils.testFirebaseNotification(techId);
      if (result) {
        alert('✅ Firebase notification test successful!');
      } else {
        alert('❌ Firebase notification test failed');
      }
    } catch (e) {
      console.log('Firebase notification test error:', e);
      alert(`Firebase notification test failed: ${e?.message || 'Unknown error'}`);
    }
  };

  const runAllFCMTests = async () => {
    try {
      const techId = await AsyncStorage.getItem("techID");
      const results = await testNotificationUtils.runAllTests(techId);
      alert(`🧪 FCM Test Results:\nPermissions: ${results.permissions ? '✅' : '❌'}\nToken Generation: ${results.tokenGeneration ? '✅' : '❌'}\nToken Saving: ${results.tokenSaving ? '✅' : '❌'}\nFirebase Notification: ${results.firebaseNotification ? '✅' : '❌'}`);
    } catch (e) {
      console.log('All FCM tests error:', e);
      alert(`All FCM tests failed: ${e?.message || 'Unknown error'}`);
    }
  };
  const confirmLogout = () => {
    setShowLogoutModal(true);
  };
  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

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
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfileData(res.data.data?.[0] ?? null);

        const reviewRes = await axios.get(
          `${API_BASE_URL}Feedback/Review?techid=${techId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (reviewRes.data && reviewRes.data.length > 0) {
          setReviewData(reviewRes.data[0]);
        }
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianDetails();
  }, []);

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
    <ScrollView style={[globalStyles.bgcontainer]} showsVerticalScrollIndicator={false}>
      <StatusBar backgroundColor={color.primary} barStyle="light-content" />
      {/* Header Section with Gradient Background */}
      <View style={styles.headerSection}>
        <View style={[globalStyles.container, globalStyles.pt5]}>
          {/* Profile Avatar with Modern Design */}
          <View style={[globalStyles.alineItemscenter, globalStyles.mb4]}>
            <View style={styles.avatarContainer}>
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
                style={styles.modernAvatar}
              />
              {/* <View style={styles.onlineIndicator} /> */}
            </View>
          </View>

          {/* Profile Information */}
          <View style={[globalStyles.alineItemscenter, globalStyles.mb4]}>
            <CustomText
              style={[globalStyles.f24Bold, globalStyles.textWhite, globalStyles.textac]}
            >
              {profileData.TechnicianName}
            </CustomText>
            <CustomText style={[globalStyles.f14Medium, globalStyles.textWhite, globalStyles.mt1]}>
              {profileData.DealerName}
            </CustomText>
          </View>

          {/* Contact Information Cards */}
          <View style={styles.contactCards}>
            <View style={[styles.contactCard, globalStyles.mb2]}>
              <Ionicons name="call-outline" size={18} color={color.primary} />
              <CustomText style={[globalStyles.f12Medium, globalStyles.ml2]}>
                {profileData.PhoneNumber}
              </CustomText>
            </View>
            <View style={[styles.contactCard, globalStyles.mb2]}>
              <Ionicons name="mail-outline" size={18} color={color.primary} />
              <CustomText 
                numberOfLines={1} 
                ellipsizeMode="tail"
                style={[globalStyles.f12Medium, globalStyles.ml2, { flex: 1 }]}
              >
                {profileData.Email}
              </CustomText>
            </View>
            <View style={styles.contactCard}>
              <Ionicons name="location-outline" size={18} color={color.primary} />
              <CustomText 
                numberOfLines={2} 
                ellipsizeMode="tail"
                style={[globalStyles.f12Medium, globalStyles.ml2, { flex: 1 }]}
              >
                {profileData.AddressLine1}
              </CustomText>
            </View>
          </View>
        </View>
      </View>

      {/* Rating Section */}
      <View style={[globalStyles.container, globalStyles.mt4]}>
        <View style={[styles.ratingCard, globalStyles.card]}>
          <View style={[globalStyles.alineItemscenter, globalStyles.mb3]}>
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
              {[1, 2, 3, 4, 5].map((star, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={24}
                  color={
                    reviewData?.OverallServiceRating >= star
                      ? color.yellow
                      : color.neutral[300]
                  }
                  style={globalStyles.mr1}
                />
              ))}
            </View>
            <CustomText style={[globalStyles.f16Bold, globalStyles.primary, globalStyles.mt2]}>
              {reviewData?.OverallServiceRating ?? "0.0"} Rating
            </CustomText>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <CustomText
                style={[globalStyles.f32Bold, globalStyles.primary, globalStyles.textac]}
              >
                {reviewData?.TotalFeedbacks ?? "0"}
              </CustomText>
              <CustomText style={[globalStyles.f12Medium, globalStyles.neutral500, globalStyles.textac]}>
                Total Reviews
              </CustomText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <CustomText
                style={[globalStyles.f32Bold, globalStyles.primary, globalStyles.textac]}
              >
                {reviewData?.OverallServiceRating ?? "0.0"}
              </CustomText>
              <CustomText style={[globalStyles.f12Medium, globalStyles.neutral500, globalStyles.textac]}>
                Average Rating
              </CustomText>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Section */}
      <View style={[globalStyles.container, globalStyles.mt4]}>
        <View style={[styles.menuCard, globalStyles.card]}>
          <CustomText style={[globalStyles.f18Bold, globalStyles.primary, globalStyles.mb3]}>
            Account & Settings
          </CustomText>
          
          {[
            { 
              label: "Leave Request List", 
              route: "leaveRequestList", 
              icon: "list-outline",
              color: color.primary
            },
            { 
              label: "Leave Request", 
              route: "leaveRequest", 
              icon: "calendar-outline",
              color: color.primary
            },
            { 
              label: "About App", 
              icon: "information-circle-outline",
              color: color.neutral[500]
            },
            { 
              label: "Privacy Policy", 
              route: "privacyPolicy", 
              icon: "shield-checkmark-outline",
              color: color.primary
            },
            { 
              label: "Terms & Conditions", 
              route: "termsAndConditions", 
              icon: "document-text-outline",
              color: color.primary
            },
            { 
              label: "Inventory Items Request", 
              icon: "cube-outline",
              color: color.neutral[500]
            },
          ].map((item, idx) => (
            <View key={idx}>
              <TouchableOpacity
                onPress={() => item.route && navigation.navigate(item.route)}
                style={[styles.menuItem, globalStyles.flexrow, globalStyles.alineItemscenter]}
                disabled={!item.route}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <CustomText 
                  style={[
                    globalStyles.f14Medium, 
                    globalStyles.ml3, 
                    globalStyles.flex1,
                    !item.route && globalStyles.neutral500
                  ]}
                >
                  {item.label}
                </CustomText>
                {item.route && (
                  <Ionicons name="chevron-forward" size={16} color={color.neutral[500]} />
                )}
              </TouchableOpacity>
              {idx < 5 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </View>
      </View>

      {/* Logout Section */}
      <View style={[globalStyles.container, globalStyles.mt4, globalStyles.mb5]}>
        <TouchableOpacity
          onPress={confirmLogout}
          style={[styles.logoutButton, globalStyles.flexrow, globalStyles.alineItemscenter]}
        >
          <View style={[styles.logoutIcon, { backgroundColor: color.error + '15' }]}>
            <Ionicons name="log-out-outline" size={20} color={color.error} />
          </View>
          <CustomText style={[globalStyles.f14Bold, globalStyles.error, globalStyles.ml3]}>
            Log Out
          </CustomText>
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
            {/* <Pressable
              style={styles.closeIcon}
              onPress={() => setShowLogoutModal(false)}
            >
              <Ionicons
                name="close-circle"
                size={22}
                color={color.neutral[500]}
              />
            </Pressable> */}
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
                  style={[globalStyles.f14Bold, globalStyles.neutral500]}
                >
                  Cancel
                </CustomText>
              </Pressable>
              <Pressable
                style={[styles.button, styles.logoutButtonModal]}
                onPress={handleLogout}
              >
                <CustomText
                  style={[globalStyles.textWhite, globalStyles.f14Bold]}
                >
                  Log Out
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
  // Header Section
  headerSection: {
    backgroundColor: color.primary,
    paddingBottom: 30,
    paddingTop: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  
  // Avatar Styles
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  modernAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: color.white,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  // onlineIndicator: {
  //   position: "absolute",
  //   bottom: 5,
  //   right: 5,
  //   width: 20,
  //   height: 20,
  //   borderRadius: 10,
  //   backgroundColor: color.alertSuccess,
  //   borderWidth: 3,
  //   borderColor: color.white,
  // },

  // Contact Cards
  contactCards: {
    backgroundColor: color.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  // Rating Card
  ratingCard: {
    backgroundColor: color.white,
    padding: 20,
    marginBottom: 0,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: color.neutral[200],
    marginHorizontal: 20,
  },

  // Menu Card
  menuCard: {
    backgroundColor: color.white,
    padding: 20,
    marginBottom: 0,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  menuDivider: {
    height: 1,
    backgroundColor: color.neutral[100],
    marginLeft: 52,
  },

  // Logout Button
  logoutButton: {
    backgroundColor: color.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal Styles
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: color.white,
    padding: 24,
    borderRadius: 16,
    width: "85%",
    alignItems: "center",
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: color.neutral[200],
    marginRight: 12,
  },
  logoutButtonModal: {
    backgroundColor: color.error,
  },

  // Legacy styles (keeping for compatibility)
  closeIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 5,
    zIndex: 1,
  },
  testSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  testButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
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
