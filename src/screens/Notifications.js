import React from "react";
import { Image, ScrollView, View, StyleSheet } from "react-native";
import globalStyles from "../styles/globalStyles";
import CustomText from "../components/CustomText";
import person from "../../assets/icons/Navigation/TechnicalSupport.png";
import { color } from "../styles/theme";

export default function Notifications() {
  return (
    <ScrollView
      style={[globalStyles.bgcontainer]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={[globalStyles.container, globalStyles.mt2]}>
        <View style={[styles.card, globalStyles.bgwhite, globalStyles.mt2]}>
          <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
            <Image source={person} style={styles.image} />
            <View>
              <CustomText style={[globalStyles.f12Bold, globalStyles.primary]}>
                Hey Buddy New Task Assigned
              </CustomText>
              <CustomText style={[globalStyles.f10Medium]}>
                Booking ID: TG234518, Click to view
              </CustomText>
            </View>
          </View>
          <CustomText style={[globalStyles.f10Regular, styles.time]}>
            11:00 am
          </CustomText>
        </View>

        <View style={[styles.card, globalStyles.bgwhite, globalStyles.mt1]}>
          <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
            <Image source={person} style={styles.image} />
            <View>
              <CustomText style={[globalStyles.f12Bold, globalStyles.primary]}>
                Hey Buddy New Task Assigned
              </CustomText>
              <CustomText style={[globalStyles.f10Medium]}>
                Booking ID: TG234518, Click to view
              </CustomText>
            </View>
          </View>
          <CustomText style={[globalStyles.f10Regular, styles.time]}>
            11:00 am
          </CustomText>
        </View>

        <View
          style={[styles.card, globalStyles.mt1, globalStyles.bgredverulight]}
        >
          <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
            <Image source={person} style={styles.image} />
            <View>
              <CustomText style={[globalStyles.f12Bold, globalStyles.red]}>
                Assigned Task Canceled
              </CustomText>
              <CustomText style={[globalStyles.f10Medium, globalStyles.red]}>
                Booking ID: TG234518
              </CustomText>
            </View>
          </View>
          <CustomText style={[globalStyles.f10Regular, styles.time]}>
            11:00 am
          </CustomText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  image: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginRight: 12,
  },
  time: {
    position: "absolute",
    bottom: 10,
    right: 12,
    color: color.neutral[500],
  },
});
