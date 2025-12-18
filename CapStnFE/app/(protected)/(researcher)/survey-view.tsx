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
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
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

export default function SurveyView() {
  const router = useRouter();
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

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleOptionSelect = (
    questionId: string,
    option: string,
    questionType: Question["type"]
  ) => {
    if (questionType === "single_choice" || questionType === "dropdown") {
      // Single selection
      handleAnswerChange(questionId, option);
    } else if (
      questionType === "multiple_choice" ||
      questionType === "checkbox"
    ) {
      // Multiple selection - toggle option
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
          <ActivityIndicator size="large" color="#3B82F6" />
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
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Survey Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{survey.title}</Text>
            {survey.description && (
              <Text style={styles.description}>{survey.description}</Text>
            )}

            <View style={styles.metadata}>
              <View style={styles.metadataItem}>
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text style={styles.metadataText}>
                  {survey.estimatedMinutes} min
                </Text>
              </View>

              <View style={styles.metadataItem}>
                <Ionicons name="list-outline" size={18} color="#6B7280" />
                <Text style={styles.metadataText}>
                  {questions.length} questions
                </Text>
              </View>

              <View style={styles.metadataItem}>
                <Ionicons name="star-outline" size={18} color="#F59E0B" />
                <Text style={[styles.metadataText, styles.pointsText]}>
                  {survey.rewardPoints} pts
                </Text>
              </View>
            </View>

            {/* Already Completed Banner */}
            {hasAnswered && userResponse && (
              <View style={styles.completedBanner}>
                <View style={styles.completedHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <View style={styles.completedTextContainer}>
                    <Text style={styles.completedTitle}>Survey Completed</Text>
                    <Text style={styles.completedSubtext}>
                      Viewing your response from{" "}
                      {new Date(
                        userResponse.submittedAt || ""
                      ).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.completedStats}>
                  <View style={styles.completedStat}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.completedStatText}>
                      Took {Math.round((userResponse.durationMs || 0) / 60000)}{" "}
                      min
                    </Text>
                  </View>
                  <View style={styles.completedStat}>
                    <Ionicons name="trophy" size={14} color="#F59E0B" />
                    <Text style={styles.completedStatText}>
                      +{survey.rewardPoints} pts earned
                    </Text>
                  </View>
                </View>
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
                <View key={question._id} style={styles.questionCard}>
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
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      editable={!hasAnswered}
                    />
                  ) : question.options && question.options.length > 0 ? (
                    <View style={styles.optionsContainer}>
                      {question.options.map((option, optIndex) => {
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
                              color={isSelected ? "#3B82F6" : "#6B7280"}
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
                  ) : null}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.answerButton,
              (submitting || hasAnswered) && styles.answerButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || hasAnswered}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.answerButtonText}>
                {hasAnswered ? "Already Answered" : "Submit"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 16,
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    color: "#6B7280",
  },
  pointsText: {
    color: "#F59E0B",
    fontWeight: "600",
  },
  questionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
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
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  requiredBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#D97706",
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
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
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  optionButtonSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  optionButtonText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    flex: 1,
  },
  optionButtonTextSelected: {
    color: "#1E40AF",
    fontWeight: "500",
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  answerButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    minHeight: 48,
  },
  answerButtonDisabled: {
    opacity: 0.6,
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  completedBanner: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  completedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  completedTextContainer: {
    flex: 1,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 2,
  },
  completedSubtext: {
    fontSize: 13,
    color: "#047857",
  },
  completedStats: {
    flexDirection: "row",
    gap: 16,
  },
  completedStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  completedStatText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  textInputReadOnly: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
  },
  optionButtonReadOnly: {
    opacity: 0.7,
  },
});
