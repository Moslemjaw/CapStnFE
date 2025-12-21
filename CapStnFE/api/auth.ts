import UserInfo from "@/types/UserInfo";
import type User from "@/types/User";
import instance from ".";
import { getToken } from "./storage";

const login = async (userInfo: UserInfo) => {
  const { data } = await instance.post("/user/login", userInfo);
  return data;
};

const register = async (
  userInfo: UserInfo,
  imageUri: string | null,
  name: string
) => {
  const formData = new FormData();

  // Always append required fields
  formData.append("name", name);
  formData.append("email", userInfo.email);
  formData.append("password", userInfo.password);

  // Append image only if provided
  if (imageUri) {
    // Extract file extension from URI
    const uriParts = imageUri.split(".");
    const fileExtension = uriParts[uriParts.length - 1].toLowerCase();

    // Determine MIME type based on extension
    let mimeType = "image/jpeg"; // default
    if (fileExtension === "png") {
      mimeType = "image/png";
    } else if (fileExtension === "jpg" || fileExtension === "jpeg") {
      mimeType = "image/jpeg";
    } else if (fileExtension === "webp") {
      mimeType = "image/webp";
    }

    // Create proper file name
    const fileName = `profile.${fileExtension}`;

    // Append image to FormData with proper format for React Native
    formData.append("image", {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any);
  }

  try {
    const baseURL = instance.defaults.baseURL;
    const fullUrl = `${baseURL}/user/register`;
    const token = await getToken();

    console.log("=== REGISTER REQUEST DEBUG ===");
    console.log("Full URL:", fullUrl);
    console.log("Base URL:", baseURL);
    console.log("FormData fields:", {
      name,
      email: userInfo.email,
      hasPassword: !!userInfo.password,
      hasImage: !!imageUri,
    });

    // Use fetch API for FormData - it handles multipart/form-data correctly in React Native
    const headers: HeadersInit = {
      Accept: "application/json",
      "User-Agent": "Sight/1.0.0",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Don't set Content-Type - React Native's fetch will set it with boundary automatically
    const response = await fetch(fullUrl, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("=== REGISTER ERROR (FULL DETAILS) ===");
    console.error("Error object:", error);
    console.error("Error message:", error?.message);
    console.error("Error name:", error?.name);
    console.error("Error stack:", error?.stack);
    console.error("================================");

    // Re-throw the original error so the full details are available
    throw error;
  }
};

const me = async (): Promise<User | null> => {
  try {
    // First try to get user from storage
    const { getUser, decodeToken, getToken, storeUser } = await import(
      "./storage"
    );
    const storedUser = await getUser();
    if (storedUser) {
      return storedUser;
    }

    // If no stored user, try to decode token and fetch user by ID
    const token = await getToken();
    if (!token) {
      return null;
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      return null;
    }

    const userId = decoded.id || decoded.userId || decoded._id;
    if (!userId) {
      return null;
    }

    try {
      const { getUserById } = await import("./users");
      const user = await getUserById(userId);
      // Store user for future use
      await storeUser(user);
      return user;
    } catch (fetchError) {
      console.error("Error fetching user by ID:", fetchError);
      // Return null instead of throwing to prevent route errors
      return null;
    }
  } catch (error) {
    console.error("Error in me() function:", error);
    // Return null instead of throwing to prevent route errors
    return null;
  }
};

// Note: getAllUsers is in api/users.ts (uses /users endpoint per Backend.md)

export { login, me, register };
