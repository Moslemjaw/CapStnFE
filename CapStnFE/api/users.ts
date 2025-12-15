import type User from "../types/User";
import instance from ".";

const getUserById = async (userId: string): Promise<User> => {
  const { data } = await instance.get<User>(`/user/${userId}`);
  return data;
};

const getAllUsers = async (): Promise<User[]> => {
  const { data } = await instance.get<User[]>("/users");
  return data;
};

export { getUserById, getAllUsers };
