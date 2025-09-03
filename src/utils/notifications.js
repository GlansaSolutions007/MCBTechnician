import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { db } from "../config/firebaseConfig";
import { ref, set } from "firebase/database";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return { expoPushToken: null, fcmToken: null };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return { expoPushToken: null, fcmToken: null };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  let expoPushToken = null;
  try {
    // Required in dev builds: pass projectId
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    expoPushToken = tokenResponse?.data ?? null;
  } catch (e) {
    console.log("getExpoPushTokenAsync error:", e?.message || e);
  }

  let fcmToken = null;
  try {
    // Returns FCM/APNs device token on native builds with push configured
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    fcmToken = deviceToken?.data || null;
  } catch (e) {
    console.log("getDevicePushTokenAsync error:", e?.message || e);
  }

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
