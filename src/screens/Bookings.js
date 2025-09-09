import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  Animated,
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
import { useEffect, useState } from "react";
import axios from "axios";

export default function Bookings() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookings, techId } = route.params;
  
  const [todaysBookings, setTodaysBookings] = useState(bookings);
  const [refreshing, setRefreshing] = useState(false);
  const [pulse] = useState(new Animated.Value(0));

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
          Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [refreshing, pulse]);

  const bg = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [globalStyles.bgneutral200?.backgroundColor || "#D9D9D9", globalStyles.bgneutral100?.backgroundColor || "#E8E8E8"],
  });

  const SkeletonBookingCard = ({ index }) => (
    <View key={`skeleton-${index}`} style={[globalStyles.bgwhite, globalStyles.p4, globalStyles.mt4, globalStyles.card, styles.cardWrapper]}>
      <View style={[styles.accent, { backgroundColor: color.neutral[200] }]} />
      <View style={globalStyles.flexrow}>
        <Animated.View style={[styles.skelAvatar, { backgroundColor: bg }]} />
        <View style={[globalStyles.ml3, { flex: 1 }]}>
          <Animated.View style={[styles.skelLineMedium, { backgroundColor: bg, width: 160 }]} />
          <Animated.View style={[styles.skelLineSmall, { backgroundColor: bg, width: 140, marginTop: 8 }]} />
          <Animated.View style={[styles.skelFlexLine, { backgroundColor: bg, marginTop: 8 }]} />
        </View>
      </View>
      <View style={globalStyles.divider} />
      <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.alineItemscenter]}>
        <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
          <View style={globalStyles.mr3}>
            <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter]}>
              <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
              <Animated.View style={[styles.skelLineSmall, { backgroundColor: bg, width: 120, marginLeft: 8 }]} />
            </View>
            <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter]}>
              <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
              <Animated.View style={[styles.skelLineSmall, { backgroundColor: bg, width: 100, marginLeft: 8 }]} />
            </View>
          </View>
          <View>
            <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter]}>
              <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
              <Animated.View style={[styles.skelLineSmall, { backgroundColor: bg, width: 100, marginLeft: 8 }]} />
            </View>
            <View style={[globalStyles.flexrow, globalStyles.mt2, globalStyles.alineItemscenter]}>
              <Animated.View style={[styles.skelIcon, { backgroundColor: bg }]} />
              <Animated.View style={[styles.skelLineSmall, { backgroundColor: bg, width: 80, marginLeft: 8 }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

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
        ) : refreshing ? (
          [0,1,2,3,4,5].map((i) => <SkeletonBookingCard key={`s-${i}`} index={i} />)
        ) : (
          todaysBookings.map((item, index) => (
            <Pressable
              onPress={() => customerInfo(item)}
              key={item.BookingID?.toString() || `idx-${index}`}
              style={[
                globalStyles.bgwhite,
                globalStyles.p4,
                globalStyles.mt4,
                globalStyles.card,
                styles.cardWrapper,
              ]}
            >
              <View style={styles.accent} />
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
                  <View
                    style={[
                      globalStyles.flexrow,
                      globalStyles.justifysb,
                      globalStyles.alineItemscenter,
                    ]}
                  >
                    <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                      {item.CustomerName}
                    </CustomText>
                  </View>

                  <CustomText style={[globalStyles.f12Medium, globalStyles.neutral500, globalStyles.mt1]}>
                    Mobile: <CustomText style={globalStyles.black}>{item.PhoneNumber}</CustomText>
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f10Regular, globalStyles.neutral500, globalStyles.mt1]}
                    numberOfLines={2}
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
                        name="card-account-details-outline"
                        size={16}
                        color={color.primary}
                        style={{ marginRight: 6 }}
                      />
                      <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>
                        {item.BookingTrackID}
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
                        color={color.primary}
                        style={{ marginRight: 6 }}
                      />
                      <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>
                        {item.VehicleNumber}
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
                        color={color.primary}
                        style={{ marginRight: 6 }}
                      />
                      <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>
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
                        color={color.primary}
                        style={{ marginRight: 6 }}
                      />
                      <CustomText style={[globalStyles.f10Regular, globalStyles.black]}>
                        {item.TimeSlot}
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
  cardWrapper: {
    position: "relative",
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: color.primary,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipCompleted: { backgroundColor: "#4CAF50" },
  chipPending: { backgroundColor: color.primary },
  avatar: {
    width: 70,
    height: 100,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: color.white,
  },
  // skeleton primitives
  skelAvatar: { width: 70, height: 100, borderRadius: 8 },
  skelLineMedium: { height: 14, borderRadius: 7 },
  skelLineSmall: { height: 12, borderRadius: 6 },
  skelFlexLine: { height: 12, borderRadius: 6, width: "90%" },
  skelIcon: { width: 16, height: 16, borderRadius: 8 },
});
