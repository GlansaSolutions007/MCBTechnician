import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SupervisorTabNavigator from "./SupervisorTabNavigator";

const Stack = createNativeStackNavigator();

export default function SupervisorStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SupervisorTabs"
        component={SupervisorTabNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

