import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
  Entypo,
} from "@expo/vector-icons";
import globalStyles from "../styles/globalStyles";
import CustomText from "../components/CustomText";
import { color } from "../styles/theme";

export default function Bookings() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookings } = route.params;
  const navigatin = useNavigation();
  const customerInfo = () => {
    navigatin.navigate("customerInfo",{bookings});
  };
  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={globalStyles.container}>
        {bookings.map((item, index) => (
          <View
            key={index}
            style={[
              globalStyles.bgprimary,
              globalStyles.p4,
              globalStyles.mt5,
              globalStyles.card,
            ]}
          >
            <View style={globalStyles.flexrow}>
              <Image
                source={{
                  uri: `https://api.mycarsbuddy.com/${item.ProfileImage}`,
                }}
                style={styles.avatar}
              />

              <View style={[globalStyles.ml3, { flex: 1 }]}>
                <CustomText
                  style={[globalStyles.f24Bold, globalStyles.textWhite]}
                >
                  {item.CustFullName}
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Regular, globalStyles.textWhite]}
                >
                  Mobile: {item.CustPhoneNumber}
                </CustomText>
                <CustomText
                  style={[globalStyles.f10Light, globalStyles.neutral100]}
                  numberOfLines={1}
                >
                  {item.FullAddress}
                </CustomText>
              </View>
            </View>

            <View style={globalStyles.divider} />

            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifysb,
                globalStyles.alineItemscenter,
              ]}
            >
              <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
                <View style={globalStyles.mr3}>
                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.mt2,
                      globalStyles.alineItemscenter,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-distance"
                      size={16}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      {item.CustPhoneNumber}
                    </CustomText>
                  </View>

                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.mt2,
                      globalStyles.alineItemscenter,
                    ]}
                  >
                    <FontAwesome5
                      name="car"
                      size={14}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      {item.CityID}
                    </CustomText>
                  </View>

                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.mt2,
                      globalStyles.alineItemscenter,
                    ]}
                  >
                    <Entypo
                      name="v-card"
                      size={14}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      {item.BookingTrackID}
                    </CustomText>
                  </View>
                </View>

                <View>
                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.mt2,
                      globalStyles.alineItemscenter,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="calendar"
                      size={16}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      {item.BookingDate?.slice(0, 10)}
                    </CustomText>
                  </View>

                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.mt2,
                      globalStyles.alineItemscenter,
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                    >
                      {item.TimeSlot}
                    </CustomText>
                  </View>

                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.mt2,
                      globalStyles.alineItemscenter,
                    ]}
                  >
                    <Entypo
                      name="documents"
                      size={16}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                    <CustomText
                      style={[globalStyles.f10Regular, globalStyles.textWhite]}
                      numberOfLines={1}
                    >
                      {item.PackageName}
                    </CustomText>
                  </View>
                </View>
              </View>

              <View style={globalStyles.alineSelfend}>
                <TouchableOpacity style={styles.cancelButton}>
                  <CustomText
                    style={[globalStyles.f12Bold, globalStyles.textWhite]}
                  >
                    Cancel
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => customerInfo(item)}
                  style={[styles.viewButton, globalStyles.mt3]}
                >
                  <CustomText
                    style={[globalStyles.f12Bold, globalStyles.primary]}
                  >
                    View
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    backgroundColor: color.black,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  viewButton: {
    backgroundColor: color.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 100,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: color.white,
  },
});
