import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveToken } from "./token";

export interface SessionUser {
  _id: string;
  name: string;
  role: string;
  token: string;
}

export const saveUserSession = async (user: SessionUser) => {
  await saveToken(user.token);
  await AsyncStorage.setItem("userName", user.name || "");
  await AsyncStorage.setItem("userRole", user.role || "");
  await AsyncStorage.setItem("userId", user._id || "");
};
