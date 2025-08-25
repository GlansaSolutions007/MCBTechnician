import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomerTabNavigator from "./CustomerTabNavigator";
import MyCars from "../screens/MyCars";
import InteriorService from "../screens/InteriorService";
import TaskReportsScreen from "../screens/TaskReportsScreen";
import Reviews from "../screens/Reviews";
import CustomerInfo from "../screens/CustomerInfo";
import PrivacyPolicy from "../components/PrivacyPolicy";
import TermsAndConditions from "../components/TermsAndCondition";
import LeaveRequest from "../screens/LeaveRequest";
import LeaveRequestList from "../screens/LeaveRequestList";
// import LiveTrackingMap from "../components/LiveTrackingMap";
import ServiceStart from "../screens/ServiceStart";
import ServiceEnd from "../screens/ServiceEnd";
import CollectPayment from "../screens/CollectPayment";
import Bookings from "../screens/Bookings";
import Notifications from "../screens/Notifications";

const Stack = createNativeStackNavigator();

export default function CustomerStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CustomerTabNavigator"
        component={CustomerTabNavigator}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="SelectCarBrand"
        component={MyCars}
        options={{ title: "Select Your Car" }}
      />
      {/* <Stack.Screen name="Tasks" component={TaskReportsScreen} /> */}

      <Stack.Screen
        name="InteriorService"
        component={InteriorService}
        options={{ title: "interior Service" }}
      />
      <Stack.Screen
        name="customerInfo"
        component={CustomerInfo}
        options={{ title: "Customer Info" }}
      />
      <Stack.Screen
        name="reviews"
        component={Reviews}
        options={{ title: "Reviews" }}
      />
      <Stack.Screen
        name="privacyPolicy"
        component={PrivacyPolicy}
        options={{ title: "Privacy Policy" }}
      />
      <Stack.Screen
        name="termsAndConditions"
        component={TermsAndConditions}
        options={{ title: "Terms and Conditions" }}
      />
      <Stack.Screen
        name="leaveRequest"
        component={LeaveRequest}
        options={{ title: "Leave Request" }}
      />
      <Stack.Screen
        name="leaveRequestList"
        component={LeaveRequestList}
        options={{ title: "Leave Request List" }}
      />
      {/* <Stack.Screen
        name="LiveTrackingMap"
        component={LiveTrackingMap}
        options={{ title: "Live Tracking Map" }}
      /> */}
      <Stack.Screen
        name="ServiceStart"
        component={ServiceStart}
        options={{ title: "Service Start" }}
      />
      <Stack.Screen
        name="ServiceEnd"
        component={ServiceEnd}
        options={{ title: "Service End" }}
      />
      <Stack.Screen
        name="CollectPayment"
        component={CollectPayment}
        options={{ title: "Collect Payment" }}
      />
      <Stack.Screen
        name="Booking"
        component={Bookings}
        options={{ title: "Booking" }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ title: "Notifications" }}
      />
      
    </Stack.Navigator>
  );
}
