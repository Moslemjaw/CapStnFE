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
      {/* Header with close button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#8A4DE8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#505050" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomNavHeight + 16 }}
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
              ) : (
                question.options && question.options.length > 6 ? (
                  <ScrollView 
                    style={styles.optionsScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={[styles.optionsPreview, styles.optionsPreviewTwoColumns]}>
                      {question.options.map((option, optIndex) => (
                        <View key={optIndex} style={[styles.optionCard, styles.optionCardTwoColumns]}>
                          <Text style={styles.optionText}>{option}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <View style={[styles.optionsPreview, question.options && question.options.length > 3 && styles.optionsPreviewTwoColumns]}>
                    {question.options?.map((option, optIndex) => (
                      <View key={optIndex} style={[styles.optionCard, question.options && question.options.length > 3 && styles.optionCardTwoColumns]}>
                        <Text style={styles.optionText}>{option}</Text>
                      </View>
                    ))}
                  </View>
                )
              )}
            </View>
          ))}
        </View>

        {/* Spacer for fixed elements */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Survey Information */}
      <View style={[styles.fixedInfoSection, { bottom: bottomNavHeight + 12 + 78 + 2 }]}>
        <LinearGradient
          colors={["#F9F6FE", "#F5F2F9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.infoSectionGradient}
        >
          <View style={styles.infoHeader}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={11} color="#FFFFFF" />
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
      <View style={[styles.fixedButtonContainer, { bottom: bottomNavHeight + 12 }]}>
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  closeButton: {
    padding: 4,
  },
  moreButton: {
    padding: 4,
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
  overviewSection: {
    padding: 24,
  },
  surveyTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 12,
  },
  surveyDescription: {
    fontSize: 16,
    color: "#505050",
    lineHeight: 24,
    marginBottom: 20,
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  creatorAvatar: {
    marginRight: 12,
  },
  creatorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  creatorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF5FF",
    justifyContent: "center",
    alignItems: "center",
  },
  creatorInitials: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A63D8",
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 2,
  },
  creatorLabel: {
    fontSize: 14,
    color: "#505050",
  },
  questionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 12,
  },
  textResponseField: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
  },
  textResponseText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  optionsPreview: {
    gap: 10,
  },
  optionsPreviewTwoColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionsScrollView: {
    maxHeight: 200,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionCardTwoColumns: {
    flexBasis: "48%",
    flexGrow: 0,
    flexShrink: 0,
  },
  optionText: {
    fontSize: 14,
    color: "#222222",
  },
  viewMoreButton: {
    marginTop: 4,
  },
  viewMoreText: {
    fontSize: 14,
    color: "#4A63D8",
    fontWeight: "600",
  },
  fixedInfoSection: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 10,
    marginBottom: 0,
    marginTop: 0,
  },
  infoSectionGradient: {
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },
  infoIconContainer: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: "#4A63D8",
    justifyContent: "center",
    alignItems: "center",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 8,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
  infoNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 9,
    color: "#505050",
    textAlign: "center",
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 250,
  },
  fixedButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: "center",
  },
  startButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    width: "100%",
    maxWidth: 400,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },
});


