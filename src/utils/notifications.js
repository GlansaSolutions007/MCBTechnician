import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { db } from "../config/firebaseConfig";
import { ref, set } from "firebase/database";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  let expoPushToken = null;
  try {
    expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
  } catch (_) {}

  let fcmToken = null;
  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    fcmToken = deviceToken?.data || null;
  } catch (_) {}

  return { expoPushToken, fcmToken };
}

export async function saveTechnicianPushToken(technicianId, tokens) {
  if (!technicianId || !tokens) return;
  const { expoPushToken, fcmToken } = tokens;
  try {
    if (expoPushToken) {
      await set(ref(db, `technicianPushTokens/${technicianId}/expo/${encodeURIComponent(expoPushToken)}`), true);
    }
    if (fcmToken) {
      await set(ref(db, `technicianPushTokens/${technicianId}/fcm/${encodeURIComponent(fcmToken)}`), true);
    }
  } catch (_) {}
}
