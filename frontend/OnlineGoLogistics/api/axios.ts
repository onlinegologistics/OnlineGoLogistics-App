import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Fallback strictly to production to prevent local IP leaking in release builds
  return "https://app.onlinegologistics.in";
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
