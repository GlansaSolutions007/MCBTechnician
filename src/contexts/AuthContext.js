import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { startTechnicianLocationTracking, stopTechnicianLocationTracking, startBackgroundTracking } from "../utils/locationTracker";
import notificationService from "../utils/notificationService";
import axios from "axios";
import { API_BASE_URL } from "@env";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Wait for AsyncStorage

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const techID = await AsyncStorage.getItem("techID");
        const token = await AsyncStorage.getItem("token");
        const email = await AsyncStorage.getItem("email");

        if (techID && token) {
          setUser({ techID, token, email });
          // Start location tracking for existing session
          try {
            startTechnicianLocationTracking(techID);
            // Also start background tracking for better reliability
            startBackgroundTracking(techID);
            // Initialize notification service
            await notificationService.initialize(techID);
          } catch (e) {
            console.log("Error starting location tracking:", e);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    try {
      if (userData?.techID) {
        // Start both foreground and background tracking
        await startTechnicianLocationTracking(userData.techID);
        await startBackgroundTracking(userData.techID);
        // Initialize notification service
        await notificationService.initialize(userData.techID);
      }
    } catch (e) {
      console.log("Error starting location tracking during login:", e);
    }
  };

  const logout = async () => {
    const techID = await AsyncStorage.getItem("techID");
    const storedToken = await AsyncStorage.getItem("pushToken");
    setUser(null);
    try {
      stopTechnicianLocationTracking();
    } catch (e) {
      console.log("Error stopping location tracking during login:", e);
    }
    try {
      // Clean up notification service
      notificationService.cleanup();
    } catch (e) {
      console.log("Error cleaning up notification service:", e);
    }
    try {
      if (techID && storedToken) {
        await axios.post(`${API_BASE_URL}Push/unregister`, {
          userType: "technician",
          id: Number(techID),
          token: storedToken,
        });
      }
    } catch (e) {
      console.log("Error unregistering push token:", e);
    }
    await AsyncStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
