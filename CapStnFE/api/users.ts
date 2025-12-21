import type User from "../types/User";
import instance from ".";

interface BackendUser {
  _id: string;
  fullName: string;
  email: string;
  image?: string;
  points?: number;
  streakDays?: number;
  level?: number;
  trustScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

const getUserById = async (userId: string): Promise<User> => {
  const { data } = await instance.get<BackendUser>(`/user/${userId}`);
  return {
    ...data,
    name: data.fullName,
  };
};

const getAllUsers = async (): Promise<User[]> => {
  const { data } = await instance.get<BackendUser[]>("/users");
  return data.map((user) => ({
    ...user,
    name: user.fullName,
  }));
};

export { getUserById, getAllUsers };
