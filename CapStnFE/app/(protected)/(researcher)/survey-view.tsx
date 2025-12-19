import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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

export default function SurveyView() {
  const router = useRouter();
  const bottomNavHeight = useBottomNavHeight();
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
  const questionYPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    if (surveyId) {
      loadSurveyData();
      checkIfAlreadyAnswered();
    }
  }, [surveyId]);

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

          // Populate answers from the response
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
      // Don't block the user if check fails
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

      // Sort questions by order
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
    if (hasAnswered) return; // Don't auto-scroll if already answered
    
    const currentIndex = questions.findIndex((q) => q._id === currentQuestionId);
    if (currentIndex === -1 || currentIndex === questions.length - 1) return;

    // Find next unanswered question
    let nextIndex = currentIndex + 1;
    while (nextIndex < questions.length && answers[questions[nextIndex]._id]) {
      nextIndex++;
    }

    if (nextIndex < questions.length) {
      const nextQuestion = questions[nextIndex];
      const nextQuestionY = questionYPositions.current[nextQuestion._id];
      
      if (nextQuestionY !== undefined && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: nextQuestionY - 20, // Offset to show question header
            animated: true,
          });
        }, 300); // Small delay for smooth transition
      }
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
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
    if (questions.length === 0) return 0;
    const answeredCount = questions.filter((q) => answers[q._id]).length;
    return answeredCount / questions.length;
  };

  const handleOptionSelect = (
    questionId: string,
    option: string,
    questionType: Question["type"]
  ) => {
    if (questionType === "single_choice" || questionType === "dropdown") {
      // Single selection - auto-scroll to next question
      handleAnswerChange(questionId, option);
      scrollToNextQuestion(questionId);
    } else if (
      questionType === "multiple_choice" ||
      questionType === "checkbox"
    ) {
      // Multiple selection - toggle option (no auto-scroll for multiple choice)
      const currentAnswer = answers[questionId] || "";
      const selectedOptions = currentAnswer ? currentAnswer.split(",") : [];
      const optionIndex = selectedOptions.indexOf(option);

      if (optionIndex > -1) {
        // Remove option
        selectedOptions.splice(optionIndex, 1);
      } else {
        // Add option
        selectedOptions.push(option);
      }

      handleAnswerChange(questionId, selectedOptions.join(","));
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

    // Check if user has already answered
    if (hasAnswered) {
      Alert.alert(
        "Already Answered",
        "You have already submitted a response to this survey. Each user can only answer a survey once.",
        [
          {
            text: "Go Back",
            onPress: () => router.back(),
          },
        ]
      );
      return;
    }

    if (!validateAnswers()) {
      return;
    }

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

      // Update user progress (points and streak)
      await updateUserProgress(surveyId, survey.rewardPoints);

      // Calculate statistics
      const requiredAnswered = questions.filter(
        (q) => q.isRequired && answers[q._id]
      ).length;
      const optionalAnswered = questions.filter(
        (q) => !q.isRequired && answers[q._id]
      ).length;

      // Navigate to success page
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

      // Check if error is due to duplicate submission
      const errorMessage = err.response?.data?.message || err.message || "";
      if (
        errorMessage.toLowerCase().includes("already") ||
        errorMessage.toLowerCase().includes("duplicate")
      ) {
        Alert.alert(
          "Already Answered",
          "You have already submitted a response to this survey.",
          [
            {
              text: "Go Back",
              onPress: () => router.back(),
            },
          ]
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

  const getQuestionTypeLabel = (type: Question["type"]) => {
    switch (type) {
      case "text":
        return "Text";
      case "multiple_choice":
        return "Multiple Choice";
      case "single_choice":
        return "Single Choice";
      case "dropdown":
        return "Dropdown";
      case "checkbox":
        return "Checkbox";
      default:
        return type;
    }
  };

  if (loading || checkingAnswered) {
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.retryButton}
          >
            <LinearGradient
              colors={["#5FA9F5", "#4A63D8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </LinearGradient>
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
          <Text style={styles.headerTitle}>Answer Survey</Text>
          <Text style={styles.headerSubtitle}>{survey.title}</Text>
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            hasAnswered && userResponse && styles.scrollContentWithCompleted,
            !hasAnswered && styles.scrollContentWithSubmit,
          ]}
          showsVerticalScrollIndicator={false}
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
                  <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
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
              <View style={styles.emptyQuestions}>
                <Ionicons
                  name="help-circle-outline"
                  size={32}
                  color="#9CA3AF"
                />
                <Text style={styles.emptyQuestionsText}>
                  No questions available for this survey
                </Text>
              </View>
            ) : (
              questions.map((question, index) => (
                <View
                  key={question._id}
                  onLayout={(event) => {
                    const { y } = event.nativeEvent.layout;
                    // Y position relative to ScrollView content - this works directly with scrollTo
                    questionYPositions.current[question._id] = y;
                  }}
                  style={styles.questionCard}
                >
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>
                      Question {index + 1}
                    </Text>
                    {question.isRequired && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Required</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.questionText}>{question.text}</Text>

                  {/* Answer Input Section */}
                  {question.type === "text" ? (
                    <TextInput
                      style={[
                        styles.textInput,
                        hasAnswered && styles.textInputReadOnly,
                      ]}
                      placeholder={
                        hasAnswered ? "" : "Type your answer here..."
                      }
                      placeholderTextColor="#9CA3AF"
                      value={answers[question._id] || ""}
                      onChangeText={(text) =>
                        handleAnswerChange(question._id, text)
                      }
                      onBlur={() => {
                        // Auto-scroll to next question when user finishes typing
                        if (answers[question._id] && !hasAnswered) {
                          scrollToNextQuestion(question._id);
                        }
                      }}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      editable={!hasAnswered}
                    />
                  ) : question.options && question.options.length > 0 ? (
                    question.options.length >= 6 ? (
                      <View style={styles.optionsContainerWithSearch}>
                        <View style={styles.searchContainer}>
                          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                          <TextInput
                            style={styles.searchInput}
                            placeholder="Search options..."
                            placeholderTextColor="#9CA3AF"
                            value={optionSearchQueries[question._id] || ""}
                            onChangeText={(text) => handleOptionSearchChange(question._id, text)}
                            editable={!hasAnswered}
                          />
                          {optionSearchQueries[question._id] && (
                            <TouchableOpacity
                              onPress={() => handleOptionSearchChange(question._id, "")}
                              style={styles.clearSearchButton}
                            >
                              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                          )}
                        </View>
                        <ScrollView 
                          style={styles.optionsScrollView}
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={false}
                        >
                          <View style={[styles.optionsContainer, styles.optionsContainerTwoColumns]}>
                            {getFilteredOptions(question._id, question.options).map((option, optIndex) => {
                              const isSelected = isOptionSelected(
                                question._id,
                                option,
                                question.type
                              );
                              const isMultiple =
                                question.type === "multiple_choice" ||
                                question.type === "checkbox";

                              return (
                                <TouchableOpacity
                                  key={optIndex}
                                  style={[
                                    styles.optionButton,
                                    styles.optionButtonTwoColumns,
                                    isSelected && styles.optionButtonSelected,
                                    hasAnswered && styles.optionButtonReadOnly,
                                  ]}
                                  onPress={() =>
                                    handleOptionSelect(
                                      question._id,
                                      option,
                                      question.type
                                    )
                                  }
                                  disabled={hasAnswered}
                                >
                                  <Ionicons
                                    name={
                                      isMultiple
                                        ? isSelected
                                          ? "checkbox"
                                          : "checkbox-outline"
                                        : isSelected
                                        ? "radio-button-on"
                                        : "radio-button-off"
                                    }
                                    size={20}
                                    color={isSelected ? "#4A63D8" : "#9CA3AF"}
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
                      <View style={[
                        styles.optionsContainer, 
                        question.options && question.options.length >= 2 && styles.optionsContainerTwoColumns
                      ]}>
                        {question.options.map((option, optIndex) => {
                          const isSelected = isOptionSelected(
                            question._id,
                            option,
                            question.type
                          );
                          const isMultiple =
                            question.type === "multiple_choice" ||
                            question.type === "checkbox";

                          const shouldUseTwoColumns = question.options && question.options.length >= 2;

                          return (
                            <TouchableOpacity
                              key={optIndex}
                              style={[
                                styles.optionButton,
                                shouldUseTwoColumns && styles.optionButtonTwoColumns,
                                isSelected && styles.optionButtonSelected,
                                hasAnswered && styles.optionButtonReadOnly,
                              ]}
                              onPress={() =>
                                handleOptionSelect(
                                  question._id,
                                  option,
                                  question.type
                                )
                              }
                              disabled={hasAnswered}
                            >
                              <Ionicons
                                name={
                                  isMultiple
                                    ? isSelected
                                      ? "checkbox"
                                      : "checkbox-outline"
                                    : isSelected
                                    ? "radio-button-on"
                                    : "radio-button-off"
                                }
                                size={20}
                                color={isSelected ? "#4A63D8" : "#9CA3AF"}
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

          {/* Spacer for fixed completed section */}
          {hasAnswered && userResponse && <View style={styles.bottomSpacer} />}
          {/* Spacer for submit button */}
          {!hasAnswered && <View style={styles.bottomSpacerSubmit} />}
        </ScrollView>

        {/* Submit Button - Only show if survey hasn't been answered */}
        {!hasAnswered && (
          <View style={[styles.fixedButtonContainer, { bottom: bottomNavHeight }]}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <LinearGradient
                colors={["#5FA9F5", "#4A63D8", "#8A4DE8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>Submit Survey</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Fixed Survey Completed Section - Only show if survey has been answered */}
        {hasAnswered && userResponse && (
          <View style={[styles.fixedCompletedSection, { bottom: bottomNavHeight }]}>
            <LinearGradient
              colors={["#F0F9FF", "#EFF6FF", "#F0F9FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completedSectionGradient}
            >
              <View style={styles.completedInfoHeader}>
                <View style={styles.completedIconContainer}>
                  <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.completedSectionTitle}>
                  Survey completed on {new Date(userResponse.submittedAt || "").toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.completedInfoGrid}>
                <View style={styles.completedInfoItem}>
                  <Text style={styles.completedInfoNumber}>
                    {Math.round((userResponse.durationMs || 0) / 60000)}
                  </Text>
                  <Text style={styles.completedInfoLabel}>Minutes</Text>
                </View>
                <View style={styles.completedInfoItem}>
                  <Text style={styles.completedInfoNumber}>+{survey.rewardPoints}</Text>
                  <Text style={styles.completedInfoLabel}>Points</Text>
                </View>
                <View style={styles.completedInfoItem}>
                  <Text style={styles.completedInfoNumber}>
                    {questions.filter((q) => answers[q._id]).length}
                  </Text>
                  <Text style={styles.completedInfoLabel}>Answered</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
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
    borderRadius: 12,
    overflow: "hidden",
  },
  retryButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
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
  surveyInfo: {
    padding: 24,
    paddingBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4A63D8",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  questionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 16,
  },
  emptyQuestions: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyQuestionsText: {
    marginTop: 8,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A63D8",
  },
  requiredBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#EEF5FF",
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4A63D8",
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 12,
    lineHeight: 24,
  },
  questionType: {
    marginBottom: 12,
  },
  questionTypeText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    minHeight: 100,
    marginTop: 12,
  },
  optionsContainer: {
    marginTop: 12,
    gap: 10,
  },
  optionsContainerTwoColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionsContainerWithSearch: {
    marginTop: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#222222",
    paddingVertical: 10,
  },
  clearSearchButton: {
    padding: 4,
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
  optionButtonSelected: {
    borderColor: "#4A63D8",
    backgroundColor: "#EEF5FF",
  },
  optionButtonText: {
    fontSize: 14,
    color: "#222222",
    marginLeft: 12,
    flex: 1,
  },
  optionButtonTextSelected: {
    color: "#4A63D8",
    fontWeight: "600",
  },
  fixedButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  submitButton: {
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
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
    minHeight: 58,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  fixedCompletedSection: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 5,
    zIndex: 10,
  },
  completedSectionGradient: {
    borderRadius: 22,
    padding: 14,
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  completedInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  completedIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  completedSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  completedInfoGrid: {
    flexDirection: "row",
    gap: 10,
  },
  completedInfoItem: {
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
  completedInfoNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  completedInfoLabel: {
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
  scrollContentWithCompleted: {
    paddingBottom: 102,
  },
  scrollContentWithSubmit: {
    paddingBottom: 70,
  },
  bottomSpacerSubmit: {
    height: 70,
  },
  textInputReadOnly: {
    backgroundColor: "#F3F4F6",
    color: "#505050",
  },
  optionButtonReadOnly: {
    opacity: 0.7,
  },
});
