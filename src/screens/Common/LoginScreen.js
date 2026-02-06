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
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

  // Validation states
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Validation functions
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone) {
      return "Phone number is required";
    }
    if (!phoneRegex.test(phone)) {
      return "Please enter a valid 10-digit phone number";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  };

  const handlePhoneNumberChange = (text) => {
    setPhoneNumber(text);
    if (phoneError) {
      setPhoneError("");
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError("");
    }
  };

  const validateForm = () => {
    const phoneValidation = validatePhoneNumber(phoneNumber);
    const passwordValidation = validatePassword(password);

    setPhoneError(phoneValidation);
    setPasswordError(passwordValidation);

    return !phoneValidation && !passwordValidation;
  };

  const handleLoginWithPassword = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      // Continue with normal technician login flow
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
        } catch (e) { }
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
            } catch (_) { }
            try {
              await axios.post(`${API_BASE_URL}Push/register`, {
                userRole: "technician",
                userId: Number(techID),
                fcmToken: fcmToken || null,
                expoToken: expoPushToken || null,
                platform: Platform.OS,
              });
            } catch (_) { }
          }
        } catch (_) { }
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
        Animated.parallel([
          Animated.timing(headerAnim, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(welcomeTextAnim, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        Animated.parallel([
          Animated.timing(headerAnim, {
            toValue: 1,
            duration: 350,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(welcomeTextAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.cubic),
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
      <StatusBar
        backgroundColor={keyboardVisible ? color.background : color.primary}
        barStyle={keyboardVisible ? "dark-content" : "light-content"}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            { flexGrow: 1 },
            keyboardVisible && { flex: 1, justifyContent: "flex-start" },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section - always rendered, animated out when keyboard opens */}
          <Animated.View
            pointerEvents={keyboardVisible ? "none" : "auto"}
            style={[
              styles.headerSectionWrapper,
              keyboardVisible && styles.headerSectionAbsolute,
              {
                opacity: headerAnim,
                transform: [
                  {
                    translateY: headerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-120, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[color.primary, color.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerSection}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/Logo/logoWhite.png")}
                  style={styles.logo}
                />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Login Form Section */}
          {/* <Animated.View
            style={[
              styles.formSection,
              { opacity: fadeAnim },
              keyboardVisible && styles.keyboardOpenFormSection,
            ]}
          > */}
          <Animated.View
            style={[
              styles.formSection,
              { opacity: fadeAnim },
              keyboardVisible && {
                flex: 1,
                justifyContent: "flex-start",
                alignItems: "center",
                marginTop: 0,
              },
            ]}
          >
            <View
              style={[
                styles.formCard,
                keyboardVisible && styles.keyboardOpenFormCard,
              ]}
            >
              {keyboardVisible && (
                <View>
                  <View style={globalStyles.alineItemscenter}>
                    <Image
                      source={require("../../../assets/Logo/mycarbuddy.png")}
                      style={styles.logo2}
                    />
                  </View>
                </View>
              )}
              <CustomText style={styles.formTitle}>Technician Login</CustomText>
              {/* Phone Number Input */}
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  phoneError && styles.inputWrapperError
                ]}>
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
                    onChangeText={handlePhoneNumberChange}
                    style={[
                      styles.modernInput,
                      phoneError && styles.inputError
                    ]}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    editable={!inputsDisabled}
                  />
                </View>
                {phoneError ? (
                  <CustomText style={styles.errorText}>
                    {phoneError}
                  </CustomText>
                ) : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  passwordError && styles.inputWrapperError
                ]}>
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
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    style={[
                      styles.modernInput,
                      passwordError && styles.inputError
                    ]}
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
                {passwordError ? (
                  <CustomText style={styles.errorText}>
                    {passwordError}
                  </CustomText>
                ) : null}
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.modernButton, loading && styles.buttonDisabled]}
                onPress={handleLoginWithPassword}
                disabled={loading}
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

              {/* Role switcher - after form */}
              <View style={styles.roleSwitcherContainer}>
                <View style={styles.roleSwitcherDivider}>
                  <View style={styles.roleSwitcherLine} />
                  <CustomText style={styles.roleSwitcherLabel}>or</CustomText>
                  <View style={styles.roleSwitcherLine} />
                </View>
                <TouchableOpacity
                  style={styles.roleSwitcherButton}
                  onPress={() => navigation.replace("SupervisorLogin")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-outline" size={18} color={color.primary} />
                  <CustomText style={styles.roleSwitcherButtonText}>
                    Login as Supervisor
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Powered by Glansa Solutions */}
      <View style={styles.poweredBySection}>
        <CustomText
          style={[
            globalStyles.f12Regular,
            globalStyles.neutral500,
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
  headerSectionWrapper: {
    width: "100%",
    marginHorizontal: 0,
  },
  headerSectionAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  headerSection: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    width: "100%",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  logo: {
    width: 220,
    height: 130,
    resizeMode: "contain",
  },
  logo2: {
    width: 220,
    height: 120,
    resizeMode: "contain",
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
    borderWidth: 2,
    borderColor: color.primary,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
    marginTop: 40,
  },
  formTitle: {
    ...globalStyles.f14Bold,
    color: color.primary,
    textAlign: "center",
    marginBottom: 20,
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
  inputWrapperError: {
    borderColor: color.error || "#FF4444",
    backgroundColor: "#FFF5F5",
  },
  inputIcon: {
    marginRight: 12,
  },
  modernInput: {
    flex: 1,
    color: color.black,
    paddingVertical: 16,
    ...globalStyles.f12Regular
  },
  inputError: {
    color: color.error || "#FF4444",
  },
  errorText: {
    color: color.error || "#FF4444",
    marginTop: 4,
    marginLeft: 4,
    ...globalStyles.f10Medium
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

  // Role switcher (after form)
  roleSwitcherContainer: {
    marginTop: 18,
    // paddingTop: 10,
    // borderTopWidth: 1,
    borderTopColor: color.neutral[200],
    alignItems: "center",
  },
  roleSwitcherDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  roleSwitcherLine: {
    flex: 1,
    height: 1,
    backgroundColor: color.neutral[200],
  },
  roleSwitcherLabel: {
    ...globalStyles.f12Regular,
    color: color.neutral[500],
    marginHorizontal: 12,
  },
  roleSwitcherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: color.primary,
    backgroundColor: "transparent",
    minWidth: 180,
  },
  roleSwitcherButtonText: {
    ...globalStyles.f12Bold,
    fontWeight: "600",
    color: color.primary,
    marginLeft: 8,
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
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  keyboardOpenFormCard: {
    padding: 25,
    marginHorizontal: 0,
    marginTop: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: color.primary,
    backgroundColor: color.white,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
});
