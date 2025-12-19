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
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getSurveyById, deleteSurvey } from "@/api/surveys";
import { getQuestionsBySurveyId } from "@/api/questions";
import { getResponsesBySurveyId, Response } from "@/api/responses";
import { Survey } from "@/api/surveys";
import { Question } from "@/api/questions";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export default function SurveyDetails() {
  const router = useRouter();
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

      // Sort questions by order
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
      case "text":
        return "Text Answer";
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
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading survey details...</Text>
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Survey Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Survey Details</Text>
          <View style={styles.detailsCard}>
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

              <View style={styles.metadataItem}>
                <Ionicons
                  name={
                    survey.draft === "published"
                      ? "checkmark-circle"
                      : "archive"
                  }
                  size={18}
                  color={survey.draft === "published" ? "#10B981" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.metadataText,
                    survey.draft === "published" && styles.publishedText,
                  ]}
                >
                  {survey.draft === "published" ? "Published" : "Unpublished"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Responses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Responses</Text>
            <View style={styles.responseCountBadge}>
              <Text style={styles.responseCountText}>{responses.length}</Text>
            </View>
          </View>

          {responses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#9CA3AF" />
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
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>

                <View style={styles.responseInfo}>
                  <View style={styles.responseInfoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.responseInfoText}>
                      Submitted: {formatDate(response.submittedAt)}
                    </Text>
                  </View>
                  <View style={styles.responseInfoRow}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.responseInfoText}>
                      Duration: {formatDuration(response.durationMs)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { paddingBottom: bottomNavHeight + 16 }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.previewButton]}
            onPress={() => setShowPreviewModal(true)}
          >
            <Ionicons name="eye-outline" size={18} color="#3B82F6" />
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => setShowDeleteModal(true)}
            disabled={actionLoading}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
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
            <Text style={styles.modalTitle}>Survey Preview</Text>
            <TouchableOpacity
              onPress={() => setShowPreviewModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>{survey.title}</Text>
              {survey.description && (
                <Text style={styles.previewDescription}>
                  {survey.description}
                </Text>
              )}
            </View>

            <View style={styles.previewQuestions}>
              {questions.map((question, index) => (
                <View key={question._id} style={styles.previewQuestionCard}>
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

                  <View style={styles.questionType}>
                    <Text style={styles.questionTypeText}>
                      Type: {getQuestionTypeLabel(question.type)}
                    </Text>
                  </View>

                  {question.options && question.options.length > 0 && (
                    <View style={styles.optionsContainer}>
                      <Text style={styles.optionsLabel}>Options:</Text>
                      {question.options.map((option, optIndex) => (
                        <View key={optIndex} style={styles.optionItem}>
                          <Ionicons
                            name={
                              question.type === "single_choice" ||
                              question.type === "dropdown"
                                ? "radio-button-on"
                                : "checkbox-outline"
                            }
                            size={16}
                            color="#6B7280"
                          />
                          <Text style={styles.optionText}>{option}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
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
            <Text style={styles.modalTitle}>
              Response #{selectedResponse ? responses.findIndex((r) => r._id === selectedResponse._id) + 1 : ""}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowResponsePreviewModal(false);
                setSelectedResponse(null);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedResponse && (
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.responsePreviewHeader}>
                <View style={styles.responsePreviewMeta}>
                  <View style={styles.responsePreviewMetaItem}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.responsePreviewMetaText}>
                      {formatDate(selectedResponse.submittedAt)}
                    </Text>
                  </View>
                  <View style={styles.responsePreviewMetaItem}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.responsePreviewMetaText}>
                      {formatDuration(selectedResponse.durationMs)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.previewQuestions}>
                {questions.map((question, index) => {
                  const answer = getAnswerForQuestion(selectedResponse, question._id);
                  return (
                    <View key={question._id} style={styles.previewQuestionCard}>
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

                      <View style={styles.questionType}>
                        <Text style={styles.questionTypeText}>
                          Type: {getQuestionTypeLabel(question.type)}
                        </Text>
                      </View>

                      {/* Answer Display */}
                      <View style={styles.answerDisplayContainer}>
                        <Text style={styles.answerDisplayLabel}>Answer:</Text>
                        {question.type === "text" ? (
                          <Text style={styles.answerDisplayText}>{answer}</Text>
                        ) : question.options && question.options.length > 0 ? (
                          <View style={styles.answerOptionsDisplay}>
                            {question.options.map((option, optIndex) => {
                              const isSelected = answer
                                .split(",")
                                .includes(option);
                              return (
                                <View
                                  key={optIndex}
                                  style={[
                                    styles.answerOptionDisplay,
                                    isSelected && styles.answerOptionDisplaySelected,
                                  ]}
                                >
                                  <Ionicons
                                    name={
                                      question.type === "single_choice" ||
                                      question.type === "dropdown"
                                        ? isSelected
                                          ? "radio-button-on"
                                          : "radio-button-off"
                                        : isSelected
                                        ? "checkbox"
                                        : "checkbox-outline"
                                    }
                                    size={16}
                                    color={isSelected ? "#3B82F6" : "#9CA3AF"}
                                  />
                                  <Text
                                    style={[
                                      styles.answerOptionText,
                                      isSelected && styles.answerOptionTextSelected,
                                    ]}
                                  >
                                    {option}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                          <Text style={styles.answerDisplayText}>{answer}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
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
        <Pressable
          style={styles.deleteModalOverlay}
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable
            style={styles.deleteModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={48} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Delete Survey</Text>
              <Text style={styles.deleteModalText}>
                Are you sure you want to delete "{survey.title}"? This action
                cannot be undone.
              </Text>
            </View>

            <View style={styles.deleteModalFooter}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
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
  publishedText: {
    color: "#10B981",
    fontWeight: "600",
  },
  responseCountBadge: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  responseCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
  },
  responseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  responseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  responseNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  responseInfo: {
    gap: 8,
  },
  responseInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  responseInfoText: {
    fontSize: 14,
    color: "#6B7280",
  },
  responsePreviewHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  responsePreviewMeta: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  responsePreviewMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  responsePreviewMetaText: {
    fontSize: 14,
    color: "#6B7280",
  },
  answerDisplayContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  answerDisplayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  answerDisplayText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },
  answerOptionsDisplay: {
    gap: 8,
  },
  answerOptionDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  answerOptionDisplaySelected: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  answerOptionText: {
    fontSize: 14,
    color: "#6B7280",
  },
  answerOptionTextSelected: {
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
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  previewButton: {
    backgroundColor: "#EFF6FF",
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
  },
  previewHeader: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  previewDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  previewQuestions: {
    marginBottom: 24,
  },
  previewQuestionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
  optionsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  optionsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  optionText: {
    fontSize: 14,
    color: "#6B7280",
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  deleteModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteModalHeader: {
    alignItems: "center",
    padding: 24,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  deleteModalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#EF4444",
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

