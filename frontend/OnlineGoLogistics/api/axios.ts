import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = typeof hostUri === "string" ? hostUri.split(":")[0] : "";

  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:5003`;
  }

  return Platform.OS === "android"
    ? "http://10.0.2.2:5003" // Android emulator default
    : "http://localhost:5003";
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("API Instance Created with BaseURL:", api.defaults.baseURL);

api.interceptors.request.use((config) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, (error) => {
  console.error("[API Request Error]", error);
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  console.log(`[API Response] ${response.status} from ${response.config.url}`);
  return response;
}, (error) => {
  console.warn("[API Response Error]", {
    url: error.config?.url,
    status: error.response?.status,
    message: error.message,
    data: error.response?.data
  });
  return Promise.reject(error);
});
