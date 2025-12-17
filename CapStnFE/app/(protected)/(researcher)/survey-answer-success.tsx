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

export default function SurveyAnswerSuccess() {
  const router = useRouter();
  const { 
    surveyId, 
    requiredAnswered, 
    optionalAnswered, 
    pointsEarned 
  } = useLocalSearchParams<{
    surveyId: string;
    requiredAnswered: string;
    optionalAnswered: string;
    pointsEarned: string;
  }>;

  const handleGoToSurveys = () => {
    router.replace("/(protected)/(researcher)/(tabs)/surveys" as any);
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
        <Text style={styles.title}>Survey Completed!</Text>
        <Text style={styles.subtitle}>
          Thank you for completing the survey. Your responses have been recorded.
        </Text>

        {/* Response Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Response Summary</Text>
          
          <View style={styles.detailsItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            <Text style={styles.detailsLabel}>Required Questions Answered:</Text>
            <Text style={styles.detailsValue}>{requiredAnswered || 0}</Text>
          </View>

          <View style={styles.detailsItem}>
            <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
            <Text style={styles.detailsLabel}>Optional Questions Answered:</Text>
            <Text style={styles.detailsValue}>{optionalAnswered || 0}</Text>
          </View>

          <View style={[styles.detailsItem, styles.pointsItem]}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.detailsLabel}>Points Earned:</Text>
            <Text style={[styles.detailsValue, styles.pointsValue]}>
              {pointsEarned || 0} pts
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleGoToSurveys}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Back to Surveys</Text>
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
  detailsCard: {
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
  detailsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  detailsItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  pointsItem: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  detailsLabel: {
    flex: 1,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailsValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  pointsValue: {
    fontSize: 20,
    color: "#F59E0B",
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
