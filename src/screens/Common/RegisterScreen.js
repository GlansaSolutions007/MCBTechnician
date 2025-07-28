import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function RegisterScreen() {
  const navigation = useNavigation();

  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access photos is required!");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,

      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/images/loginbg2.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={globalStyles.container}>
        <TextInput
          placeholder="First Name"
          placeholderTextColor={color.textInputDark}
          style={styles.textInput}
        />
        <TextInput
          placeholder="Last Name"
          placeholderTextColor={color.textInputDark}
          style={styles.textInput}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor={color.textInputDark}
          style={styles.textInput}
        />
        <TextInput
          placeholder="Phone Number"
          placeholderTextColor={color.textInputDark}
          style={styles.textInput}
        />
        <TextInput
          placeholder="Additional Phone Number (optional)"
          placeholderTextColor={color.textInputDark}
          style={styles.textInput}
        />

        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          <CustomText style={{ color: color.white }}>
            Upload Profile Photo
          </CustomText>
          {image && (
            <View style={styles.imageWrapper}>
              <ImageBackground
                source={{ uri: image }}
                style={styles.imagePreview}
                imageStyle={{ borderRadius: 40 }}
              >
                <TouchableOpacity
                  style={styles.removeIcon}
                  onPress={() => setImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              </ImageBackground>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <CustomText style={styles.buttonText}>Sign Up</CustomText>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    marginTop: 10,
    width: 80,
    height: 80,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  removeIcon: {
    position: "absolute",
    top: -10,
    right: -10,
    borderRadius: 12,
  },

  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  textInput: {
    borderBottomWidth: 1,
    borderColor: color.white,
    paddingVertical: 10,
    color: color.white,
    fontSize: 16,
    marginBottom: 20,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: color.white,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: color.white,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: color.textDark,
    fontSize: 16,
  },
});
