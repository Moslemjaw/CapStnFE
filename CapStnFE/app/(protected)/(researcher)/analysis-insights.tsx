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
import { SafeAreaView } from "react-native-safe-area-context";
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

interface SurveyWithName extends SurveySummary {
  surveyTitle: string;
}

export default function AnalysisInsights() {
  const router = useRouter();
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

      contentOpacity.value = withDelay(150, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      headerOpacity.value = withDelay(150, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      statsOpacity.value = withDelay(270, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      overviewOpacity.value = withDelay(390, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      surveysOpacity.value = withDelay(510, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

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
      let shareText = `Analysis Insights\n\nOverview:\n${analysis?.data?.overview || "No overview available"}\n\n`;

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
            <TouchableOpacity onPress={() => router.back()} style={styles.button}>
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
      <SafeAreaView style={styles.container}>
        {/* Light background layer */}
        <View style={styles.lightBackground} />
        
        {/* Dark overlay that fades in */}
        <Animated.View style={[styles.darkOverlay, overlayAnimatedStyle]} />
        
        {/* Content container */}
        <View style={styles.contentContainer}>
          {/* Fixed Header Section */}
          <Animated.View style={[styles.fixedHeader, headerAnimatedStyle]}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image source={require("@/assets/sightai.png")} style={styles.titleImage} resizeMode="contain" />
              </View>
              <Text style={styles.title}>Analysis Insights</Text>
              <Text style={styles.subtitle}>
                {analysis?.createdAt ? new Date(analysis.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : "Analysis Insights"}
              </Text>
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
                      <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                      <Text style={styles.cardTitle}>Data Quality</Text>
                    </View>
                    <View style={styles.confidenceRow}>
                      <Text style={styles.confidenceLabel}>Confidence Score:</Text>
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceValue}>
                          {Math.round(
                            (analysis?.data?.dataQualityNotes?.confidenceScore || 0) * 100
                          )}
                          %
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.qualityText}>
                      {analysis?.data?.dataQualityNotes?.confidenceExplanation || ""}
                    </Text>
                    {analysis?.data?.dataQualityNotes?.notes &&
                      analysis?.data?.dataQualityNotes?.notes.length > 0 && (
                        <View style={styles.notesSection}>
                          {analysis?.data?.dataQualityNotes?.notes.map((note, index) => (
                            <View key={index} style={styles.noteItem}>
                              <Ionicons
                                name="information-circle"
                                size={16}
                                color="#9CA3AF"
                              />
                              <Text style={styles.noteText}>{note}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                  </View>
                )}

                {/* Overview Card */}
                <View style={styles.overviewCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="document-text-outline" size={24} color="#8B5CF6" />
                    <Text style={styles.cardTitle}>Overview</Text>
                  </View>
                  <Text style={styles.overviewText}>{analysis?.data?.overview || "No overview available"}</Text>
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
    backgroundColor: "#FFFFFF",
    zIndex: 0,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F0F1E",
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
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#9CA3AF",
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  fixedHeader: {
    backgroundColor: "transparent",
    zIndex: 10,
    paddingBottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E2E",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  titleImage: {
    height: 28,
    width: 92,
    marginTop: -4,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1E1E2E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B5CF6",
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B5CF6",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
  },
  qualityCard: {
    backgroundColor: "#1E1E2E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#CCCCCC",
  },
  confidenceBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  qualityText: {
    fontSize: 14,
    color: "#CCCCCC",
    lineHeight: 20,
    marginBottom: 12,
  },
  notesSection: {
    marginTop: 8,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
  },
  overviewCard: {
    backgroundColor: "#1E1E2E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  overviewText: {
    fontSize: 16,
    color: "#CCCCCC",
    lineHeight: 24,
  },
  surveysSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  surveyCard: {
    backgroundColor: "#1E1E2E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  surveyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  surveyTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  responseBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  responseText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  findingCard: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  findingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F59E0B",
    marginBottom: 6,
  },
  findingDescription: {
    fontSize: 14,
    color: "#FCD34D",
    lineHeight: 20,
  },
  insightCard: {
    backgroundColor: "#2D2D3E",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  themeChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  themeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 14,
    color: "#CCCCCC",
    lineHeight: 20,
  },
  examplesSection: {
    marginTop: 10,
  },
  examplesLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 6,
  },
  exampleItem: {
    flexDirection: "row",
    marginBottom: 4,
    gap: 8,
  },
  exampleBullet: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "700",
  },
  exampleText: {
    flex: 1,
    fontSize: 13,
    color: "#CCCCCC",
    lineHeight: 18,
  },
  correlationCard: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  correlationDescription: {
    fontSize: 14,
    color: "#10B981",
    lineHeight: 20,
    marginBottom: 8,
  },
  evidenceBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  evidenceText: {
    flex: 1,
    fontSize: 13,
    color: "#34D399",
    lineHeight: 18,
  },
  caveatsBox: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  caveatItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  caveatText: {
    flex: 1,
    fontSize: 13,
    color: "#F87171",
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
