import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  getSurveysByCreatorId,
  publishSurvey,
  unpublishSurvey,
  Survey,
} from "@/api/surveys";
import { getResponsesBySurveyId } from "@/api/responses";
import { getUser } from "@/api/storage";
import User from "@/types/User";

interface SurveyWithResponseCount extends Survey {
  responseCount: number;
}

interface Statistics {
  totalSurveys: number;
  activeSurveys: number;
  archivedSurveys: number;
  totalResponses: number;
}

export default function ResearcherResearch() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [surveys, setSurveys] = useState<SurveyWithResponseCount[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalSurveys: 0,
    activeSurveys: 0,
    archivedSurveys: 0,
    totalResponses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadUser = async () => {
    const userData = await getUser();
    setUser(userData);
  };

  const loadData = async () => {
    if (!user?._id) return;

    setLoading(true);
    setError(null);
    try {
      await loadSurveysAndStatistics();
    } catch (err: any) {
      console.error("Error loading research data:", err);
      setError(err.message || "Failed to load research data");
    } finally {
      setLoading(false);
    }
  };

  const loadSurveysAndStatistics = async () => {
    if (!user?._id) return;

    // Fetch all surveys by creator
    const userSurveys = await getSurveysByCreatorId(user._id);

    // Fetch response counts for each survey
    const surveysWithCounts = await Promise.all(
      userSurveys.map(async (survey) => {
        try {
          const responses = await getResponsesBySurveyId(survey._id);
          return {
            ...survey,
            responseCount: responses.length,
          };
        } catch (err) {
          console.error(
            `Error fetching responses for survey ${survey._id}:`,
            err
          );
          return {
            ...survey,
            responseCount: 0,
          };
        }
      })
    );

    setSurveys(surveysWithCounts);

    // Calculate statistics
    const totalSurveys = userSurveys.length;
    const activeSurveys = userSurveys.filter(
      (s) => s.draft === "published"
    ).length;
    const archivedSurveys = userSurveys.filter(
      (s) => s.draft === "unpublished"
    ).length;
    const totalResponses = surveysWithCounts.reduce(
      (sum, survey) => sum + survey.responseCount,
      0
    );

    setStatistics({
      totalSurveys,
      activeSurveys,
      archivedSurveys,
      totalResponses,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadSurveysAndStatistics();
    } catch (err) {
      console.error("Error refreshing:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSurvey = () => {
    router.push("/(protected)/(researcher)/create-survey" as any);
  };

  const handleViewSurvey = (survey: SurveyWithResponseCount) => {
    router.push({
      pathname: "/(protected)/(researcher)/survey-details",
      params: { surveyId: survey._id },
    } as any);
  };

  const handleAnalyzeSurvey = (survey: SurveyWithResponseCount) => {
    Alert.alert(
      "Analyze Survey",
      `AI analysis for "${survey.title}" will be available soon.`,
      [{ text: "OK" }]
    );
  };

  const handleToggleStatus = async (survey: SurveyWithResponseCount) => {
    try {
      if (survey.draft === "published") {
        await unpublishSurvey(survey._id);
        Alert.alert("Success", "Survey archived successfully");
      } else {
        await publishSurvey(survey._id);
        Alert.alert("Success", "Survey published successfully");
      }
      // Refresh data
      await loadSurveysAndStatistics();
    } catch (err: any) {
      console.error("Error toggling survey status:", err);
      Alert.alert("Error", err.message || "Failed to update survey status");
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading research data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Research</Text>
          <Text style={styles.subtitle}>
            Manage your surveys and create new ones
          </Text>
        </View>

        {/* Total Surveys and Active Surveys (2 boxes at the beginning) */}
        <View style={styles.topStatsContainer}>
          <StatCard
            icon="document-text-outline"
            value={statistics.totalSurveys}
            label="Total Surveys"
            color="#3B82F6"
          />
          <StatCard
            icon="checkmark-circle-outline"
            value={statistics.activeSurveys}
            label="Active Surveys"
            color="#10B981"
          />
        </View>

        {/* Statistics Cards (4 boxes) */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="archive-outline"
            value={statistics.archivedSurveys}
            label="Archived Surveys"
            color="#6B7280"
          />
          <StatCard
            icon="people-outline"
            value={statistics.totalResponses}
            label="Total Responses"
            color="#F59E0B"
          />
        </View>

        {/* Mass Analysis Button */}
        <View style={styles.massAnalysisContainer}>
          <TouchableOpacity
            style={styles.massAnalysisButton}
            onPress={() => {
              Alert.alert(
                "Mass Analysis",
                "AI-powered mass analysis feature will be available soon.",
                [{ text: "OK" }]
              );
            }}
          >
            <Ionicons name="analytics-outline" size={28} color="#FFFFFF" />
            <View style={styles.massAnalysisTextContainer}>
              <Text style={styles.massAnalysisButtonText}>Mass Analysis</Text>
              <Text style={styles.massAnalysisButtonSubtext}>
                Analyze multiple of surveys at once
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Create New Survey Button */}
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSurvey}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create New Survey</Text>
          </TouchableOpacity>
        </View>

        {/* My Surveys Section */}
        <View style={styles.surveysSection}>
          <Text style={styles.sectionTitle}>My Surveys</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadData} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : surveys.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#9CA3AF"
              />
              <Text style={styles.emptyText}>No surveys created yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first survey to get started
              </Text>
            </View>
          ) : (
            surveys.map((survey) => (
              <ResearchSurveyCard
                key={survey._id}
                survey={survey}
                onView={() => handleViewSurvey(survey)}
                onAnalyze={() => handleAnalyzeSurvey(survey)}
                onToggleStatus={() => handleToggleStatus(survey)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Statistics Card Component
interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => {
  return (
    <View style={styles.statCard}>
      <View
        style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}
      >
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

// Research Survey Card Component
interface ResearchSurveyCardProps {
  survey: SurveyWithResponseCount;
  onView: () => void;
  onAnalyze: () => void;
  onToggleStatus: () => void;
}

const ResearchSurveyCard: React.FC<ResearchSurveyCardProps> = ({
  survey,
  onView,
  onAnalyze,
  onToggleStatus,
}) => {
  const isActive = survey.draft === "published";

  return (
    <View style={styles.surveyCard}>
      <View style={styles.surveyCardHeader}>
        <View style={styles.surveyCardTitleRow}>
          <Text style={styles.surveyCardTitle}>{survey.title}</Text>
          <View
            style={[
              styles.statusBadge,
              isActive ? styles.statusBadgeActive : styles.statusBadgeArchived,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isActive
                  ? styles.statusBadgeTextActive
                  : styles.statusBadgeTextArchived,
              ]}
            >
              {isActive ? "Active" : "Archived"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.surveyCardDetails}>
        <View style={styles.surveyDetailItem}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.surveyDetailText}>
            {survey.estimatedMinutes} min
          </Text>
        </View>
        <View style={styles.surveyDetailItem}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.surveyDetailText}>
            {survey.responseCount} answers
          </Text>
        </View>
      </View>

      <View style={styles.surveyCardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={onView}
        >
          <Ionicons name="eye-outline" size={18} color="#3B82F6" />
          <Text style={[styles.actionButtonText, styles.viewButtonText]}>
            View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.analyzeButton]}
          onPress={onAnalyze}
        >
          <Ionicons name="analytics-outline" size={18} color="#8B5CF6" />
          <Text style={[styles.actionButtonText, styles.analyzeButtonText]}>
            Analyze
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isActive ? styles.archiveButton : styles.publishButton,
          ]}
          onPress={onToggleStatus}
        >
          <Ionicons
            name={isActive ? "archive-outline" : "checkmark-circle-outline"}
            size={18}
            color={isActive ? "#6B7280" : "#10B981"}
          />
          <Text
            style={[
              styles.actionButtonText,
              isActive ? styles.archiveButtonText : styles.publishButtonText,
            ]}
          >
            {isActive ? "Archive" : "Publish"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
  topStatsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  createButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  massAnalysisContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  massAnalysisButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 16,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  massAnalysisTextContainer: {
    flex: 1,
  },
  massAnalysisButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  massAnalysisButtonSubtext: {
    fontSize: 13,
    color: "#E9D5FF",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  surveysSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
  surveyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  surveyCardHeader: {
    marginBottom: 12,
  },
  surveyCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  surveyCardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginRight: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: "#D1FAE5",
  },
  statusBadgeArchived: {
    backgroundColor: "#F3F4F6",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadgeTextActive: {
    color: "#065F46",
  },
  statusBadgeTextArchived: {
    color: "#6B7280",
  },
  surveyCardDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  surveyDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  surveyDetailText: {
    fontSize: 14,
    color: "#6B7280",
  },
  surveyCardActions: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewButton: {
    backgroundColor: "#EFF6FF",
  },
  analyzeButton: {
    backgroundColor: "#F5F3FF",
  },
  archiveButton: {
    backgroundColor: "#F9FAFB",
  },
  publishButton: {
    backgroundColor: "#ECFDF5",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  viewButtonText: {
    color: "#3B82F6",
  },
  analyzeButtonText: {
    color: "#8B5CF6",
  },
  archiveButtonText: {
    color: "#6B7280",
  },
  publishButtonText: {
    color: "#10B981",
  },
});
