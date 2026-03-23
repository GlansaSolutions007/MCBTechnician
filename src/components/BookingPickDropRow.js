import React from "react";
import { View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomText from "./CustomText";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";

/**
 * Renders Pick From / Drop At when booking.PickupDelivery has PickFrom or DropAt.
 * Use in Bookings, Dashboard, CustomerInfo, ServiceStart, CarPickUp, ServiceEnd.
 */
export default function BookingPickDropRow({ booking, style }) {
  const pickFrom = booking?.PickupDelivery?.PickFrom;
  const dropAt = booking?.PickupDelivery?.DropAt;
  if (!pickFrom && !dropAt) return null;

  return (
    <View style={[styles.wrap, style]}>
      {pickFrom && (
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="map-marker-plus"
            size={20}
            color={color.primary}
            style={styles.icon}
          />
          <CustomText style={[globalStyles.f14Bold, globalStyles.primary]}>
            Pick:{" "}
          </CustomText>
          <CustomText
            style={[globalStyles.f14Regular, globalStyles.black, styles.addressText]}
            numberOfLines={2}
          >
            {pickFrom.Address || pickFrom.PersonName || "—"}
          </CustomText>
        </View>
      )}
      {dropAt && (
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="map-marker-check"
            size={20}
            color={color.alertInfo}
            style={styles.icon}
          />
          <CustomText style={[globalStyles.f14Bold, { color: color.alertInfo }]}>
            Drop:{" "}
          </CustomText>
          <CustomText
            style={[globalStyles.f14Regular, globalStyles.black, styles.addressText]}
            numberOfLines={2}
          >
            {dropAt.Address || dropAt.PersonName || "—"}
          </CustomText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
    flexWrap: "wrap",
  },
  icon: { marginRight: 8 },
  addressText: { flex: 1 },
});
