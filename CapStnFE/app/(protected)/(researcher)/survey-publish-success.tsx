import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function SurveyPublishSuccess() {
  const router = useRouter();
  const { surveyId, questionCount, points, estimatedMinutes } = useLocalSearchParams<{
    surveyId: string;
    questionCount: string;
    points: string;
    estimatedMinutes: string;
  }>;

  const handleGoToResearch = () => {
    router.replace("/(protected)/(researcher)/(tabs)/research" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Survey Published!</Text>
        <Text style={styles.subtitle}>
          Your survey has been successfully published and is now available for respondents.
        </Text>

        {/* Survey Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Survey Overview</Text>
          
          <View style={styles.overviewItem}>
            <Ionicons name="list-outline" size={20} color="#3B82F6" />
            <Text style={styles.overviewLabel}>Questions:</Text>
            <Text style={styles.overviewValue}>{questionCount || 0}</Text>
          </View>

          <View style={styles.overviewItem}>
            <Ionicons name="star-outline" size={20} color="#F59E0B" />
            <Text style={styles.overviewLabel}>Points:</Text>
            <Text style={styles.overviewValue}>{points || 0} pts</Text>
          </View>

          <View style={styles.overviewItem}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.overviewLabel}>Estimated Time:</Text>
            <Text style={styles.overviewValue}>{estimatedMinutes || 0} min</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleGoToResearch}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Back to Research</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  overviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  overviewItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  overviewLabel: {
    flex: 1,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
