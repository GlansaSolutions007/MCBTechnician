import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import globalStyles from '../styles/globalStyles';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width * 0.9;
const BUTTON_WIDTH = 120;
const BUTTON_HEIGHT = 50;

const SlideButton = ({ onComplete }) => {
  const translateX = useSharedValue(0);
  const completed = useSharedValue(false);
  const [isVisible, setIsVisible] = useState(true);

  const onSlideComplete = () => {
    if (onComplete) {
      onComplete(); 
    }
    setIsVisible(false);
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      if (completed.value) return;
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      if (completed.value) return;

      const newTranslateX = ctx.startX + event.translationX;
      if (newTranslateX >= 0 && newTranslateX <= SLIDER_WIDTH - BUTTON_WIDTH) {
        translateX.value = newTranslateX;
      }
    },
    onEnd: () => {
      if (completed.value) return;

      if (translateX.value > SLIDER_WIDTH - BUTTON_WIDTH - 10) {
        translateX.value = withTiming(SLIDER_WIDTH - BUTTON_WIDTH, { duration: 300 });
        completed.value = true;
        runOnJS(onSlideComplete)();
      } else {
        translateX.value = withTiming(0, { duration: 300 });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: completed.value ? 0.6 : 1,
  }));
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.slider}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.button, animatedStyle]}>
            <Text style={[globalStyles.f16Bold, globalStyles.textWhite]}>Start Ride</Text>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </View>
  );
};

export default SlideButton;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 10,
  },
  slider: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    width: SLIDER_WIDTH,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    backgroundColor: '#707070',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
