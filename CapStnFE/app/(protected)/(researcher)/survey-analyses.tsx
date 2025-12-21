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
import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { getSurveyById, Survey } from "@/api/surveys";
import { getResponsesBySurveyId } from "@/api/responses";
import { createAnalysis, getAllAnalyses, getAnalysisById, AnalysisResponse } from "@/api/ai";
import AnalysisContext from "@/context/AnalysisContext";
import { Colors, Typography, Spacing, Shadows } from "@/constants/design";

export default function SurveyAnalyses() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { surveyId } = useLocalSearchParams<{ surveyId: string }>();
  const { setIsAnalyzing, triggerCompletion } = useContext(AnalysisContext);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisResponse[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dark mode transition animations
  const overlayOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const listOpacity = useSharedValue(0);

  const entranceEasing = Easing.bezier(0.25, 0.1, 0.25, 1);
  const exitEasing = Easing.bezier(0.4, 0.0, 0.2, 1);

  useEffect(() => {
    overlayOpacity.value = 0;
    contentOpacity.value = 0;
    headerOpacity.value = 0;
    statsOpacity.value = 0;
    buttonOpacity.value = 0;
    listOpacity.value = 0;
  }, []);

  useFocusEffect(
    useCallback(() => {
      overlayOpacity.value = withTiming(1, { duration: 1000, easing: entranceEasing });
      contentOpacity.value = withDelay(150, withTiming(1, { duration: 800, easing: entranceEasing }));
      headerOpacity.value = withDelay(150, withTiming(1, { duration: 800, easing: entranceEasing }));
      statsOpacity.value = withDelay(270, withTiming(1, { duration: 800, easing: entranceEasing }));
      buttonOpacity.value = withDelay(390, withTiming(1, { duration: 800, easing: entranceEasing }));
      listOpacity.value = withDelay(510, withTiming(1, { duration: 800, easing: entranceEasing }));

      if (surveyId) {
        loadData();
      }

      return () => {
        const exitDuration = 600;
        overlayOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
        contentOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
        headerOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
        statsOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
        buttonOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
        listOpacity.value = withTiming(0, { duration: exitDuration, easing: exitEasing });
      };
    }, [surveyId])
  );

  const overlayAnimatedStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const contentAnimatedStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const headerAnimatedStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const statsAnimatedStyle = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));
  const buttonAnimatedStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));
  const listAnimatedStyle = useAnimatedStyle(() => ({ opacity: listOpacity.value }));

  const loadData = async () => {
    if (!surveyId) return;

    setLoading(true);
    setError(null);
    try {
      const [surveyData, responses, allAnalyses] = await Promise.all([
        getSurveyById(surveyId),
        getResponsesBySurveyId(surveyId),
        getAllAnalyses(),
      ]);

      setSurvey(surveyData);
      setResponseCount(responses.length);

      const surveyAnalyses = allAnalyses.analyses.filter((analysis) => {
        if (analysis.type !== "single") return false;
        if (!analysis.data?.surveys || !Array.isArray(analysis.data.surveys)) return false;
        return analysis.data.surveys.some((s) => s.surveyId === surveyId);
      });

      setAnalyses(surveyAnalyses);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("Authentication expired - redirecting to login");
        return;
      }
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
        console.error("Error polling analysis:", err);

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
      `Analyze "${survey.title}" with ${responseCount} response${responseCount !== 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Analyze",
          onPress: async () => {
            setCreating(true);
            try {
              const analysis = await createAnalysis(surveyId);
              setIsAnalyzing(true);
              pollAnalysisInBackground(analysis.analysisId);
            } catch (err: any) {
              console.error("Error creating analysis:", err);
              setIsAnalyzing(false);
              Alert.alert(
                "Error",
                err.response?.data?.message || err.message || "Failed to start analysis. Please try again."
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
        params: { analysisId: analysis.analysisId },
      } as any);
    } else if (analysis.status === "processing") {
      router.push({
        pathname: "/(protected)/(researcher)/analysis-loading",
        params: { analysisId: analysis.analysisId, type: analysis.type },
      } as any);
    } else {
      Alert.alert("Analysis Failed", "This analysis failed to complete.", [{ text: "OK" }]);
    }
  };

  const getStatusColor = (status: AnalysisResponse["status"]) => {
    switch (status) {
      case "ready":
        return Colors.semantic.success;
      case "processing":
        return Colors.semantic.warning;
      case "failed":
        return Colors.semantic.error;
      default:
        return Colors.textDark.tertiary;
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
    return (
      <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
        <View style={styles.lightBackground} />
        <View style={[styles.darkOverlay, { opacity: 1 }]} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.purple} />
          <Text style={styles.loadingText}>Loading analyses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !survey) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
        <View style={styles.lightBackground} />
        <View style={[styles.darkOverlay, { opacity: 1 }]} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.semantic.error} />
          <Text style={styles.errorText}>{error || "Survey not found"}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <View style={styles.lightBackground} />
      <Animated.View style={[styles.darkOverlay, overlayAnimatedStyle]} />

      <View style={styles.contentContainer}>
        {/* Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.textDark.primary} />
            </TouchableOpacity>
            <Image source={require("@/assets/sightai.png")} style={styles.sightaiLogo} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>Survey Analysis</Text>
          <Text style={styles.headerSubtitle} numberOfLines={2}>{survey.title}</Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary.purple}
              colors={[Colors.primary.purple]}
            />
          }
        >
          <Animated.View style={contentAnimatedStyle}>
            {/* Stats Cards */}
            <Animated.View style={[styles.statsRow, statsAnimatedStyle]}>
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={24} color={Colors.accent.cyan} />
                <Text style={styles.statNumber}>{responseCount}</Text>
                <Text style={styles.statLabel}>Responses</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="analytics-outline" size={24} color={Colors.primary.purple} />
                <Text style={[styles.statNumber, { color: Colors.primary.purple }]}>{analyses.length}</Text>
                <Text style={styles.statLabel}>Analyses</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle-outline" size={24} color={Colors.semantic.success} />
                <Text style={[styles.statNumber, { color: Colors.semantic.success }]}>
                  {analyses.filter((a) => a.status === "ready").length}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </Animated.View>

            {/* Analyze Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                style={[styles.analyzeButton, (creating || responseCount === 0) && styles.analyzeButtonDisabled]}
                onPress={handleCreateAnalysis}
                disabled={creating || responseCount === 0}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[Colors.primary.purple, Colors.primary.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.analyzeButtonGradient}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color={Colors.background.primary} />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={22} color={Colors.background.primary} />
                      <Text style={styles.analyzeButtonText}>
                        {responseCount === 0 ? "No Responses to Analyze" : "Start New Analysis"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Previous Analyses Section */}
            <Animated.View style={[styles.section, listAnimatedStyle]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Previous Analyses</Text>
                <Text style={styles.sectionCount}>{analyses.length}</Text>
              </View>

              {analyses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="analytics-outline" size={48} color={Colors.textDark.tertiary} />
                  <Text style={styles.emptyText}>No analyses yet</Text>
                  <Text style={styles.emptySubtext}>Create your first analysis to get AI-powered insights</Text>
                </View>
              ) : (
                analyses.map((analysis) => (
                  <TouchableOpacity
                    key={analysis.analysisId}
                    style={styles.analysisCard}
                    onPress={() => handleViewAnalysis(analysis)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[getStatusColor(analysis.status), Colors.primary.purple]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.analysisCardAccent}
                    />

                    <View style={styles.analysisCardContent}>
                      <View style={styles.analysisHeader}>
                        <View style={styles.analysisStatus}>
                          <Ionicons
                            name={getStatusIcon(analysis.status) as any}
                            size={18}
                            color={getStatusColor(analysis.status)}
                          />
                          <Text style={[styles.statusText, { color: getStatusColor(analysis.status) }]}>
                            {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                          </Text>
                        </View>
                        <Text style={styles.analysisTime}>{formatTimeAgo(analysis.createdAt || "")}</Text>
                      </View>

                      {analysis.status === "processing" && (
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
                      )}

                      {analysis.status === "ready" && analysis.data?.overview && (
                        <Text style={styles.analysisPreview} numberOfLines={2}>
                          {analysis.data.overview}
                        </Text>
                      )}

                      <View style={styles.viewReportRow}>
                        <Text style={styles.viewReportText}>
                          {analysis.status === "ready" ? "View Full Report" : "View Status"}
                        </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    zIndex: 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.textDark.secondary,
  },
  errorText: {
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.semantic.error,
    textAlign: "center",
  },
  errorButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.button.paddingVerticalSmall,
    paddingHorizontal: Spacing.button.paddingHorizontal,
    backgroundColor: Colors.primary.purple,
    borderRadius: Spacing.button.borderRadius,
  },
  errorButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.background.primary,
  },
  header: {
    backgroundColor: "transparent",
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  sightaiLogo: {
    height: 39,
    width: 132,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h2,
    color: Colors.textDark.primary,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.textDark.secondary,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.huge,
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
    color: Colors.accent.cyan,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.textDark.tertiary,
  },
  analyzeButton: {
    marginBottom: Spacing.xl,
    borderRadius: Spacing.button.borderRadius,
    overflow: "hidden",
    ...Shadows.glow.purple,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.button.paddingVertical,
    gap: Spacing.sm,
  },
  analyzeButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodyLarge,
    color: Colors.background.primary,
  },
  section: {
    marginBottom: Spacing.xl,
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
    color: Colors.textDark.primary,
  },
  sectionCount: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.caption,
    color: Colors.textDark.tertiary,
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Spacing.button.borderRadiusPill,
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
    textAlign: "center",
  },
  analysisCard: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: Spacing.card.borderRadius,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  analysisCardAccent: {
    width: 4,
  },
  analysisCardContent: {
    flex: 1,
    padding: Spacing.card.paddingSmall,
  },
  analysisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  analysisStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
  },
  analysisTime: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.textDark.tertiary,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
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
  analysisPreview: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.textDark.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  viewReportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.xs,
  },
  viewReportText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.accent.sky,
  },
});
