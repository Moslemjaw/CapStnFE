import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getSurveyById, publishSurvey } from "@/api/surveys";
import { Survey } from "@/api/surveys";

export default function SurveyArchiveSuccess() {
  const router = useRouter();
  const { surveyId, questionCount, points, estimatedMinutes } = useLocalSearchParams<{
    surveyId: string;
    questionCount: string;
    points: string;
    estimatedMinutes: string;
  }>;
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (surveyId) {
      loadSurvey();
    }
  }, [surveyId]);

  const loadSurvey = async () => {
    if (!surveyId) return;
    try {
      const surveyData = await getSurveyById(surveyId);
      setSurvey(surveyData);
    } catch (err: any) {
      console.error("Error loading survey:", err);
    }
  };

  const handlePublishNow = async () => {
    if (!surveyId) return;

    setActionLoading(true);
    try {
      await publishSurvey(surveyId);
      router.replace({
        pathname: "/(protected)/(researcher)/survey-publish-success",
        params: {
          surveyId: surveyId,
          questionCount: questionCount || "0",
          points: points || "0",
          estimatedMinutes: estimatedMinutes || "0",
        },
      } as any);
    } catch (err: any) {
      console.error("Error publishing survey:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || err.message || "Failed to publish survey. Please try again."
      );
      setActionLoading(false);
    }
  };

  const handleEditSurvey = () => {
    if (!surveyId) return;
    router.push({
      pathname: "/(protected)/(researcher)/create-survey",
      params: { surveyId: surveyId },
    } as any);
  };

  const handleGoToResearch = () => {
    router.replace("/(protected)/(researcher)/(tabs)/research" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>Success</Text>
          <Text style={styles.headerSubtitle}>Your survey has been archived</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={["#5FA9F5", "#4A63D8", "#8A4DE8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name="archive" size={60} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Survey Archived!</Text>
        <Text style={styles.subtitle}>
          Your survey has been successfully saved to your archives. You can publish it anytime.
        </Text>

        {/* Survey Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>SURVEY SUMMARY</Text>
          <Text style={styles.surveyTitleText}>
            {survey?.title || "Survey"}
          </Text>
          
          <View style={styles.summaryModules}>
            <View style={styles.summaryModule}>
              <Ionicons name="list-outline" size={24} color="#4A63D8" />
              <Text style={styles.moduleValue}>{questionCount || 0}</Text>
              <Text style={styles.moduleLabel}>Questions</Text>
            </View>

            <View style={styles.summaryModule}>
              <View style={styles.timeIconContainer}>
                <Ionicons name="time-outline" size={20} color="#2BB6E9" />
                <Ionicons name="pencil" size={10} color="#2BB6E9" style={styles.timeEditIcon} />
              </View>
              <Text style={styles.moduleValue}>~{estimatedMinutes || 0}</Text>
              <Text style={styles.moduleLabel}>Minutes</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.publishButton}
          onPress={handlePublishNow}
          disabled={actionLoading}
        >
          <LinearGradient
            colors={["#A23DD8", "#D13DB8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.publishButtonGradient}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                <Text style={styles.publishButtonText}>Publish Now</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditSurvey}
          disabled={actionLoading}
        >
          <Ionicons name="pencil-outline" size={18} color="#6B7280" />
          <Text style={styles.editButtonText}>Edit Survey</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={handleGoToResearch}
          disabled={actionLoading}
        >
          <Text style={styles.backLinkText}>Back to Research</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  fixedHeader: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    paddingBottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  titleImage: {
    height: 28,
    width: 92,
    marginLeft: -8,
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#505050",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: "center",
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
    shadowOpacity: 0.3,
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
    paddingHorizontal: 8,
  },
  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: "center",
  },
  surveyTitleText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  summaryModules: {
    flexDirection: "row",
    gap: 12,
  },
  summaryModule: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeIconContainer: {
    position: "relative",
    marginBottom: 8,
  },
  timeEditIcon: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  moduleValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  moduleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  publishButton: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
    marginBottom: 12,
    shadowColor: "#A23DD8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  publishButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    width: "100%",
    marginBottom: 16,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
  },
  backLink: {
    paddingVertical: 12,
  },
  backLinkText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A63D8",
  },
});
