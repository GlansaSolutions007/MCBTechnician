import React, { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import NoInternetScreen from "../screens/NoInternetScreen";

export default function NetworkProvider({ children }) {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (!isConnected) {
    return <NoInternetScreen />;
  }

  return children;
}
