import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getSurveyById, deleteSurvey } from "@/api/surveys";
import { getQuestionsBySurveyId } from "@/api/questions";
import { getResponsesBySurveyId, Response } from "@/api/responses";
import { Survey } from "@/api/surveys";
import { Question } from "@/api/questions";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";
import { SurveyDetailsSkeleton } from "@/components/Skeleton";
import { Colors, Typography, Spacing, Shadows } from "@/constants/design";

export default function SurveyDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const { surveyId } = useLocalSearchParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResponsePreviewModal, setShowResponsePreviewModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);

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
      setResponses(responsesData);
    } catch (err: any) {
      console.error("Error loading survey data:", err);
      setError(err.message || "Failed to load survey");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!surveyId) return;

    setActionLoading(true);
    try {
      await deleteSurvey(surveyId);
      setShowDeleteModal(false);
      Alert.alert("Success", "Survey deleted successfully", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (err: any) {
      console.error("Error deleting survey:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message ||
          err.message ||
          "Failed to delete survey. Please try again."
      );
      setActionLoading(false);
    }
  };

  const getQuestionTypeLabel = (type: Question["type"]) => {
    switch (type) {
      case "text": return "Text Answer";
      case "multiple_choice": return "Multiple Choice";
      case "single_choice": return "Single Choice";
      case "dropdown": return "Dropdown";
      case "checkbox": return "Checkbox";
      default: return type;
    }
  };

  const getAnswerForQuestion = (response: Response, questionId: string) => {
    const answer = response.answers.find((a) => a.questionId === questionId);
    return answer?.value || "No answer";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return <SurveyDetailsSkeleton />;
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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Survey Details</Text>
            <Text style={styles.headerSubtitle}>View and manage survey</Text>
          </View>
          <Image
            source={require("@/assets/title.png")}
            style={styles.titleImage}
            resizeMode="contain"
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Survey Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.surveyTitle}>{survey.title}</Text>
            {survey.description && (
              <Text style={styles.surveyDescription}>{survey.description}</Text>
            )}

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color={Colors.text.secondary} />
                <Text style={styles.metaText}>{survey.estimatedMinutes} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="list-outline" size={18} color={Colors.text.secondary} />
                <Text style={styles.metaText}>{questions.length} questions</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="star-outline" size={18} color={Colors.semantic.warning} />
                <Text style={[styles.metaText, { color: Colors.semantic.warning, fontFamily: Typography.fontFamily.semiBold }]}>
                  {survey.rewardPoints} pts
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name={survey.draft === "published" ? "checkmark-circle" : "archive"}
                  size={18}
                  color={survey.draft === "published" ? Colors.semantic.success : Colors.text.secondary}
                />
                <Text
                  style={[
                    styles.metaText,
                    survey.draft === "published" && { color: Colors.semantic.success, fontFamily: Typography.fontFamily.semiBold },
                  ]}
                >
                  {survey.draft === "published" ? "Published" : "Unpublished"}
                </Text>
              </View>
            </View>
          </View>

          {/* Responses Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Responses</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{responses.length}</Text>
              </View>
            </View>

            {responses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={40} color={Colors.text.tertiary} />
                <Text style={styles.emptyStateText}>No responses yet</Text>
              </View>
            ) : (
              responses.map((response, index) => (
                <TouchableOpacity
                  key={response._id}
                  style={styles.responseCard}
                  onPress={() => {
                    setSelectedResponse(response);
                    setShowResponsePreviewModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.responseHeader}>
                    <Text style={styles.responseNumber}>Response #{index + 1}</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
                  </View>
                  <View style={styles.responseInfo}>
                    <View style={styles.responseInfoRow}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.text.tertiary} />
                      <Text style={styles.responseInfoText}>{formatDate(response.submittedAt)}</Text>
                    </View>
                    <View style={styles.responseInfoRow}>
                      <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
                      <Text style={styles.responseInfoText}>{formatDuration(response.durationMs)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { paddingBottom: bottomNavHeight + Spacing.md }]}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => setShowPreviewModal(true)}
          >
            <Ionicons name="eye-outline" size={18} color={Colors.primary.blue} />
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
            disabled={actionLoading}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.semantic.error} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Preview Modal */}
        <Modal
          visible={showPreviewModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPreviewModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{survey?.title || "Survey"}</Text>
                <Text style={styles.modalSubtitle}>Preview</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
              {survey?.description && (
                <Text style={styles.modalDescription}>{survey.description}</Text>
              )}

              <Text style={styles.modalSectionTitle}>Questions</Text>

              {questions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="help-circle-outline" size={32} color={Colors.text.tertiary} />
                  <Text style={styles.emptyStateText}>No questions available</Text>
                </View>
              ) : (
                questions.map((question, index) => (
                  <View key={question._id} style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionNumber}>Question {index + 1}</Text>
                      {question.isRequired && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredBadgeText}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.questionText}>{question.text}</Text>

                    {question.options && question.options.length > 0 && (
                      <View style={styles.optionsContainer}>
                        {question.options.map((option, optIndex) => {
                          const isMultiple =
                            question.type === "multiple_choice" || question.type === "checkbox";
                          return (
                            <View key={optIndex} style={styles.optionItem}>
                              <Ionicons
                                name={isMultiple ? "checkbox-outline" : "radio-button-off"}
                                size={18}
                                color={Colors.text.tertiary}
                              />
                              <Text style={styles.optionText}>{option}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Response Preview Modal */}
        <Modal
          visible={showResponsePreviewModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowResponsePreviewModal(false);
            setSelectedResponse(null);
          }}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.responsePreviewMeta}>
                {selectedResponse && (
                  <>
                    <View style={styles.responseMetaItem}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.text.tertiary} />
                      <Text style={styles.responseMetaText}>{formatDate(selectedResponse.submittedAt)}</Text>
                    </View>
                    <View style={styles.responseMetaItem}>
                      <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
                      <Text style={styles.responseMetaText}>{formatDuration(selectedResponse.durationMs)}</Text>
                    </View>
                  </>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowResponsePreviewModal(false);
                  setSelectedResponse(null);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {selectedResponse && (
              <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
                {questions.map((question, index) => {
                  const answer = getAnswerForQuestion(selectedResponse, question._id);
                  return (
                    <View key={question._id} style={styles.questionCard}>
                      <View style={styles.questionHeader}>
                        <Text style={styles.questionNumber}>Question {index + 1}</Text>
                        {question.isRequired && (
                          <View style={styles.requiredBadge}>
                            <Text style={styles.requiredBadgeText}>Required</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.questionText}>{question.text}</Text>

                      <View style={styles.answerContainer}>
                        <Text style={styles.answerLabel}>Answer:</Text>
                        {question.type === "text" ? (
                          <Text style={styles.answerText}>{answer}</Text>
                        ) : question.options && question.options.length > 0 ? (
                          <View style={styles.answerOptions}>
                            {question.options.map((option, optIndex) => {
                              const isSelected = answer.split(",").includes(option);
                              return (
                                <View
                                  key={optIndex}
                                  style={[styles.answerOption, isSelected && styles.answerOptionSelected]}
                                >
                                  <Ionicons
                                    name={
                                      question.type === "single_choice" || question.type === "dropdown"
                                        ? isSelected ? "radio-button-on" : "radio-button-off"
                                        : isSelected ? "checkbox" : "checkbox-outline"
                                    }
                                    size={16}
                                    color={isSelected ? Colors.primary.blue : Colors.text.tertiary}
                                  />
                                  <Text style={[styles.answerOptionText, isSelected && styles.answerOptionTextSelected]}>
                                    {option}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                          <Text style={styles.answerText}>{answer}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <Pressable style={styles.deleteModalOverlay} onPress={() => setShowDeleteModal(false)}>
            <Pressable style={styles.deleteModalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.deleteModalHeader}>
                <Ionicons name="warning" size={48} color={Colors.semantic.error} />
                <Text style={styles.deleteModalTitle}>Delete Survey</Text>
                <Text style={styles.deleteModalText}>
                  Are you sure you want to delete "{survey.title}"? This action cannot be undone.
                </Text>
              </View>

              <View style={styles.deleteModalFooter}>
                <TouchableOpacity style={styles.deleteModalCancelButton} onPress={() => setShowDeleteModal(false)}>
                  <Text style={styles.deleteModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteModalConfirmButton}
                  onPress={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={Colors.background.primary} />
                  ) : (
                    <Text style={styles.deleteModalConfirmText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
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
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerContent: {
    flex: 1,
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
  titleImage: {
    height: 28,
    width: 94,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.padding,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  surveyTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  surveyDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.h4,
    color: Colors.text.primary,
  },
  countBadge: {
    backgroundColor: Colors.primary.blue,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.button.borderRadiusPill,
  },
  countBadgeText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.background.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  emptyStateText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  responseCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.paddingSmall,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  responseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  responseNumber: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.primary.blue,
  },
  responseInfo: {
    gap: 6,
  },
  responseInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  responseInfoText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  previewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface.blueTint,
    paddingVertical: Spacing.button.paddingVerticalSmall,
    borderRadius: Spacing.button.borderRadius,
    gap: 6,
  },
  previewButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.primary.blue,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.semantic.errorLight,
    paddingVertical: Spacing.button.paddingVerticalSmall,
    borderRadius: Spacing.button.borderRadius,
    gap: 6,
  },
  deleteButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.semantic.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h3,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  modalDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  modalSectionTitle: {
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
    paddingVertical: 3,
    paddingHorizontal: Spacing.xs,
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
  optionsContainer: {
    gap: Spacing.xs,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Spacing.button.borderRadiusSmall,
  },
  optionText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
  },
  responsePreviewMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
    flex: 1,
  },
  responseMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  responseMetaText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  answerContainer: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: Spacing.button.borderRadiusSmall,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  answerLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  answerText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  answerOptions: {
    gap: Spacing.xs,
  },
  answerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.xs,
    borderRadius: 6,
    backgroundColor: Colors.background.primary,
  },
  answerOptionSelected: {
    backgroundColor: Colors.surface.blueTint,
    borderWidth: 1,
    borderColor: Colors.primary.blue,
  },
  answerOptionText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
  },
  answerOptionTextSelected: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary.blue,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  deleteModalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    width: "100%",
    maxWidth: 400,
    ...Shadows.lg,
  },
  deleteModalHeader: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  deleteModalTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h4,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  deleteModalText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  deleteModalFooter: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: Spacing.sm,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.button.paddingVerticalSmall,
    borderRadius: Spacing.button.borderRadius,
    alignItems: "center",
    backgroundColor: Colors.background.tertiary,
  },
  deleteModalCancelText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: Spacing.button.paddingVerticalSmall,
    borderRadius: Spacing.button.borderRadius,
    alignItems: "center",
    backgroundColor: Colors.semantic.error,
  },
  deleteModalConfirmText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.background.primary,
  },
});
