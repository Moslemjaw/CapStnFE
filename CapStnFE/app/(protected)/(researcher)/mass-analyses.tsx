import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from "react-native";
import React, { useEffect, useState, useMemo, useContext, useRef, useCallback } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import {
  getSurveysByCreatorId,
  getPublishedSurveys,
  Survey,
} from "@/api/surveys";
import { getResponsesBySurveyId } from "@/api/responses";
import { createAnalysis, getAnalysisById } from "@/api/ai";
import { getUser } from "@/api/storage";
import User from "@/types/User";
import { SurveyListSkeleton } from "@/components/Skeleton";
import AnalysisContext from "@/context/AnalysisContext";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

interface SurveyWithResponses extends Survey {
  responseCount: number;
  isSelected: boolean;
}

type ResponseRangeFilter = "all" | "0" | "1-5" | "6-10" | "11-20" | "21+";
type TimeRangeFilter = "all" | "1-5" | "6-10" | "11-15" | "16-30" | "31+";

export default function MassAnalyses() {
  const router = useRouter();
  const bottomNavHeight = useBottomNavHeight();
  const insets = useSafeAreaInsets();
  const { setIsAnalyzing, triggerCompletion } = useContext(AnalysisContext);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [surveys, setSurveys] = useState<SurveyWithResponses[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "published" | "unpublished"
  >("all");
  const [responseRangeFilter, setResponseRangeFilter] =
    useState<ResponseRangeFilter>("all");
  const [timeRangeFilter, setTimeRangeFilter] =
    useState<TimeRangeFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dark overlay system for fade-in transition
  const overlayOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const searchOpacity = useSharedValue(0);
  const filtersOpacity = useSharedValue(0);
  const listOpacity = useSharedValue(0);

  // Ultra-smooth easing curves
  const entranceEasing = Easing.bezier(0.25, 0.1, 0.25, 1);
  const exitEasing = Easing.bezier(0.4, 0.0, 0.2, 1);

  // Initialize animations to hidden state
  useEffect(() => {
    overlayOpacity.value = 0;
    contentOpacity.value = 0;
    headerOpacity.value = 0;
    searchOpacity.value = 0;
    filtersOpacity.value = 0;
    listOpacity.value = 0;
  }, []);

  // Fade-in animations when page is focused
  useFocusEffect(
    useCallback(() => {
      // Dark overlay fades in first
      overlayOpacity.value = withTiming(1, {
        duration: 1000,
        easing: entranceEasing,
      });

      // Content fades in after overlay starts
      contentOpacity.value = withDelay(150, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      // Staggered section animations
      headerOpacity.value = withDelay(150, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      searchOpacity.value = withDelay(270, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      filtersOpacity.value = withDelay(390, withTiming(1, {
        duration: 800,
        easing: entranceEasing,
      }));

      listOpacity.value = withDelay(510, withTiming(1, {
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
        searchOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        filtersOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
        listOpacity.value = withTiming(0, {
          duration: exitDuration,
          easing: exitEasing,
        });
      };
    }, [])
  );

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

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
  }));

  const filtersAnimatedStyle = useAnimatedStyle(() => ({
    opacity: filtersOpacity.value,
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
  }));

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadSurveys();
    }
  }, [user]);

  const loadUser = async () => {
    const userData = await getUser();
    setUser(userData);
  };

  const loadSurveys = async () => {
    if (!user?._id) return;

    setLoading(true);
    setError(null);
    try {
      // Get user's own surveys
      const userSurveys = await getSurveysByCreatorId(user._id);

      // Get all published surveys (including other users')
      const publishedSurveys = await getPublishedSurveys();

      // Combine: user's unpublished + all published (excluding duplicates)
      const allRelevantSurveys = [
        ...userSurveys.filter((s) => s.draft === "unpublished"), // User's unpublished
        ...publishedSurveys, // All published surveys
      ];

      // Remove duplicates based on _id
      const uniqueSurveys = allRelevantSurveys.filter(
        (survey, index, self) =>
          index === self.findIndex((s) => s._id === survey._id)
      );

      // Fetch response counts
      const surveysWithCounts = await Promise.all(
        uniqueSurveys.map(async (survey) => {
          try {
            const responses = await getResponsesBySurveyId(survey._id);
            return {
              ...survey,
              responseCount: responses.length,
              isSelected: false,
            };
          } catch (err) {
            console.error(
              `Error fetching responses for survey ${survey._id}:`,
              err
            );
            return {
              ...survey,
              responseCount: 0,
              isSelected: false,
            };
          }
        })
      );

      setSurveys(surveysWithCounts);
    } catch (err: any) {
      console.error("Error loading surveys:", err);
      setError(err.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  const toggleSurvey = (surveyId: string) => {
    setSurveys((prev) =>
      prev.map((survey) =>
        survey._id === surveyId
          ? { ...survey, isSelected: !survey.isSelected }
          : survey
      )
    );
  };

  const selectAll = () => {
    const filtered = filteredSurveys;
    const allSelected = filtered.every((s) => s.isSelected);

    setSurveys((prev) =>
      prev.map((survey) => {
        const isInFiltered = filtered.some((f) => f._id === survey._id);
        return isInFiltered ? { ...survey, isSelected: !allSelected } : survey;
      })
    );
  };

  const clearSelection = () => {
    setSurveys((prev) =>
      prev.map((survey) => ({ ...survey, isSelected: false }))
    );
  };

  const filteredSurveys = useMemo(() => {
    let filtered = [...surveys];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((survey) =>
        survey.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((survey) => survey.draft === filterStatus);
    }

    // Apply response range filter
    if (responseRangeFilter !== "all") {
      filtered = filtered.filter((survey) => {
        const count = survey.responseCount;
        switch (responseRangeFilter) {
          case "0":
            return count === 0;
          case "1-5":
            return count >= 1 && count <= 5;
          case "6-10":
            return count >= 6 && count <= 10;
          case "11-20":
            return count >= 11 && count <= 20;
          case "21+":
            return count >= 21;
          default:
            return true;
        }
      });
    }

    // Apply time range filter
    if (timeRangeFilter !== "all") {
      filtered = filtered.filter((survey) => {
        const time = survey.estimatedMinutes;
        switch (timeRangeFilter) {
          case "1-5":
            return time >= 1 && time <= 5;
          case "6-10":
            return time >= 6 && time <= 10;
          case "11-15":
            return time >= 11 && time <= 15;
          case "16-30":
            return time >= 16 && time <= 30;
          case "31+":
            return time >= 31;
          default:
            return true;
        }
      });
    }

    // Sort by response count
    return filtered.sort((a, b) => b.responseCount - a.responseCount);
  }, [
    surveys,
    searchQuery,
    filterStatus,
    responseRangeFilter,
    timeRangeFilter,
  ]);

  const selectedSurveys = surveys.filter((s) => s.isSelected);
  const totalResponses = selectedSurveys.reduce(
    (sum, s) => sum + s.responseCount,
    0
  );

  const handleStartAnalysis = async () => {
    if (selectedSurveys.length === 0) {
      Alert.alert(
        "No Surveys Selected",
        "Please select at least one survey to analyze."
      );
      return;
    }

    if (totalResponses === 0) {
      Alert.alert(
        "No Responses",
        "The selected surveys have no responses yet. Please wait for users to answer before analyzing."
      );
      return;
    }

    Alert.alert(
      "Start Mass Analysis",
      `Analyze ${selectedSurveys.length} survey${
        selectedSurveys.length !== 1 ? "s" : ""
      } with ${totalResponses} total response${
        totalResponses !== 1 ? "s" : ""
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
              const surveyIds = selectedSurveys.map((s) => s._id);
              const analysis = await createAnalysis(surveyIds);
              
              // Set analyzing state to trigger jelly effect
              setIsAnalyzing(true);

              // Navigate to loading screen
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
              setCreating(false);
            }
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.lightBackground} />
        <Animated.View style={[styles.darkOverlay, overlayAnimatedStyle]} />
        <View style={styles.contentContainer}>
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadSurveys} style={styles.button}>
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return <SurveyListSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Light background (visible when overlay is transparent) */}
      <View style={styles.lightBackground} />
      
      {/* Dark overlay that fades in */}
      <Animated.View style={[styles.darkOverlay, overlayAnimatedStyle]} />
      
      {/* Content container */}
      <View style={styles.contentContainer}>
        {/* Fixed Header Section */}
        <Animated.View style={[styles.fixedHeader, headerAnimatedStyle]}>
          <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
            <Text style={styles.headerTitle}>Mass Analyses</Text>
            <View style={styles.logoContainer}>
              <Image source={require("@/assets/sightai.png")} style={styles.titleImage} resizeMode="contain" />
            </View>
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.content, contentAnimatedStyle]}>

          {/* Search Bar */}
          <Animated.View style={searchAnimatedStyle}>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search surveys..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#6B7280"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Filters Section */}
          <Animated.View style={[styles.filtersSection, filtersAnimatedStyle]}>
            <View style={styles.filtersRow}>
              {/* Status Filter */}
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterStatus !== "all" && styles.filterButtonActive,
                ]}
                onPress={() => {
                  const statuses: ("all" | "published" | "unpublished")[] = ["all", "published", "unpublished"];
                  const currentIndex = statuses.indexOf(filterStatus);
                  const nextIndex = (currentIndex + 1) % statuses.length;
                  setFilterStatus(statuses[nextIndex]);
                }}
              >
                <View style={styles.filterButtonContent}>
                  <Ionicons
                    name={
                      filterStatus === "published"
                        ? "checkmark-circle-outline"
                        : filterStatus === "unpublished"
                        ? "document-outline"
                        : "filter-outline"
                    }
                    size={16}
                    color={filterStatus !== "all" ? "#8B5CF6" : "#9CA3AF"}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterStatus !== "all" && styles.filterButtonTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {filterStatus === "all"
                      ? "All Status"
                      : filterStatus === "published"
                      ? "Published"
                      : "My Drafts"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={filterStatus !== "all" ? "#8B5CF6" : "#9CA3AF"}
                />
              </TouchableOpacity>

              {/* Response Range Filter */}
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  responseRangeFilter !== "all" && styles.filterButtonActive,
                ]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <View style={styles.filterButtonContent}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={responseRangeFilter !== "all" ? "#5FA9F5" : "#9CA3AF"}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      responseRangeFilter !== "all" && styles.filterButtonTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {responseRangeFilter === "all"
                      ? "All Responses"
                      : `${responseRangeFilter} responses`}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={responseRangeFilter !== "all" ? "#5FA9F5" : "#9CA3AF"}
                />
              </TouchableOpacity>

              {/* Time Range Filter */}
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  timeRangeFilter !== "all" && styles.filterButtonActive,
                ]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <View style={styles.filterButtonContent}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={timeRangeFilter !== "all" ? "#8A4DE8" : "#9CA3AF"}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      timeRangeFilter !== "all" && styles.filterButtonTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {timeRangeFilter === "all"
                      ? "All Time"
                      : `${timeRangeFilter} min`}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={timeRangeFilter !== "all" ? "#8A4DE8" : "#9CA3AF"}
                />
              </TouchableOpacity>
            </View>

            {/* Select All Button */}
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={selectAll}
            >
              <Text style={styles.selectAllText}>
                {filteredSurveys.every((s) => s.isSelected)
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Animated.View style={[styles.advancedFiltersPanel, filtersAnimatedStyle]}>
            {/* Response Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Response Range</Text>
              <View style={styles.filterOptionsRow}>
                {(
                  [
                    "all",
                    "0",
                    "1-5",
                    "6-10",
                    "11-20",
                    "21+",
                  ] as ResponseRangeFilter[]
                ).map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.filterOption,
                      responseRangeFilter === range &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => setResponseRangeFilter(range)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        responseRangeFilter === range &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {range === "all" ? "All" : range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Estimated Time Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                Estimated Time (min)
              </Text>
              <View style={styles.filterOptionsRow}>
                {(
                  [
                    "all",
                    "1-5",
                    "6-10",
                    "11-15",
                    "16-30",
                    "31+",
                  ] as TimeRangeFilter[]
                ).map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.filterOption,
                      timeRangeFilter === range && styles.filterOptionActive,
                    ]}
                    onPress={() => setTimeRangeFilter(range)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        timeRangeFilter === range &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {range === "all" ? "All" : range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Clear Filters Button */}
            {(responseRangeFilter !== "all" || timeRangeFilter !== "all") && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setResponseRangeFilter("all");
                  setTimeRangeFilter("all");
                }}
              >
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={styles.clearFiltersText}>
                  Clear Advanced Filters
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

          {/* Survey List */}
          <Animated.View style={[styles.scrollViewContainer, listAnimatedStyle]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + 16 }]}
              showsVerticalScrollIndicator={false}
            >
          {filteredSurveys.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#9CA3AF"
              />
              <Text style={styles.emptyText}>No surveys found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first survey to get started"}
              </Text>
            </View>
          ) : (
            filteredSurveys.map((survey) => (
              <TouchableOpacity
                key={survey._id}
                style={[
                  styles.surveyCard,
                  survey.isSelected && styles.surveyCardSelected,
                ]}
                onPress={() => toggleSurvey(survey._id)}
                activeOpacity={0.7}
              >
                <View style={styles.surveyCardContent}>
                  <View
                    style={[
                      styles.checkbox,
                      survey.isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {survey.isSelected && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </View>

                  <View style={styles.surveyInfo}>
                    <View style={styles.surveyTitleRow}>
                      <Text style={styles.surveyTitle} numberOfLines={1}>
                        {survey.title}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          survey.draft === "published"
                            ? styles.statusBadgePublished
                            : styles.statusBadgeUnpublished,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            survey.draft === "published"
                              ? styles.statusBadgeTextPublished
                              : styles.statusBadgeTextUnpublished,
                          ]}
                        >
                          {survey.draft === "published" ? "Active" : "Draft"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.surveyMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="people" size={14} color="#9CA3AF" />
                        <Text style={styles.metaText}>
                          {survey.responseCount} responses
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time" size={14} color="#9CA3AF" />
                        <Text style={styles.metaText}>
                          {survey.estimatedMinutes} min
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
            </ScrollView>
          </Animated.View>

          {/* Bottom Action Bar */}
          {selectedSurveys.length > 0 && (
            <View style={[styles.actionBar, { bottom: bottomNavHeight }]}>
              <View style={styles.selectionInfo}>
                <Text style={styles.selectionCount}>
                  {selectedSurveys.length} survey
                  {selectedSurveys.length !== 1 ? "s" : ""}
                </Text>
                <Text style={styles.responseCount}>
                  {totalResponses} total response{totalResponses !== 1 ? "s" : ""}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearSelection}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.analyzeButton,
                    creating && styles.analyzeButtonDisabled,
                  ]}
                  onPress={handleStartAnalysis}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <LinearGradient
                      colors={["#8B5CF6", "#5FA9F5"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.analyzeButtonGradient}
                    >
                      <Ionicons name="analytics" size={20} color="#FFFFFF" />
                      <Text style={styles.analyzeButtonText}>
                        Start Analyses ({totalResponses})
                      </Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
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
  content: {
    flex: 1,
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleImage: {
    height: 32,
    width: 106,
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E2E",
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2D2D3E",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
  },
  filtersSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E1E2E",
    borderWidth: 1,
    borderColor: "#2D2D3E",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    minHeight: 40,
  },
  filterButtonActive: {
    borderColor: "#8B5CF6",
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
  filterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    textAlign: "left",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  selectAllButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5FA9F5",
  },
  advancedFiltersPanel: {
    backgroundColor: "#1E1E2E",
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2D2D3E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  filterOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#2D2D3E",
    borderWidth: 1,
    borderColor: "#3D3D4E",
  },
  filterOptionActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  filterOptionTextActive: {
    color: "#FFFFFF",
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
    marginTop: 8,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
  },
  scrollViewContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  surveyCard: {
    backgroundColor: "#1E1E2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  surveyCardSelected: {
    borderColor: "#8B5CF6",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
  },
  surveyCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2D2D3E",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  surveyInfo: {
    flex: 1,
  },
  surveyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  surveyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusBadgePublished: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  statusBadgeUnpublished: {
    backgroundColor: "#2D2D3E",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadgeTextPublished: {
    color: "#10B981",
  },
  statusBadgeTextUnpublished: {
    color: "#9CA3AF",
  },
  surveyMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1E1E2E",
    borderTopWidth: 1,
    borderTopColor: "#2D2D3E",
    padding: 16,
    gap: 12,
    zIndex: 10,
    elevation: 10,
  },
  selectionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  responseCount: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2D2D3E",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  analyzeButton: {
    flex: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
