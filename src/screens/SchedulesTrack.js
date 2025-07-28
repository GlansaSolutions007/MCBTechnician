import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import CustomText from "../components/CustomText";

export default function SchedulesTrack() {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");

  const getStates = async () => {
    try {
      const response = await axios.get("https://api.mycarsbuddy.com/api/State");
      setStates(response.data);
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  useEffect(() => {
    getStates();
  }, []);

  return (
    <View style={styles.container}>
      <CustomText style={styles.label}>Select State</CustomText>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedState}
          onValueChange={(itemValue) => setSelectedState(itemValue)}
        >
          <Picker.Item label="Select a state..." value="" />
          {states.map((state,index) => (
            <Picker.Item
            key={index}
              label={state.StateName}
              value={state.StateId}
            />
          ))}
        </Picker>
      </View>
      {selectedState !== "" && (
        <CustomText style={styles.resultText}>Selected State ID: {selectedState}</CustomText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  label: { fontSize: 18, marginBottom: 10 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
  },
  resultText: { marginTop: 20, fontSize: 16, color: "blue" },
});
