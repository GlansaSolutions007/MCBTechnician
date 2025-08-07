import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/Common/LoginScreen";
import RegisterScreen from "../screens/Common/RegisterScreen";
import CustomerTabNavigator from "./CustomerTabNavigator";
import { useAuth } from "../contexts/AuthContext";
import CustomerStackNavigator from "./CustomerStackNavigator";
import LiveTrackingMap from "../components/LiveTrackingMap";
import { View, ActivityIndicator } from "react-native";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen
              name="CustomerTabs"
              component={CustomerStackNavigator}
            />
            <Stack.Screen name="liveTrackingMap" component={LiveTrackingMap} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
