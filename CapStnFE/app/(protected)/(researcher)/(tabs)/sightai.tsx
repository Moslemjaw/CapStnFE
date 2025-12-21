import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  Image,
} from "react-native";
import React, { useEffect, useState, useCallback, useContext, useRef } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { getAllAnalyses, AnalysisResponse } from "@/api/ai";
import { getResponsesByUserId } from "@/api/responses";
import { getUser } from "@/api/storage";
import { getSurveyById } from "@/api/surveys";
import { createAnalysis, getAnalysisById } from "@/api/ai";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import AnalysisContext from "@/context/AnalysisContext";
import { SightAISkeleton } from "@/components/Skeleton";
import { Colors, Typography, Spacing, Shadows } from "@/constants/design";

interface SurveyWithTitle {
  surveyId: string;
  title: string;
}

interface InsightCard {
  analysisId: string;
  surveyTitle: string;
  surveyIds: string[];
  createdAt: string;
  insight: string;
  tags: string[];
}

export default function SightAI() {
  const router = useRouter();
  const bottomNavHeight = useBottomNavHeight();
  const insets = useSafeAreaInsets();
  const { setIsAnalyzing, triggerCompletion } = useContext(AnalysisContext);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisResponse[]>([]);
  const [answeredSurveys, setAnsweredSurveys] = useState<SurveyWithTitle[]>([]);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzingAnswered, setAnalyzingAnswered] = useState(false);

  // Dark mode transition animations
  const overlayOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const aiCardOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const insightsOpacity = useSharedValue(0);

  const entranceEasing = Easing.bezier(0.25, 0.1, 0.25, 1);
  const exitEasing = Easing.bezier(0.4, 0.0, 0.2, 1);

  useEffect(() => {
    overlayOpacity.value = 0;
    contentOpacity.value = 0;
    headerOpacity.value = 0;
    aiCardOpacity.value = 0;
    statsOpacity.value = 0;
    insightsOpacity.value = 0;
  }, []);

  useFocusEffect(
    useCallback(() => {
      overlayOpacity.value = withTiming(1, { duration: 1000, easing: entranceEasing });
      contentOpacity.value = withDelay(150, withTiming(1, { duration: 800, easing: entranceEasing }));
      headerOpacity.value = withDelay(150, withTiming(1, { duration: 800, easing: entranceEasing }));
      aiCardOpacity.value = withDelay(270, withTiming(1, { duration: 800, easing: entranceEasing }));
      statsOpacity.value = withDelay(390, withTiming(1, { duration: 800, easing: entranceEasing }));
      insightsOpacity.value = withDelay(510, withTiming(1, { duration: 800, easing: entranceEasing }));

      loadData();

      return () => {
        const exitDuration = 600;
        overlayOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
        contentOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
        headerOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
        aiCardOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
        statsOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
        insightsOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
      };
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadAnalyses(), loadAnsweredSurveys()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (analyses.length > 0) {
      loadInsightCards();
    }
  }, [analyses]);

  const loadAnalyses = async () => {
    try {
      const response = await getAllAnalyses();
      setAnalyses(response.analyses || []);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log("Authentication expired - redirecting to login");
        return;
      }
      console.error("Error loading analyses:", error);
    }
  };

  const loadAnsweredSurveys = async () => {
    try {
      const user = await getUser();
      if (user?._id) {
        const responses = await getResponsesByUserId(user._id);
        const uniqueSurveyIds = Array.from(new Set(responses.map((r) => r.surveyId)));

        const surveysWithTitles = await Promise.all(
          uniqueSurveyIds.map(async (surveyId) => {
            try {
              const survey = await getSurveyById(surveyId);
              return { surveyId, title: survey.title };
            } catch (error) {
              return { surveyId, title: "Survey" };
            }
          })
        );

        setAnsweredSurveys(surveysWithTitles);
      }
    } catch (error) {
      console.error("Error loading answered surveys:", error);
    }
  };

  const loadInsightCards = async () => {
    try {
      const readyAnalyses = analyses.filter((a) => a.status === "ready");
      if (readyAnalyses.length === 0) {
        setInsightCards([]);
        return;
      }

      const cards: InsightCard[] = [];

      for (const analysis of readyAnalyses.slice(0, 4)) {
        if (!analysis.data?.surveys || analysis.data.surveys.length === 0) continue;

        const firstSurvey = analysis.data.surveys[0];
        const firstInsight = firstSurvey.insights[0];

        let surveyTitle = "Survey Analysis";
        try {
          const survey = await getSurveyById(firstSurvey.surveyId);
          surveyTitle = survey.title;
        } catch (error) {
          console.error(`Error fetching survey title:`, error);
        }

        const allTags: string[] = [];
        analysis.data.surveys.forEach((survey) => {
          survey.insights.forEach((insight) => {
            if (insight.theme && !allTags.includes(insight.theme)) {
              allTags.push(insight.theme);
            }
          });
        });

        cards.push({
          analysisId: analysis.analysisId,
          surveyTitle,
          surveyIds: analysis.surveyIds || [],
          createdAt: analysis.createdAt || new Date().toISOString(),
          insight: firstInsight?.description || analysis.data.overview || "Analysis complete",
          tags: allTags.slice(0, 3),
        });
      }

      setInsightCards(cards);
    } catch (error) {
      console.error("Error loading insight cards:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleMassAnalyze = () => {
    router.push("/(protected)/(researcher)/mass-analyses" as any);
  };

  const pollAnalysisInBackground = (analysisId: string) => {
    const poll = async () => {
      try {
        const data = await getAnalysisById(analysisId);

        if (data.status === "ready") {
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }

          triggerCompletion();

          setTimeout(() => {
            setIsAnalyzing(false);
            router.replace({
              pathname: "/(protected)/(researcher)/analysis-insights",
              params: { analysisId: data.analysisId },
            } as any);
          }, 800);
        } else if (data.status === "failed") {
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }

          setIsAnalyzing(false);
          Alert.alert("Analysis Failed", "The analysis failed to complete. Please try again.");
        } else if (data.status === "processing") {
          pollingTimeoutRef.current = setTimeout(() => poll(), 2000);
        }
      } catch (err: any) {
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }

        setIsAnalyzing(false);
        Alert.alert("Error", "Failed to check analysis status. Please try again.");
      }
    };

    poll();
  };

  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, []);

  const handleAnalyzeAnsweredSurveys = async () => {
    if (answeredSurveys.length === 0) {
      Alert.alert("No Surveys", "You haven't answered any surveys yet. Answer some surveys to get personal insights!");
      return;
    }

    Alert.alert(
      "Analyze Your Responses",
      `Analyze ${answeredSurveys.length} survey${answeredSurveys.length !== 1 ? "s" : ""} you've answered to get personal insights?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Analyze",
          onPress: async () => {
            setAnalyzingAnswered(true);
            try {
              const surveyIds = answeredSurveys.map((s) => s.surveyId);
              const analysis = await createAnalysis(surveyIds);

              setIsAnalyzing(true);
              pollAnalysisInBackground(analysis.analysisId);
            } catch (err: any) {
              setIsAnalyzing(false);
              Alert.alert("Error", err.response?.data?.message || err.message || "Failed to start analysis. Please try again.");
            } finally {
              setAnalyzingAnswered(false);
            }
          },
        },
      ]
    );
  };

  const handleViewAnalysis = (analysisId: string) => {
    router.push({
      pathname: "/(protected)/(researcher)/analysis-insights",
      params: { analysisId },
    } as any);
  };

  const handleShare = async (analysis: AnalysisResponse) => {
    try {
      const message = `Check out my survey analysis: ${analysis.analysisId}`;
      await Share.share({ message, title: "Survey Analysis" });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const readyAnalyses = analyses.filter((a) => a.status === "ready");
  const processingAnalyses = analyses.filter((a) => a.status === "processing");
  const totalInsights = readyAnalyses.reduce((sum, analysis) => {
    if (analysis.data?.surveys) {
      return sum + analysis.data.surveys.reduce((s, survey) => s + survey.insights.length, 0);
    }
    return sum;
  }, 0);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const contentAnimatedStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const headerAnimatedStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const aiCardAnimatedStyle = useAnimatedStyle(() => ({ opacity: aiCardOpacity.value }));
  const statsAnimatedStyle = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));
  const insightsAnimatedStyle = useAnimatedStyle(() => ({ opacity: insightsOpacity.value }));

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  if (loading) {
    return <SightAISkeleton />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <View style={styles.lightBackground} />
      <Animated.View style={[styles.darkOverlay, overlayAnimatedStyle]} />

      <View style={styles.contentContainer}>
        {/* Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle, { paddingTop: insets.top + Spacing.md }]}>
          <Text style={styles.headerTitle}>AI Analysis</Text>
          <Image source={require("@/assets/sightai.png")} style={styles.sightaiLogo} resizeMode="contain" />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + Spacing.lg }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary.purple} colors={[Colors.primary.purple]} />
          }
        >
          <Animated.View style={contentAnimatedStyle}>
            {/* Hero AI Card */}
            <Animated.View style={[styles.heroCardContainer, aiCardAnimatedStyle]}>
              <LinearGradient
                colors={[Colors.dark.backgroundSecondary, "#1A1A3A", "#2A1A4A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                {/* Subtle grid pattern overlay */}
                <View style={styles.gridPattern} />

                <View style={styles.heroIconContainer}>
                  <LinearGradient colors={[Colors.primary.purple, Colors.accent.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroIconGradient}>
                    <Ionicons name="sparkles" size={28} color={Colors.background.primary} />
                  </LinearGradient>
                </View>

                <Text style={styles.heroTitle}>AI-Powered Intelligence</Text>
                <Text style={styles.heroDescription}>
                  Discover hidden patterns and insights from millions of survey responses with advanced AI analysis.
                </Text>

                <TouchableOpacity style={styles.heroButton} onPress={handleMassAnalyze} activeOpacity={0.9}>
                  <Text style={styles.heroButtonText}>Analyze Mass Data</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.dark.backgroundSecondary} />
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            {/* Stats Row */}
            <Animated.View style={[styles.statsRow, statsAnimatedStyle]}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{readyAnalyses.length}</Text>
                <Text style={styles.statLabel}>Analyses</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: Colors.accent.teal }]}>{processingAnalyses.length}</Text>
                <Text style={styles.statLabel}>Processing</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: Colors.primary.pink }]}>{totalInsights}</Text>
                <Text style={styles.statLabel}>Insights</Text>
              </View>
            </Animated.View>

            {/* Processing Section */}
            {processingAnalyses.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Analyzing Now</Text>
                  <TouchableOpacity onPress={handleMassAnalyze}>
                    <Text style={styles.addLink}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                {processingAnalyses.slice(0, 3).map((analysis) => (
                  <View key={analysis.analysisId} style={styles.processingCard}>
                    <View style={styles.processingCardContent}>
                      <Text style={styles.processingCardTitle}>Analysis {analysis.analysisId.slice(-8)}</Text>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <LinearGradient
                            colors={[Colors.accent.teal, Colors.primary.purple]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressFill, { width: `${analysis.progress || 0}%` }]}
                          />
                        </View>
                        <Text style={styles.progressText}>{analysis.progress || 0}%</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Personal Insights Section */}
            <Animated.View style={[styles.section, insightsAnimatedStyle]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Personal Insights</Text>
                  <Text style={styles.sectionSubtitle}>From your surveys</Text>
                </View>
              </View>

              {answeredSurveys.length > 0 && (
                <TouchableOpacity
                  style={[styles.analyzeButton, analyzingAnswered && styles.analyzeButtonDisabled]}
                  onPress={handleAnalyzeAnsweredSurveys}
                  disabled={analyzingAnswered}
                  activeOpacity={0.9}
                >
                  {analyzingAnswered ? (
                    <ActivityIndicator size="small" color={Colors.background.primary} />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={18} color={Colors.background.primary} />
                      <Text style={styles.analyzeButtonText}>Analyze My Surveys ({answeredSurveys.length})</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {insightCards.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="analytics-outline" size={48} color={Colors.text.tertiary} />
                  <Text style={styles.emptyText}>No insights yet</Text>
                  <Text style={styles.emptySubtext}>Analyze surveys to see insights here</Text>
                </View>
              ) : (
                insightCards.map((card) => (
                  <TouchableOpacity
                    key={card.analysisId}
                    style={styles.insightCard}
                    onPress={() => handleViewAnalysis(card.analysisId)}
                    activeOpacity={0.8}
                  >
                    {/* Left accent border */}
                    <LinearGradient colors={[Colors.accent.cyan, Colors.primary.purple]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.insightCardAccent} />

                    <View style={styles.insightCardContent}>
                      <View style={styles.insightCardHeader}>
                        <View style={styles.insightStatus}>
                          <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.success} />
                          <Text style={styles.insightTime}>{formatTimeAgo(card.createdAt)}</Text>
                        </View>
                      </View>

                      <Text style={styles.insightTitle} numberOfLines={1}>{card.surveyTitle}</Text>
                      <Text style={styles.insightDescription} numberOfLines={2}>{card.insight}</Text>

                      {card.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                          {card.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.viewReportRow}>
                        <Text style={styles.viewReportText}>View Full Report</Text>
                        <Ionicons name="arrow-forward" size={14} color={Colors.accent.sky} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

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
  header: {
    backgroundColor: "transparent",
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h2,
    color: Colors.textDark.primary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  sightaiLogo: {
    height: 39,
    width: 132,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.page.paddingHorizontal,
  },
  heroCardContainer: {
    marginBottom: Spacing.xl,
  },
  heroCard: {
    borderRadius: Spacing.card.borderRadiusLarge,
    padding: Spacing.card.paddingLarge,
    position: "relative",
    overflow: "hidden",
  },
  gridPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.textDark.primary,
  },
  heroIconContainer: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  heroIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h2,
    color: Colors.textDark.primary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  heroDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.textDark.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent.cyan,
    paddingVertical: Spacing.button.paddingVertical,
    borderRadius: Spacing.button.borderRadius,
    gap: Spacing.xs,
  },
  heroButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.dark.backgroundSecondary,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statNumber: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h3,
    color: Colors.primary.purple,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.textDark.tertiary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.h4,
    color: Colors.textDark.primary,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.caption,
    color: Colors.textDark.tertiary,
    marginTop: 2,
  },
  addLink: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.accent.sky,
  },
  processingCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.paddingSmall,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  processingCardContent: {
    flex: 1,
  },
  processingCardTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.textDark.primary,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.textDark.tertiary,
    width: 35,
    textAlign: "right",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.purple,
    paddingVertical: Spacing.button.paddingVertical,
    borderRadius: Spacing.button.borderRadius,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    ...Shadows.glow.purple,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.background.primary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodyLarge,
    color: Colors.textDark.tertiary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.textDark.disabled,
    marginTop: Spacing.xs,
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: Spacing.card.borderRadius,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  insightCardAccent: {
    width: 4,
  },
  insightCardContent: {
    flex: 1,
    padding: Spacing.card.paddingSmall,
  },
  insightCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  insightStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  insightTime: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.textDark.tertiary,
  },
  insightTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodyLarge,
    color: Colors.textDark.primary,
    marginBottom: 4,
  },
  insightDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.textDark.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tag: {
    backgroundColor: `${Colors.primary.purple}20`,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.label,
    color: Colors.primary.purple,
  },
  viewReportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewReportText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.accent.sky,
  },
});
