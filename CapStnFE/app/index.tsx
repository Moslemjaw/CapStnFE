import { Redirect } from "expo-router";
import { useContext } from "react";
import { View, ActivityIndicator } from "react-native";
import AuthContext from "@/context/AuthContext";

export default function Index() {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Always start with login page if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Only redirect to protected routes if authenticated
  return <Redirect href={"/(protected)/choose-path" as any} />;
}
