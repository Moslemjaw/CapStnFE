import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getToken } from "./storage";

// Determine base URL that also works on physical devices & emulators
const getBaseURL = () => {
  try {
    // In Expo dev, this usually contains the host the JS bundle was loaded from,
    // e.g. "192.168.0.10:19000" or "localhost:19000"
    const hostUri =
      (Constants.expoConfig as any)?.hostUri ||
      (Constants.manifest as any)?.debuggerHost ||
      (Constants.manifest2 as any)?.extra?.expoClient?.hostUri;

    if (hostUri) {
      const host = hostUri.split(":")[0];
      return `http://${host}:8000`;
    }
  } catch (e) {
    console.log("Error determining API host from Expo Constants", e);
  }

  // Fallbacks per-platform
  if (Platform.OS === "android") {
    // Special localhost alias for Android emulator
    return "http://10.0.2.2:8000";
  }

  // iOS simulator & web can usually use localhost directly
  return "http://localhost:8000";
};

const baseURL = getBaseURL();
console.log(`API Base URL: ${baseURL} (Platform: ${Platform.OS})`);

const instance = axios.create({
  baseURL: baseURL,
});

// Add token to every request
instance.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
