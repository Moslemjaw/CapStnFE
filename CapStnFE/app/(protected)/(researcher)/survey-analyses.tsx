import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getSurveyById, Survey } from "@/api/surveys";
import { getResponsesBySurveyId } from "@/api/responses";
import { createAnalysis, getAllAnalyses, AnalysisResponse } from "@/api/ai";

export default function SurveyAnalyses() {
  const router = useRouter();
  const { surveyId } = useLocalSearchParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisResponse[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      loadData();
    }
  }, [surveyId]);

  const loadData = async () => {
    if (!surveyId) return;

    setLoading(true);
    setError(null);
    try {
      // Load survey details, responses count, and all analyses
      const [surveyData, responses, allAnalyses] = await Promise.all([
        getSurveyById(surveyId),
        getResponsesBySurveyId(surveyId),
        getAllAnalyses(),
      ]);

      setSurvey(surveyData);
      setResponseCount(responses.length);

      // Filter analyses for this specific survey
      const surveyAnalyses = allAnalyses.analyses.filter((analysis) => {
        if (analysis.type !== "single") return false;
        if (!analysis.data?.surveys || !Array.isArray(analysis.data.surveys))
          return false;
        return analysis.data.surveys.some((s) => s.surveyId === surveyId);
      });

      setAnalyses(surveyAnalyses);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (err) {
      console.error("Error refreshing:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateAnalysis = async () => {
    if (!surveyId || !survey) return;

    if (responseCount === 0) {
      Alert.alert(
        "No Responses",
        "This survey has no responses yet. Please wait for users to answer the survey before analyzing.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Start Analysis",
      `Analyze "${survey.title}" with ${responseCount} response${
        responseCount !== 1 ? "s" : ""
      }?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Analyze",
          onPress: async () => {
            setCreating(true);
            try {
              const analysis = await createAnalysis(surveyId);

              // Navigate to loading screen with analysis ID
              router.push({
                pathname: "/(protected)/(researcher)/analysis-loading",
                params: {
                  analysisId: analysis.analysisId,
                  type: "single",
                },
              } as any);
            } catch (err: any) {
              console.error("Error creating analysis:", err);
              Alert.alert(
                "Error",
                err.response?.data?.message ||
                  err.message ||
                  "Failed to start analysis. Please try again."
              );
            } finally {
              setCreating(false);
            }
          },
        },
      ]
    );
  };

  const handleViewAnalysis = (analysis: AnalysisResponse) => {
    if (analysis.status === "ready") {
      router.push({
        pathname: "/(protected)/(researcher)/analysis-insights",
        params: {
          analysisId: analysis.analysisId,
        },
      } as any);
    } else if (analysis.status === "processing") {
      router.push({
        pathname: "/(protected)/(researcher)/analysis-loading",
        params: {
          analysisId: analysis.analysisId,
          type: analysis.type,
        },
      } as any);
    } else {
      Alert.alert("Analysis Failed", "This analysis failed to complete.", [
        { text: "OK" },
      ]);
    }
  };

  const getStatusColor = (status: AnalysisResponse["status"]) => {
    switch (status) {
      case "ready":
        return "#10B981";
      case "processing":
        return "#F59E0B";
      case "failed":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status: AnalysisResponse["status"]) => {
    switch (status) {
      case "ready":
        return "checkmark-circle";
      case "processing":
        return "hourglass-outline";
      case "failed":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading analyses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !survey) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || "Survey not found"}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.button}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>Survey Analyses</Text>
          <Text style={styles.headerSubtitle}>{survey.title}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Survey Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={20} color="#8B5CF6" />
              <Text style={styles.infoLabel}>Responses</Text>
              <Text style={styles.infoValue}>{responseCount}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="analytics-outline" size={20} color="#8B5CF6" />
              <Text style={styles.infoLabel}>Analyses</Text>
              <Text style={styles.infoValue}>{analyses.length}</Text>
            </View>
          </View>
        </View>

        {/* New Analysis Button */}
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            creating && styles.analyzeButtonDisabled,
          ]}
          onPress={handleCreateAnalysis}
          disabled={creating || responseCount === 0}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>
                {responseCount === 0
                  ? "No Responses to Analyze"
                  : "Analyze Survey"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Previous Analyses */}
        <View style={styles.analysesSection}>
          <Text style={styles.sectionTitle}>Previous Analyses</Text>

          {analyses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No analyses yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first analysis to get AI-powered insights
              </Text>
            </View>
          ) : (
            analyses.map((analysis) => (
              <TouchableOpacity
                key={analysis.analysisId}
                style={styles.analysisCard}
                onPress={() => handleViewAnalysis(analysis)}
                activeOpacity={0.7}
              >
                <View style={styles.analysisHeader}>
                  <View style={styles.analysisStatus}>
                    <Ionicons
                      name={getStatusIcon(analysis.status) as any}
                      size={20}
                      color={getStatusColor(analysis.status)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(analysis.status) },
                      ]}
                    >
                      {analysis.status.charAt(0).toUpperCase() +
                        analysis.status.slice(1)}
                    </Text>
                  </View>
                  {analysis.status === "processing" && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressText}>
                        {analysis.progress}%
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.analysisDate}>
                  {new Date(analysis.createdAt || "").toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </Text>

                {analysis.status === "ready" && analysis.data?.overview && (
                  <Text style={styles.analysisPreview} numberOfLines={2}>
                    {analysis.data.overview}
                  </Text>
                )}

                <View style={styles.analysisFooter}>
                  <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
                </View>
              </TouchableOpacity>
            ))
          )}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#6B7280",
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  button: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  analysesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  analysisCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  analysisStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F59E0B",
  },
  analysisDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  analysisPreview: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },
  analysisFooter: {
    alignItems: "flex-end",
  },
});
