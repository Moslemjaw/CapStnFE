import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  Image,
  Animated,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getSurveyById } from "@/api/surveys";
import { getQuestionsBySurveyId } from "@/api/questions";
import {
  createResponse,
  Answer,
  getResponsesByUserId,
  Response,
} from "@/api/responses";
import { Survey } from "@/api/surveys";
import { Question } from "@/api/questions";
import { updateUserProgress } from "@/utils/userProgress";
import { getUser } from "@/api/storage";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";
import { Colors, Typography, Spacing, Shadows } from "@/constants/design";

export default function SurveyView() {
  const router = useRouter();
  const bottomNavHeight = useBottomNavHeight();
  const insets = useSafeAreaInsets();
  const { surveyId } = useLocalSearchParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState<Date>(new Date());
  const [hasAnswered, setHasAnswered] = useState(false);
  const [checkingAnswered, setCheckingAnswered] = useState(true);
  const [userResponse, setUserResponse] = useState<Response | null>(null);
  const [optionSearchQueries, setOptionSearchQueries] = useState<Record<string, string>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const questionPositions = useRef<Record<string, number>>({});
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (surveyId) {
      loadSurveyData();
      checkIfAlreadyAnswered();
    }
  }, [surveyId]);

  // Animate progress bar when answers change
  useEffect(() => {
    const progress = getProgress();
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [answers, questions]);

  const checkIfAlreadyAnswered = async () => {
    if (!surveyId) return;

    setCheckingAnswered(true);
    try {
      const user = await getUser();
      if (user?._id) {
        const userResponses = await getResponsesByUserId(user._id);
        const existingResponse = userResponses.find(
          (response) => response.surveyId === surveyId
        );

        if (existingResponse) {
          setHasAnswered(true);
          setUserResponse(existingResponse);

          const populatedAnswers: Record<string, string> = {};
          existingResponse.answers.forEach((answer) => {
            populatedAnswers[answer.questionId] = answer.value;
          });
          setAnswers(populatedAnswers);
        } else {
          setHasAnswered(false);
        }
      }
    } catch (err: any) {
      console.error("Error checking if survey was answered:", err);
      setHasAnswered(false);
    } finally {
      setCheckingAnswered(false);
    }
  };

  const loadSurveyData = async () => {
    if (!surveyId) return;

    setLoading(true);
    setError(null);
    try {
      const [surveyData, questionsData] = await Promise.all([
        getSurveyById(surveyId),
        getQuestionsBySurveyId(surveyId),
      ]);

      const sortedQuestions = questionsData.sort((a, b) => a.order - b.order);

      setSurvey(surveyData);
      setQuestions(sortedQuestions);
    } catch (err: any) {
      console.error("Error loading survey data:", err);
      setError(err.message || "Failed to load survey");
    } finally {
      setLoading(false);
    }
  };

  const scrollToNextQuestion = (currentQuestionId: string) => {
    if (hasAnswered) return;

    const currentIndex = questions.findIndex((q) => q._id === currentQuestionId);
    if (currentIndex === -1) return;

    const nextUnansweredIndex = questions.findIndex(
      (q, index) => index > currentIndex && !answers[q._id]
    );

    if (nextUnansweredIndex !== -1) {
      const nextQuestionId = questions[nextUnansweredIndex]._id;
      const position = questionPositions.current[nextQuestionId];

      if (position !== undefined && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, position - 100),
            animated: true,
          });
        }, 300);
      }
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    if (value && value.trim()) {
      scrollToNextQuestion(questionId);
    }
  };

  const handleOptionSearchChange = (questionId: string, query: string) => {
    setOptionSearchQueries((prev) => ({
      ...prev,
      [questionId]: query,
    }));
  };

  const getFilteredOptions = (questionId: string, options: string[]): string[] => {
    const searchQuery = optionSearchQueries[questionId]?.toLowerCase() || "";
    if (!searchQuery) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchQuery)
    );
  };

  const getProgress = (): number => {
    const requiredQuestions = questions.filter((q) => q.isRequired);
    if (requiredQuestions.length === 0) return 1; // No required questions means 100%
    const answeredRequiredCount = requiredQuestions.filter((q) => answers[q._id]).length;
    return answeredRequiredCount / requiredQuestions.length;
  };

  const handleOptionSelect = (
    questionId: string,
    option: string,
    questionType: Question["type"]
  ) => {
    if (questionType === "single_choice" || questionType === "dropdown") {
      handleAnswerChange(questionId, option);
    } else if (
      questionType === "multiple_choice" ||
      questionType === "checkbox"
    ) {
      const currentAnswer = answers[questionId] || "";
      const selectedOptions = currentAnswer ? currentAnswer.split(",") : [];
      const optionIndex = selectedOptions.indexOf(option);

      if (optionIndex > -1) {
        selectedOptions.splice(optionIndex, 1);
      } else {
        selectedOptions.push(option);
      }

      setAnswers((prev) => ({
        ...prev,
        [questionId]: selectedOptions.join(","),
      }));
    }
  };

  const isOptionSelected = (
    questionId: string,
    option: string,
    questionType: Question["type"]
  ): boolean => {
    const answer = answers[questionId] || "";
    if (questionType === "single_choice" || questionType === "dropdown") {
      return answer === option;
    } else if (
      questionType === "multiple_choice" ||
      questionType === "checkbox"
    ) {
      const selectedOptions = answer ? answer.split(",") : [];
      return selectedOptions.includes(option);
    }
    return false;
  };

  const validateAnswers = (): boolean => {
    for (const question of questions) {
      if (question.isRequired && !answers[question._id]) {
        Alert.alert(
          "Required Question",
          `Please answer "${question.text}" before submitting.`
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!surveyId || !survey) return;

    if (hasAnswered) {
      Alert.alert(
        "Already Answered",
        "You have already submitted a response to this survey.",
        [{ text: "Go Back", onPress: () => router.back() }]
      );
      return;
    }

    if (!validateAnswers()) return;

    setSubmitting(true);
    try {
      const submittedAt = new Date();
      const durationMs = submittedAt.getTime() - startTime.getTime();

      const answerArray: Answer[] = questions
        .filter((q) => answers[q._id])
        .map((q) => ({
          questionId: q._id,
          value: answers[q._id],
        }));

      if (answerArray.length === 0) {
        Alert.alert("Error", "Please answer at least one question.");
        setSubmitting(false);
        return;
      }

      await createResponse({
        surveyId,
        startedAt: startTime.toISOString(),
        submittedAt: submittedAt.toISOString(),
        durationMs,
        answers: answerArray,
      });

      await updateUserProgress(surveyId, survey.rewardPoints);

      const requiredAnswered = questions.filter(
        (q) => q.isRequired && answers[q._id]
      ).length;
      const optionalAnswered = questions.filter(
        (q) => !q.isRequired && answers[q._id]
      ).length;

      router.replace({
        pathname: "/(protected)/(researcher)/survey-answer-success",
        params: {
          surveyId,
          requiredAnswered: requiredAnswered.toString(),
          optionalAnswered: optionalAnswered.toString(),
          pointsEarned: survey.rewardPoints.toString(),
          durationMs: durationMs.toString(),
          totalQuestions: questions.length.toString(),
          totalRequired: questions.filter((q) => q.isRequired).length.toString(),
          totalOptional: questions.filter((q) => !q.isRequired).length.toString(),
        },
      } as any);
    } catch (err: any) {
      console.error("Error submitting response:", err);

      const errorMessage = err.response?.data?.message || err.message || "";
      if (
        errorMessage.toLowerCase().includes("already") ||
        errorMessage.toLowerCase().includes("duplicate")
      ) {
        Alert.alert(
          "Already Answered",
          "You have already submitted a response to this survey.",
          [{ text: "Go Back", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Error",
          errorMessage || "Failed to submit response. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          <Text style={styles.headerTitle}>Answer Survey</Text>
          <Image
            source={require("@/assets/title.png")}
            style={styles.titleImage}
            resizeMode="contain"
          />
        </View>

        <KeyboardAwareScrollView
          innerRef={(ref) => { scrollViewRef.current = ref; }}
          style={[styles.keyboardView, styles.scrollView]}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomNavHeight + (hasAnswered ? 140 : 100) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.OS === "ios" ? 20 : 100}
          extraHeight={120}
        >
            {/* Survey Info */}
            <View style={styles.surveyInfo}>
              {survey.description && (
                <Text style={styles.description}>{survey.description}</Text>
              )}

              {/* Progress Bar */}
              {!hasAnswered && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={[Colors.accent.sky, Colors.primary.blue]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${getProgress() * 100}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {questions.filter((q) => answers[q._id]).length} / {questions.length} answered
                  </Text>
                </View>
              )}
            </View>

            {/* Questions Section */}
            <View style={styles.questionsSection}>
              <Text style={styles.sectionTitle}>Questions</Text>

              {questions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="help-circle-outline" size={32} color={Colors.text.tertiary} />
                  <Text style={styles.emptyStateText}>No questions available</Text>
                </View>
              ) : (
                questions.map((question, index) => (
                  <View
                    key={question._id}
                    style={styles.questionCard}
                    onLayout={(event) => {
                      const { y } = event.nativeEvent.layout;
                      questionPositions.current[question._id] = y;
                    }}
                  >
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionNumber}>Question {index + 1}</Text>
                      {question.isRequired && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredBadgeText}>Required</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.questionText}>{question.text}</Text>

                    {question.type === "text" ? (
                      <TextInput
                        style={[
                          styles.textInput,
                          hasAnswered && styles.textInputReadOnly,
                        ]}
                        placeholder={hasAnswered ? "" : "Type your answer here..."}
                        placeholderTextColor={Colors.text.tertiary}
                        value={answers[question._id] || ""}
                        onChangeText={(text) => handleAnswerChange(question._id, text)}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        editable={!hasAnswered}
                      />
                    ) : question.options && question.options.length > 0 ? (
                      question.options.length >= 6 ? (
                        <View style={styles.optionsWithSearch}>
                          <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={Colors.text.tertiary} />
                            <TextInput
                              style={styles.searchInput}
                              placeholder="Search options..."
                              placeholderTextColor={Colors.text.tertiary}
                              value={optionSearchQueries[question._id] || ""}
                              onChangeText={(text) => handleOptionSearchChange(question._id, text)}
                              editable={!hasAnswered}
                            />
                            {optionSearchQueries[question._id] && (
                              <TouchableOpacity
                                onPress={() => handleOptionSearchChange(question._id, "")}
                              >
                                <Ionicons name="close-circle" size={18} color={Colors.text.tertiary} />
                              </TouchableOpacity>
                            )}
                          </View>
                          <ScrollView
                            style={styles.optionsScrollView}
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={false}
                          >
                            <View style={styles.optionsGrid}>
                              {getFilteredOptions(question._id, question.options).map((option, optIndex) => {
                                const isSelected = isOptionSelected(question._id, option, question.type);
                                const isMultiple =
                                  question.type === "multiple_choice" || question.type === "checkbox";

                                return (
                                  <TouchableOpacity
                                    key={optIndex}
                                    style={[
                                      styles.optionButton,
                                      isSelected && styles.optionButtonSelected,
                                      hasAnswered && styles.optionButtonReadOnly,
                                    ]}
                                    onPress={() => handleOptionSelect(question._id, option, question.type)}
                                    disabled={hasAnswered}
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons
                                      name={
                                        isMultiple
                                          ? isSelected ? "checkbox" : "checkbox-outline"
                                          : isSelected ? "radio-button-on" : "radio-button-off"
                                      }
                                      size={18}
                                      color={isSelected ? Colors.primary.blue : Colors.text.tertiary}
                                    />
                                    <Text
                                      style={[
                                        styles.optionButtonText,
                                        isSelected && styles.optionButtonTextSelected,
                                      ]}
                                    >
                                      {option}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </ScrollView>
                        </View>
                      ) : (
                        <View style={styles.optionsGrid}>
                          {question.options.map((option, optIndex) => {
                            const isSelected = isOptionSelected(question._id, option, question.type);
                            const isMultiple =
                              question.type === "multiple_choice" || question.type === "checkbox";

                            return (
                              <TouchableOpacity
                                key={optIndex}
                                style={[
                                  styles.optionButton,
                                  isSelected && styles.optionButtonSelected,
                                  hasAnswered && styles.optionButtonReadOnly,
                                ]}
                                onPress={() => handleOptionSelect(question._id, option, question.type)}
                                disabled={hasAnswered}
                                activeOpacity={0.7}
                              >
                                <Ionicons
                                  name={
                                    isMultiple
                                      ? isSelected ? "checkbox" : "checkbox-outline"
                                      : isSelected ? "radio-button-on" : "radio-button-off"
                                  }
                                  size={18}
                                  color={isSelected ? Colors.primary.blue : Colors.text.tertiary}
                                />
                                <Text
                                  style={[
                                    styles.optionButtonText,
                                    isSelected && styles.optionButtonTextSelected,
                                  ]}
                                >
                                  {option}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )
                    ) : null}
                  </View>
                ))
              )}
            </View>

          {/* Submit Button with Progress */}
          {!hasAnswered && (
            <View style={[styles.fixedButtonContainer, { bottom: bottomNavHeight + 16 }]}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.9}
              >
                <View style={styles.submitButtonBackground}>
                  {/* Animated Progress Fill */}
                  <Animated.View
                    style={[
                      styles.submitProgressFillContainer,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[Colors.accent.sky, Colors.primary.blue]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitProgressFill}
                    />
                  </Animated.View>
                  {/* Button Content */}
                  <View style={styles.submitButtonContent}>
                    <Text style={[
                      styles.submitButtonText,
                      getProgress() < 0.5 && styles.submitButtonTextDark
                    ]}>
                      {submitting ? "Submitting..." : "Submit Survey"}
                    </Text>
                    {!submitting && (
                      <Ionicons 
                        name="arrow-forward" 
                        size={20} 
                        color={getProgress() >= 0.5 ? Colors.background.primary : Colors.text.secondary} 
                      />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Completed Info */}
          {hasAnswered && userResponse && (
            <View style={[styles.completedSection, { bottom: bottomNavHeight + 16 }]}>
              <View style={styles.completedCard}>
                <View style={styles.completedHeader}>
                  <View style={styles.completedIconContainer}>
                    <Ionicons name="checkmark" size={12} color={Colors.background.primary} />
                  </View>
                  <Text style={styles.completedTitle}>
                    Completed on{" "}
                    {new Date(userResponse.submittedAt || "").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <View style={styles.completedGrid}>
                  <View style={styles.completedItem}>
                    <Text style={styles.completedNumber}>
                      {Math.round((userResponse.durationMs || 0) / 60000)}
                    </Text>
                    <Text style={styles.completedLabel}>Min</Text>
                  </View>
                  <View style={styles.completedItem}>
                    <Text style={styles.completedNumber}>+{survey.rewardPoints}</Text>
                    <Text style={styles.completedLabel}>Points</Text>
                  </View>
                  <View style={styles.completedItem}>
                    <Text style={styles.completedNumber}>
                      {questions.filter((q) => answers[q._id]).length}
                    </Text>
                    <Text style={styles.completedLabel}>Answered</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.semantic.error,
    textAlign: "center",
    marginTop: Spacing.md,
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
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.lg,
  },
  surveyInfo: {
    marginBottom: Spacing.lg,
  },
  description: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  progressContainer: {
    marginTop: Spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  questionsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyStateText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
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
  textInput: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: Spacing.button.borderRadiusSmall,
    padding: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    minHeight: 100,
  },
  textInputReadOnly: {
    backgroundColor: Colors.background.tertiary,
    color: Colors.text.secondary,
  },
  optionsWithSearch: {
    gap: Spacing.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: Spacing.button.borderRadiusSmall,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    paddingVertical: 4,
  },
  optionsScrollView: {
    maxHeight: 200,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.button.borderRadiusSmall,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
    gap: Spacing.xs,
    flexBasis: "48%",
    flexGrow: 0,
  },
  optionButtonSelected: {
    borderColor: Colors.primary.blue,
    backgroundColor: Colors.surface.blueTint,
  },
  optionButtonReadOnly: {
    opacity: 0.7,
  },
  optionButtonText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
  },
  optionButtonTextSelected: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary.blue,
  },
  fixedButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    zIndex: 10,
  },
  submitButton: {
    borderRadius: Spacing.button.borderRadiusPill,
    overflow: "hidden",
    ...Shadows.primary,
  },
  submitButtonBackground: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: Spacing.button.borderRadiusPill,
    overflow: "hidden",
    position: "relative",
  },
  submitProgressFillContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  submitProgressFill: {
    flex: 1,
    width: 1000, // Large enough to fill any button width
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.button.paddingVerticalLarge,
    gap: Spacing.xs,
  },
  submitButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodyLarge,
    color: Colors.background.primary,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  submitButtonTextDark: {
    color: Colors.text.secondary,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  completedSection: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    zIndex: 10,
  },
  completedCard: {
    backgroundColor: Colors.surface.blueTint,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.paddingSmall,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  completedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  completedIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.semantic.success,
    justifyContent: "center",
    alignItems: "center",
  },
  completedTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.primary,
  },
  completedGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  completedItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.button.borderRadiusSmall,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  completedNumber: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h4,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  completedLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.label,
    color: Colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
