import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
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
import { FadeInView } from "@/components/FadeInView";
import { Colors, Typography, Spacing, Shadows } from "@/constants/design";

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

      const sortedQuestions = questionsData.sort((a, b) => a.order - b.order);

      setSurvey(surveyData);
      setQuestions(sortedQuestions);
      setResponseCount(responsesData.length);

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

  const requiredCount = questions.filter((q) => q.isRequired).length;
  const optionalCount = questions.filter((q) => !q.isRequired).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.blue} />
          <Text style={styles.loadingText}>Loading survey...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !survey) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.semantic.error} />
          <Text style={styles.errorText}>{error || "Survey not found"}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
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
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{survey?.title || "Survey"}</Text>
              <Text style={styles.headerSubtitle}>Preview before starting</Text>
            </View>
            <Image
              source={require("@/assets/title.png")}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavHeight + 180 }}
        >
          {/* Overview Section */}
          <View style={styles.overviewSection}>
            {survey.description && survey.description.trim() && (
              <Text style={styles.surveyDescription}>{survey.description}</Text>
            )}

            {/* Creator Info */}
            {creator && (
              <View style={styles.creatorCard}>
                <View style={styles.creatorAvatar}>
                  {creator.image ? (
                    <Image
                      source={{ uri: getImageUrl(creator.image) }}
                      style={styles.creatorImage}
                    />
                  ) : (
                    <Image
                      source={require("@/assets/logo.png")}
                      style={styles.creatorImage}
                      resizeMode="contain"
                    />
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
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Q{index + 1}</Text>
                  {question.isRequired && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredBadgeText}>Required</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.questionText}>{question.text}</Text>

                {question.type === "text" ? (
                  <View style={styles.textResponseField}>
                    <Ionicons name="create-outline" size={16} color={Colors.text.tertiary} />
                    <Text style={styles.textResponseText}>Text response</Text>
                  </View>
                ) : question.options && question.options.length > 0 ? (
                  <View style={styles.optionsContainer}>
                    {question.options.slice(0, 4).map((option, optIndex) => {
                      const isMultiple =
                        question.type === "multiple_choice" || question.type === "checkbox";
                      return (
                        <View key={optIndex} style={styles.optionItem}>
                          <Ionicons
                            name={isMultiple ? "checkbox-outline" : "radio-button-off"}
                            size={16}
                            color={Colors.text.tertiary}
                          />
                          <Text style={styles.optionText} numberOfLines={1}>
                            {option}
                          </Text>
                        </View>
                      );
                    })}
                    {question.options.length > 4 && (
                      <Text style={styles.moreOptionsText}>
                        +{question.options.length - 4} more options
                      </Text>
                    )}
                  </View>
                ) : null}
              </View>
            ))}

            {questions.length > 6 && (
              <View style={styles.moreQuestionsNote}>
                <Text style={styles.moreQuestionsText}>
                  +{questions.length - 6} more questions
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Fixed Info Section */}
        <View style={[styles.fixedInfoSection, { bottom: bottomNavHeight + 80 }]}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={16} color={Colors.primary.blue} />
              <Text style={styles.infoTitle}>Survey Information</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoNumber}>{questions.length}</Text>
                <Text style={styles.infoLabel}>Questions</Text>
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
          </View>
        </View>

        {/* Fixed Start Button */}
        <View style={[styles.fixedButtonContainer, { bottom: bottomNavHeight + 16 }]}>
          <TouchableOpacity style={styles.startButton} onPress={handleStartSurvey} activeOpacity={0.9}>
            <LinearGradient
              colors={[Colors.accent.sky, Colors.primary.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>Start Survey</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.background.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.semantic.error,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  retryButton: {
    marginTop: Spacing.lg,
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
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  titleImage: {
    height: 28,
    width: 94,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h2,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  overviewSection: {
    padding: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  surveyDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  creatorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Spacing.card.borderRadius,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  creatorAvatar: {
    marginRight: Spacing.sm,
  },
  creatorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  creatorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface.blueTint,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.accent.lightBlue,
  },
  creatorInitials: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.bodyLarge,
    color: Colors.primary.blue,
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  creatorLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  questionsSection: {
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  questionCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.paddingSmall,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.xs,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  questionNumber: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.caption,
    color: Colors.primary.blue,
  },
  requiredBadge: {
    backgroundColor: Colors.surface.blueTint,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Spacing.button.borderRadiusPill,
  },
  requiredBadgeText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.label,
    color: Colors.primary.blue,
  },
  questionText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  textResponseField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: Spacing.button.borderRadiusSmall,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  textResponseText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.caption,
    color: Colors.text.tertiary,
    fontStyle: "italic",
  },
  optionsContainer: {
    gap: Spacing.xs,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Spacing.button.borderRadiusSmall,
    gap: Spacing.xs,
  },
  optionText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
  },
  moreOptionsText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.caption,
    color: Colors.primary.blue,
    marginTop: 4,
  },
  moreQuestionsNote: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  moreQuestionsText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.text.tertiary,
  },
  fixedInfoSection: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    zIndex: 10,
  },
  infoCard: {
    backgroundColor: Colors.surface.blueTint,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.paddingSmall,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.primary,
  },
  infoGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.button.borderRadiusSmall,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  infoNumber: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h4,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  infoLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.label,
    color: Colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fixedButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    zIndex: 10,
  },
  startButton: {
    borderRadius: Spacing.button.borderRadiusPill,
    overflow: "hidden",
    ...Shadows.primary,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.button.paddingVerticalLarge,
    gap: Spacing.xs,
  },
  startButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodyLarge,
    color: Colors.background.primary,
    letterSpacing: 0.3,
  },
});
