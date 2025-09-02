import "react-native-gesture-handler";
import React, { useCallback, useEffect } from "react";
import { View } from "react-native";
import * as Notifications from "expo-notifications";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "./src/contexts/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text, TextInput } from "react-native";
import AppLayout from "./src/components/AppLayout";
import NetworkProvider from "./src/contexts/NetworkProvider";

if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

export default function App() {
  // Foreground notification handling for technician app
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, // replaces shouldShowAlert
      shouldShowList: true, // ensures it appears in Notification Center
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received (technician):", notification);
      }
    );
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification response (technician):", response);
      }
    );
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);
  const [fontsLoaded] = Font.useFonts({
    "Manrope-Medium": require("./assets/fonts/Manrope-Medium.ttf"),
    "Manrope-Bold": require("./assets/fonts/Manrope-Bold.ttf"),
    "Manrope-Regular": require("./assets/fonts/Manrope-Regular.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <AuthProvider>
            {/* <AppLayout> */}
            {/* <RootNavigator /> */}
            {/* </AppLayout> */}

              <NetworkProvider>  
              <RootNavigator />
            </NetworkProvider>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
