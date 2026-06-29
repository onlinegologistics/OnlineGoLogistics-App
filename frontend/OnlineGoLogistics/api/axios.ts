import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return "https://app.onlinegologistics.in";
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("API Instance Created with BaseURL:", api.defaults.baseURL);

// Single unified request interceptor: attaches token + logs
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
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
