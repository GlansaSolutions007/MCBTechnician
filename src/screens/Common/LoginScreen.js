import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import globalStyles from "../../styles/globalStyles";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../contexts/AuthContext";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { startTechnicianLocationTracking } from "../../utils/locationTracker";
import { registerForPushNotificationsAsync } from "../../utils/notifications";
import { db } from "../../config/firebaseConfig";
import { ref, set } from "firebase/database";

export default function LoginScreen() {
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [headerAnim] = useState(new Animated.Value(1));
  const [welcomeTextAnim] = useState(new Animated.Value(1));
  const [logoAnim] = useState(new Animated.Value(1));

  const { login } = useAuth();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [status, setStatus] = useState("info");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("Login Info");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [inputsDisabled, setInputsDisabled] = useState(false);

  const handleLoginWithPassword = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}Auth/Technician-login`,
        {
          PhoneNumber: phoneNumber,
          Password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Login response:", response.data);

      if (response.data?.success) {
        const techID = response.data?.techId;
        const email = response.data?.email || "";
        const token = response.data?.token || "";

        if (!techID) {
          throw new Error("Tech ID not found in response.");
        }

        await AsyncStorage.setItem("techID", techID.toString());
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("email", email);

        login({ email, token, techID: techID });
        try {
          if (techID) {
            startTechnicianLocationTracking(techID);
          }
        } catch (e) {}
        try {
          const tokens = await registerForPushNotificationsAsync();
          console.log("Tokens Vishal:", tokens);
          if (tokens) {
            const { expoPushToken, fcmToken } = tokens;
            if (expoPushToken) {
              await set(
                ref(
                  db,
                  `technicianPushTokens/${techID}/expo/${encodeURIComponent(
                    expoPushToken
                  )}`
                ),
                true
              );
            }
            if (fcmToken) {
              await set(
                ref(
                  db,
                  `technicianPushTokens/${techID}/fcm/${encodeURIComponent(
                    fcmToken
                  )}`
                ),
                true
              );
            }
            try {
              await AsyncStorage.setItem(
                "pushToken",
                fcmToken || expoPushToken || ""
              );
              await AsyncStorage.setItem(
                "pushTokenType",
                fcmToken ? "fcm" : expoPushToken ? "expo" : "unknown"
              );
            } catch (_) {}
            try {
              await axios.post(`${API_BASE_URL}Push/register`, {
                userRole: "technician",
                userId: Number(techID),
                fcmToken: fcmToken || null,
                expoToken: expoPushToken || null,
                platform: Platform.OS,
              });
            } catch (_) {}
          }
        } catch (_) {}
        navigation.replace("CustomerTabs", {
          screen: "Profile",
          params: { techID: techID },
        });
      } else {
        throw new Error(response.data?.message || "Login failed.");
      }
    } catch (error) {
      console.error("Login error:", error?.response?.data || error.message);
      setTitle("Login Failed");
      setMessage(error?.response?.data?.message || error.message);
      setStatus("error");
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Simple fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        // Smooth animations when keyboard opens
        Animated.parallel([
          Animated.timing(headerAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(welcomeTextAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(logoAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        // Smooth animations when keyboard closes
        Animated.parallel([
          Animated.timing(headerAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(welcomeTextAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(logoAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [fadeAnim, headerAnim, welcomeTextAnim, logoAnim]);

  return (
    <View style={[globalStyles.bgcontainer, { flex: 1 }]}>
      <StatusBar backgroundColor={color.primary} barStyle="light-content" />
      <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
>
  <ScrollView
    style={{ flex: 1 }}
    contentContainerStyle={[
      { flexGrow: 1 },
      keyboardVisible && { flex: 1, justifyContent: "center" } // ✅ Center card when keyboard opens
    ]}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >
          {/* Header Section with smooth hide animation */}
          <Animated.View
            style={[
              styles.headerSection,

              {
                opacity: headerAnim,
                transform: [
                  {
                    translateY: headerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-150, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/Logo/mycarbuddy.png")}
                style={styles.logo}
              />
            </View>

            {/* Welcome Text with smooth hide animation */}
            <Animated.View
              style={[
                styles.welcomeContainer,
                {
                  opacity: welcomeTextAnim,
                  transform: [
                    {
                      translateY: welcomeTextAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <CustomText
                style={[
                  globalStyles.f28Bold,
                  globalStyles.textWhite,
                  globalStyles.textac,
                ]}
              >
                Welcome Back
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f16Regular,
                  globalStyles.textWhite,
                  globalStyles.textac,
                  globalStyles.mt1,
                ]}
              >
                Sign in to continue
              </CustomText>
            </Animated.View>
          </Animated.View>

          {/* Login Form Section */}
          <Animated.View
            style={[
              styles.formSection,
              { opacity: fadeAnim },
              keyboardVisible && styles.keyboardOpenFormSection,
            ]}
          >
            <View
              style={[
                styles.formCard,
                keyboardVisible && styles.keyboardOpenFormCard,
              ]}
            >
              {/* Simple title */}
              <CustomText
                style={[
                  globalStyles.f20Bold,
                  globalStyles.black,
                  globalStyles.mb4,
                  globalStyles.textac,
                ]}
              >
                {keyboardVisible ? "Sign In" : "Login"}
              </CustomText>

              {/* Phone Number Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={color.neutral[500]}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Phone Number"
                    placeholderTextColor={color.neutral[400]}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    style={styles.modernInput}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    editable={!inputsDisabled}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={color.neutral[500]}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={color.neutral[400]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={styles.modernInput}
                    editable={!inputsDisabled}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={color.neutral[500]}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.modernButton, loading && styles.buttonDisabled]}
                onPress={handleLoginWithPassword}
                disabled={loading || !phoneNumber || !password}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <MaterialCommunityIcons
                      name="loading"
                      size={20}
                      color={color.white}
                      style={styles.loadingIcon}
                    />
                    <CustomText
                      style={[globalStyles.f16Bold, globalStyles.textWhite]}
                    >
                      Signing In...
                    </CustomText>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <CustomText
                      style={[globalStyles.f16Bold, globalStyles.textWhite]}
                    >
                      Sign In
                    </CustomText>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={color.white}
                    />
                  </View>
                )}
              </TouchableOpacity>

              {/* Additional Info - Hidden when keyboard is open */}
              {!keyboardVisible && (
                <View style={styles.infoContainer}>
                  <CustomText
                    style={[
                      globalStyles.f12Regular,
                      globalStyles.neutral500,
                      globalStyles.textac,
                    ]}
                  >
                    Secure login for MCB Technicians
                  </CustomText>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Powered by Glansa Solutions */}
      <View style={styles.poweredBySection}>
        <CustomText
          style={[
            globalStyles.f12Regular,
            globalStyles.neutral400,
            globalStyles.textac,
          ]}
        >
          Powered by Glansa Solutions PVT LTD
        </CustomText>
      </View>

      <CustomAlert
        visible={showAlert}
        status={status}
        title={title}
        message={message}
        onClose={() => setShowAlert(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Header Section
  headerSection: {
    backgroundColor: color.primary,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginHorizontal: 0,
    marginLeft: 0,
    marginRight: 0,
    width: "100%",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 260,
    height: 140,
    resizeMode: "contain",
  },
  welcomeContainer: {
    alignItems: "center",
  },

  // Form Section
  formSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: color.white,
    borderRadius: 20,
    padding: 30,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
    marginTop: 40,
  },

  // Input Styles
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.neutral[200],
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  modernInput: {
    flex: 1,
    fontSize: 16,
    color: color.black,
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 4,
  },

  // Button Styles
  modernButton: {
    backgroundColor: color.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: color.neutral[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingIcon: {
    transform: [{ rotate: "0deg" }],
  },

  // Info Section
  infoContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: color.neutral[200],
  },

  // Powered By Section
  poweredBySection: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: color.neutral[50],
  },

  // Logo Only Section
  logoOnlySection: {
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  logoOnly: {
    width: 200,
    height: 100,
    resizeMode: "contain",
  },

  // Keyboard Open States
  keyboardOpenHeader: {
    width: "100%",
    marginHorizontal: 0,
    paddingHorizontal: 20,
  },
  keyboardOpenContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 0,
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
  },
  keyboardOpenFormSection: {
    flexGrow: 1,              // ✅ Allow the container to grow
    justifyContent: "center", // ✅ Center vertically
    alignItems: "center",     // ✅ Center horizontally
    paddingHorizontal: 20,
  },
  

  keyboardOpenFormCard: {
    padding: 25,
    marginHorizontal: 0,
    borderRadius: 16,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: color.white,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
});
