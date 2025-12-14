interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  points?: number;
  streakDays?: number;
  level?: number;
  trustScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default User;
