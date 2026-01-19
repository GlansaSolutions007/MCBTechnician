import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "../screens/Common/LoginScreen";
import RegisterScreen from "../screens/Common/RegisterScreen";
import CustomerTabNavigator from "./CustomerTabNavigator";
import { useAuth } from "../contexts/AuthContext";
import CustomerStackNavigator from "./CustomerStackNavigator";
import SupervisorTabNavigator from "./SupervisorTabNavigator";
import SupervisorLoginScreen from "../screens/Supervisor/SupervisorLoginScreen";
// import LiveTrackingMap from "../components/LiveTrackingMap";
import { View, ActivityIndicator } from "react-native";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [checkingSupervisor, setCheckingSupervisor] = useState(true);

  useEffect(() => {
    const checkSupervisorStatus = async () => {
      try {
        const supervisorStatus = await AsyncStorage.getItem("isSupervisor");
        setIsSupervisor(supervisorStatus === "true");
      } catch (error) {
        console.error("Error checking supervisor status:", error);
      } finally {
        setCheckingSupervisor(false);
      }
    };
    checkSupervisorStatus();
  }, []);

  if (loading || checkingSupervisor) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Determine initial route
  const getInitialRouteName = () => {
    if (isSupervisor) return "SupervisorTabs";
    if (user) return "CustomerTabs";
    return "Login";
  };

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={getInitialRouteName()}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="SupervisorLogin" component={SupervisorLoginScreen} />
        <Stack.Screen
          name="SupervisorTabs"
          component={SupervisorTabNavigator}
        />
        <Stack.Screen
          name="CustomerTabs"
          component={CustomerStackNavigator}
        />
        {/* <Stack.Screen name="liveTrackingMap" component={LiveTrackingMap} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
