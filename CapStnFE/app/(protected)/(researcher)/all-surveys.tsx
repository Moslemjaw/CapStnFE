import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  Pressable,
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
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  return `${Math.floor(diffMonths / 12)} year${Math.floor(diffMonths / 12) !== 1 ? "s" : ""} ago`;
};

// Utility function to format response count
const formatResponseCount = (count: number): string => {
  if (count < 1000) return count.toString();
  const k = (count / 1000).toFixed(1);
  return `${k}K`;
};

type StatusFilter = "all" | "published" | "archived";
type ResponseFilter = "all" | "0" | "1-10" | "11-50" | "51-100" | "100+";
type SortOption = "newest" | "oldest" | "most-responses" | "least-responses";

export default function AllSurveys() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const [user, setUser] = useState<User | null>(null);
  const [surveys, setSurveys] = useState<SurveyWithMetadata[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showResponseDropdown, setShowResponseDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper functions for filter labels
  const getStatusLabel = (filter: StatusFilter): string => {
    switch (filter) {
      case "all":
        return "All";
      case "published":
        return "Published";
      case "archived":
        return "Archived";
      default:
        return "All";
    }
  };

  const getResponseLabel = (filter: ResponseFilter): string => {
    switch (filter) {
      case "all":
        return "All";
      case "0":
        return "0";
      case "1-10":
        return "1-10";
      case "11-50":
        return "11-50";
      case "51-100":
        return "51-100";
      case "100+":
        return "100+";
      default:
        return "All";
    }
  };

  const getSortLabel = (sort: SortOption): string => {
    switch (sort) {
      case "newest":
        return "Newest";
      case "oldest":
        return "Oldest";
      case "most-responses":
        return "Most Responses";
      case "least-responses":
        return "Least Responses";
      default:
        return "Newest";
    }
  };

  const hasActiveFilters = statusFilter !== "all" || responseFilter !== "all" || sortOption !== "newest";

  const clearFilters = () => {
    setStatusFilter("all");
    setResponseFilter("all");
    setSortOption("newest");
  };

  const statusOptions: StatusFilter[] = ["all", "published", "archived"];
  const responseOptions: ResponseFilter[] = ["all", "0", "1-10", "11-50", "51-100", "100+"];
  const sortOptions: SortOption[] = ["newest", "oldest", "most-responses", "least-responses"];

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
      await loadSurveys();
    } catch (err: any) {
      console.error("Error loading surveys:", err);
      setError(err.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  const loadSurveys = async () => {
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

    setSurveys(surveysWithMetadata);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadSurveys();
    } catch (err) {
      console.error("Error refreshing:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredAndSortedSurveys = useMemo(() => {
    let filtered = [...surveys];

    // Apply status filter
    if (statusFilter === "published") {
      filtered = filtered.filter((s) => s.draft === "published");
    } else if (statusFilter === "archived") {
      filtered = filtered.filter((s) => s.draft === "unpublished");
    }

    // Apply response filter
    if (responseFilter !== "all") {
      filtered = filtered.filter((survey) => {
        const count = survey.responseCount;
        switch (responseFilter) {
          case "0":
            return count === 0;
          case "1-10":
            return count >= 1 && count <= 10;
          case "11-50":
            return count >= 11 && count <= 50;
          case "51-100":
            return count >= 51 && count <= 100;
          case "100+":
            return count > 100;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "newest":
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        case "oldest":
          const dateAOld = a.updatedAt ? new Date(a.updatedAt).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateBOld = b.updatedAt ? new Date(b.updatedAt).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateAOld - dateBOld;
        case "most-responses":
          return b.responseCount - a.responseCount;
        case "least-responses":
          return a.responseCount - b.responseCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [surveys, statusFilter, responseFilter, sortOption]);

  const hasActiveFilters = statusFilter !== "all" || responseFilter !== "all" || sortOption !== "newest";

  const clearFilters = () => {
    setStatusFilter("all");
    setResponseFilter("all");
    setSortOption("newest");
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

  const handleToggleStatus = async (survey: SurveyWithMetadata) => {
    const isPublishing = survey.draft === "unpublished";
    const action = isPublishing ? "publish" : "archive";

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
              await loadSurveys();
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
              await loadSurveys();
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

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTextContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#222222" />
            </TouchableOpacity>
            <Text style={styles.title}>All Surveys</Text>
          </View>
          <View style={styles.logoContainer}>
            <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
          </View>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          {hasActiveFilters && (
            <View style={styles.filtersHeader}>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter !== "all" && styles.filterButtonActive,
              ]}
              onPress={() => {
                setShowResponseDropdown(false);
                setShowSortDropdown(false);
                setShowStatusDropdown(!showStatusDropdown);
              }}
            >
              <View style={styles.filterButtonContent}>
                <Ionicons
                  name={
                    statusFilter === "published"
                      ? "checkmark-circle-outline"
                      : statusFilter === "archived"
                      ? "archive-outline"
                      : "filter-outline"
                  }
                  size={16}
                  color={statusFilter !== "all" ? "#4A63D8" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter !== "all" && styles.filterButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {getStatusLabel(statusFilter)}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={14}
                color={statusFilter !== "all" ? "#4A63D8" : "#9CA3AF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                responseFilter !== "all" && styles.filterButtonActive,
              ]}
              onPress={() => {
                setShowStatusDropdown(false);
                setShowSortDropdown(false);
                setShowResponseDropdown(!showResponseDropdown);
              }}
            >
              <View style={styles.filterButtonContent}>
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={responseFilter !== "all" ? "#4A63D8" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    responseFilter !== "all" && styles.filterButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {getResponseLabel(responseFilter)}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={14}
                color={responseFilter !== "all" ? "#4A63D8" : "#9CA3AF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                sortOption !== "newest" && styles.filterButtonActive,
              ]}
              onPress={() => {
                setShowStatusDropdown(false);
                setShowResponseDropdown(false);
                setShowSortDropdown(!showSortDropdown);
              }}
            >
              <View style={styles.filterButtonContent}>
                <Ionicons
                  name="swap-vertical-outline"
                  size={16}
                  color={sortOption !== "newest" ? "#4A63D8" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    sortOption !== "newest" && styles.filterButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {getSortLabel(sortOption)}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={14}
                color={sortOption !== "newest" ? "#4A63D8" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + 8 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Dropdown Modal */}
        <Modal visible={showStatusDropdown} transparent animationType="fade" onRequestClose={() => setShowStatusDropdown(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowStatusDropdown(false)}>
            <View style={styles.dropdownMenu}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.dropdownItem, statusFilter === option && styles.dropdownItemActive]}
                  onPress={() => {
                    setStatusFilter(option);
                    setShowStatusDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, statusFilter === option && styles.dropdownItemTextActive]}>
                    {getStatusLabel(option)}
                  </Text>
                  {statusFilter === option && <Ionicons name="checkmark" size={20} color="#4A63D8" />}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Response Dropdown Modal */}
        <Modal visible={showResponseDropdown} transparent animationType="fade" onRequestClose={() => setShowResponseDropdown(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowResponseDropdown(false)}>
            <View style={styles.dropdownMenu}>
              {responseOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.dropdownItem, responseFilter === option && styles.dropdownItemActive]}
                  onPress={() => {
                    setResponseFilter(option);
                    setShowResponseDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, responseFilter === option && styles.dropdownItemTextActive]}>
                    {getResponseLabel(option)}
                  </Text>
                  {responseFilter === option && <Ionicons name="checkmark" size={20} color="#4A63D8" />}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Sort Dropdown Modal */}
        <Modal visible={showSortDropdown} transparent animationType="fade" onRequestClose={() => setShowSortDropdown(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowSortDropdown(false)}>
            <View style={styles.dropdownMenu}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.dropdownItem, sortOption === option && styles.dropdownItemActive]}
                  onPress={() => {
                    setSortOption(option);
                    setShowSortDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, sortOption === option && styles.dropdownItemTextActive]}>
                    {getSortLabel(option)}
                  </Text>
                  {sortOption === option && <Ionicons name="checkmark" size={20} color="#4A63D8" />}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadData} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAndSortedSurveys.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color="#9CA3AF"
            />
            <Text style={styles.emptyText}>No surveys found</Text>
            <Text style={styles.emptySubtext}>
              {surveys.length === 0
                ? "Create your first survey to get started"
                : "Try adjusting your filters"}
            </Text>
          </View>
        ) : (
          <View style={styles.surveysSection}>
            {filteredAndSortedSurveys.map((survey) => (
              <ResearchSurveyCard
                key={survey._id}
                survey={survey}
                onView={() => handleViewSurvey(survey)}
                onAnalyze={() => handleAnalyzeSurvey(survey)}
                onToggleStatus={() => handleToggleStatus(survey)}
                onDelete={() => handleDeleteSurvey(survey)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  fixedHeader: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    paddingBottom: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
    alignItems: "flex-start",
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 4,
  },
  titleImage: {
    height: 32,
    width: 106,
    marginLeft: -6,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#222222",
    lineHeight: 40,
  },
  filtersSection: {
    paddingHorizontal: 16,
    marginBottom: 0,
    paddingBottom: 16,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 12,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A63D8",
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    minHeight: 40,
  },
  filterButtonActive: {
    borderColor: "#4A63D8",
    backgroundColor: "#F0F4FF",
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
    color: "#6B7280",
    textAlign: "center",
  },
  filterButtonTextActive: {
    color: "#222222",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    minWidth: 200,
    maxHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemActive: {
    backgroundColor: "#F0F9FF",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#374151",
  },
  dropdownItemTextActive: {
    color: "#4A63D8",
    fontWeight: "600",
  },
  surveysSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
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
    paddingHorizontal: 24,
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
  // Survey Card Styles (copied from research.tsx)
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

  const status = getStatus();
  const timeAgo = formatTimeAgo(survey.updatedAt || survey.createdAt);

  return (
    <View style={styles.surveyCard}>
      <View style={styles.surveyCardHeader}>
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
        <Text style={styles.surveyCardTitle} numberOfLines={2}>
          {survey.title}
        </Text>
      </View>

      <View style={styles.surveyCardMetrics}>
        <View style={styles.surveyMetricItem}>
          <Ionicons name="help-circle-outline" size={16} color="#8A4DE8" />
          <Text style={styles.surveyMetricText}>
            {survey.questionCount} question{survey.questionCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.surveyMetricItem}>
          <Ionicons name="people-outline" size={16} color="#2BB6E9" />
          <Text style={styles.surveyMetricText}>
            {formatResponseCount(survey.responseCount)} response{survey.responseCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.surveyCardActions}>
        {isPublished ? (
          <>
            <TouchableOpacity
              style={[styles.mainActionButton, styles.mainActionButtonFullWidth]}
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
            <TouchableOpacity
              style={[styles.mainActionButton, styles.mainActionButtonFullWidth]}
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
            <TouchableOpacity
              style={[styles.mainActionButton, styles.mainActionButtonFullWidth]}
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
