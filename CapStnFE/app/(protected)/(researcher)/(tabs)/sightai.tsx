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
import React, { useEffect, useState, useCallback, useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { createAnalysis } from "@/api/ai";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import AnalysisContext from "@/context/AnalysisContext";

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
  const { setIsAnalyzing } = useContext(AnalysisContext);
  const [analyses, setAnalyses] = useState<AnalysisResponse[]>([]);
  const [answeredSurveys, setAnsweredSurveys] = useState<SurveyWithTitle[]>([]);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzingAnswered, setAnalyzingAnswered] = useState(false);
  
  // New fade overlay system for dark mode transition
  const overlayOpacity = useSharedValue(0); // Dark overlay that fades in
  
  // Content opacity animations (opacity only, no transforms)
  const contentOpacity = useSharedValue(0);
  
  // Staggered section animations (opacity only)
  const headerOpacity = useSharedValue(0);
  const aiCardOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const insightsOpacity = useSharedValue(0);

  // Ultra-smooth easing curves for fluid transitions
  const entranceEasing = Easing.bezier(0.25, 0.1, 0.25, 1); // Smooth ease-in-out
  const exitEasing = Easing.bezier(0.4, 0.0, 0.2, 1); // Smooth ease-out

  // Initialize all animations to hidden state immediately on mount
  // This prevents the sudden pop when content is already loaded
  useEffect(() => {
    overlayOpacity.value = 0;
    contentOpacity.value = 0;
    headerOpacity.value = 0;
    aiCardOpacity.value = 0;
    statsOpacity.value = 0;
    insightsOpacity.value = 0;
  }, []);

  // Detect when page is focused for fade overlay transition
  useFocusEffect(
    useCallback(() => {
      // Dark overlay fades in first (1000ms duration for smooth transition)
      overlayOpacity.value = withTiming(1, {
        duration: 1000,
        easing: entranceEasing,
      });

      // Content fades in after overlay starts (150ms delay, 800ms duration)
      contentOpacity.value = withDelay(150, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      // Header starts with content
      headerOpacity.value = withDelay(150, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      // Staggered section animations with longer delays for smoother cascade
      // AI Card: 120ms delay after header
      aiCardOpacity.value = withDelay(270, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      // Stats: 240ms delay after header
      statsOpacity.value = withDelay(390, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      // Insights: 360ms delay after header
      insightsOpacity.value = withDelay(510, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      // Load data when page is focused
      loadData();

      return () => {
        // Coordinated exit animations when navigating away (slower for smoothness)
        const exitDuration = 600;
        
        // Fade out overlay and content together
        overlayOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        
        contentOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        
        // Fade out all sections simultaneously
        headerOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        
        aiCardOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        
        statsOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        
        insightsOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
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
    } catch (error) {
      console.error("Error loading analyses:", error);
    }
  };

  const loadAnsweredSurveys = async () => {
    try {
      const user = await getUser();
      if (user?._id) {
        const responses = await getResponsesByUserId(user._id);
        // Get unique survey IDs
        const uniqueSurveyIds = Array.from(
          new Set(responses.map((r) => r.surveyId))
        );

        // Fetch survey titles
        const surveysWithTitles = await Promise.all(
          uniqueSurveyIds.map(async (surveyId) => {
            try {
              const survey = await getSurveyById(surveyId);
              return { surveyId, title: survey.title };
            } catch (error) {
              console.error(`Error fetching survey ${surveyId}:`, error);
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
        if (!analysis.data?.surveys || analysis.data.surveys.length === 0) {
          continue;
        }

        // Get first survey for display
        const firstSurvey = analysis.data.surveys[0];
        const firstInsight = firstSurvey.insights[0];

        // Fetch actual survey title
        let surveyTitle = "Survey Analysis";
        try {
          const survey = await getSurveyById(firstSurvey.surveyId);
          surveyTitle = survey.title;
        } catch (error) {
          console.error(`Error fetching survey title:`, error);
        }

        // Collect all tags from insights
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

  const handleAnalyzeAnsweredSurveys = async () => {
    if (answeredSurveys.length === 0) {
      Alert.alert(
        "No Surveys",
        "You haven't answered any surveys yet. Answer some surveys to get personal insights!"
      );
      return;
    }

    Alert.alert(
      "Analyze Your Responses",
      `Analyze ${answeredSurveys.length} survey${
        answeredSurveys.length !== 1 ? "s" : ""
      } you've answered to get personal insights?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Analyze",
          onPress: async () => {
            setAnalyzingAnswered(true);
            try {
              const surveyIds = answeredSurveys.map((s) => s.surveyId);
              const analysis = await createAnalysis(surveyIds);
              
              // Set analyzing state to trigger jelly effect
              setIsAnalyzing(true);

              router.push({
                pathname: "/(protected)/(researcher)/analysis-loading",
                params: {
                  analysisId: analysis.analysisId,
                  type: "multi",
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
      await Share.share({
        message,
        title: "Survey Analysis",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Calculate statistics
  const readyAnalyses = analyses.filter((a) => a.status === "ready");
  const processingAnalyses = analyses.filter((a) => a.status === "processing");
  const totalInsights = readyAnalyses.reduce((sum, analysis) => {
    if (analysis.data?.surveys) {
      return sum + analysis.data.surveys.reduce((s, survey) => s + survey.insights.length, 0);
    }
    return sum;
  }, 0);


  // Animated styles - fade overlay system
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // Section animated styles (opacity only)
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const aiCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: aiCardOpacity.value,
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const insightsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: insightsOpacity.value,
  }));

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Light background (visible when overlay is transparent) */}
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
            <Text style={styles.subtitle}>AI-powered insights and analysis</Text>
          </View>
        </Animated.View>
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavHeight + 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8B5CF6"
              colors={["#8B5CF6"]}
            />
          }
        >
          <Animated.View style={contentAnimatedStyle}>

            {/* AI-Powered Intelligence Card */}
            <Animated.View style={[styles.aiCardContainer, aiCardAnimatedStyle]}>
              <LinearGradient
                colors={["#1E1E3F", "#2D1B4E", "#3D1F5E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiCard}
              >
                <View style={styles.aiIconContainer}>
                  <View style={styles.aiIconCircle}>
                    <Ionicons name="sparkles" size={32} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.aiCardTitle}>AI-Powered Intelligence</Text>
                <Text style={styles.aiCardDescription}>
                  Discover hidden patterns to uncover millions of survey responses.
                </Text>
                <TouchableOpacity
                  style={styles.massAnalyzeButton}
                  onPress={handleMassAnalyze}
                >
                  <LinearGradient
                    colors={["#8B5CF6", "#5FA9F5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.massAnalyzeButtonGradient}
                  >
                    <Text style={styles.massAnalyzeButtonText}>
                      Analyze Mass Data
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            {/* Summary Statistics */}
            <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{readyAnalyses.length}</Text>
                <Text style={styles.statLabel}>Surveys</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{processingAnalyses.length}</Text>
                <Text style={styles.statLabel}>Analyzing</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{totalInsights}</Text>
                <Text style={styles.statLabel}>Insights</Text>
              </View>
            </Animated.View>

            {/* Analyzing Now Section */}
            {processingAnalyses.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Analyzing Now</Text>
                  <TouchableOpacity onPress={handleMassAnalyze}>
                    <Text style={styles.addLink}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                {processingAnalyses.slice(0, 3).map((analysis) => (
                  <View key={analysis.analysisId} style={styles.analyzingCard}>
                    <View style={styles.analyzingCardContent}>
                      <Text style={styles.analyzingCardTitle}>
                        Analysis {analysis.analysisId.slice(-8)}
                      </Text>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${analysis.progress || 0}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {analysis.progress || 0}% completed
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleShare(analysis)}
                      style={styles.shareButton}
                    >
                      <Ionicons name="share-outline" size={20} color="#8B5CF6" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Personal Insights Section */}
            <Animated.View style={[styles.section, insightsAnimatedStyle]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Personal Insights</Text>
                <Text style={styles.sectionSubtitle}>from your surveys</Text>
              </View>

              {/* Button to analyze answered surveys */}
              {answeredSurveys.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.analyzeAnsweredButton,
                    analyzingAnswered && styles.analyzeAnsweredButtonDisabled,
                  ]}
                  onPress={handleAnalyzeAnsweredSurveys}
                  disabled={analyzingAnswered}
                >
                  {analyzingAnswered ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                      <Text style={styles.analyzeAnsweredButtonText}>
                        Analyze My Answered Surveys ({answeredSurveys.length})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {insightCards.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="analytics-outline" size={48} color="#6B7280" />
                  <Text style={styles.emptyText}>No insights yet</Text>
                  <Text style={styles.emptySubtext}>
                    Analyze surveys to see insights here
                  </Text>
                </View>
              ) : (
                insightCards.map((card) => (
                  <View key={card.analysisId} style={styles.insightCard}>
                    <View style={styles.insightCardHeader}>
                      <View style={styles.insightCardHeaderLeft}>
                        <View style={styles.insightIcon}>
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        </View>
                        <Text style={styles.insightTime}>
                          {formatTimeAgo(card.createdAt)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleShare(analyses.find((a) => a.analysisId === card.analysisId)!)}
                        style={styles.shareButton}
                      >
                        <Ionicons name="share-outline" size={20} color="#8B5CF6" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.insightTitle}>
                      {card.surveyTitle}
                    </Text>
                    <Text style={styles.insightDescription} numberOfLines={3}>
                      {card.insight}
                    </Text>
                    {card.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {card.tags.slice(0, 3).map((tag, index) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.viewReportButton}
                      onPress={() => handleViewAnalysis(card.analysisId)}
                    >
                      <Text style={styles.viewReportButtonText}>
                        View Full Report →
                      </Text>
                    </TouchableOpacity>
                  </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F1E",
  },
  scrollView: {
    flex: 1,
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
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
  },
  aiCardContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  aiCard: {
    borderRadius: 20,
    padding: 24,
    minHeight: 200,
  },
  aiIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  aiIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiCardTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  aiCardDescription: {
    fontSize: 16,
    color: "#CCCCCC",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  massAnalyzeButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  massAnalyzeButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  massAnalyzeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1E1E2E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B5CF6",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
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
    color: "#FFFFFF",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  addLink: {
    fontSize: 14,
    color: "#5FA9F5",
    fontWeight: "600",
  },
  analyzingCard: {
    backgroundColor: "#1E1E2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  analyzingCardContent: {
    flex: 1,
  },
  analyzingCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#2D2D3E",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#5FA9F5",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  shareButton: {
    padding: 8,
  },
  analyzeAnsweredButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  analyzeAnsweredButtonDisabled: {
    opacity: 0.6,
  },
  analyzeAnsweredButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
  },
  insightCard: {
    backgroundColor: "#1E1E2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  insightCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insightIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  insightTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: "#CCCCCC",
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  viewReportButton: {
    marginTop: 8,
  },
  viewReportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5FA9F5",
  },
});
