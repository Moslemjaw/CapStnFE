import UserInfo from "@/types/UserInfo";
import type User from "@/types/User";
import instance from ".";

const login = async (userInfo: UserInfo) => {
  const { data } = await instance.post("/user/login", userInfo);
  console.log(data);
  console.log("data.token from login", data.token);
  return data;
};

const register = async (userInfo: UserInfo, image: string, name: string) => {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("email", userInfo.email);
  formData.append("password", userInfo.password);
  if (image) {
    formData.append("image", {
      name: "image.jpg",
      uri: image,
      type: "image/jpeg",
    } as any);
  }

  try {
    console.log(
      "Registering user - URL:",
      `${instance.defaults.baseURL}/user/register`
    );
    const { data } = await instance.post("/user/register", formData);
    return data;
  } catch (error: any) {
    console.error("Register error:", error);
    console.error("Request URL:", error?.config?.url);
    console.error("Full URL:", error?.config?.baseURL + error?.config?.url);
    console.error("Response:", error?.response?.data);
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
