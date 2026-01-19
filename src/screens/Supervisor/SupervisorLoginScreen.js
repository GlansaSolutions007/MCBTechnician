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
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SupervisorLoginScreen() {
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
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

  // Special credentials
  const SUPERVISOR_PHONE = "1234567890";
  const SUPERVISOR_PASSWORD = "abcdefg";

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

  const handleLogin = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setInputsDisabled(true);

    try {
      // Check for special supervisor credentials
      if (phoneNumber === SUPERVISOR_PHONE && password === SUPERVISOR_PASSWORD) {
        // Store supervisor login state
        await AsyncStorage.setItem("isSupervisor", "true");
        await AsyncStorage.setItem("supervisorPhone", phoneNumber);
        
        // Navigate to supervisor dashboard using reset to ensure proper navigation
        navigation.reset({
          index: 0,
          routes: [{ name: "SupervisorTabs" }],
        });
      } else {
        throw new Error("Invalid credentials. Please check your phone number and password.");
      }
    } catch (error) {
      console.error("Login error:", error.message);
      setTitle("Login Failed");
      setMessage(error.message || "Invalid credentials");
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
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={[globalStyles.flex1, { backgroundColor: color.white }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" backgroundColor={color.white} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <CustomText
                style={[
                  globalStyles.f28Bold,
                  globalStyles.textWhite,
                  { marginBottom: 10 },
                ]}
              >
                Supervisor Portal
              </CustomText>
            </View>
            <View style={styles.welcomeContainer}>
              <CustomText
                style={[globalStyles.f20Bold, globalStyles.textWhite]}
              >
                Welcome Back
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f14Regular,
                  globalStyles.textWhite,
                  { marginTop: 8, opacity: 0.9 },
                ]}
              >
                Sign in to continue
              </CustomText>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.formCard}>
              {/* Phone Number Input */}
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    phoneError && styles.inputWrapperError,
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={phoneError ? color.error : color.neutral[400]}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.modernInput,
                      phoneError && styles.inputError,
                    ]}
                    placeholder="Phone Number"
                    placeholderTextColor={color.neutral[400]}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!inputsDisabled}
                    autoCapitalize="none"
                  />
                </View>
                {phoneError ? (
                  <CustomText style={styles.errorText}>{phoneError}</CustomText>
                ) : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    passwordError && styles.inputWrapperError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={passwordError ? color.error : color.neutral[400]}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.modernInput,
                      passwordError && styles.inputError,
                    ]}
                    placeholder="Password"
                    placeholderTextColor={color.neutral[400]}
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    editable={!inputsDisabled}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={color.neutral[400]}
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
                style={[
                  styles.modernButton,
                  (loading || inputsDisabled) && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading || inputsDisabled}
              >
                {loading ? (
                  <CustomText
                    style={[globalStyles.f16Bold, globalStyles.textWhite]}
                  >
                    Signing in...
                  </CustomText>
                ) : (
                  <CustomText
                    style={[globalStyles.f16Bold, globalStyles.textWhite]}
                  >
                    Sign In
                  </CustomText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <CustomAlert
        visible={showAlert}
        title={title}
        message={message}
        status={status}
        onClose={() => setShowAlert(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
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
  welcomeContainer: {
    alignItems: "center",
  },
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
});

