import { useEffect } from "react";
import { router } from "expo-router";
import { getToken } from "../utils/token";
import { getHomeRouteForRole } from "../utils/roleRoutes";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      console.log("TOKEN:", token);

      if (token) {
        const role = await AsyncStorage.getItem("userRole");
        router.replace(getHomeRouteForRole(role) as any);
      } else {
        router.replace("/SplashScreen" as any);
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
