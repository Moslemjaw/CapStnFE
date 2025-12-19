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
import { LinearGradient } from "expo-linear-gradient";

export default function SurveyArchiveSuccess() {
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
          <LinearGradient
            colors={["#EEF5FF", "#E8D5FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name="archive" size={60} color="#4A63D8" />
          </LinearGradient>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Survey Archived!</Text>
        <Text style={styles.subtitle}>
          Your survey has been successfully archived and is no longer visible to respondents.
        </Text>

        {/* Survey Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Survey Overview</Text>
          
          <View style={styles.overviewItem}>
            <Ionicons name="list-outline" size={20} color="#4A63D8" />
            <Text style={styles.overviewLabel}>Questions:</Text>
            <Text style={styles.overviewValue}>{questionCount || 0}</Text>
          </View>

          <View style={styles.overviewItem}>
            <Ionicons name="star-outline" size={20} color="#8A4DE8" />
            <Text style={styles.overviewLabel}>Points:</Text>
            <Text style={styles.overviewValue}>{points || 0} pts</Text>
          </View>

          <View style={styles.overviewItem}>
            <Ionicons name="time-outline" size={20} color="#2BB6E9" />
            <Text style={styles.overviewLabel}>Estimated Time:</Text>
            <Text style={styles.overviewValue}>{estimatedMinutes || 0} min</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleGoToResearch}
        >
          <LinearGradient
            colors={["#5FA9F5", "#4A63D8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Back to Research</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
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
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
