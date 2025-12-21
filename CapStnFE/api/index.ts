import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getToken } from "./storage";

/**
 * Determine base URL for the backend API server
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_URL environment variable (if set)
 * 2. Extract host from Expo Metro bundler (port 8081/19000) and use port 8080
 * 3. Platform-specific fallbacks
 *
 * Note: Port 8081 is Expo's Metro bundler (serves JS code)
 *       Port 8080 is your backend API server (configured here)
 */
const getBaseURL = () => {
  // 1. Check for environment variable override (highest priority)
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    console.log(`[API] Using environment URL: ${envApiUrl}`);
    return envApiUrl;
  }

  // 2. Try to extract network IP from Metro bundler first
  // This works for physical devices and should be prioritized
  try {
    const hostUri =
      (Constants.expoConfig as any)?.hostUri ||
      (Constants.manifest as any)?.debuggerHost ||
      (Constants.manifest2 as any)?.extra?.expoClient?.hostUri;

    if (hostUri) {
      const host = hostUri.split(":")[0];
      // Only use network IP if it's not localhost (localhost means we're on same machine)
      if (host && host !== "localhost" && host !== "127.0.0.1") {
        const networkUrl = `http://${host}:8080`;
        console.log(`[API] Using network IP from Metro bundler: ${networkUrl}`);
        return networkUrl;
      }
    }
  } catch (e) {
    console.log(`[API] Error extracting host from Metro:`, e);
  }

  // 3. Platform-specific fallbacks (for emulators or when Metro IP not available)
  if (Platform.OS === "android") {
    // Android emulator uses special alias for host machine
    // Only use this if we couldn't get network IP (means we're in emulator)
    const androidUrl = "http://10.0.2.2:8080";
    console.log(
      `[API] Android detected, using emulator address: ${androidUrl}`
    );
    return androidUrl;
  }

  if (Platform.OS === "ios") {
    // iOS simulator can use localhost
    const iosUrl = "http://localhost:8080";
    console.log(`[API] iOS detected, using: ${iosUrl}`);
    return iosUrl;
  }

  // 4. Final fallback
  const fallbackUrl = "http://localhost:8080";
  console.log(`[API] Using fallback: ${fallbackUrl}`);
  return fallbackUrl;
};

const baseURL = getBaseURL();

const instance = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 30 second timeout (increased for network issues)
  // React Native specific configuration
  adapter: undefined, // Let axios choose the adapter
});

// Response interceptor for error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// Add token to every request
instance.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set User-Agent header
    config.headers["User-Agent"] = "Sight/1.0.0";

    // For FormData requests, ensure Content-Type is properly handled
    // React Native's FormData needs special handling - it will set Content-Type with boundary automatically
    if (config.data instanceof FormData) {
      // Remove Content-Type header - React Native's FormData will set it with proper boundary
      config.headers.delete("Content-Type");
      config.headers.delete("content-type");
      // Prevent axios from transforming FormData and setting Content-Type
      config.transformRequest = [
        (data, headers) => {
          // Ensure Content-Type is not set - React Native will handle it
          if (headers) {
            delete headers["Content-Type"];
            delete headers["content-type"];
          }
          return data;
        },
      ];
      // Explicitly tell axios not to set Content-Type
      (config as any).headers = config.headers;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
