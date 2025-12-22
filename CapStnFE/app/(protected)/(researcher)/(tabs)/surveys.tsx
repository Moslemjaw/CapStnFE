import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  Keyboard,
} from "react-native";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";
import { SurveysSkeleton } from "@/components/Skeleton";
import { getPublishedSurveys } from "@/api/surveys";
import { getQuestionsBySurveyId } from "@/api/questions";
import { getResponsesBySurveyId, getResponsesByUserId } from "@/api/responses";
import { getUser } from "@/api/storage";
import { SurveyWithMetadata } from "@/types/Survey";
import User from "@/types/User";
import { Colors, Typography, Spacing, Shadows } from "@/constants/design";

type QuestionCountFilter = "all" | "1-5" | "6-10" | "11-15" | "16+";
type MaxTimeFilter = "all" | "1-5" | "5-10" | "10-15" | "15-30" | "30+";
type StatusFilter = "all" | "open" | "answered";

interface UserStats {
  surveysAnswered: number;
  totalTimeSpent: number;
}

export default function ResearcherSurveys() {
  const router = useRouter();
  const bottomNavHeight = useBottomNavHeight();
  const insets = useSafeAreaInsets();
  const [featuredSurveys, setFeaturedSurveys] = useState<SurveyWithMetadata[]>([]);
  const [availableSurveys, setAvailableSurveys] = useState<SurveyWithMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [questionCountFilter, setQuestionCountFilter] = useState<QuestionCountFilter>("all");
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


  // Search input ref
  const searchInputRef = useRef<TextInput>(null);

  // Clear button animation
  const clearButtonProgress = useSharedValue(0);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    loadUser();
  }, []);

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
      const totalTimeMs = responses.reduce((sum, r) => sum + (r.durationMs || 0), 0);
      setUserStats({
        surveysAnswered: uniqueSurveys.size,
        totalTimeSpent: totalTimeMs,
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
      await loadAvailableSurveys(featured.map((s) => s._id), userResponses);
    } catch (err: any) {
      console.error("Error loading surveys:", err);
      setError(err.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedSurveys = async (userResponses: any[] = []): Promise<SurveyWithMetadata[]> => {
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
          return { ...survey, responseCount: responsesThisWeek.length };
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
          const isAnswered = userResponses.some((response) => response.surveyId === survey._id);
          return { ...survey, questionCount: questions.length, isAnswered };
        } catch (err) {
          const isAnswered = userResponses.some((response) => response.surveyId === survey._id);
          return { ...survey, questionCount: 0, isAnswered };
        }
      })
    );

    setFeaturedSurveys(surveysWithMetadata);
    return surveysWithMetadata;
  };

  const loadAvailableSurveys = async (featuredIds: string[] = [], userResponses: any[] = []) => {
    if (!user?._id) return;
    const publishedSurveys = await getPublishedSurveys();
    const available = publishedSurveys.filter(
      (survey) => survey.creatorId !== user._id && !featuredIds.includes(survey._id)
    );

    const surveysWithMetadata = await Promise.all(
      available.map(async (survey) => {
        try {
          const [questions, responses] = await Promise.all([
            getQuestionsBySurveyId(survey._id),
            getResponsesBySurveyId(survey._id),
          ]);
          const isAnswered = userResponses.some((response) => response.surveyId === survey._id);
          return { 
            ...survey, 
            questionCount: questions.length, 
            responseCount: responses.length,
            isAnswered 
          };
        } catch (err) {
          const isAnswered = userResponses.some((response) => response.surveyId === survey._id);
          return { 
            ...survey, 
            questionCount: 0, 
            responseCount: 0,
            isAnswered 
          };
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

  const filterSurveys = useCallback(
    (surveys: SurveyWithMetadata[]) => {
      let filtered = [...surveys];
      const query = searchQuery.trim().toLowerCase();

      if (query) {
        filtered = filtered.filter(
          (survey) =>
            survey.title.toLowerCase().includes(query) ||
            (survey.description && survey.description.toLowerCase().includes(query))
        );
      }

      if (questionCountFilter !== "all") {
        filtered = filtered.filter((survey) => {
          const count = survey.questionCount || 0;
          switch (questionCountFilter) {
            case "1-5": return count >= 1 && count <= 5;
            case "6-10": return count >= 6 && count <= 10;
            case "11-15": return count >= 11 && count <= 15;
            case "16+": return count >= 16;
            default: return true;
          }
        });
      }

      if (maxTimeFilter !== "all") {
        filtered = filtered.filter((survey) => {
          const minutes = survey.estimatedMinutes;
          switch (maxTimeFilter) {
            case "1-5": return minutes >= 1 && minutes <= 5;
            case "5-10": return minutes > 5 && minutes <= 10;
            case "10-15": return minutes > 10 && minutes <= 15;
            case "15-30": return minutes > 15 && minutes <= 30;
            case "30+": return minutes > 30;
            default: return true;
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
    },
    [searchQuery, questionCountFilter, maxTimeFilter, statusFilter]
  );

  const filteredFeatured = useMemo(
    () => filterSurveys(featuredSurveys),
    [featuredSurveys, filterSurveys]
  );

  const filteredAvailable = useMemo(
    () => filterSurveys(availableSurveys),
    [availableSurveys, filterSurveys]
  );

  const handleSurveyAction = (survey: SurveyWithMetadata) => {
    if (survey.isAnswered) {
      router.push({
        pathname: "/(protected)/(researcher)/survey-view",
        params: { surveyId: survey._id },
      } as any);
    } else {
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

  // Animate clear button when filters change
  useEffect(() => {
    clearButtonProgress.value = withSpring(hasActiveFilters ? 1 : 0, {
      damping: 15,
      stiffness: 200,
      mass: 0.8,
    });
  }, [hasActiveFilters]);

  const clearButtonAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      clearButtonProgress.value,
      [0, 0.5, 1],
      [0.6, 1.1, 1],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      clearButtonProgress.value,
      [0, 0.3, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    const translateX = interpolate(
      clearButtonProgress.value,
      [0, 1],
      [20, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }, { translateX }],
    };
  });

  const formatDuration = (ms: number): { value: string; label: string } => {
    const totalMinutes = ms / 60000;
    if (totalMinutes < 60) {
      return { value: Math.round(totalMinutes).toString(), label: "min" };
    } else {
      const hours = totalMinutes / 60;
      return { value: hours.toFixed(1), label: "hrs" };
    }
  };

  const getQuestionLabel = (value: QuestionCountFilter) => {
    switch (value) {
      case "all": return "Questions";
      case "1-5": return "1-5";
      case "6-10": return "6-10";
      case "11-15": return "11-15";
      case "16+": return "16+";
      default: return "Questions";
    }
  };

  const getTimeLabel = (value: MaxTimeFilter) => {
    switch (value) {
      case "all": return "Duration";
      case "1-5": return "1-5 min";
      case "5-10": return "5-10 min";
      case "10-15": return "10-15 min";
      case "15-30": return "15-30 min";
      case "30+": return "30+ min";
      default: return "Duration";
    }
  };

  const getStatusLabel = (value: StatusFilter) => {
    switch (value) {
      case "all": return "Status";
      case "open": return "Open";
      case "answered": return "Answered";
      default: return "Status";
    }
  };

  const maxTimeOptions: MaxTimeFilter[] = ["all", "1-5", "5-10", "10-15", "15-30", "30+"];
  const questionOptions: QuestionCountFilter[] = ["all", "1-5", "6-10", "11-15", "16+"];
  const statusOptions: StatusFilter[] = ["all", "open", "answered"];

  if (loading) {
    return <SurveysSkeleton />;
  }

  return (
    <FadeInView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
        {/* Gradient Background */}
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF', '#F5F3FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Surveys</Text>
            <Image
              source={require("@/assets/title.png")}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={Colors.text.tertiary} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search surveys..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.text.tertiary}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills */}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterPill, questionCountFilter !== "all" && styles.filterPillActive]}
              onPress={() => {
                Keyboard.dismiss();
                setShowStatusDropdown(false);
                setShowTimeDropdown(false);
                setShowQuestionDropdown(!showQuestionDropdown);
              }}
            >
              <Ionicons
                name="help-circle-outline"
                size={16}
                color={questionCountFilter !== "all" ? Colors.primary.blue : Colors.text.secondary}
              />
              <Text style={[styles.filterPillText, questionCountFilter !== "all" && styles.filterPillTextActive]}>
                {getQuestionLabel(questionCountFilter)}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={questionCountFilter !== "all" ? Colors.primary.blue : Colors.text.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, maxTimeFilter !== "all" && styles.filterPillActive]}
              onPress={() => {
                Keyboard.dismiss();
                setShowStatusDropdown(false);
                setShowQuestionDropdown(false);
                setShowTimeDropdown(!showTimeDropdown);
              }}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={maxTimeFilter !== "all" ? Colors.primary.purple : Colors.text.secondary}
              />
              <Text style={[styles.filterPillText, maxTimeFilter !== "all" && styles.filterPillTextActive]}>
                {getTimeLabel(maxTimeFilter)}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={maxTimeFilter !== "all" ? Colors.primary.purple : Colors.text.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, statusFilter !== "all" && styles.filterPillActive]}
              onPress={() => {
                Keyboard.dismiss();
                setShowTimeDropdown(false);
                setShowQuestionDropdown(false);
                setShowStatusDropdown(!showStatusDropdown);
              }}
            >
              <Ionicons
                name={statusFilter === "answered" ? "checkmark-circle" : "funnel-outline"}
                size={16}
                color={statusFilter !== "all" ? Colors.semantic.success : Colors.text.secondary}
              />
              <Text style={[styles.filterPillText, statusFilter !== "all" && styles.filterPillTextActive]}>
                {getStatusLabel(statusFilter)}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={statusFilter !== "all" ? Colors.semantic.success : Colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Clear Filters Button - Below filters */}
          {hasActiveFilters && (
            <Animated.View style={[styles.clearButtonRow, clearButtonAnimatedStyle]}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={14} color={Colors.semantic.error} />
                <Text style={styles.clearButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + Spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          {/* Filter Dropdowns */}
          <FilterDropdown
            visible={showStatusDropdown}
            onClose={() => setShowStatusDropdown(false)}
            title="Filter by Status"
            icon="funnel-outline"
            iconColor={Colors.semantic.success}
            options={statusOptions.map((option) => ({
              value: option,
              label: option === "all" ? "All Surveys" : option === "open" ? "Not Answered" : "Answered",
              icon: option === "answered" ? "checkmark-circle" : option === "open" ? "ellipse-outline" : "apps-outline",
            }))}
            selectedValue={statusFilter}
            onSelect={(value) => {
              setStatusFilter(value as StatusFilter);
              setShowStatusDropdown(false);
            }}
            accentColor={Colors.semantic.success}
          />

          <FilterDropdown
            visible={showTimeDropdown}
            onClose={() => setShowTimeDropdown(false)}
            title="Filter by Duration"
            icon="time-outline"
            iconColor={Colors.primary.purple}
            options={maxTimeOptions.map((option) => ({
              value: option,
              label: option === "all" ? "Any Duration" : `${option} minutes`,
              icon: "timer-outline",
            }))}
            selectedValue={maxTimeFilter}
            onSelect={(value) => {
              setMaxTimeFilter(value as MaxTimeFilter);
              setShowTimeDropdown(false);
            }}
            accentColor={Colors.primary.purple}
          />

          <FilterDropdown
            visible={showQuestionDropdown}
            onClose={() => setShowQuestionDropdown(false)}
            title="Filter by Questions"
            icon="help-circle-outline"
            iconColor={Colors.primary.blue}
            options={questionOptions.map((option) => ({
              value: option,
              label: option === "all" ? "Any Number" : `${option} questions`,
              icon: "list-outline",
            }))}
            selectedValue={questionCountFilter}
            onSelect={(value) => {
              setQuestionCountFilter(value as QuestionCountFilter);
              setShowQuestionDropdown(false);
            }}
            accentColor={Colors.primary.blue}
          />

          {/* Stats Summary */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: Colors.surface.blueTint }]}>
              <Ionicons name="checkbox-outline" size={24} color={Colors.primary.blue} />
              <Text style={[styles.statValue, { color: Colors.primary.blue }]}>
                {userStats.surveysAnswered}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.surface.purpleTint }]}>
              <Ionicons name="hourglass-outline" size={24} color={Colors.primary.purple} />
              <Text style={[styles.statValue, { color: Colors.primary.purple }]}>
                {formatDuration(userStats.totalTimeSpent).value}
              </Text>
              <Text style={styles.statLabel}>
                {formatDuration(userStats.totalTimeSpent).label} spent
              </Text>
            </View>
          </View>

          {/* Error State */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadSurveys} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Featured Section */}
              {filteredFeatured.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trending</Text>
                    <View style={styles.trendingBadge}>
                      <Ionicons name="trending-up" size={12} color={Colors.background.primary} />
                      <Text style={styles.trendingBadgeText}>Top 5</Text>
                    </View>
                  </View>

                  {/* Featured Hero Card */}
                  {filteredFeatured[0] && (
                    <SurveyCard
                      survey={filteredFeatured[0]}
                      onPress={handleSurveyAction}
                      variant="hero"
                    />
                  )}

                  {/* Featured Grid */}
                  {filteredFeatured.length > 1 && (
                    <View style={styles.featuredGrid}>
                      {filteredFeatured.slice(1, 5).map((survey) => (
                        <SurveyCard
                          key={survey._id}
                          survey={survey}
                          onPress={handleSurveyAction}
                          variant="compact"
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* All Surveys Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>All Surveys</Text>
                {filteredAvailable.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="clipboard-outline" size={40} color={Colors.text.tertiary} />
                    <Text style={styles.emptyText}>
                      {hasActiveFilters ? "No surveys match your filters" : "No available surveys"}
                    </Text>
                  </View>
                ) : (
                  filteredAvailable.map((survey) => (
                    <SurveyCard
                      key={survey._id}
                      survey={survey}
                      onPress={handleSurveyAction}
                      variant="list"
                    />
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </FadeInView>
  );
}

// Filter Dropdown Component
interface FilterDropdownProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  iconColor: string;
  options: { value: string; label: string; icon: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  accentColor: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  visible,
  onClose,
  title,
  icon,
  iconColor,
  options,
  selectedValue,
  onSelect,
  accentColor,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <View style={styles.dropdownContainer}>
        <View style={styles.dropdownHeader}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
          <Text style={styles.dropdownTitle}>{title}</Text>
        </View>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.dropdownItem, selectedValue === option.value && styles.dropdownItemActive]}
            onPress={() => onSelect(option.value)}
          >
            <View style={styles.dropdownItemContent}>
              <Ionicons
                name={option.icon as any}
                size={18}
                color={selectedValue === option.value ? accentColor : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.dropdownItemText,
                  selectedValue === option.value && { color: Colors.text.primary, fontFamily: Typography.fontFamily.semiBold },
                ]}
              >
                {option.label}
              </Text>
            </View>
            {selectedValue === option.value && (
              <Ionicons name="checkmark" size={20} color={accentColor} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Pressable>
  </Modal>
);

// Survey Card Component
interface SurveyCardProps {
  survey: SurveyWithMetadata;
  onPress: (survey: SurveyWithMetadata) => void;
  variant: "hero" | "compact" | "list";
}

const SurveyCard: React.FC<SurveyCardProps> = ({ survey, onPress, variant }) => {
  const getPointsColor = (): string => {
    const points = survey.rewardPoints || 0;
    if (points >= 100) return Colors.primary.pink;
    if (points >= 80) return Colors.primary.purple;
    if (points >= 60) return Colors.primary.blue;
    return Colors.accent.teal;
  };

  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const isList = variant === "list";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isHero && styles.cardHero,
        isCompact && styles.cardCompact,
        isList && styles.cardList,
      ]}
      onPress={() => onPress(survey)}
      activeOpacity={0.7}
    >
      {/* Status Badge */}
      {survey.isAnswered ? (
        <View style={styles.statusBadgeCompleted}>
          <Ionicons name="checkmark" size={12} color={Colors.background.primary} />
          {!isCompact && <Text style={styles.statusBadgeText}>Done</Text>}
        </View>
      ) : (
        <View style={[styles.pointsBadge, { backgroundColor: `${getPointsColor()}15` }]}>
          <Text style={[styles.pointsBadgeText, { color: getPointsColor() }]}>
            +{survey.rewardPoints || 0}
          </Text>
        </View>
      )}

      {/* Title */}
      <Text
        style={[
          styles.cardTitle,
          isHero && styles.cardTitleHero,
          isCompact && styles.cardTitleCompact,
        ]}
        numberOfLines={isCompact ? 2 : isHero ? 2 : 1}
      >
        {survey.title}
      </Text>

      {/* Description (hero and list only) */}
      {!isCompact && survey.description && survey.description.trim() && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {survey.description}
        </Text>
      )}

      {/* Meta Info */}
      <View style={[styles.cardMeta, isCompact && styles.cardMetaCompact]}>
        <View style={styles.metaItem}>
          <Ionicons name="stats-chart-outline" size={isCompact ? 14 : 16} color={Colors.primary.blue} />
          <Text style={[styles.metaText, isCompact && styles.metaTextCompact]}>
            {survey.responseCount || 0}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="layers-outline" size={isCompact ? 14 : 16} color={Colors.primary.purple} />
          <Text style={[styles.metaText, isCompact && styles.metaTextCompact]}>
            {survey.questionCount || 0}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="timer-outline" size={isCompact ? 14 : 16} color={Colors.accent.teal} />
          <Text style={[styles.metaText, isCompact && styles.metaTextCompact]}>
            {survey.estimatedMinutes}m
          </Text>
        </View>
      </View>

      {/* Action Button */}
      {isCompact ? (
        <TouchableOpacity style={styles.cardButtonCompact} onPress={() => onPress(survey)}>
          <Text style={styles.cardButtonTextCompact}>
            {survey.isAnswered ? "View" : "Preview"}
          </Text>
          <Ionicons name="arrow-forward" size={12} color={Colors.primary.blue} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.cardButton} onPress={() => onPress(survey)}>
          <Text style={styles.cardButtonText}>
            {survey.isAnswered ? "View Answers" : "Preview Survey"}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.primary.blue} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h2,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  titleImage: {
    height: 28,
    width: 94,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.tertiary,
    borderRadius: Spacing.button.borderRadius,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  searchContainerFocused: {
    backgroundColor: Colors.background.primary,
    borderColor: Colors.primary.blue,
    ...Shadows.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
    paddingVertical: 2,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.tertiary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.button.borderRadiusPill,
    gap: 4,
  },
  filterPillActive: {
    backgroundColor: Colors.surface.blueTint,
  },
  filterPillText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.text.secondary,
  },
  filterPillTextActive: {
    color: Colors.text.primary,
  },
  clearButtonRow: {
    marginTop: Spacing.sm,
    alignItems: "flex-start",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.semantic.error}12`,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.button.borderRadiusPill,
    gap: 6,
    borderWidth: 1,
    borderColor: `${Colors.semantic.error}25`,
  },
  clearButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.caption,
    color: Colors.semantic.error,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.page.paddingHorizontal,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.card.borderRadius,
  },
  statValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h2,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: Spacing.section.gap,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.section.headerGap,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.h4,
    color: Colors.text.primary,
  },
  trendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.pink,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Spacing.button.borderRadiusPill,
    gap: 3,
  },
  trendingBadgeText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.label,
    color: Colors.background.primary,
  },
  featuredGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.padding,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardHero: {
    ...Shadows.sm,
    borderColor: "transparent",
  },
  cardCompact: {
    width: "48%",
    padding: Spacing.card.paddingSmall,
  },
  cardList: {
    borderColor: Colors.border.light,
  },
  statusBadgeCompleted: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.semantic.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Spacing.button.borderRadiusPill,
    gap: 3,
  },
  statusBadgeText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.label,
    color: Colors.background.primary,
  },
  pointsBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Spacing.button.borderRadiusPill,
  },
  pointsBadgeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.captionSmall,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodyLarge,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    paddingRight: 60,
  },
  cardTitleHero: {
    fontSize: Typography.fontSize.h4,
    marginTop: Spacing.xl,
  },
  cardTitleCompact: {
    fontSize: Typography.fontSize.body,
    marginTop: Spacing.lg,
    lineHeight: 20,
  },
  cardDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardMetaCompact: {
    gap: Spacing.xs,
    marginBottom: 0,
    marginTop: "auto",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  metaTextCompact: {
    fontSize: Typography.fontSize.captionSmall,
  },
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface.blueTint,
    paddingVertical: Spacing.button.paddingVerticalSmall,
    borderRadius: Spacing.button.borderRadiusSmall,
    gap: Spacing.xs,
  },
  cardButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.primary.blue,
  },
  cardButtonCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface.blueTint,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.button.borderRadiusPill,
    gap: 4,
    marginTop: Spacing.xs,
  },
  cardButtonTextCompact: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.primary.blue,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    minWidth: 260,
    maxWidth: 320,
    ...Shadows.lg,
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  dropdownTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.primary,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  dropdownItemActive: {
    backgroundColor: Colors.surface.blueTint,
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dropdownItemText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.semantic.error,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary.blue,
    paddingVertical: Spacing.button.paddingVerticalSmall,
    paddingHorizontal: Spacing.button.paddingHorizontal,
    borderRadius: Spacing.button.borderRadius,
  },
  retryButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.background.primary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
});
