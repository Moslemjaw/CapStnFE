import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import GlobalBottomNav from "@/components/GlobalBottomNav";

export default function ResearcherLayout() {
  return (
    <View style={styles.container} pointerEvents="box-none">
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
          name="survey-respondent-preview"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="survey-answer-success"
          options={{
            headerShown: false,
            presentation: "card",
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
      <View style={styles.navContainer} pointerEvents="box-none">
        <GlobalBottomNav />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
});
