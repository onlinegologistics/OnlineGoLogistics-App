import { useEffect } from "react";
import { router } from "expo-router";
import { getToken } from "../utils/token";
import { getHomeRouteForRole } from "../utils/roleRoutes";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from 'expo-splash-screen';

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          const role = await AsyncStorage.getItem("userRole");
          router.replace(getHomeRouteForRole(role) as any);
        } else {
          router.replace("/login" as any);
        }
      } catch (error) {
        router.replace("/login" as any);
      } finally {
        // Hide native splash screen after auth check completes
        SplashScreen.hideAsync();
      }
    };
    checkAuth();
  }, []);

  // Dark background matching splash screen so there's no white flash
  return <View style={{ flex: 1, backgroundColor: "#0B1528" }} />;
}
