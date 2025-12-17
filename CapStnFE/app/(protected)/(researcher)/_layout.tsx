import { Stack } from "expo-router";

export default function ResearcherLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="survey-view"
        options={{
          headerShown: true,
          title: "Survey Details",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="create-survey"
        options={{
          headerShown: true,
          title: "Create New Survey",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
