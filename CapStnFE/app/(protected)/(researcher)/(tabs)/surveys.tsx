import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getPublishedSurveys } from "@/api/surveys";
import { getQuestionsBySurveyId } from "@/api/questions";
import { getResponsesBySurveyId } from "@/api/responses";
import { getUser } from "@/api/storage";
import { SurveyWithMetadata } from "@/types/Survey";
import User from "@/types/User";

type QuestionCountFilter = "all" | "1-5" | "6-10" | "11-15" | "16+";
type MaxTimeFilter = "all" | "1-5" | "5-10" | "10-15" | "15-30" | "30+";

export default function ResearcherSurveys() {
  const [featuredSurveys, setFeaturedSurveys] = useState<SurveyWithMetadata[]>([]);
  const [availableSurveys, setAvailableSurveys] = useState<SurveyWithMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [questionCountFilter, setQuestionCountFilter] =
    useState<QuestionCountFilter>("all");
  const [maxTimeFilter, setMaxTimeFilter] = useState<MaxTimeFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showQuestionDropdown, setShowQuestionDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    loadUser();
  }, []);

  // Load surveys when user is available
  useEffect(() => {
    if (user) {
      loadSurveys();
    }
  }, [user]);

  const loadSurveys = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load featured surveys first
      const featured = await loadFeaturedSurveys();
      // Then load available surveys (which will exclude featured)
      await loadAvailableSurveys(featured.map((s) => s._id));
    } catch (err: any) {
      console.error("Error loading surveys:", err);
      setError(err.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedSurveys = async (): Promise<SurveyWithMetadata[]> => {
    // Fetch all published surveys
    const publishedSurveys = await getPublishedSurveys();

    // Fetch response count for each survey
    const surveysWithCounts = await Promise.all(
      publishedSurveys.map(async (survey) => {
        try {
          const responses = await getResponsesBySurveyId(survey._id);
          return {
            ...survey,
            responseCount: responses.length,
          };
        } catch (err) {
          console.error(`Error fetching responses for survey ${survey._id}:`, err);
          return {
            ...survey,
            responseCount: 0,
          };
        }
      })
    );

    // Sort by response count and take top 5
    const topSurveys = surveysWithCounts
      .sort((a, b) => (b.responseCount || 0) - (a.responseCount || 0))
      .slice(0, 5);

    // Fetch question count for each survey
    const surveysWithMetadata = await Promise.all(
      topSurveys.map(async (survey) => {
        try {
          const questions = await getQuestionsBySurveyId(survey._id);
          return {
            ...survey,
            questionCount: questions.length,
          };
        } catch (err) {
          console.error(`Error fetching questions for survey ${survey._id}:`, err);
          return {
            ...survey,
            questionCount: 0,
          };
        }
      })
    );

    setFeaturedSurveys(surveysWithMetadata);
    return surveysWithMetadata;
  };

  const loadAvailableSurveys = async (featuredIds: string[] = []) => {
    if (!user?._id) {
      return;
    }

    // Fetch all published surveys
    const publishedSurveys = await getPublishedSurveys();

    // Filter out:
    // 1. Surveys created by current user
    // 2. Surveys that are in featured list
    const available = publishedSurveys.filter(
      (survey) =>
        survey.creatorId !== user._id && !featuredIds.includes(survey._id)
    );

    // Fetch question count for each survey
    const surveysWithMetadata = await Promise.all(
      available.map(async (survey) => {
        try {
          const questions = await getQuestionsBySurveyId(survey._id);
          return {
            ...survey,
            questionCount: questions.length,
          };
        } catch (err) {
          console.error(`Error fetching questions for survey ${survey._id}:`, err);
          return {
            ...survey,
            questionCount: 0,
          };
        }
      })
    );

    setAvailableSurveys(surveysWithMetadata);
  };

  // Reload available surveys when featured surveys change (for manual refresh)
  useEffect(() => {
    if (featuredSurveys.length > 0 && user) {
      const featuredIds = featuredSurveys.map((s) => s._id);
      loadAvailableSurveys(featuredIds);
    }
  }, [featuredSurveys.length, user?._id]);

  // Filter surveys
  const filterSurveys = (surveys: SurveyWithMetadata[]) => {
    let filtered = [...surveys];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((survey) =>
        survey.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply question count filter
    if (questionCountFilter !== "all") {
      filtered = filtered.filter((survey) => {
        const count = survey.questionCount || 0;
        switch (questionCountFilter) {
          case "1-5":
            return count >= 1 && count <= 5;
          case "6-10":
            return count >= 6 && count <= 10;
          case "11-15":
            return count >= 11 && count <= 15;
          case "16+":
            return count >= 16;
          default:
            return true;
        }
      });
    }

    // Apply max time filter
    if (maxTimeFilter !== "all") {
      filtered = filtered.filter((survey) => {
        const minutes = survey.estimatedMinutes;
        switch (maxTimeFilter) {
          case "1-5":
            return minutes >= 1 && minutes <= 5;
          case "5-10":
            return minutes > 5 && minutes <= 10;
          case "10-15":
            return minutes > 10 && minutes <= 15;
          case "15-30":
            return minutes > 15 && minutes <= 30;
          case "30+":
            return minutes > 30;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredFeatured = useMemo(
    () => filterSurveys(featuredSurveys),
    [featuredSurveys, searchQuery, questionCountFilter, maxTimeFilter]
  );

  const filteredAvailable = useMemo(
    () => filterSurveys(availableSurveys),
    [availableSurveys, searchQuery, questionCountFilter, maxTimeFilter]
  );

  const handleSurveyAction = (survey: SurveyWithMetadata) => {
    Alert.alert("Answer Survey", `Answering survey: ${survey.title}`);
    // TODO: Navigate to survey answer page
  };

  const clearFilters = () => {
    setSearchQuery("");
    setQuestionCountFilter("all");
    setMaxTimeFilter("all");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    questionCountFilter !== "all" ||
    maxTimeFilter !== "all";

  const maxTimeOptions: MaxTimeFilter[] = ["all", "1-5", "5-10", "10-15", "15-30", "30+"];
  const questionOptions: QuestionCountFilter[] = ["all", "1-5", "6-10", "11-15", "16+"];

  const getQuestionLabel = (value: QuestionCountFilter) => {
    return value === "all" ? "All" : value;
  };

  const getTimeLabel = (value: MaxTimeFilter) => {
    switch (value) {
      case "all":
        return "All";
      case "1-5":
        return "1-5 min";
      case "5-10":
        return "5-10 min";
      case "10-15":
        return "10-15 min";
      case "15-30":
        return "15-30 min";
      case "30+":
        return "30+ min";
      default:
        return "All";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Surveys</Text>
        <Text style={styles.subtitle}>Explore and answer surveys</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search surveys by title..."
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

      {/* Filters - One Line with Dropdowns */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersRow}>
          {/* Questions Dropdown */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.filterLabel}>Questions:</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setShowTimeDropdown(false);
                setShowQuestionDropdown(!showQuestionDropdown);
              }}
            >
              <Text style={styles.dropdownText}>
                {getQuestionLabel(questionCountFilter)}
              </Text>
              <Ionicons
                name={showQuestionDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
            <Modal
              visible={showQuestionDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowQuestionDropdown(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowQuestionDropdown(false)}
              >
                <View style={styles.dropdownMenu}>
                  {questionOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownItem,
                        questionCountFilter === option && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setQuestionCountFilter(option);
                        setShowQuestionDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          questionCountFilter === option && styles.dropdownItemTextActive,
                        ]}
                      >
                        {getQuestionLabel(option)}
                      </Text>
                      {questionCountFilter === option && (
                        <Ionicons name="checkmark" size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Modal>
          </View>

          {/* Max Time Dropdown */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.filterLabel}>Max Time:</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setShowQuestionDropdown(false);
                setShowTimeDropdown(!showTimeDropdown);
              }}
            >
              <Text style={styles.dropdownText}>
                {getTimeLabel(maxTimeFilter)}
              </Text>
              <Ionicons
                name={showTimeDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
            <Modal
              visible={showTimeDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowTimeDropdown(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowTimeDropdown(false)}
              >
                <View style={styles.dropdownMenu}>
                  {maxTimeOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownItem,
                        maxTimeFilter === option && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setMaxTimeFilter(option);
                        setShowTimeDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          maxTimeFilter === option && styles.dropdownItemTextActive,
                        ]}
                      >
                        {getTimeLabel(option)}
                      </Text>
                      {maxTimeFilter === option && (
                        <Ionicons name="checkmark" size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>

        {hasActiveFilters && (
          <TouchableOpacity
            onPress={clearFilters}
            style={styles.clearAllButton}
          >
            <Text style={styles.clearAllText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading surveys...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={loadSurveys}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Featured Section */}
          {filteredFeatured.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Featured Surveys</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredListContent}
              >
                {filteredFeatured.map((survey) => (
                  <View key={survey._id} style={styles.featuredCardContainer}>
                    <SurveyCard survey={survey} onPress={handleSurveyAction} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Available Surveys Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Available Surveys</Text>
            {filteredAvailable.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="document-text-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptySectionText}>
                  {hasActiveFilters
                    ? "No surveys match your filters"
                    : "No available surveys"}
                </Text>
              </View>
            ) : (
              filteredAvailable.map((survey) => (
                <SurveyCard
                  key={survey._id}
                  survey={survey}
                  onPress={handleSurveyAction}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Survey Card Component
interface SurveyCardProps {
  survey: SurveyWithMetadata;
  onPress: (survey: SurveyWithMetadata) => void;
}

const SurveyCard: React.FC<SurveyCardProps> = ({ survey, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(survey)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{survey.title}</Text>
      </View>

      {survey.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {survey.description}
        </Text>
      )}

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {survey.estimatedMinutes} min
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="list-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {survey.questionCount || 0} questions
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="star-outline" size={16} color="#F59E0B" />
          <Text style={[styles.detailText, styles.pointsText]}>
            {survey.rewardPoints} pts
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onPress(survey)}
        >
          <Text style={styles.actionButtonText}>Answer</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  filtersContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  dropdownContainer: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    color: "#3B82F6",
    fontWeight: "600",
  },
  clearAllButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  clearAllText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "600",
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
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  featuredListContent: {
    paddingRight: 24,
  },
  featuredCardContainer: {
    width: 300,
    marginRight: 16,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptySectionText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  card: {
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
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 20,
  },
  cardDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
  },
  pointsText: {
    color: "#F59E0B",
    fontWeight: "600",
  },
  cardFooter: {
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#3B82F6",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
