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
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";
import {
  getSurveysByCreatorId,
  publishSurvey,
  unpublishSurvey,
  deleteSurvey,
  Survey,
} from "@/api/surveys";
import { getResponsesBySurveyId } from "@/api/responses";
import { getQuestionsBySurveyId } from "@/api/questions";
import { getUser } from "@/api/storage";
import User from "@/types/User";

interface SurveyWithMetadata extends Survey {
  responseCount: number;
  questionCount: number;
}

interface Statistics {
  surveysLast7Days: number;
  totalRespondents: number;
  totalResponses: number;
  publishedCount: number;
  archivedCount: number;
}

// Utility function to format relative time
const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 4)
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  return `${Math.floor(diffMonths / 12)} year${
    Math.floor(diffMonths / 12) !== 1 ? "s" : ""
  } ago`;
};

// Utility function to format response count
const formatResponseCount = (count: number): string => {
  if (count < 1000) return count.toString();
  const k = (count / 1000).toFixed(1);
  return `${k}K`;
};

export default function ResearcherResearch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const [user, setUser] = useState<User | null>(null);
  const [surveys, setSurveys] = useState<SurveyWithMetadata[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    surveysLast7Days: 0,
    totalRespondents: 0,
    totalResponses: 0,
    publishedCount: 0,
    archivedCount: 0,
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

    // Fetch response counts and question counts for each survey
    const surveysWithMetadata = await Promise.all(
      userSurveys.map(async (survey) => {
        try {
          const [responses, questions] = await Promise.all([
            getResponsesBySurveyId(survey._id).catch(() => []),
            getQuestionsBySurveyId(survey._id).catch(() => []),
          ]);
          return {
            ...survey,
            responseCount: responses.length,
            questionCount: questions.length,
          };
        } catch (err) {
          console.error(
            `Error fetching metadata for survey ${survey._id}:`,
            err
          );
          return {
            ...survey,
            responseCount: 0,
            questionCount: 0,
          };
        }
      })
    );

    // Sort surveys by most recent (updatedAt or createdAt) and take top 5
    const sortedSurveys = surveysWithMetadata.sort((a, b) => {
      const dateA = a.updatedAt
        ? new Date(a.updatedAt).getTime()
        : a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;
      const dateB = b.updatedAt
        ? new Date(b.updatedAt).getTime()
        : b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;
      return dateB - dateA; // Most recent first
    });

    setSurveys(sortedSurveys.slice(0, 5)); // Show only recent 5

    // Calculate statistics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const surveysLast7Days = userSurveys.filter((survey) => {
      const surveyDate = survey.createdAt
        ? new Date(survey.createdAt)
        : survey.updatedAt
        ? new Date(survey.updatedAt)
        : null;
      return surveyDate && surveyDate >= sevenDaysAgo;
    }).length;

    const totalRespondents = surveysWithMetadata.reduce(
      (sum, survey) => sum + survey.responseCount,
      0
    );

    const totalResponses = surveysWithMetadata.reduce(
      (sum, survey) => sum + survey.responseCount,
      0
    );

    const publishedCount = userSurveys.filter(
      (s) => s.draft === "published"
    ).length;

    const archivedCount = userSurveys.filter(
      (s) => s.draft === "unpublished"
    ).length;

    setStatistics({
      surveysLast7Days,
      totalRespondents,
      totalResponses,
      publishedCount,
      archivedCount,
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

  const handleToggleStatus = async (survey: SurveyWithMetadata) => {
    const isPublishing = survey.draft === "unpublished";
    const action = isPublishing ? "publish" : "archive";

    // Confirm action with user
    Alert.alert(
      isPublishing ? "Publish Survey" : "Archive Survey",
      isPublishing
        ? `Are you sure you want to publish "${survey.title}"? It will be visible to all users.`
        : `Are you sure you want to archive "${survey.title}"? It will no longer be visible to users.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: isPublishing ? "Publish" : "Archive",
          onPress: async () => {
            try {
              if (isPublishing) {
                await publishSurvey(survey._id);
                Alert.alert(
                  "Success",
                  "Survey published successfully! It is now visible to all users."
                );
              } else {
                await unpublishSurvey(survey._id);
                Alert.alert(
                  "Success",
                  "Survey archived successfully. It is no longer visible to users."
                );
              }
              // Refresh data
              await loadSurveysAndStatistics();
            } catch (err: any) {
              console.error(`Error ${action}ing survey:`, err);
              const errorMessage =
                err.response?.data?.message ||
                err.message ||
                `Failed to ${action} survey`;
              Alert.alert(
                "Error",
                `${errorMessage}. Please check your connection and try again.`
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteSurvey = async (survey: SurveyWithMetadata) => {
    Alert.alert(
      "Delete Survey",
      `Are you sure you want to delete "${survey.title}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSurvey(survey._id);
              Alert.alert("Success", "Survey deleted successfully.");
              // Refresh data
              await loadSurveysAndStatistics();
            } catch (err: any) {
              console.error("Error deleting survey:", err);
              const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Failed to delete survey";
              Alert.alert(
                "Error",
                `${errorMessage}. Please check your connection and try again.`
              );
            }
          },
        },
      ]
    );
  };

  const handleViewSurvey = (survey: SurveyWithMetadata) => {
    router.push({
      pathname: "/(protected)/(researcher)/survey-details",
      params: { surveyId: survey._id },
    } as any);
  };

  const handleAnalyzeSurvey = (survey: SurveyWithMetadata) => {
    router.push({
      pathname: "/(protected)/(researcher)/survey-analyses",
      params: { surveyId: survey._id },
    } as any);
  };

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.title}>Research</Text>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/title.png")}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.headerContent}>
          {/* Compact Overview Stats Row */}
          <View style={styles.headerOverviewRow}>
            <View style={styles.headerOverviewStats}>
              <View style={styles.headerStatItem}>
                <Text style={styles.headerStatValuePink}>{surveys.length}</Text>
                <Text style={styles.headerStatLabel}>Total surveys</Text>
              </View>
              <View style={styles.headerStatItem}>
                <Text style={styles.headerStatValueGreen}>
                  {statistics.publishedCount}
                </Text>
                <Text style={styles.headerStatLabel}>Published</Text>
              </View>
              <View style={styles.headerStatItem}>
                <Text style={styles.headerStatValueGrey}>
                  {statistics.archivedCount}
                </Text>
                <Text style={styles.headerStatLabel}>Archived</Text>
              </View>
              <View style={styles.headerStatItem}>
                <Text style={styles.headerStatValueTeal}>
                  {formatResponseCount(statistics.totalResponses)}
                </Text>
                <Text style={styles.headerStatLabel}>Responses</Text>
              </View>
            </View>
          </View>

          {/* Compact Create Button */}
          <TouchableOpacity
            style={styles.headerCreateButton}
            onPress={handleCreateSurvey}
          >
            <LinearGradient
              colors={["#8A4DE8", "#5FA9F5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerCreateButtonGradient}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.headerCreateButtonText}>
                Create New Survey
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight + 4 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Recent Surveys Section */}
        <View style={styles.surveysSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Surveys</Text>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "/(protected)/(researcher)/all-surveys",
                } as any);
              }}
            >
              <Text style={styles.viewAllLink}>view all</Text>
            </TouchableOpacity>
          </View>

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
                onDelete={() => handleDeleteSurvey(survey)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
    </FadeInView>
  );
}

// Research Survey Card Component
interface ResearchSurveyCardProps {
  survey: SurveyWithMetadata;
  onView: () => void;
  onAnalyze: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

const ResearchSurveyCard: React.FC<ResearchSurveyCardProps> = ({
  survey,
  onView,
  onAnalyze,
  onToggleStatus,
  onDelete,
}) => {
  const isPublished = survey.draft === "published";
  // If unpublished and has responses, it was published before (Archived)
  // If unpublished and no responses, it's a Draft
  const isArchived = survey.draft === "unpublished" && survey.responseCount > 0;
  const isDraft = survey.draft === "unpublished" && survey.responseCount === 0;

  // Determine status
  const getStatus = () => {
    if (isPublished) return "Published";
    if (isArchived) return "Archived";
    return "Draft";
  };

  const status = getStatus();
  const timeAgo = formatTimeAgo(survey.updatedAt || survey.createdAt);

  return (
    <View style={styles.surveyCard}>
      <View style={styles.surveyCardHeader}>
        {/* Status and Time Row */}
        <View style={styles.surveyCardStatusRow}>
          <View
            style={[
              styles.statusBadge,
              status === "Published" && styles.statusBadgePublished,
              status === "Draft" && styles.statusBadgeDraft,
              status === "Archived" && styles.statusBadgeArchived,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                status === "Published" && styles.statusBadgeTextPublished,
                status === "Draft" && styles.statusBadgeTextDraft,
                status === "Archived" && styles.statusBadgeTextArchived,
              ]}
            >
              {status}
            </Text>
          </View>
          <Text style={styles.surveyCardTime}>{timeAgo}</Text>
        </View>
        {/* Title Row */}
        <Text style={styles.surveyCardTitle} numberOfLines={2}>
          {survey.title}
        </Text>
      </View>

      <View style={styles.surveyCardMetrics}>
        <View style={styles.surveyMetricItem}>
          <Ionicons name="help-circle-outline" size={16} color="#8A4DE8" />
          <Text style={styles.surveyMetricText}>
            {survey.questionCount} question
            {survey.questionCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.surveyMetricItem}>
          <Ionicons name="people-outline" size={16} color="#2BB6E9" />
          <Text style={styles.surveyMetricText}>
            {formatResponseCount(survey.responseCount)} response
            {survey.responseCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.surveyCardActions}>
        {isPublished ? (
          <>
            {/* Full-width Analyze Button for Published */}
            <TouchableOpacity
              style={[
                styles.mainActionButton,
                styles.mainActionButtonFullWidth,
              ]}
              onPress={onAnalyze}
            >
              <LinearGradient
                colors={["#8A4DE8", "#FF6FAE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainActionButtonGradient}
              >
                <Text style={styles.mainActionButtonText}>Analyze with</Text>
                <Image
                  source={require("@/assets/sightai.png")}
                  style={styles.sightaiIcon}
                  resizeMode="contain"
                />
              </LinearGradient>
            </TouchableOpacity>
            {/* Secondary Buttons Row Below */}
            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={onView}
              >
                <Text style={styles.secondaryActionButtonText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={onToggleStatus}
              >
                <Ionicons name="archive-outline" size={18} color="#6B7280" />
                <Text style={styles.secondaryActionButtonText}>Archive</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : isDraft ? (
          <>
            {/* Full-width Publish Button for Draft */}
            <TouchableOpacity
              style={[
                styles.mainActionButton,
                styles.mainActionButtonFullWidth,
              ]}
              onPress={onToggleStatus}
            >
              <LinearGradient
                colors={["#3B82F6", "#2563EB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainActionButtonGradient}
              >
                <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
                <Text style={styles.mainActionButtonText}>Publish</Text>
              </LinearGradient>
            </TouchableOpacity>
            {/* Secondary Buttons Row Below */}
            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={onView}
              >
                <Text style={styles.secondaryActionButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Full-width Unarchive Button for Archived */}
            <TouchableOpacity
              style={[
                styles.mainActionButton,
                styles.mainActionButtonFullWidth,
              ]}
              onPress={onToggleStatus}
            >
              <LinearGradient
                colors={["#8A4DE8", "#5FA9F5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainActionButtonGradient}
              >
                <Ionicons name="archive-outline" size={18} color="#FFFFFF" />
                <Text style={styles.mainActionButtonText}>Unarchive</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={onView}
              >
                <Text style={styles.secondaryActionButtonText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={onDelete}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
    paddingTop: 0,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleImage: {
    height: 32,
    width: 106,
    marginLeft: -6,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222222",
  },
  headerOverviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerOverviewStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    flex: 1,
    justifyContent: "center",
  },
  headerStatItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  headerStatValueBlue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3B82F6",
    marginBottom: 2,
  },
  headerStatValuePink: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF6FAE",
    marginBottom: 2,
    textAlign: "center",
  },
  headerStatValueTeal: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2BB6E9",
    marginBottom: 2,
    textAlign: "center",
  },
  headerStatValueGreen: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 2,
    textAlign: "center",
  },
  headerStatValueGrey: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 2,
    textAlign: "center",
  },
  headerStatLabel: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    width: "100%",
  },
  headerCreateButton: {
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
  },
  headerCreateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 8,
  },
  headerCreateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  overviewCardContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  overviewCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  overviewMenuButton: {
    padding: 4,
  },
  overviewStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  overviewStatItem: {
    flex: 1,
    alignItems: "flex-start",
  },
  overviewStatValueBlue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#3B82F6",
    marginBottom: 4,
  },
  overviewStatValuePink: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FF6FAE",
    marginBottom: 4,
  },
  overviewStatLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  createButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  surveysSection: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
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
  surveyCardStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  surveyCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  surveyCardTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgePublished: {
    backgroundColor: "#D1FAE5",
  },
  statusBadgeDraft: {
    backgroundColor: "#DBEAFE",
  },
  statusBadgeArchived: {
    backgroundColor: "#F3F4F6",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadgeTextPublished: {
    color: "#065F46",
  },
  statusBadgeTextDraft: {
    color: "#1E40AF",
  },
  statusBadgeTextArchived: {
    color: "#6B7280",
  },
  surveyCardMetrics: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  surveyMetricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  surveyMetricText: {
    fontSize: 14,
    color: "#6B7280",
  },
  surveyCardActions: {
    gap: 12,
  },
  mainActionButton: {
    borderRadius: 8,
    shadowColor: "#8A4DE8",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 44,
  },
  mainActionButtonFullWidth: {
    width: "100%",
  },
  mainActionButtonCompact: {
    flex: 1,
  },
  mainActionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
  },
  mainActionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  sightaiIcon: {
    width: 22,
    height: 22,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    gap: 6,
  },
  secondaryActionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
});
