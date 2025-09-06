import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import CustomText from "./CustomText";
import globalStyles from "../styles/globalStyles";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";
import { Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  getTrackingStatus,
  startBackgroundTracking,
  stopBackgroundTracking,
} from "../utils/locationTracker";

const color = {
  white: "#ffffff",
  red: "#fa7f7c",
  grey: "#969696",
  green: "#136D6E",
  primaryLight: "#178F91",
};

export default function TrackingStatusIndicator({ technicianId }) {
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (technicianId) {
      updateTrackingStatus();
      // const interval = setInterval(updateTrackingStatus, 10000);
      // return () => clearInterval(interval);
    }
  }, [technicianId]);

  const updateTrackingStatus = async () => {
    try {
      const status = await getTrackingStatus();
      setTrackingStatus(status);

      progress.value = withTiming(status?.backgroundTrackingActive ? 1 : 0, {
        duration: 300,
      });
    } catch (error) {
      console.log("Error updating tracking status:", error);
    }
  };

  const toggleStatus = async () => {
    if (!technicianId || isLoading) return;

    setIsLoading(true);
    try {
      if (trackingStatus?.backgroundTrackingActive) {
        await stopBackgroundTracking();
        console.log(
          "Background Tracking Stopped",
          "Location updates will only work when the app is open."
        );
      } else {
        await startBackgroundTracking(technicianId);
        console.log(
          "Background Tracking Started",
          "Your location will be shared with customers even when the app is closed."
        );
      }
      await updateTrackingStatus();
    } catch (error) {
      console.log("Error", "Failed to toggle background tracking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==== Switch styles ====
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [color.white, color.white]),
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [25, 4]);
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [color.red, color.primaryLight]
    );
    return {
      transform: [{ translateY }],
      backgroundColor,
    };
  });

  const cardBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [color.grey, color.green]),
  }));

  const Switch = () => (
    <Pressable onPress={toggleStatus} disabled={isLoading}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );

  if (!technicianId) return null;

  return (
    <Animated.View
      style={[
        cardBackgroundStyle,
        globalStyles.p3,
        globalStyles.borderRadiuslarge,
        globalStyles.flexrow,
        globalStyles.justifysb,
        globalStyles.alineItemscenter,
        globalStyles.mv3,
      ]}
    >
      <View>
        {/* Today + Status */}
        <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </CustomText>

        <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
          <CustomText style={[globalStyles.f24Bold, globalStyles.textWhite]}>
            Today{" "}
          </CustomText>
          <CustomText
            style={[
              globalStyles.f16Light,
              globalStyles.neutral100,
              globalStyles.alineSelfend,
            ]}
          >
            (
            {trackingStatus?.backgroundTrackingActive
              ? "Online"
              : "Offline"}
            )
          </CustomText>
        </View>
      </View>

      {/* Switch */}
      <View style={globalStyles.alineSelfend}>
        <Switch />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 42,
    height: 60,
    backgroundColor: color.white,
    borderRadius: 15,
    padding: 4,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: 24,
    borderRadius: 10,
  },
});
