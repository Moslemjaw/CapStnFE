import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { testAI } from "@/api/ai";

export default function ResearcherHome() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);

  useEffect(() => {
    // Test AI connection on mount
    const checkAIConnection = async () => {
      setIsLoading(true);
      try {
        await testAI();
        setAiConnected(true);
      } catch (error) {
        console.error("AI connection test failed:", error);
        setAiConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAIConnection();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.subtitle}>Latest updates and insights</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.placeholderCard}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Connecting to AI...</Text>
              </View>
            ) : (
              <>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: aiConnected ? "#10B981" : "#EF4444" },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    AI API: {aiConnected ? "Connected" : "Disconnected"}
                  </Text>
                </View>
                <Text style={styles.placeholderText}>
                  This is where your latest updates and insights will appear.
                </Text>
                <Text style={styles.placeholderSubtext}>
                  Stay tuned for AI-powered analysis of your survey data, recent
                  responses, and important notifications.
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  content: {
    padding: 24,
    gap: 16,
  },
  placeholderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    minHeight: 200,
    justifyContent: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "center",
  },
});
