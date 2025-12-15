import AuthContext from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";
import { useContext } from "react";

export default function ProtectedLayout() {
  const { isAutheticated } = useContext(AuthContext);

  if (!isAutheticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="participant-home" />
      <Stack.Screen name="researcher-dashboard" />
      <Stack.Screen name="survey" />
      <Stack.Screen name="survey-completed" />
      <Stack.Screen name="create-survey" />
      <Stack.Screen name="survey-preview" />
      <Stack.Screen name="survey-created" />
      <Stack.Screen name="survey-archived" />
    </Stack>
  );
}
