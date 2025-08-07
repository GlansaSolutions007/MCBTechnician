import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
