import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getSurveyById } from "@/api/surveys";
import { getQuestionsBySurveyId } from "@/api/questions";
import { getResponsesBySurveyId } from "@/api/responses";
import { getUserById } from "@/api/users";
import { Survey } from "@/api/surveys";
import { Question } from "@/api/questions";
import User from "@/types/User";
import { getImageUrl } from "@/utils/imageUtils";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export default function SurveyRespondentPreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const { surveyId } = useLocalSearchParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [creator, setCreator] = useState<User | null>(null);
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      loadSurveyData();
    }
  }, [surveyId]);

  const loadSurveyData = async () => {
    if (!surveyId) return;

    setLoading(true);
    setError(null);
    try {
      const [surveyData, questionsData, responsesData] = await Promise.all([
        getSurveyById(surveyId),
        getQuestionsBySurveyId(surveyId),
        getResponsesBySurveyId(surveyId),
      ]);

      // Sort questions by order
      const sortedQuestions = questionsData.sort((a, b) => a.order - b.order);

      setSurvey(surveyData);
      setQuestions(sortedQuestions);
      setResponseCount(responsesData.length);

      // Load creator info
      if (surveyData.creatorId) {
        try {
          const creatorData = await getUserById(surveyData.creatorId);
          setCreator(creatorData);
        } catch (err) {
          console.error("Error loading creator:", err);
        }
      }
    } catch (err: any) {
      console.error("Error loading survey data:", err);
      setError(err.message || "Failed to load survey");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSurvey = () => {
    if (!surveyId) return;
    router.push({
      pathname: "/(protected)/(researcher)/survey-view",
      params: { surveyId },
    } as any);
  };

  const handleShare = async () => {
    if (!survey) return;
    try {
      await Share.share({
        message: `Check out this survey: ${survey.title}\n${survey.description || ""}`,
        title: survey.title,
      });
    } catch (err: any) {
      console.error("Error sharing:", err);
    }
  };

  const formatResponseCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Calculate required and optional questions
  const requiredCount = questions.filter((q) => q.isRequired).length;
  const optionalCount = questions.filter((q) => !q.isRequired).length;

  const getQuestionTypeLabel = (type: Question["type"]) => {
    switch (type) {
      case "text":
        return "Text response";
      case "multiple_choice":
        return "Multiple Choice";
      case "single_choice":
        return "Multiple Choice";
      case "dropdown":
        return "Dropdown";
      case "checkbox":
        return "Multiple Select";
      default:
        return "Question";
    }
  };

  const getQuestionIcon = (type: Question["type"]) => {
    switch (type) {
      case "text":
        return "create-outline";
      case "multiple_choice":
      case "single_choice":
        return "radio-button-on-outline";
      case "checkbox":
        return "checkbox-outline";
      case "dropdown":
        return "chevron-down-outline";
      default:
        return "help-outline";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4A63D8" />
          <Text style={styles.loadingText}>Loading survey...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !survey) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || "Survey not found"}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>Survey Preview</Text>
          <Text style={styles.headerSubtitle}>Review before answering</Text>
        </View>
      </View>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomNavHeight + 8 }}
      >
        {/* Survey Overview */}
        <View style={styles.overviewSection}>
          <Text style={styles.surveyTitle}>{survey.title}</Text>
          {survey.description && survey.description.trim() && (
            <Text style={styles.surveyDescription}>{survey.description}</Text>
          )}

          {/* Creator Info */}
          {creator && (
            <View style={styles.creatorInfo}>
              <View style={styles.creatorAvatar}>
                {creator.image ? (
                  <Image
                    source={{ uri: getImageUrl(creator.image) }}
                    style={styles.creatorImage}
                  />
                ) : (
                  <View style={styles.creatorAvatarPlaceholder}>
                    <Text style={styles.creatorInitials}>
                      {creator.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.creatorDetails}>
                <Text style={styles.creatorName}>{creator.name || "Unknown User"}</Text>
                <Text style={styles.creatorLabel}>Survey Creator</Text>
              </View>
            </View>
          )}
        </View>

        {/* Questions Preview */}
        <View style={styles.questionsSection}>
          <Text style={styles.sectionTitle}>Questions Preview</Text>

          {questions.slice(0, 6).map((question, index) => (
            <View key={question._id} style={styles.questionCard}>
              <Text style={styles.questionText}>{question.text}</Text>
              {question.type === "text" ? (
                <View style={styles.textResponseField}>
                  <Text style={styles.textResponseText}>Text response</Text>
                </View>
              ) : question.options && question.options.length > 0 ? (
                question.options.length >= 6 ? (
                  <View style={styles.optionsContainerWithScroll}>
                    <ScrollView 
                      style={styles.optionsScrollView}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={[styles.optionsContainer, styles.optionsContainerTwoColumns]}>
                        {question.options.map((option, optIndex) => {
                          const isMultiple =
                            question.type === "multiple_choice" ||
                            question.type === "checkbox";

                          return (
                            <View
                              key={optIndex}
                              style={[
                                styles.optionButton,
                                styles.optionButtonTwoColumns,
                              ]}
                            >
                              <Ionicons
                                name={
                                  isMultiple
                                    ? "checkbox-outline"
                                    : "radio-button-off"
                                }
                                size={20}
                                color="#9CA3AF"
                              />
                              <Text style={styles.optionButtonText}>
                                {option}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <View style={[
                    styles.optionsContainer, 
                    question.options && question.options.length >= 2 && styles.optionsContainerTwoColumns
                  ]}>
                    {question.options.map((option, optIndex) => {
                      const isMultiple =
                        question.type === "multiple_choice" ||
                        question.type === "checkbox";

                      const shouldUseTwoColumns = question.options && question.options.length >= 2;

                      return (
                        <View
                          key={optIndex}
                          style={[
                            styles.optionButton,
                            shouldUseTwoColumns && styles.optionButtonTwoColumns,
                          ]}
                        >
                          <Ionicons
                            name={
                              isMultiple
                                ? "checkbox-outline"
                                : "radio-button-off"
                            }
                            size={20}
                            color="#9CA3AF"
                          />
                          <Text style={styles.optionButtonText}>
                            {option}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )
              ) : null}
            </View>
          ))}
        </View>

        {/* Spacer for fixed elements */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Survey Information */}
      <View style={[styles.fixedInfoSection, { bottom: bottomNavHeight + 8 + 78 + 2 + 16 }]}>
        <LinearGradient
          colors={["#F0F9FF", "#EFF6FF", "#F0F9FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.infoSectionGradient}
        >
          <View style={styles.infoHeader}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.infoSectionTitle}>Survey Information</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>{questions.length}</Text>
              <Text style={styles.infoLabel}>Total Questions</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>{requiredCount}</Text>
              <Text style={styles.infoLabel}>Required</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>{optionalCount}</Text>
              <Text style={styles.infoLabel}>Optional</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>~{survey.estimatedMinutes}</Text>
              <Text style={styles.infoLabel}>Minutes</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Fixed Start Survey Button */}
      <View style={[styles.fixedButtonContainer, { bottom: bottomNavHeight + 8 }]}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartSurvey}>
          <LinearGradient
            colors={["#5FA9F5", "#4A63D8", "#8A4DE8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startButtonText}>Start Survey</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    marginLeft: -8,
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#505050",
  },
  closeButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  moreButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
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
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  errorText: {
    marginTop: 16,
    fontSize: 15,
    color: "#EF4444",
    textAlign: "center",
    fontWeight: "500",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 20,
    overflow: "hidden",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  overviewSection: {
    padding: 20,
    paddingBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: "#E5E7EB",
  },
  surveyTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  surveyDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 26,
    marginBottom: 24,
    fontWeight: "400",
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  creatorAvatar: {
    marginRight: 14,
  },
  creatorImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  creatorAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#BAE6FD",
  },
  creatorInitials: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A63D8",
    letterSpacing: 0.5,
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  creatorLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  questionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  textResponseField: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    minHeight: 60,
  },
  textResponseText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "500",
    fontStyle: "italic",
  },
  optionsContainer: {
    marginTop: 12,
    gap: 10,
  },
  optionsContainerTwoColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionsContainerWithScroll: {
    marginTop: 12,
  },
  optionsScrollView: {
    maxHeight: 200,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButtonTwoColumns: {
    flexBasis: "48%",
    flexGrow: 0,
    flexShrink: 0,
  },
  optionButtonText: {
    fontSize: 14,
    color: "#222222",
    marginLeft: 12,
    flex: 1,
  },
  viewMoreButton: {
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 15,
    color: "#4A63D8",
    fontWeight: "700",
  },
  fixedInfoSection: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
    marginBottom: 0,
    marginTop: 0,
  },
  infoSectionGradient: {
    borderRadius: 22,
    padding: 18,
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4A63D8",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 10,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  infoLabel: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 119,
  },
  fixedButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: "center",
  },
  startButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
    minHeight: 58,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  infoSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
});


