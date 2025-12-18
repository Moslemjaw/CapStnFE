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
          headerBackTitle: "back",
          headerBackTitleVisible: true,
        }}
      />
      <Stack.Screen
        name="survey-details"
        options={{
          headerShown: true,
          title: "Survey Details",
          presentation: "card",
          headerBackTitle: "back",
          headerBackTitleVisible: true,
        }}
      />
      <Stack.Screen
        name="create-survey"
        options={{
          headerShown: true,
          title: "Create New Survey",
          presentation: "card",
          headerBackTitle: "back",
          headerBackTitleVisible: true,
        }}
      />
      <Stack.Screen
        name="survey-preview"
        options={{
          headerShown: true,
          title: "Survey Preview",
          presentation: "card",
          headerBackTitle: "back",
          headerBackTitleVisible: true,
        }}
      />
      <Stack.Screen
        name="survey-answer-success"
        options={{
          headerShown: true,
          title: "Success",
          presentation: "card",
          headerBackTitle: "back",
          headerBackTitleVisible: true,
        }}
      />
      <Stack.Screen
        name="survey-publish-success"
        options={{
          headerShown: true,
          title: "Success",
          presentation: "card",
          headerBackTitle: "back",
          headerBackTitleVisible: true,
        }}
      />
      <Stack.Screen
        name="survey-archive-success"
        options={{
          headerShown: true,
          title: "Success",
          presentation: "card",
          headerBackTitle: "back",
          headerBackTitleVisible: true,
        }}
      />
    </Stack>
  );
}
