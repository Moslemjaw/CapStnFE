import AuthContext from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";
import { useContext } from "react";

export default function ProtectedLayout() {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="choose-path" />
      <Stack.Screen name="tutorial" />
      <Stack.Screen name="(researcher)" />
    </Stack>
  );
}
