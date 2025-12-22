import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";
import { ResearchSkeleton } from "@/components/Skeleton";
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
import { Colors, Typography, Spacing, Shadows } from "@/constants/design";

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
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
};

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

    const userSurveys = await getSurveysByCreatorId(user._id);

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
          return {
            ...survey,
            responseCount: 0,
            questionCount: 0,
          };
        }
      })
    );

    const sortedSurveys = surveysWithMetadata.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    setSurveys(sortedSurveys.slice(0, 5));

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const surveysLast7Days = userSurveys.filter((survey) => {
      const surveyDate = survey.createdAt ? new Date(survey.createdAt) : survey.updatedAt ? new Date(survey.updatedAt) : null;
      return surveyDate && surveyDate >= sevenDaysAgo;
    }).length;

    const totalRespondents = surveysWithMetadata.reduce((sum, survey) => sum + survey.responseCount, 0);
    const totalResponses = surveysWithMetadata.reduce((sum, survey) => sum + survey.responseCount, 0);
    const publishedCount = userSurveys.filter((s) => s.draft === "published").length;
    const archivedCount = userSurveys.filter((s) => s.draft === "unpublished").length;

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

    Alert.alert(
      isPublishing ? "Publish Survey" : "Archive Survey",
      isPublishing
        ? `Publish "${survey.title}"? It will be visible to all users.`
        : `Archive "${survey.title}"? It will no longer be visible.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isPublishing ? "Publish" : "Archive",
          onPress: async () => {
            try {
              if (isPublishing) {
                await publishSurvey(survey._id);
                Alert.alert("Success", "Survey published successfully!");
              } else {
                await unpublishSurvey(survey._id);
                Alert.alert("Success", "Survey archived successfully.");
              }
              await loadSurveysAndStatistics();
            } catch (err: any) {
              const errorMessage = err.response?.data?.message || err.message || `Failed to ${action} survey`;
              Alert.alert("Error", errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleDeleteSurvey = async (survey: SurveyWithMetadata) => {
    Alert.alert(
      "Delete Survey",
      `Delete "${survey.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSurvey(survey._id);
              Alert.alert("Success", "Survey deleted successfully.");
              await loadSurveysAndStatistics();
            } catch (err: any) {
              const errorMessage = err.response?.data?.message || err.message || "Failed to delete survey";
              Alert.alert("Error", errorMessage);
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

  if (loading) {
    return <ResearchSkeleton />;
  }

  return (
    <FadeInView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
        {/* Gradient Background */}
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF', '#F5F3FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Research</Text>
            <Image
              source={require("@/assets/title.png")}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.primary.pink }]}>{surveys.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.semantic.success }]}>{statistics.publishedCount}</Text>
              <Text style={styles.statLabel}>Published</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.text.secondary }]}>{statistics.archivedCount}</Text>
              <Text style={styles.statLabel}>Archived</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.accent.teal }]}>{formatResponseCount(statistics.totalResponses)}</Text>
              <Text style={styles.statLabel}>Responses</Text>
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity style={styles.createButton} onPress={handleCreateSurvey} activeOpacity={0.9}>
            <Text style={styles.createButtonText}>Create New Survey</Text>
            <Ionicons name="add" size={18} color={Colors.background.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + Spacing.lg }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Recent Surveys */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Surveys</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/(protected)/(researcher)/all-surveys" } as any)}
              >
                <Text style={styles.viewAllLink}>View all</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={32} color={Colors.semantic.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={loadData} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : surveys.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={40} color={Colors.text.tertiary} />
                <Text style={styles.emptyText}>No surveys created yet</Text>
                <Text style={styles.emptySubtext}>Create your first survey to get started</Text>
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
  const isArchived = survey.draft === "unpublished" && survey.responseCount > 0;
  const isDraft = survey.draft === "unpublished" && survey.responseCount === 0;

  const getStatus = () => {
    if (isPublished) return "Published";
    if (isArchived) return "Archived";
    return "Draft";
  };

  const getStatusColor = () => {
    if (isPublished) return Colors.semantic.success;
    if (isArchived) return Colors.text.secondary;
    return Colors.primary.blue;
  };

  const status = getStatus();
  const statusColor = getStatusColor();
  const timeAgo = formatTimeAgo(survey.updatedAt || survey.createdAt);

  return (
    <View style={styles.surveyCard}>
      {/* Left color stripe */}
      <View style={[styles.cardStripe, { backgroundColor: statusColor }]} />

      <View style={styles.cardContent}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{status}</Text>
          </View>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>{survey.title}</Text>

        {/* Metrics */}
        <View style={styles.cardMetrics}>
          <View style={styles.metricItem}>
            <Ionicons name="layers-outline" size={14} color={Colors.primary.purple} />
            <Text style={styles.metricText}>{survey.questionCount} questions</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="bar-chart-outline" size={14} color={Colors.accent.teal} />
            <Text style={styles.metricText}>{formatResponseCount(survey.responseCount)} responses</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          {isPublished ? (
            <>
              <TouchableOpacity style={styles.analyzeButton} onPress={onAnalyze} activeOpacity={0.9}>
                <LinearGradient
                  colors={[Colors.primary.purple, Colors.primary.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.analyzeButtonGradient}
                >
                  <Text style={styles.analyzeButtonText}>Analyze with</Text>
                  <Image
                    source={require("@/assets/sightai.png")}
                    style={styles.sightaiIcon}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.secondaryActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={onView}>
                  <Text style={styles.secondaryButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={onToggleStatus}>
                  <Text style={styles.secondaryButtonText}>Archive</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : isDraft ? (
            <>
              <View style={styles.secondaryActions}>
                <TouchableOpacity style={styles.publishButton} onPress={onToggleStatus} activeOpacity={0.9}>
                  <Ionicons name="send-outline" size={16} color={Colors.background.primary} />
                  <Text style={styles.publishButtonText}>Publish</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={onView}>
                  <Text style={styles.secondaryButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.unarchiveButton} onPress={onToggleStatus} activeOpacity={0.9}>
                <Ionicons name="arrow-undo-outline" size={16} color={Colors.background.primary} />
                <Text style={styles.unarchiveButtonText}>Unarchive</Text>
              </TouchableOpacity>
              <View style={styles.secondaryActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={onView}>
                  <Text style={styles.secondaryButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={onDelete}>
                  <Ionicons name="trash-outline" size={16} color={Colors.semantic.error} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h2,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  titleImage: {
    height: 28,
    width: 94,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h4,
  },
  statLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.blue,
    paddingVertical: Spacing.button.paddingVertical,
    borderRadius: Spacing.button.borderRadius,
    gap: Spacing.xs,
  },
  createButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.h4,
    color: Colors.text.primary,
  },
  viewAllLink: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.primary.blue,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.semantic.error,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary.blue,
    paddingVertical: Spacing.button.paddingVerticalSmall,
    paddingHorizontal: Spacing.button.paddingHorizontal,
    borderRadius: Spacing.button.borderRadius,
  },
  retryButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.background.primary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  surveyCard: {
    flexDirection: "row",
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardStripe: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.card.paddingSmall,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Spacing.button.borderRadiusPill,
  },
  statusBadgeText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.label,
  },
  timeAgo: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.text.tertiary,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodyLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: 22,
  },
  cardMetrics: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  cardActions: {
    gap: Spacing.xs,
  },
  analyzeButton: {
    borderRadius: Spacing.button.borderRadiusSmall,
    overflow: "hidden",
    ...Shadows.purple,
  },
  analyzeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.button.paddingVerticalSmall,
    gap: 6,
  },
  analyzeButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.background.primary,
  },
  sightaiIcon: {
    width: 34,
    height: 34,
  },
  publishButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.blue,
    paddingVertical: Spacing.button.paddingVerticalSmall,
    borderRadius: Spacing.button.borderRadiusSmall,
    gap: 6,
  },
  publishButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.background.primary,
  },
  unarchiveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.purple,
    paddingVertical: Spacing.button.paddingVerticalSmall,
    borderRadius: Spacing.button.borderRadiusSmall,
    gap: 6,
  },
  unarchiveButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.background.primary,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    borderRadius: Spacing.button.borderRadiusSmall,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    gap: 4,
  },
  secondaryButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
});
