import AuthContext from "@/context/AuthContext";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { getToken } from "@/api/storage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { Colors } from "@/constants/design";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  // Start with false to ensure login page is shown first
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load Inter fonts
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await getToken();
        if (token) {
          setIsAuthenticated(true);
        } else {
          // Explicitly set to false to ensure login page is shown
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking token:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  // Hide splash screen once fonts are loaded
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Show loading while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background.primary }}>
        <ActivityIndicator size="large" color={Colors.primary.blue} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, isLoading }}>
          <AnalysisProvider>
            <SafeAreaProvider style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(protected)" />
              </Stack>
            </SafeAreaProvider>
          </AnalysisProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
