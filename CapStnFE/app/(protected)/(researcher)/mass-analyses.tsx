import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  getSurveysByCreatorId,
  getPublishedSurveys,
  Survey,
} from "@/api/surveys";
import { getResponsesBySurveyId } from "@/api/responses";
import { createAnalysis } from "@/api/ai";
import { getUser } from "@/api/storage";
import User from "@/types/User";

interface SurveyWithResponses extends Survey {
  responseCount: number;
  isSelected: boolean;
}

type ResponseRangeFilter = "all" | "0" | "1-5" | "6-10" | "11-20" | "21+";
type TimeRangeFilter = "all" | "1-5" | "6-10" | "11-15" | "16-30" | "31+";

export default function MassAnalyses() {
  const router = useRouter();
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading surveys...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadSurveys} style={styles.button}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Mass Analyses</Text>
            <Text style={styles.subtitle}>
              Select surveys to analyze together
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search surveys..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainerWrapper}>
          {/* First Row - Status Filters */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterStatus === "all" && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus("all")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === "all" && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterStatus === "published" && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus("published")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === "published" && styles.filterChipTextActive,
                ]}
              >
                Published
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterStatus === "unpublished" && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus("unpublished")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === "unpublished" && styles.filterChipTextActive,
                ]}
              >
                My Drafts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Second Row - Advanced Filters & Select All */}
          <View style={styles.filterContainer}>
            {/* Advanced Filters Button */}
            <TouchableOpacity
              style={[
                styles.advancedFilterButton,
                (responseRangeFilter !== "all" || timeRangeFilter !== "all") &&
                  styles.advancedFilterButtonActive,
              ]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={
                  responseRangeFilter !== "all" || timeRangeFilter !== "all"
                    ? "#8B5CF6"
                    : "#6B7280"
                }
              />
              <Text
                style={[
                  styles.advancedFilterText,
                  (responseRangeFilter !== "all" ||
                    timeRangeFilter !== "all") &&
                    styles.advancedFilterTextActive,
                ]}
              >
                Filters
              </Text>
            </TouchableOpacity>

            {/* Select/Clear All */}
            <View style={styles.filterDivider} />
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
          </View>
        </View>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <View style={styles.advancedFiltersPanel}>
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
          </View>
        )}

        {/* Survey List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
                        <Ionicons name="people" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>
                          {survey.responseCount} responses
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time" size={14} color="#6B7280" />
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

        {/* Bottom Action Bar */}
        {selectedSurveys.length > 0 && (
          <View style={styles.actionBar}>
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
                  <>
                    <Ionicons name="analytics" size={20} color="#FFFFFF" />
                    <Text style={styles.analyzeButtonText}>
                      Start Analyses ({totalResponses})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  filterContainerWrapper: {
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  selectAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  advancedFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
  },
  advancedFilterButtonActive: {
    backgroundColor: "#F5F3FF",
    borderColor: "#8B5CF6",
  },
  advancedFilterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  advancedFilterTextActive: {
    color: "#8B5CF6",
  },
  advancedFiltersPanel: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
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
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterOptionActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
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
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  surveyCardSelected: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F5F3FF",
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
    borderColor: "#D1D5DB",
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
    color: "#111827",
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusBadgePublished: {
    backgroundColor: "#D1FAE5",
  },
  statusBadgeUnpublished: {
    backgroundColor: "#F3F4F6",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadgeTextPublished: {
    color: "#065F46",
  },
  statusBadgeTextUnpublished: {
    color: "#6B7280",
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
    color: "#6B7280",
  },
  actionBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 16,
    gap: 12,
  },
  selectionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  responseCount: {
    fontSize: 14,
    color: "#6B7280",
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
    borderColor: "#E5E7EB",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  analyzeButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
