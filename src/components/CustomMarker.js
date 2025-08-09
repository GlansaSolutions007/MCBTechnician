// CustomMarker.js
import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";

const CustomMarker = ({ coordinate, image }) => {
  return (
    <Marker coordinate={coordinate}>
      <View style={styles.markerContainer}>
        <Image source={image} style={styles.markerImage} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
});

export default CustomMarker;
