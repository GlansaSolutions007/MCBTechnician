import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "../screens/Common/LoginScreen";
import RegisterScreen from "../screens/Common/RegisterScreen";
import PermissionsDisclosureScreen, { DISCLOSURE_KEY } from "../screens/Common/PermissionsDisclosureScreen";
import CustomerTabNavigator from "./CustomerTabNavigator";
import { useAuth } from "../contexts/AuthContext";
import CustomerStackNavigator from "./CustomerStackNavigator";
import SupervisorTabNavigator from "./SupervisorTabNavigator";
import SupervisorLoginScreen from "../screens/Supervisor/SupervisorLoginScreen";
import SupervisorBookingDetails from "../screens/Supervisor/SupervisorBookingDetails";
import SupervisorLeads from "../screens/Supervisor/SupervisorLeads";
// import LiveTrackingMap from "../components/LiveTrackingMap";
import { View, ActivityIndicator } from "react-native";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [checkingSupervisor, setCheckingSupervisor] = useState(true);
  const [disclosureAccepted, setDisclosureAccepted] = useState(null);

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

  useEffect(() => {
    if (!user && !isSupervisor) {
      setDisclosureAccepted(true);
      return;
    }
    let cancelled = false;
    AsyncStorage.getItem(DISCLOSURE_KEY)
      .then((val) => {
        if (!cancelled) setDisclosureAccepted(val === "true");
      })
      .catch(() => {
        if (!cancelled) setDisclosureAccepted(false);
      });
    return () => { cancelled = true; };
  }, [user, isSupervisor]);

  const handleDisclosureAccept = async () => {
    try {
      await AsyncStorage.setItem(DISCLOSURE_KEY, "true");
    } catch (_) {}
    setDisclosureAccepted(true);
  };

  const handleDisclosureDecline = () => {
    setDisclosureAccepted(true);
  };

  if (loading || checkingSupervisor) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if ((user || isSupervisor) && disclosureAccepted === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if ((user || isSupervisor) && disclosureAccepted === false) {
    return (
      <PermissionsDisclosureScreen
        onAccept={handleDisclosureAccept}
        onDecline={handleDisclosureDecline}
      />
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
          name="SupervisorBookingDetails"
          component={SupervisorBookingDetails}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SupervisorLeads"
          component={SupervisorLeads}
          options={{ headerShown: false }}
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
