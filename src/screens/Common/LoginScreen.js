import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Keyboard,
} from "react-native";
import globalStyles from "../../styles/globalStyles";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../contexts/AuthContext";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import AntDesign from "@expo/vector-icons/AntDesign";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const [password, setPassword] = useState("");

  const { login } = useAuth();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [status, setStatus] = useState("info");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("Login Info");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [inputsDisabled, setInputsDisabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleLoginWithPassword = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://api.mycarsbuddy.com/api/Auth/Technician-login",
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
        console.log("iddddddddddddddd:", techID);
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
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={[globalStyles.bgprimary, globalStyles.container]}>
      {!keyboardVisible && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.replace("CustomerTabs")}
        >
          <View style={styles.skipContent}>
            <CustomText style={styles.skipText}>Skip</CustomText>
            <AntDesign name="doubleright" size={16} color="white" />
          </View>
        </TouchableOpacity>
      )}
      <View />
      <View>
        <View>
          <Image
            source={require("../../../assets/Logo/my car buddy-02 yellow-01.png")}
            style={styles.logo}
          />
        </View>
        <CustomText style={globalStyles.fullredLight}>9705577208</CustomText>
        <TextInput
          placeholder="Enter Phone Number"
          placeholderTextColor={color.textWhite}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={styles.textInput}
          keyboardType="phone-pad"
          autoCapitalize="none"
          editable={!inputsDisabled}
        />
        <TextInput
          placeholder="Enter Password"
          placeholderTextColor={color.textWhite}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          F
          style={styles.textInput}
          editable={!inputsDisabled}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLoginWithPassword}
          disabled={loading}
        >
          <CustomText style={[globalStyles.f16Regular, globalStyles.textWhite]}>
            Login
          </CustomText>
        </TouchableOpacity>
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
  logo: {
    width: 200,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 100,
  },

  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  skipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  title: {
    // fontFamily: fonts.bold,
    fontSize: 22,
    color: color.white,
  },
  titleBlack: {
    // fontFamily: fonts.bold,
    fontSize: 22,
    color: color.black,
  },
  textInput: {
    borderBottomWidth: 1,
    borderColor: color.white,
    paddingVertical: 10,
    color: color.white,
    // fontFamily: fonts.regular,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: color.primaryLight,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  // Home Screen Styles
  header: {
    backgroundColor: color.primary || "#017F77",
    padding: 20,
  },
  greeting: {
    color: color.white,
    fontSize: 16,
    // fontFamily: fonts.medium,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  location: {
    color: color.white,
    fontSize: 14,
    marginRight: 5,
    // fontFamily: fonts.regular,
  },
  banner: {
    backgroundColor: color.primary || "#017F77",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
  },
  carImage: {
    width: "100%",
    height: 130,
  },
  bannerTitle: {
    fontSize: 22,
    color: color.white,
    // fontFamily: fonts.semiBold,
    marginTop: 10,
  },

  bannerSubtitle: {
    fontSize: 14,
    color: color.white,
    // fontFamily: fonts.regular,
    marginTop: 5,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    // fontFamily: fonts.medium,
    marginVertical: 20,
    marginLeft: 20,
    color: color.textDark,
  },
  services: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: color.lightGreen || "#E0F7F4",
    borderRadius: 10,
    width: "42%",
    overflow: "hidden",
    alignItems: "center",
  },
  cardImage: {
    width: "100%",
    height: 100,
  },
  cardText: {
    fontSize: 14,
    // fontFamily: fonts.medium,
    padding: 10,
    color: color.textDark,
    textAlign: "center",
  },
  ctaContainer: {
    flexDirection: "row",
    borderRadius: 10,
    margin: 20,
    padding: 15,
    alignItems: "center",
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 24,
    width: "60%",
    // fontFamily: fonts.medium,
    color: color.textDark,
    marginBottom: 5,
    lineHeight: 25,
  },
  ctaSubTitle: {
    fontSize: 12,
    // fontFamily: fonts.regular,
    color: color.textLight || "#555",
  },
  ctaImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 10,
  },
  ctaButton: {
    backgroundColor: color.black,
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  ctaButtonText: {
    color: color.white,
    fontSize: 14,
  },
});
