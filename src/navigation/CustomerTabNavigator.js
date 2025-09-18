import { Pressable } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ProfileScreen from "../screens/Common/ProfileScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomHeader from "../components/CustomHeader";
import { color } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
// import SchedulesTrackicon from '../../assets/icons/Navigation/schedule.png'
// import servicelocationsicon from '../../assets/icons/Navigation/LocationsPin.png'
import Dashboard from "../screens/Dashboard";
// import SchedulesTrack from "../screens/SchedulesTrack";
import TaskReportsScreen from "../screens/TaskReportsScreen";
import Reportlist from "../screens/Reportlist";
// import Servicelocations from "../screens/Servicelocations";
const Tab = createBottomTabNavigator();
export default function CustomerTabNavigator({ navigation }) {
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
            case "Dashboard":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Tasks":
              iconName = focused ? "calendar" : "calendar-outline";
              break;
            case "Reports":
              iconName = focused ? "document-text" : "document-text-outline";
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
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Tasks" component={TaskReportsScreen} />
      <Tab.Screen name="Reports" component={Reportlist} />
      {/* <Tab.Screen name="service locations" component={Servicelocations} /> */}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
