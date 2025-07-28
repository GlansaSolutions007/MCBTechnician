import React, { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import CustomText from "./CustomText";
import globalStyles from "../styles/globalStyles";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";

const color = {
  white: "#ffffff",
  red: "#fa7f7c",
  grey: "#969696",
  green: "#136D6E",
  primaryLight: "#178F91",
};

function AvailabilityHeader() {
  const [isOnline, setIsOnline] = useState(true);
  const progress = useSharedValue(isOnline ? 1 : 0);

  const toggleStatus = () => {
    const newValue = isOnline ? 0 : 1;
    progress.value = withTiming(newValue, { duration: 300 });
    setIsOnline(!isOnline);
  };

  const cardBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [color.grey, color.green]
    ),
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [color.white, color.white]
    ),
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

  const Switch = ({ onPress }) => {
    return (
      <Pressable onPress={onPress}>
        <Animated.View style={[styles.track, trackStyle]}>
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </Animated.View>
      </Pressable>
    );
  };

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
        <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>
          Wednesday, July 16
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
            ({isOnline ? "Online" : "Offline"})
          </CustomText>
        </View>
      </View>

      <View style={globalStyles.alineSelfend}>
        <Switch onPress={toggleStatus} />
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

export default AvailabilityHeader;
