import User from "@/types/User";
import AsyncStorage from "@react-native-async-storage/async-storage";

const storeToken = async (value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem("Token", value);
  } catch (error) {
    console.error("Error storing token:", error);
    throw new Error("Failed to store authentication token");
  }
};

const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("Token");
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
};

const deleteToken = async (): Promise<void> => {
  try {
    console.log("Deleting token");

    // Get token before deletion for verification
    const tokenBefore = await AsyncStorage.getItem("Token");
    console.log(
      "Token before deletion:",
      tokenBefore ? "exists" : "does not exist"
    );

    await AsyncStorage.removeItem("Token");
    await AsyncStorage.removeItem("CurrentUser");

    // Verify token was actually deleted
    const tokenAfter = await AsyncStorage.getItem("Token");
    console.log(
      "Token after deletion:",
      tokenAfter ? "still exists!" : "deleted successfully"
    );

    if (tokenAfter) {
      console.error("Token still exists after deletion attempt!");
      // Try again with multiRemove
      await AsyncStorage.multiRemove(["Token", "CurrentUser"]);
      const tokenAfterRetry = await AsyncStorage.getItem("Token");
      if (tokenAfterRetry) {
        throw new Error(
          "Failed to delete authentication token after multiple attempts"
        );
      }
    }

    console.log("Token deletion verified successfully");
  } catch (error) {
    console.error("Error deleting token:", error);
    throw new Error("Failed to delete authentication token");
  }
};

const storeUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem("CurrentUser", JSON.stringify(user));
  } catch (error) {
    console.error("Error storing user:", error);
    throw new Error("Failed to store user data");
  }
};

const getUser = async (): Promise<User | null> => {
  try {
    const userString = await AsyncStorage.getItem("CurrentUser");
    if (userString) {
      return JSON.parse(userString);
    }
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

// Decode JWT token to get user ID
const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export { storeToken, getToken, deleteToken, storeUser, getUser, decodeToken };
