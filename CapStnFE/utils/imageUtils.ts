import { Platform } from "react-native";
import Constants from "expo-constants";

// Get the base URL for images - should match API base URL
// Note: API uses port 8080, but backend serves media on port 8000
const getImageBaseURL = () => {
  try {
    // In Expo dev, this usually contains the host the JS bundle was loaded from,
    // e.g. "192.168.0.10:19000" or "localhost:19000"
    const hostUri =
      (Constants.expoConfig as any)?.hostUri ||
      (Constants.manifest as any)?.debuggerHost ||
      (Constants.manifest2 as any)?.extra?.expoClient?.hostUri;

    if (hostUri) {
      const host = hostUri.split(":")[0];
      // Backend serves media on port 8000, not 8080
      return `http://${host}:8000`;
    }
  } catch (e) {
    console.log(
      "[getImageBaseURL] Error determining host from Expo Constants",
      e
    );
  }

  // Fallbacks per-platform - use port 8000 for media
  if (Platform.OS === "android") {
    // Special localhost alias for Android emulator
    return "http://10.0.2.2:8000";
  }

  // iOS simulator & web can usually use localhost directly
  // For physical devices, use the IP address
  if (Platform.OS === "ios") {
    // For physical iOS device, use your computer's IP
    return "http://192.168.8.196:8000";
  }

  // Default fallback - use IP for physical devices
  return "http://192.168.8.196:8000";
};

/**
 * Converts an image path from the database to a full URL
 * Currently trying: Method 1 - /media/filename (without uploads prefix)
 *
 * @param imagePath - The image path from the database
 * @returns Full URL for the image or undefined if no path provided
 */
export const getImageUrl = (
  imagePath: string | undefined | null
): string | undefined => {
  // Return undefined if no image path
  if (!imagePath || imagePath.trim() === "") {
    return undefined;
  }

  // If already an absolute URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const baseURL = getImageBaseURL();

  // Normalize path separators (convert backslashes to forward slashes)
  let normalizedPath = imagePath.replace(/\\/g, "/");

  // METHOD 1: /media/filename (without uploads prefix)
  // Remove "uploads/" prefix if present
  let cleanPath = normalizedPath;
  if (cleanPath.startsWith("uploads/")) {
    cleanPath = cleanPath.substring("uploads/".length);
  } else if (cleanPath.startsWith("/uploads/")) {
    cleanPath = cleanPath.substring("/uploads/".length);
  }
  cleanPath = cleanPath.replace(/^\/+/, "");

  if (!cleanPath || cleanPath.trim() === "") {
    return undefined;
  }

  // Construct URL: baseURL/media/filename
  const finalUrl = `${baseURL}/media/${cleanPath}`;

  return finalUrl;
};
