import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SupervisorDashboard from "../screens/Supervisor/SupervisorDashboard";
import SupervisorCustomersList from "../screens/Supervisor/SupervisorCustomersList";

const Stack = createNativeStackNavigator();

export default function SupervisorHomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Dashboard"
    >
      <Stack.Screen
        name="Dashboard"
        component={SupervisorDashboard}
      />
      <Stack.Screen
        name="SupervisorDashboard"
        component={SupervisorDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="CustomersList" component={SupervisorCustomersList} />
    </Stack.Navigator>
  );
}
