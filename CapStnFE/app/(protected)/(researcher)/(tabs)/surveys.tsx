import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
} from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";
import { getPublishedSurveys } from "@/api/surveys";
import { getQuestionsBySurveyId } from "@/api/questions";
import { getResponsesBySurveyId, getResponsesByUserId } from "@/api/responses";
import { getUser } from "@/api/storage";
import { SurveyWithMetadata } from "@/types/Survey";
import User from "@/types/User";

type QuestionCountFilter = "all" | "1-5" | "6-10" | "11-15" | "16+";
type MaxTimeFilter = "all" | "1-5" | "5-10" | "10-15" | "15-30" | "30+";
type StatusFilter = "all" | "open" | "answered";

interface UserStats {
  surveysAnswered: number;
  totalTimeSpent: number; // in milliseconds
}

export default function ResearcherSurveys() {
  const router = useRouter();
  const bottomNavHeight = useBottomNavHeight();
  const [featuredSurveys, setFeaturedSurveys] = useState<SurveyWithMetadata[]>(
    []
  );
  const [availableSurveys, setAvailableSurveys] = useState<
    SurveyWithMetadata[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [questionCountFilter, setQuestionCountFilter] =
    useState<QuestionCountFilter>("all");
  const [maxTimeFilter, setMaxTimeFilter] = useState<MaxTimeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    surveysAnswered: 0,
    totalTimeSpent: 0,
  });
  const [showQuestionDropdown, setShowQuestionDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    loadUser();
  }, []);

  // Load surveys and stats when user is available
  useEffect(() => {
    if (user) {
      loadSurveys();
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user?._id) return;
    try {
      const responses = await getResponsesByUserId(user._id);
      const uniqueSurveys = new Set(responses.map((r) => r.surveyId));
      const totalTimeMs = responses.reduce(
        (sum, r) => sum + (r.durationMs || 0),
        0
      );

      setUserStats({
        surveysAnswered: uniqueSurveys.size,
        totalTimeSpent: totalTimeMs, // Store in milliseconds
      });
    } catch (err) {
      console.error("Error loading user stats:", err);
    }
  };

  const loadSurveys = async () => {
    setLoading(true);
    setError(null);
    try {
      let userResponses: any[] = [];
      if (user?._id) {
        try {
          userResponses = await getResponsesByUserId(user._id);
        } catch (err) {
          console.error("Error fetching user responses:", err);
        }
      }

      const featured = await loadFeaturedSurveys(userResponses);
      await loadAvailableSurveys(
        featured.map((s) => s._id),
        userResponses
      );
    } catch (err: any) {
      console.error("Error loading surveys:", err);
      setError(err.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedSurveys = async (
    userResponses: any[] = []
  ): Promise<SurveyWithMetadata[]> => {
    const publishedSurveys = await getPublishedSurveys();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const surveysWithCounts = await Promise.all(
      publishedSurveys.map(async (survey) => {
        try {
          const responses = await getResponsesBySurveyId(survey._id);
          const responsesThisWeek = responses.filter((response) => {
            if (!response.submittedAt) return false;
            const submittedDate = new Date(response.submittedAt);
            return submittedDate >= oneWeekAgo;
          });

          return {
            ...survey,
            responseCount: responsesThisWeek.length,
          };
        } catch (err) {
          return { ...survey, responseCount: 0 };
        }
      })
    );

    const topSurveys = surveysWithCounts
      .sort((a, b) => (b.responseCount || 0) - (a.responseCount || 0))
      .slice(0, 5);

    const surveysWithMetadata = await Promise.all(
      topSurveys.map(async (survey) => {
        try {
          const questions = await getQuestionsBySurveyId(survey._id);
          const isAnswered = userResponses.some(
            (response) => response.surveyId === survey._id
          );
          return {
            ...survey,
            questionCount: questions.length,
            isAnswered,
          };
        } catch (err) {
          const isAnswered = userResponses.some(
            (response) => response.surveyId === survey._id
          );
          return { ...survey, questionCount: 0, isAnswered };
        }
      })
    );

    setFeaturedSurveys(surveysWithMetadata);
    return surveysWithMetadata;
  };

  const loadAvailableSurveys = async (
    featuredIds: string[] = [],
    userResponses: any[] = []
  ) => {
    if (!user?._id) return;

    const publishedSurveys = await getPublishedSurveys();
    const available = publishedSurveys.filter(
      (survey) => survey.creatorId !== user._id && !featuredIds.includes(survey._id)
    );

    const surveysWithMetadata = await Promise.all(
      available.map(async (survey) => {
        try {
          const questions = await getQuestionsBySurveyId(survey._id);
          const isAnswered = userResponses.some(
            (response) => response.surveyId === survey._id
          );
          return {
            ...survey,
            questionCount: questions.length,
            isAnswered,
          };
        } catch (err) {
          const isAnswered = userResponses.some(
            (response) => response.surveyId === survey._id
          );
          return { ...survey, questionCount: 0, isAnswered };
        }
      })
    );

    setAvailableSurveys(surveysWithMetadata);
  };

  useEffect(() => {
    if (featuredSurveys.length > 0 && user) {
      const loadData = async () => {
        let userResponses: any[] = [];
        if (user?._id) {
          try {
            userResponses = await getResponsesByUserId(user._id);
          } catch (err) {
            console.error("Error fetching user responses:", err);
          }
        }
        const featuredIds = featuredSurveys.map((s) => s._id);
        await loadAvailableSurveys(featuredIds, userResponses);
      };
      loadData();
    }
  }, [featuredSurveys.length, user?._id]);

  const filterSurveys = (surveys: SurveyWithMetadata[]) => {
    let filtered = [...surveys];

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (survey) =>
          survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (survey.description &&
            survey.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
    }

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

    if (statusFilter !== "all") {
      filtered = filtered.filter((survey) => {
        if (statusFilter === "open") return !survey.isAnswered;
        if (statusFilter === "answered") return survey.isAnswered;
        return true;
      });
    }

    return filtered;
  };

  const filteredFeatured = useMemo(
    () => filterSurveys(featuredSurveys),
    [
      featuredSurveys,
      searchQuery,
      questionCountFilter,
      maxTimeFilter,
      statusFilter,
    ]
  );

  const filteredAvailable = useMemo(
    () => filterSurveys(availableSurveys),
    [
      availableSurveys,
      searchQuery,
      questionCountFilter,
      maxTimeFilter,
      statusFilter,
    ]
  );

  const handleSurveyAction = (survey: SurveyWithMetadata) => {
    // If user has already answered, go directly to view page showing their answers
    if (survey.isAnswered) {
      router.push({
        pathname: "/(protected)/(researcher)/survey-view",
        params: { surveyId: survey._id },
      } as any);
    } else {
      // Otherwise, go to preview page
      router.push({
        pathname: "/(protected)/(researcher)/survey-respondent-preview",
        params: { surveyId: survey._id },
      } as any);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setQuestionCountFilter("all");
    setMaxTimeFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    questionCountFilter !== "all" ||
    maxTimeFilter !== "all" ||
    statusFilter !== "all";

  // Format duration: show minutes if < 60 min, hours if >= 60 min (with 2 decimals)
  const formatDuration = (ms: number): { value: string; label: string } => {
    const totalMinutes = ms / 60000; // Convert milliseconds to minutes
    if (totalMinutes < 60) {
      return {
        value: totalMinutes.toFixed(2),
        label: "Minutes",
      };
    } else {
      const hours = totalMinutes / 60;
      return {
        value: hours.toFixed(2),
        label: "Hours",
      };
    }
  };

  const getQuestionLabel = (value: QuestionCountFilter) => {
    switch (value) {
      case "all":
        return "Questions";
      case "1-5":
        return "1-5 Q's";
      case "6-10":
        return "6-10 Q's";
      case "11-15":
        return "11-15 Q's";
      case "16+":
        return "16+ Q's";
      default:
        return "Questions";
    }
  };

  const getTimeLabel = (value: MaxTimeFilter) => {
    switch (value) {
      case "all":
        return "Duration";
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
        return "Duration";
    }
  };

  const getStatusLabel = (value: StatusFilter) => {
    switch (value) {
      case "all":
        return "Status";
      case "open":
        return "Open";
      case "answered":
        return "Answered";
      default:
        return "Status";
    }
  };

  const maxTimeOptions: MaxTimeFilter[] = [
    "all",
    "1-5",
    "5-10",
    "10-15",
    "15-30",
    "30+",
  ];
  const questionOptions: QuestionCountFilter[] = [
    "all",
    "1-5",
    "6-10",
    "11-15",
    "16+",
  ];
  const statusOptions: StatusFilter[] = ["all", "open", "answered"];

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/title.png")}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Explore Surveys</Text>
          <Text style={styles.subtitle}>
            Answer surveys, earn points, shape insights.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#505050"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for surveys by title or description"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
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
                questionCountFilter !== "all" && styles.filterButtonActive,
              ]}
              onPress={() => {
                setShowStatusDropdown(false);
                setShowTimeDropdown(false);
                setShowQuestionDropdown(!showQuestionDropdown);
              }}
            >
              <View style={styles.filterButtonContent}>
                <Ionicons
                  name="help-circle-outline"
                  size={16}
                  color={questionCountFilter !== "all" ? "#4A63D8" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    questionCountFilter !== "all" &&
                      styles.filterButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {getQuestionLabel(questionCountFilter)}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={14}
                color={questionCountFilter !== "all" ? "#4A63D8" : "#9CA3AF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                maxTimeFilter !== "all" && styles.filterButtonActive,
              ]}
              onPress={() => {
                setShowStatusDropdown(false);
                setShowQuestionDropdown(false);
                setShowTimeDropdown(!showTimeDropdown);
              }}
            >
              <View style={styles.filterButtonContent}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={maxTimeFilter !== "all" ? "#8A4DE8" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    maxTimeFilter !== "all" && styles.filterButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {getTimeLabel(maxTimeFilter)}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={14}
                color={maxTimeFilter !== "all" ? "#8A4DE8" : "#9CA3AF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter !== "all" && styles.filterButtonActive,
              ]}
              onPress={() => {
                setShowTimeDropdown(false);
                setShowQuestionDropdown(false);
                setShowStatusDropdown(!showStatusDropdown);
              }}
            >
              <View style={styles.filterButtonContent}>
                <Ionicons
                  name={
                    statusFilter === "answered"
                      ? "checkmark-circle-outline"
                      : "filter-outline"
                  }
                  size={16}
                  color={statusFilter !== "all" ? "#10B981" : "#6B7280"}
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
                color={statusFilter !== "all" ? "#10B981" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight + 4 },
        ]}
      >
        {/* Status Dropdown Modal */}
        <Modal
          visible={showStatusDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStatusDropdown(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowStatusDropdown(false)}
          >
            <View style={styles.dropdownMenu}>
              <View style={styles.dropdownHeader}>
                <Ionicons name="filter-outline" size={18} color="#10B981" />
                <Text style={styles.dropdownHeaderText}>Filter by Status</Text>
              </View>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownItem,
                    statusFilter === option && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setStatusFilter(option);
                    setShowStatusDropdown(false);
                  }}
                >
                  <View style={styles.dropdownItemContent}>
                    <Ionicons
                      name={
                        option === "answered"
                          ? "checkmark-circle"
                          : option === "open"
                          ? "ellipse-outline"
                          : "apps-outline"
                      }
                      size={18}
                      color={statusFilter === option ? "#10B981" : "#6B7280"}
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        statusFilter === option &&
                          styles.dropdownItemTextActive,
                      ]}
                    >
                      {option === "all"
                        ? "All Surveys"
                        : option === "open"
                        ? "Not Answered"
                        : "Already Answered"}
                    </Text>
                  </View>
                  {statusFilter === option && (
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Time Dropdown Modal */}
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
              <View style={styles.dropdownHeader}>
                <Ionicons name="time-outline" size={18} color="#8A4DE8" />
                <Text style={styles.dropdownHeaderText}>
                  Filter by Duration
                </Text>
              </View>
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
                  <View style={styles.dropdownItemContent}>
                    <Ionicons
                      name="timer-outline"
                      size={18}
                      color={maxTimeFilter === option ? "#8A4DE8" : "#6B7280"}
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        maxTimeFilter === option &&
                          styles.dropdownItemTextActive,
                      ]}
                    >
                      {option === "all" ? "Any Duration" : `${option} minutes`}
                    </Text>
                  </View>
                  {maxTimeFilter === option && (
                    <Ionicons name="checkmark" size={20} color="#8A4DE8" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Question Dropdown Modal */}
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
              <View style={styles.dropdownHeader}>
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color="#4A63D8"
                />
                <Text style={styles.dropdownHeaderText}>
                  Filter by Questions
                </Text>
              </View>
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
                  <View style={styles.dropdownItemContent}>
                    <Ionicons
                      name="list-outline"
                      size={18}
                      color={
                        questionCountFilter === option ? "#4A63D8" : "#6B7280"
                      }
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        questionCountFilter === option &&
                          styles.dropdownItemTextActive,
                      ]}
                    >
                      {option === "all" ? "Any Number" : `${option} questions`}
                    </Text>
                  </View>
                  {questionCountFilter === option && (
                    <Ionicons name="checkmark" size={20} color="#4A63D8" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Stats Summary Card */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={["#EEF5FF", "#E8D5FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statsGradient}
          >
            <View style={styles.statsLeft}>
              <View style={styles.statsIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#4A63D8" />
              </View>
              <Text style={styles.statsNumber}>
                {userStats.surveysAnswered}
              </Text>
              <Text style={styles.statsLabel}>Surveys answered</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsRight}>
              <View style={styles.statsIconContainer}>
                <Ionicons name="time" size={24} color="#8A4DE8" />
              </View>
              <Text style={styles.statsNumber}>
                {formatDuration(userStats.totalTimeSpent).value}
              </Text>
              <Text style={styles.statsLabel}>
                {formatDuration(userStats.totalTimeSpent).label} Spent
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Content */}
        {loading ? null : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadSurveys} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Featured This Week Section */}
            {filteredFeatured.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured This Week</Text>
                  <View style={styles.top5Badge}>
                    <Ionicons name="star" size={12} color="#FFFFFF" />
                    <Text style={styles.top5Text}>Top 5</Text>
                  </View>
                </View>
                {/* Large Featured Card */}
                {filteredFeatured[0] && (
                  <View style={styles.largeFeaturedCard}>
                    <SurveyCard
                      survey={filteredFeatured[0]}
                      onPress={handleSurveyAction}
                      isLarge={true}
                    />
                  </View>
                )}
                {/* 2x2 Grid of Smaller Cards */}
                {filteredFeatured.length > 1 && (
                  <View style={styles.featuredGrid}>
                    {filteredFeatured.slice(1, 5).map((survey) => (
                      <View key={survey._id} style={styles.smallFeaturedCard}>
                        <SurveyCard
                          survey={survey}
                          onPress={handleSurveyAction}
                          isSmall={true}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* All Surveys Section */}
            <View style={styles.allSurveysSection}>
              <Text style={styles.sectionTitle}>All Surveys</Text>
              {filteredAvailable.length === 0 ? (
                <View style={styles.emptySection}>
                  <Ionicons
                    name="document-text-outline"
                    size={32}
                    color="#9CA3AF"
                  />
                  <Text style={styles.emptySectionText}>
                    {hasActiveFilters
                      ? "No surveys match your filters"
                      : "No available surveys"}
                  </Text>
                </View>
              ) : (
                filteredAvailable.map((survey) => (
                  <View key={survey._id} style={styles.allSurveyCard}>
                    <SurveyCard
                      survey={survey}
                      onPress={handleSurveyAction}
                      isAllSurvey={true}
                    />
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </FadeInView>
  );
}

// Survey Card Component
interface SurveyCardProps {
  survey: SurveyWithMetadata;
  onPress: (survey: SurveyWithMetadata) => void;
  isLarge?: boolean;
  isSmall?: boolean;
  isAllSurvey?: boolean;
}

const SurveyCard: React.FC<SurveyCardProps> = ({
  survey,
  onPress,
  isLarge = false,
  isSmall = false,
  isAllSurvey = false,
}) => {
  const getPointsTagColor = (): [string, string] => {
    const points = survey.rewardPoints || 0;
    if (points >= 100) return ["#FF6FAE", "#D13DB8"]; // Pink to Magenta
    if (points >= 80) return ["#8A4DE8", "#A23DD8"]; // Violet to Purple
    if (points >= 60) return ["#5FA9F5", "#4A63D8"]; // Sky Blue to Indigo
    return ["#2BB6E9", "#35E0E6"]; // Teal to Cyan
  };

  const formatResponseCount = (count: number): string => {
    if (count >= 100) return "100+";
    return count.toString();
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isLarge && styles.largeCard,
        isSmall && styles.smallCard,
      ]}
      onPress={() => onPress(survey)}
    >
      {survey.isAnswered && (isAllSurvey || isLarge || isSmall) && (
        <View style={styles.answeredTag}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          {isAllSurvey && <Text style={styles.answeredTagText}>Answered</Text>}
        </View>
      )}
      {!survey.isAnswered && (isLarge || isSmall) && (
        <View style={styles.pointsTag}>
          <LinearGradient
            colors={getPointsTagColor()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pointsTagGradient}
          >
            <Text style={styles.pointsTagText}>
              +{survey.rewardPoints || 0}
            </Text>
          </LinearGradient>
        </View>
      )}
      <Text
        style={[
          styles.cardTitle,
          isLarge && styles.largeCardTitle,
          isSmall && styles.smallCardTitle,
        ]}
        numberOfLines={isSmall ? 2 : undefined}
      >
        {survey.title}
      </Text>
      {survey.description && survey.description.trim() && survey.description.trim() !== "No description provided" && !isSmall && (
        <Text style={styles.cardDescription} numberOfLines={3}>
          {survey.description}
        </Text>
      )}
      <View style={[styles.cardDetails, isSmall && styles.smallCardDetails]}>
        <View style={styles.detailItem}>
          <Ionicons
            name="people-outline"
            size={isSmall ? 14 : 16}
            color="#4A63D8"
          />
          <Text style={[styles.detailText, isSmall && styles.smallDetailText]}>
            {formatResponseCount(survey.responseCount || 0)}{" "}
            {isSmall ? "" : "answers"}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons
            name="document-text-outline"
            size={isSmall ? 14 : 16}
            color="#4A63D8"
          />
          <Text style={[styles.detailText, isSmall && styles.smallDetailText]}>
            {survey.questionCount || 0} {isSmall ? "Q" : "questions"}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons
            name="time-outline"
            size={isSmall ? 14 : 16}
            color="#8A4DE8"
          />
          <Text style={[styles.detailText, isSmall && styles.smallDetailText]}>
            {survey.estimatedMinutes}m
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => onPress(survey)}
      >
        <LinearGradient
          colors={["#5FA9F5", "#4A63D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.viewButtonGradient}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  fixedHeader: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    paddingBottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  titleImage: {
    height: 24,
    width: 80,
    marginLeft: -6,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#505050",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#222222",
  },
  filtersSection: {
    paddingHorizontal: 16,
    marginBottom: 0,
    paddingBottom: 16,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  filtersLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#505050",
    letterSpacing: 0.5,
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
    borderRadius: 16,
    minWidth: 220,
    maxHeight: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dropdownHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemActive: {
    backgroundColor: "#F0F9FF",
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "left",
  },
  dropdownItemTextActive: {
    color: "#222222",
    fontWeight: "600",
  },
  statsCard: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsGradient: {
    flexDirection: "row",
    padding: 20,
  },
  statsLeft: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRight: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statsDivider: {
    width: 1,
    backgroundColor: "rgba(74, 99, 216, 0.2)",
    marginHorizontal: 20,
  },
  statsIconContainer: {
    marginBottom: 8,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
    textAlign: "center",
  },
  statsLabel: {
    fontSize: 12,
    color: "#505050",
    textAlign: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 200,
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
    backgroundColor: "#4A63D8",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  content: {
    paddingBottom: 24,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  allSurveysSection: {
    marginTop: 8,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginRight: 12,
  },
  top5Badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6FAE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  top5Text: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  largeFeaturedCard: {
    marginBottom: 16,
  },
  featuredGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  smallFeaturedCard: {
    width: "48%",
    minWidth: 150,
  },
  allSurveyCard: {
    marginBottom: 16,
    marginHorizontal: 0,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  largeCard: {
    padding: 20,
  },
  smallCard: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginTop: 8,
    marginBottom: 8,
  },
  largeCardTitle: {
    fontSize: 24,
    paddingRight: 70,
  },
  smallCardTitle: {
    fontSize: 17,
    marginBottom: 4,
    paddingRight: 40,
  },
  cardDescription: {
    fontSize: 16,
    color: "#505050",
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 22,
  },
  cardDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  smallCardDetails: {
    gap: 8,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#505050",
  },
  smallDetailText: {
    fontSize: 12,
  },
  pointsTag: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  pointsTagGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  answeredTag: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    minWidth: 24,
    justifyContent: "center",
  },
  answeredTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  viewButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
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
});
