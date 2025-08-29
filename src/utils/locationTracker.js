import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../config/firebaseConfig";
import { ref, update } from "firebase/database";

let locationWatcherSubscription = null;
let lastWriteTimestampMs = 0;
const BACKGROUND_LOCATION_TASK = "mcbt-background-location";

// Define background task once
try {
  // Avoid redefining the task if Hot Reload triggers
  // @ts-ignore
  if (!TaskManager.isTaskDefined || !TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
      if (error) {
        return;
      }
      try {
        const { locations } = data || {};
        if (!locations || locations.length === 0) return;

        const latest = locations[locations.length - 1];
        const techId = await AsyncStorage.getItem("backgroundTechId");
        if (!techId) return;

        const locationRef = ref(db, `technicians/${techId}`);
        const latitude = Number(latest.coords.latitude);
        const longitude = Number(latest.coords.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        // Throttle writes in background as well
        const now = Date.now();
        if (now - lastWriteTimestampMs < 9500) return;
        lastWriteTimestampMs = now;

        await update(locationRef, {
          latitude,
          longitude,
          lastUpdatedAt: new Date().toISOString(),
        });
      } catch (_) {}
    });
  }
} catch (_) {}

export async function startTechnicianLocationTracking(technicianId) {
  if (!technicianId) return;

  // Stop any existing watcher first
  stopTechnicianLocationTracking();

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return;
  }

  // Optional: attempt background permission if available (ignore result if denied)
  try {
    await Location.requestBackgroundPermissionsAsync();
  } catch (_) {}

  const locationRef = ref(db, `technicians/${technicianId}`);

  const writeIfThrottled = async (coords) => {
    const now = Date.now();
    if (now - lastWriteTimestampMs < 9500) {
      return; // throttle ~10s
    }
    lastWriteTimestampMs = now;
    try {
      const latitude = Number(coords.latitude);
      const longitude = Number(coords.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      await update(locationRef, {
        latitude,
        longitude,
        lastUpdatedAt: new Date().toISOString(),
      });
    } catch (_) {}
  };

  // Write immediately with current position, then subscribe to changes
  try {
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await writeIfThrottled(current.coords);
  } catch (_) {}

  locationWatcherSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 4000, // request updates at least every 4s
      distanceInterval: 5, // or when moved ~5 meters
      mayShowUserSettingsDialog: true,
    },
    (location) => {
      if (location?.coords) {
        writeIfThrottled(location.coords);
      }
    }
  );
}

export function stopTechnicianLocationTracking() {
  try {
    if (locationWatcherSubscription) {
      locationWatcherSubscription.remove();
      locationWatcherSubscription = null;
    }
  } catch (_) {}
  lastWriteTimestampMs = 0;
}

export async function startBackgroundTracking(technicianId) {
  if (!technicianId) return;
  try {
    await AsyncStorage.setItem("backgroundTechId", String(technicianId));
  } catch (_) {}

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return;
  try {
    await Location.requestBackgroundPermissionsAsync();
  } catch (_) {}

  const isRunning = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK
  );
  if (isRunning) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    // Android requires a foreground service to run reliably
    foregroundService: {
      notificationTitle: "My Car Buddy",
      notificationBody: "Sharing your live location during the ride.",
      notificationColor: "#017F77",
    },
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 4000,
    distanceInterval: 5,
    showsBackgroundLocationIndicator: false,
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.AutomotiveNavigation,
  });
}

export async function stopBackgroundTracking() {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch (_) {}
  try {
    await AsyncStorage.removeItem("backgroundTechId");
  } catch (_) {}
}


