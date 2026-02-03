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
  BackHandler,
} from "react-native";
import globalStyles from "../../styles/globalStyles";
import CustomAlert from "../../components/CustomAlert";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";

export default function SupervisorLoginScreen() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [headerAnim] = useState(new Animated.Value(1));
  const [welcomeTextAnim] = useState(new Animated.Value(1));
  const [logoAnim] = useState(new Animated.Value(1));
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [status, setStatus] = useState("info");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("Login Info");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [inputsDisabled, setInputsDisabled] = useState(false);

  // Validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
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

  const handleEmailChange = (text) => {
    setEmail(text);
    if (emailError) {
      setEmailError("");
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError("");
    }
  };

  const validateForm = () => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    
    return !emailValidation && !passwordValidation;
  };

  const handleLogin = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setInputsDisabled(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}Auth/Admin-login`,
        {
          email: email,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Supervisor login response:", response.data);

      if (response.data?.success) {
        const adminId = response.data?.adminId || response.data?.id;
        const token = response.data?.token || "";
        const adminEmail = response.data?.email || email;

        // Store supervisor login state
        await AsyncStorage.setItem("isSupervisor", "true");
        await AsyncStorage.setItem("supervisorEmail", adminEmail);
        if (adminId) {
          await AsyncStorage.setItem("supervisorId", adminId.toString());
        }
        if (token) {
          await AsyncStorage.setItem("supervisorToken", token);
        }
        
        // Navigate to supervisor dashboard using reset to ensure proper navigation
        navigation.reset({
          index: 0,
          routes: [{ name: "SupervisorTabs" }],
        });
      } else {
        throw new Error(response.data?.message || "Login failed.");
      }
    } catch (error) {
      console.error("Supervisor login error:", error?.response?.data || error.message);
      setTitle("Login Failed");
      setMessage(error?.response?.data?.message || error.message || "Invalid credentials. Please check your email and password.");
      setStatus("error");
      setShowAlert(true);
    } finally {
      setLoading(false);
      setInputsDisabled(false);
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

  // Prevent back navigation to technician login
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      // Prevent going back to technician login
      return true; // Return true to prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

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
            keyboardVisible && { flex: 1, justifyContent: "flex-start" },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section with smooth hide animation */}
          {!keyboardVisible && (
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
              {/* Technician Login Button - Above Logo */}
              <View style={styles.technicianButtonContainer}>
                <TouchableOpacity
                  style={styles.technicianButton}
                  onPress={() => navigation.navigate("Login")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-outline" size={16} color={color.white} />
                  <CustomText style={[globalStyles.f12Medium, { color: color.white, marginLeft: 6 }]}>
                    Technician Login
                  </CustomText>
                </TouchableOpacity>
              </View>

              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/Logo/mycarbuddy.png")}
                  style={styles.logo}
                />
              </View>

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
          )}

          {/* Login Form Section */}
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
              {/* Simple title - Only show when keyboard is open */}
              {keyboardVisible && (
                <CustomText
                  style={[
                    globalStyles.f24Bold,
                    { color: color.primary },
                    globalStyles.mb4,
                    globalStyles.textac,
                  ]}
                >
                  Supervisor Login
                </CustomText>
              )}
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  emailError && styles.inputWrapperError
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={color.neutral[500]}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={color.neutral[400]}
                    value={email}
                    onChangeText={handleEmailChange}
                    style={[
                      styles.modernInput,
                      emailError && styles.inputError
                    ]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!inputsDisabled}
                  />
                </View>
                {emailError ? (
                  <CustomText style={styles.errorText}>
                    {emailError}
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
                onPress={handleLogin}
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
                    Secure login for MCB Supervisors
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
  headerSection: {
    backgroundColor: color.primary,
    paddingTop: 30,
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
  },
  logo2: {
    width: 200,
    height: 100,
    resizeMode: "contain",
  },
  logo: {
    width: 260,
    height: 140,
    resizeMode: "contain",
  },
  logo2: {
    width: 200,
    height: 100,
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
    borderWidth: 2,
    borderColor: color.primary,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
    marginTop: 40,
  },
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
    fontSize: 16,
    color: color.black,
    paddingVertical: 16,
  },
  inputError: {
    color: color.error || "#FF4444",
  },
  errorText: {
    color: color.error || "#FF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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

  // Keyboard Open States
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
  technicianButtonContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: "flex-end",
    width: "100%",
  },
  technicianButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 140,
  },
});

