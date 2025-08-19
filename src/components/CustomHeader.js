import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "./CustomText";
import globalStyles from "../styles/globalStyles";
import { useNavigation } from "@react-navigation/native";
import { color } from "../styles/theme";

export default function CustomHeader() {
  const navigation = useNavigation();
  const Notifications = () => {
    navigation.navigate("Notifications");
  };
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.headerContainer,
        globalStyles.bgcontainer,
        { paddingTop: insets.top + 10 },
      ]}
    >
      <View style={styles.topRow}>
        <View>
          <CustomText style={[globalStyles.f14Bold, globalStyles.mt1]}>
            Hello User
          </CustomText>
          {/* <Pressable>
            <CustomText style={[globalStyles.f10Regular, globalStyles.mt1]}>
              Hyderabad, Telangana <Ionicons name="chevron-down" size={14} />
            </CustomText>
          </Pressable> */}
        </View>

        <Pressable style={[globalStyles.p1]} onPress={Notifications}>
          <Ionicons name="notifications-outline" size={24} color={color.black} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    fontFamily: "Manrope-Medium",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 0,
    backgroundColor: "#fff",
    // borderBottomColor: "#eee",
    // borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
  },
});
