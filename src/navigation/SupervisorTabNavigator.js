import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomHeader from "../components/CustomHeader";
import { color } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import SupervisorDashboard from "../screens/Supervisor/SupervisorDashboard";
import SupervisorProfileScreen from "../screens/Supervisor/SupervisorProfileScreen";

const Tab = createBottomTabNavigator();

export default function SupervisorTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <CustomHeader screenName={route.name} />,
        tabBarShowLabel: true,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: "#8e8e93",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0.5,
          height: 75 + insets.bottom,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
        },
        tabBarItemStyle: {
          borderRadius: 20,
        },
        tabBarPressColor: "rgba(0, 0, 0, 0.01)",
        tabBarPressOpacity: 0.8,
        tabBarButton: (props) => (
          <Pressable
            android_ripple={{
              color: "rgba(0, 0, 0, 0.01)",
              borderless: false,
            }}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.9 : 1,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
            {...props}
          />
        ),
        tabBarIcon: ({ color: tintColor, focused, size = 26 }) => {
          let iconName = "ellipse-outline";
          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "ellipse-outline";
          }
          return <Ionicons name={iconName} size={size} color={tintColor} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={SupervisorDashboard}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen 
        name="Profile" 
        component={SupervisorProfileScreen}
        options={{ tabBarLabel: "Profile", headerShown: false }}
      />
    </Tab.Navigator>
  );
}

