import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
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
import { API_BASE_URL, API_BASE_URL_IMAGE } from "@env";
import defaultAvatar from "../../assets/images/buddy.png";
import { useState } from "react";
import axios from "axios";

export default function Bookings() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookings, techId } = route.params;
  const [todaysBookings, setTodaysBookings] = useState(bookings);
  const [refreshing, setRefreshing] = useState(false);

  const customerInfo = (booking) => {
    navigation.navigate("customerInfo", { booking });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}Bookings/GetAssignedBookings?Id=${techId}`
      );
      if (response.data) {
        setTodaysBookings(response.data);
      }
    } catch (error) {
      console.error("Error refreshing bookings:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={
        todaysBookings.length === 0
          ? styles.noDataContainer
          : { paddingBottom: 30 }
      }
    >
      <View style={globalStyles.container}>
        {todaysBookings.length === 0 ? (
          <CustomText style={globalStyles.neutral500}>
            No bookings assigned
          </CustomText>
        ) : (
          todaysBookings.map((item, index) => (
            <Pressable
              onPress={() => customerInfo(item)}
              key={index}
              style={[
                item.BookingStatus == "Completed"
                  ? { backgroundColor: "#969696" }
                  : globalStyles.bgprimary,
                globalStyles.p4,
                globalStyles.mt5,
                globalStyles.card,
              ]}
            >
              <View style={globalStyles.flexrow}>
                <Image
                  source={
                    item.ProfileImage
                      ? { uri: `${API_BASE_URL_IMAGE}${item.ProfileImage}` }
                      : defaultAvatar
                  }
                  style={styles.avatar}
                />

                <View style={[globalStyles.ml3, { flex: 1 }]}>
                  <CustomText
                    style={[globalStyles.f24Bold, globalStyles.textWhite]}
                  >
                    {item.CustomerName}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f12Regular, globalStyles.textWhite]}
                  >
                    Mobile: {item.PhoneNumber}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f10Light, globalStyles.neutral100]}
                    numberOfLines={3}
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
                        style={[
                          globalStyles.f10Regular,
                          globalStyles.textWhite,
                        ]}
                      >
                        {item.PhoneNumber}
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
                        style={[
                          globalStyles.f10Regular,
                          globalStyles.textWhite,
                        ]}
                      >
                        {item.VehicleNumber}
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
                        style={[
                          globalStyles.f10Regular,
                          globalStyles.textWhite,
                        ]}
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
                        style={[
                          globalStyles.f10Regular,
                          globalStyles.textWhite,
                        ]}
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
                        style={[
                          globalStyles.f10Regular,
                          globalStyles.textWhite,
                        ]}
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
                        style={[
                          globalStyles.f10Regular,
                          globalStyles.textWhite,
                        ]}
                        numberOfLines={3}
                      >
                        {item.BrandName}
                      </CustomText>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  noDataContainer: {
    flexGrow: 1,
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
