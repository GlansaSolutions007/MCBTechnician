import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../config/firebaseConfig";
import { ref, update } from "firebase/database";
import * as BackgroundFetch from "expo-background-fetch";

let locationWatcherSubscription = null;
let lastWriteTimestampMs = 0;
const BACKGROUND_LOCATION_TASK = "mcbt-background-location";
const BACKGROUND_FETCH_TASK = "mcbt-background-fetch";

// Define background location task at module load (always attempt; ignore duplicate errors)
try {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.log("Background location task error:", error);
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

      // More frequent updates in background for better tracking
      const now = Date.now();
      if (now - lastWriteTimestampMs < 5000) return; // 5 seconds
      lastWriteTimestampMs = now;

      await update(locationRef, {
        latitude,
        longitude,
        lastUpdatedAt: new Date().toISOString(),
        isBackground: true,
        accuracy: latest.coords.accuracy || null,
        speed: latest.coords.speed || null,
        heading: latest.coords.heading || null,
      });
    } catch (error) {
      console.log("Background location task error:", error);
    }
  });
} catch (error) {
  // Ignore duplicate definition errors during Fast Refresh
  console.log("Background location task define skipped:", String(error?.message || error));
}

// Define background fetch task at module load (always attempt; ignore duplicate errors)
try {
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
      const techId = await AsyncStorage.getItem("backgroundTechId");
      if (!techId) return BackgroundFetch.BackgroundFetchResult.NoData;

      // Get current location and update Firebase
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      if (location?.coords) {
        const locationRef = ref(db, `technicians/${techId}`);
        await update(locationRef, {
          latitude: Number(location.coords.latitude),
          longitude: Number(location.coords.longitude),
          lastUpdatedAt: new Date().toISOString(),
          isBackgroundFetch: true,
          accuracy: location.coords.accuracy || null,
        });
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
      return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
      console.log("Background fetch task error:", error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
} catch (error) {
  // Ignore duplicate definition errors during Fast Refresh
  console.log("Background fetch task define skipped:", String(error?.message || error));
}

export async function startTechnicianLocationTracking(technicianId) {
  if (!technicianId) return;

  // Stop any existing watcher first
  stopTechnicianLocationTracking();

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    console.log("Foreground location permission denied");
    return;
  }

  // Request background permissions
  try {
    const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus.status !== "granted") {
      console.log("Background location permission denied, but continuing with foreground tracking");
    }
  } catch (error) {
    console.log("Error requesting background permissions:", error);
  }

  const locationRef = ref(db, `technicians/${technicianId}`);

  const writeIfThrottled = async (coords) => {
    const now = Date.now();
    if (now - lastWriteTimestampMs < 3000) { // More frequent updates: 3 seconds
      return;
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
        isForeground: true,
        accuracy: coords.accuracy || null,
        speed: coords.speed || null,
        heading: coords.heading || null,
      });
    } catch (error) {
      console.log("Error updating location:", error);
    }
  };

  // Write immediately with current position, then subscribe to changes
  try {
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await writeIfThrottled(current.coords);
  } catch (error) {
    console.log("Error getting current position:", error);
  }

  locationWatcherSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 3000, // More frequent updates: 3 seconds
      distanceInterval: 3, // Update when moved ~3 meters
      mayShowUserSettingsDialog: true,
    },
    (location) => {
      if (location?.coords) {
        writeIfThrottled(location.coords);
      }
    }
  );

  // Start background fetch for additional reliability with delay
  setTimeout(async () => {
    try {
      // Ensure task is defined before registering
      if (TaskManager.isTaskDefined(BACKGROUND_FETCH_TASK)) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 15 * 60, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log("Background fetch task registered successfully");
      } else {
        console.log("Background fetch task not defined, skipping registration");
      }
    } catch (error) {
      console.log("Error registering background fetch task:", error);
    }
  }, 1000); // 1 second delay to ensure task definitions are loaded
}

export function stopTechnicianLocationTracking() {
  try {
    if (locationWatcherSubscription) {
      locationWatcherSubscription.remove();
      locationWatcherSubscription = null;
    }
  } catch (error) {
    console.log("Error stopping location watcher:", error);
  }
  
  // Stop background fetch
  try {
    BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  } catch (error) {
    console.log("Error unregistering background fetch task:", error);
  }
  
  lastWriteTimestampMs = 0;
}

export async function startBackgroundTracking(technicianId) {
  if (!technicianId) return;
  
  try {
    await AsyncStorage.setItem("backgroundTechId", String(technicianId));
  } catch (error) {
    console.log("Error saving background tech ID:", error);
  }

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    console.log("Foreground location permission required for background tracking");
    return;
  }
  
  try {
    const bgStatus = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus.status !== "granted") {
      console.log("Background location permission denied, background tracking may not work reliably");
    }
  } catch (error) {
    console.log("Error requesting background permissions:", error);
  }

  const isRunning = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK
  );
  if (isRunning) {
    console.log("Background location updates already running");
    return;
  }

  try {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      // Android requires a foreground service to run reliably
      foregroundService: {
        notificationTitle: "My Car Buddy",
        notificationBody: "Sharing your live location for customer tracking.",
        notificationColor: "#017F77",
        notificationIcon: "ic_notification",
      },
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000, // 5 seconds for more responsive tracking
      distanceInterval: 3, // 3 meters
      showsBackgroundLocationIndicator: false,
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation,
      // Additional options for better reliability
      deferredUpdatesInterval: 10000, // 10 seconds
      deferredUpdatesDistance: 5, // 5 meters
    });
    console.log("Background location tracking started successfully");
  } catch (error) {
    console.log("Error starting background location updates:", error);
  }
}

export async function stopBackgroundTracking() {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log("Background location tracking stopped");
    }
  } catch (error) {
    console.log("Error stopping background location updates:", error);
  }
  
  try {
    await AsyncStorage.removeItem("backgroundTechId");
  } catch (error) {
    console.log("Error removing background tech ID:", error);
  }
}

// Function to check if background tracking is working
export async function isBackgroundTrackingActive() {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
    return isRunning;
  } catch (error) {
    console.log("Error checking background tracking status:", error);
    return false;
  }
}

// Function to get current tracking status
export async function getTrackingStatus() {
  try {
    const techId = await AsyncStorage.getItem("backgroundTechId");
    const isBackgroundActive = await isBackgroundTrackingActive();
    
    return {
      technicianId: techId,
      backgroundTrackingActive: isBackgroundActive,
      foregroundTrackingActive: locationWatcherSubscription !== null,
      lastUpdate: lastWriteTimestampMs > 0 ? new Date(lastWriteTimestampMs) : null,
    };
  } catch (error) {
    console.log("Error getting tracking status:", error);
    return {
      technicianId: null,
      backgroundTrackingActive: false,
      foregroundTrackingActive: false,
      lastUpdate: null,
    };
  }
}


