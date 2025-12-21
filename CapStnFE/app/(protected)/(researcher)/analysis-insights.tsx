import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import {
  getAnalysisById,
  AnalysisResponse,
  SurveySummary,
  Finding,
  Insight,
  Correlation,
} from "@/api/ai";
import { getSurveyById } from "@/api/surveys";
import { AnalysisSkeleton } from "@/components/Skeleton";
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

interface SurveyWithName extends SurveySummary {
  surveyTitle: string;
}

export default function AnalysisInsights() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { analysisId } = useLocalSearchParams<{ analysisId: string }>();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [surveysWithNames, setSurveysWithNames] = useState<SurveyWithName[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation system for dark theme transition
  const overlayOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const overviewOpacity = useSharedValue(0);
  const surveysOpacity = useSharedValue(0);

  const entranceEasing = Easing.bezier(0.25, 0.1, 0.25, 1);
  const exitEasing = Easing.bezier(0.4, 0.0, 0.2, 1);

  // Initialize animations
  useEffect(() => {
    overlayOpacity.value = 0;
    contentOpacity.value = 0;
    headerOpacity.value = 0;
    statsOpacity.value = 0;
    overviewOpacity.value = 0;
    surveysOpacity.value = 0;
  }, []);

  // Handle page focus for animations
  useFocusEffect(
    useCallback(() => {
      overlayOpacity.value = withTiming(1, {
        duration: 1000,
        easing: entranceEasing,
      });

      contentOpacity.value = withDelay(
        150,
        withTiming(1, {
          duration: 800,
          easing: entranceEasing,
        })
      );

      headerOpacity.value = withDelay(
        150,
        withTiming(1, {
          duration: 800,
          easing: entranceEasing,
        })
      );

      statsOpacity.value = withDelay(
        270,
        withTiming(1, {
          duration: 800,
          easing: entranceEasing,
        })
      );

      overviewOpacity.value = withDelay(
        390,
        withTiming(1, {
          duration: 800,
          easing: entranceEasing,
        })
      );

      surveysOpacity.value = withDelay(
        510,
        withTiming(1, {
          duration: 800,
          easing: entranceEasing,
        })
      );

      return () => {
        const exitDuration = 600;
        overlayOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        contentOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        headerOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        statsOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        overviewOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        surveysOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
      };
    }, [])
  );

  useEffect(() => {
    if (analysisId) {
      loadAnalysis();
    }
  }, [analysisId]);

  const loadAnalysis = async () => {
    if (!analysisId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getAnalysisById(analysisId);
      setAnalysis(data);

      // Fetch survey names
      if (data.data?.surveys) {
        const surveysWithTitles = await Promise.all(
          data.data.surveys.map(async (survey) => {
            try {
              const surveyData = await getSurveyById(survey.surveyId);
              return {
                ...survey,
                surveyTitle: surveyData.title,
              };
            } catch (err) {
              console.error(`Error fetching survey ${survey.surveyId}:`, err);
              return {
                ...survey,
                surveyTitle: "Survey",
              };
            }
          })
        );
        setSurveysWithNames(surveysWithTitles);
      }
    } catch (err: any) {
      console.error("Error loading analysis:", err);
      setError(err.message || "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!analysis || !analysis.data) return;

    try {
      let shareText = `Analysis Insights\n\nOverview:\n${
        analysis?.data?.overview || "No overview available"
      }\n\n`;

      if (surveysWithNames.length > 0) {
        shareText += `Surveys Analyzed:\n`;
        surveysWithNames.forEach((survey) => {
          shareText += `- ${survey.surveyTitle} (${survey.responseCountUsed} responses)\n`;
        });
      }

      shareText += `\nGenerated by SIGHT`;

      await Share.share({
        message: shareText,
        title: "Survey Analysis",
      });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  // Animated styles
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const overviewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overviewOpacity.value,
  }));

  const surveysAnimatedStyle = useAnimatedStyle(() => ({
    opacity: surveysOpacity.value,
  }));

  if (error || (!loading && (!analysis || !analysis.data))) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lightBackground} />
        <Animated.View style={[styles.darkOverlay, overlayAnimatedStyle]} />
        <View style={styles.contentContainer}>
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>
              {error || "Analysis data not available"}
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const totalResponses = surveysWithNames.reduce(
    (sum, s) => sum + (s.responseCountUsed || 0),
    0
  );

  if (loading) {
    return <AnalysisSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* Light background layer */}
      <View style={styles.lightBackground} />

      {/* Dark overlay that fades in */}
      <Animated.View style={[styles.darkOverlay, overlayAnimatedStyle]} />

      {/* Content container */}
      <View style={styles.contentContainer}>
        {/* Fixed Header Section */}
        <Animated.View style={[styles.fixedHeader, headerAnimatedStyle]}>
          <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
            <Text style={styles.title}>Insights</Text>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/sightai.png")}
                style={styles.titleImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={contentAnimatedStyle}>
            {/* Success Badge */}
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.successText}>Analysis Complete</Text>
            </View>

            {/* Stats Cards */}
            <Animated.View style={[styles.statsGrid, statsAnimatedStyle]}>
              <StatCard
                icon="document-text"
                label="Surveys"
                value={surveysWithNames.length}
                color="#8B5CF6"
              />
              <StatCard
                icon="people"
                label="Responses"
                value={totalResponses}
                color="#5FA9F5"
              />
            </Animated.View>

            {/* Data Quality */}
            <Animated.View style={overviewAnimatedStyle}>
              {analysis?.data?.dataQualityNotes && (
                <View style={styles.qualityCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons
                      name="shield-checkmark"
                      size={24}
                      color="#10B981"
                    />
                    <Text style={styles.cardTitle}>Data Quality</Text>
                  </View>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceLabel}>
                      Confidence Score:
                    </Text>
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceValue}>
                        {Math.round(
                          (analysis?.data?.dataQualityNotes?.confidenceScore ||
                            0) * 100
                        )}
                        %
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.qualityText}>
                    {analysis?.data?.dataQualityNotes?.confidenceExplanation ||
                      ""}
                  </Text>
                  {analysis?.data?.dataQualityNotes?.notes &&
                    analysis?.data?.dataQualityNotes?.notes.length > 0 && (
                      <View style={styles.notesSection}>
                        {analysis?.data?.dataQualityNotes?.notes.map(
                          (note, index) => (
                            <View key={index} style={styles.noteItem}>
                              <Ionicons
                                name="information-circle"
                                size={16}
                                color="#9CA3AF"
                              />
                              <Text style={styles.noteText}>{note}</Text>
                            </View>
                          )
                        )}
                      </View>
                    )}
                </View>
              )}

              {/* Overview Card */}
              <View style={styles.overviewCard}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color="#8B5CF6"
                  />
                  <Text style={styles.cardTitle}>Overview</Text>
                </View>
                <Text style={styles.overviewText}>
                  {analysis?.data?.overview || "No overview available"}
                </Text>
              </View>
            </Animated.View>

            {/* Survey Insights */}
            <Animated.View style={surveysAnimatedStyle}>
              {surveysWithNames && surveysWithNames.length > 0 && (
                <View style={styles.surveysSection}>
                  <Text style={styles.sectionTitle}>Survey Details</Text>
                  {surveysWithNames.map((survey, index) => (
                    <SurveyInsightCard key={index} survey={survey} />
                  ))}
                </View>
              )}
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

interface SurveyInsightCardProps {
  survey: SurveyWithName;
}

const SurveyInsightCard: React.FC<SurveyInsightCardProps> = ({ survey }) => {
  return (
    <View style={styles.surveyCard}>
      {/* Survey Header */}
      <View style={styles.surveyHeader}>
        <Text style={styles.surveyTitle}>{survey.surveyTitle}</Text>
        <View style={styles.responseBadge}>
          <Ionicons name="people" size={16} color="#8B5CF6" />
          <Text style={styles.responseText}>
            {survey.responseCountUsed} responses
          </Text>
        </View>
      </View>

      {/* Findings */}
      {survey.findings && survey.findings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            <Text style={styles.sectionHeaderText}>Key Findings</Text>
          </View>
          {survey.findings.map((finding: Finding, index: number) => (
            <View key={index} style={styles.findingCard}>
              <Text style={styles.findingTitle}>{finding.title}</Text>
              <Text style={styles.findingDescription}>
                {finding.description}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Insights */}
      {survey.insights && survey.insights.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color="#8B5CF6" />
            <Text style={styles.sectionHeaderText}>Insights</Text>
          </View>
          {survey.insights.map((insight: Insight, index: number) => (
            <View key={index} style={styles.insightCard}>
              <View style={styles.themeChip}>
                <Text style={styles.themeText}>{insight.theme}</Text>
              </View>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>
                {insight.description}
              </Text>
              {insight.examples && insight.examples.length > 0 && (
                <View style={styles.examplesSection}>
                  <Text style={styles.examplesLabel}>Examples:</Text>
                  {insight.examples.map((example, idx) => (
                    <View key={idx} style={styles.exampleItem}>
                      <Text style={styles.exampleBullet}>•</Text>
                      <Text style={styles.exampleText}>{example}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Correlations */}
      {survey.correlations && survey.correlations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-compare" size={20} color="#10B981" />
            <Text style={styles.sectionHeaderText}>Correlations</Text>
          </View>
          {survey.correlations.map(
            (correlation: Correlation, index: number) => (
              <View key={index} style={styles.correlationCard}>
                <Text style={styles.correlationDescription}>
                  {correlation.description}
                </Text>
                <View style={styles.evidenceBox}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.evidenceText}>
                    {correlation.evidence}
                  </Text>
                </View>
              </View>
            )
          )}
        </View>
      )}

      {/* Caveats */}
      {survey.caveats && survey.caveats.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={20} color="#EF4444" />
            <Text style={styles.sectionHeaderText}>Caveats</Text>
          </View>
          <View style={styles.caveatsBox}>
            {survey.caveats.map((caveat: string, index: number) => (
              <View key={index} style={styles.caveatItem}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.caveatText}>{caveat}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty State */}
      {(!survey.findings || survey.findings.length === 0) &&
        (!survey.insights || survey.insights.length === 0) &&
        (!survey.correlations || survey.correlations.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons
              name="information-circle-outline"
              size={32}
              color="#9CA3AF"
            />
            <Text style={styles.emptyText}>No detailed insights available</Text>
          </View>
        )}
    </View>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background.primary,
    zIndex: 0,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.dark.background,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    zIndex: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.styles.body,
    color: Colors.textDark.tertiary,
  },
  errorText: {
    marginTop: Spacing.md,
    ...Typography.styles.body,
    color: Colors.status.error,
    textAlign: "center",
  },
  button: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary.purple,
    borderRadius: Borders.radius.sm,
  },
  buttonText: {
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  fixedHeader: {
    backgroundColor: "transparent",
    zIndex: 10,
    paddingBottom: 0,
    borderBottomLeftRadius: Borders.radius.xl,
    borderBottomRightRadius: Borders.radius.xl,
    borderBottomWidth: Borders.width.default,
    borderBottomColor: Colors.dark.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...Typography.styles.h1,
    color: Colors.textDark.primary,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleImage: {
    height: Spacing.icon.xl,
    width: 106,
    marginTop: -Spacing.xxs,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.textDark.secondary,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Borders.radius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  successText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.status.success,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: Borders.radius.md,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Borders.radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  statNumber: {
    ...Typography.styles.h2,
    color: Colors.primary.purple,
    marginBottom: Spacing.xxs,
    textAlign: "center",
  },
  statValue: {
    ...Typography.styles.h2,
    color: Colors.primary.purple,
    marginBottom: Spacing.xxs,
  },
  statLabel: {
    ...Typography.styles.body,
    color: Colors.textDark.secondary,
    textAlign: "center",
  },
  qualityCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Borders.radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  confidenceLabel: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textDark.secondary,
  },
  confidenceBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Borders.radius.md,
  },
  confidenceValue: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.success,
  },
  qualityText: {
    ...Typography.styles.body,
    color: Colors.textDark.secondary,
    lineHeight: Typography.lineHeight.body,
    marginBottom: Spacing.sm,
  },
  notesSection: {
    marginTop: Spacing.xs,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  noteText: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    color: Colors.textDark.tertiary,
    lineHeight: 18,
  },
  overviewCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Borders.radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Typography.styles.h3,
    color: Colors.textDark.primary,
  },
  overviewText: {
    ...Typography.styles.body,
    color: Colors.textDark.secondary,
    lineHeight: Typography.lineHeight.body,
  },
  surveysSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    color: Colors.textDark.primary,
    marginBottom: Spacing.md,
  },
  surveyCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Borders.radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  surveyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  surveyTitle: {
    flex: 1,
    ...Typography.styles.h4,
    color: Colors.textDark.primary,
  },
  responseBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    borderRadius: Borders.radius.md,
    gap: Spacing.xxs,
  },
  responseText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.purple,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionHeaderText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textDark.primary,
  },
  findingCard: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: Borders.radius.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.xs,
    borderWidth: Borders.width.default,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  findingTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.status.warning,
    marginBottom: Spacing.xxs,
  },
  findingDescription: {
    fontSize: Typography.fontSize.body,
    color: "#FCD34D",
    lineHeight: Typography.lineHeight.body,
  },
  insightCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Borders.radius.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.xs,
  },
  themeChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    borderRadius: Borders.radius.md,
    marginBottom: Spacing.xs,
  },
  themeText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.purple,
  },
  insightTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textDark.primary,
    marginBottom: Spacing.xxs,
  },
  insightDescription: {
    fontSize: Typography.fontSize.body,
    color: Colors.textDark.secondary,
    lineHeight: Typography.lineHeight.body,
  },
  examplesSection: {
    marginTop: Spacing.xs,
  },
  examplesLabel: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textDark.tertiary,
    marginBottom: Spacing.xxs,
  },
  exampleItem: {
    flexDirection: "row",
    marginBottom: Spacing.xxs,
    gap: Spacing.xs,
  },
  exampleBullet: {
    fontSize: Typography.fontSize.body,
    color: Colors.primary.purple,
    fontWeight: Typography.fontWeight.bold,
  },
  exampleText: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    color: Colors.textDark.secondary,
    lineHeight: 18,
  },
  correlationCard: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: Borders.radius.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.xs,
    borderWidth: Borders.width.default,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  correlationDescription: {
    fontSize: Typography.fontSize.body,
    color: Colors.status.success,
    lineHeight: Typography.lineHeight.body,
    marginBottom: Spacing.xs,
  },
  evidenceBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xxs,
  },
  evidenceText: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    color: "#34D399",
    lineHeight: 18,
  },
  caveatsBox: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: Borders.radius.md,
    padding: Spacing.sm + 2,
    borderWidth: Borders.width.default,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  caveatItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  caveatText: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    color: "#F87171",
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.sm,
    ...Typography.styles.body,
    color: Colors.textDark.tertiary,
    textAlign: "center",
  },
});
