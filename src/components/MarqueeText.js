import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const MarqueeText = ({ text, textStyle }) => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -SCREEN_WIDTH,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          textStyle,
          {
            transform: [{ translateX }],
            width: SCREEN_WIDTH * 2, 
          },
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: SCREEN_WIDTH * 0.9,
  },
});

export default MarqueeText;
