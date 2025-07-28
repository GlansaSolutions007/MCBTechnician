// src/navigation/RootNavigator.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/Common/LoginScreen";
import RegisterScreen from "../screens/Common/RegisterScreen";
import CustomerTabNavigator from "./CustomerTabNavigator";
import TechnicianTabNavigator from "./TechnicianTabNavigator";
import { useAuth } from "../contexts/AuthContext";
import CustomerStackNavigator from "./CustomerStackNavigator";
import CustomText from "../components/CustomText";
import LiveTrackingMap from "../components/LiveTrackingMap";
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user } = useAuth(); // Get user from auth context
  // const user = { role: '' }; // Simulate auth state

  // Prepare screen list ahead
  const renderScreens = () => {
    if (!user?.role) {
      return (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen
            name="CustomerTabs"
            component={CustomerStackNavigator}
          />
          <Stack.Screen name="liveTrackingMap" component={LiveTrackingMap} />
        </>
      );
    }

    // if (user.role === "customer") {
    //   return (
    //     <Stack.Screen
    //       name="CustomerTabs"
    //       component={CustomerStackNavigator}
    //     />
    //   );
    // }

    // if (user.role === "technician") {
    //   return (
    //     <Stack.Screen
    //       name="TechnicianTabs"
    //       component={TechnicianTabNavigator}
    //     />
    //   );
    // }

    return null;
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {renderScreens()}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
