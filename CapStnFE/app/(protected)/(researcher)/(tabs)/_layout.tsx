import { Tabs } from "expo-router";

export default function ResearcherTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          display: "none",
          height: 0,
        },
        tabBarButton: () => null,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="surveys"
        options={{
          title: "Surveys",
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="sightai"
        options={{
          title: "",
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="research"
        options={{
          title: "Research",
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
