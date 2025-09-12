import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  Animated,
  TouchableOpacity,
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
import { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function Bookings() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookings, techId } = route.params;
  
  const [todaysBookings, setTodaysBookings] = useState(bookings);
  const [refreshing, setRefreshing] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const [filterType, setFilterType] = useState('all'); // 'all', 'completed', 'pending'
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => {
      try { loop.stop(); } catch (_) {}
    };
  }, [pulse]);

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

  const getFilteredBookings = () => {
    switch (filterType) {
      case 'completed':
        return todaysBookings.filter(booking => booking.BookingStatus === 'Completed');
      case 'pending':
        return todaysBookings.filter(booking => booking.BookingStatus !== 'Completed');
      default:
        return todaysBookings;
    }
  };

  const filteredBookings = getFilteredBookings();

  const handleFilterChange = (newFilterType) => {
    if (newFilterType === filterType) return;
    
    setIsAnimating(true);
    
    // Start smooth transition animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change filter after fade out
      setFilterType(newFilterType);
      
      // Fade back in with new content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
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
        {/* Filter Section */}
        {todaysBookings.length > 0 && (
          <View style={[styles.filterCard, globalStyles.card, globalStyles.mt3]}>
            {/* <CustomText style={[globalStyles.f16Bold, globalStyles.primary, globalStyles.mb3]}>
              Filter Bookings
            </CustomText> */}
            
            <View style={styles.filterButtons}>
              <TouchableOpacity
                onPress={() => handleFilterChange('all')}
                style={[
                  styles.filterButton,
                  filterType === 'all' && styles.filterButtonActive
                ]}
                activeOpacity={0.7}
              >
               
                <CustomText style={[
                  globalStyles.f12Medium,
                  filterType === 'all' ? globalStyles.textWhite : globalStyles.neutral500
                ]}>
                  All
                </CustomText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleFilterChange('pending')}
                style={[
                  styles.filterButton,
                  filterType === 'pending' && styles.filterButtonActive
                ]}
                activeOpacity={0.7}
              >
               
                <CustomText style={[
                  globalStyles.f12Medium,
                  filterType === 'pending' ? globalStyles.textWhite : globalStyles.neutral500
                ]}>
                  Pending
                </CustomText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleFilterChange('completed')}
                style={[
                  styles.filterButton,
                  filterType === 'completed' && styles.filterButtonActive
                ]}
                activeOpacity={0.7}
              >
              
                <CustomText style={[
                  globalStyles.f12Medium,
                  filterType === 'completed' ? globalStyles.textWhite : globalStyles.neutral500
                ]}>
                  Completed
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {filteredBookings.length === 0 ? (
          <View style={[globalStyles.alineItemscenter, globalStyles.justifycenter, { paddingVertical: 40 }]}>
            <Ionicons name="document-text-outline" size={48} color={color.neutral[300]} />
            <CustomText style={[globalStyles.f16Medium, globalStyles.neutral500, globalStyles.mt2, globalStyles.textac]}>
              {todaysBookings.length === 0 
                ? "No bookings assigned" 
                : `No ${filterType === 'all' ? '' : filterType} bookings found`
              }
          </CustomText>
          </View>
        ) : refreshing ? (
          [0,1,2,3,4,5].map((i) => <SkeletonBookingCard key={`s-${i}`} index={i} />)
        ) : (
          <Animated.View style={{ 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}>
            {filteredBookings.map((item, index) => (
            <Pressable
              onPress={() => customerInfo(item)}
              key={item.BookingID?.toString() || `idx-${index}`}
              style={[
                item.BookingStatus === 'Completed' ? globalStyles.bgneutral100 : globalStyles.bgwhite,
                globalStyles.p4,
                globalStyles.mt4,
                isAnimating ? globalStyles.radius : globalStyles.card,
                styles.cardWrapper,
              ]}
            >
              <View style={[
                styles.accent,
                { backgroundColor: item.BookingStatus === 'Completed' ? color.alertError : color.primary }
              ]} />
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
                    {/* <View style={[
                      styles.statusChip,
                      { backgroundColor: item.BookingStatus === 'Completed' ? color.alertSuccess : color.primary }
                    ]}>
                      <CustomText style={[globalStyles.f10Bold, globalStyles.textWhite]}>
                        {item.BookingStatus || 'Pending'}
                      </CustomText>
                    </View> */}
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
            ))}
          </Animated.View>
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
  // Filter Card
  filterCard: {
    backgroundColor: color.white,
    padding: 12,
    marginBottom: 0,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: color.neutral[100],
    alignItems: "center",
    marginHorizontal: 3,
    minHeight: 40,
  },
  filterButtonActive: {
    backgroundColor: color.primary,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardWrapper: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
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
