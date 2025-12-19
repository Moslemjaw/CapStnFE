import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getSurveyById, publishSurvey, unpublishSurvey, updateSurvey } from "@/api/surveys";
import { getQuestionsBySurveyId } from "@/api/questions";
import { Survey } from "@/api/surveys";
import { Question } from "@/api/questions";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export default function SurveyPreview() {
  const router = useRouter();
  const bottomNavHeight = useBottomNavHeight();
  const { surveyId } = useLocalSearchParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTimeEditModal, setShowTimeEditModal] = useState(false);
  const [editedMinutes, setEditedMinutes] = useState("");

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

  const handleArchive = async () => {
    if (!surveyId || !survey) return;

    setActionLoading(true);
    try {
      // Only call unpublishSurvey if the survey is currently published
      if (survey.draft === "published") {
        await unpublishSurvey(surveyId);
      }
      
      // Navigate to success page (replace to prevent going back to preview)
      router.replace({
        pathname: "/(protected)/(researcher)/survey-archive-success",
        params: {
          surveyId: surveyId,
          questionCount: questions.length.toString(),
          points: survey.rewardPoints.toString(),
          estimatedMinutes: survey.estimatedMinutes.toString(),
        },
      } as any);
    } catch (err: any) {
      console.error("Error archiving survey:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || err.message || "Failed to archive survey. Please try again."
      );
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!surveyId || !survey) return;

    setActionLoading(true);
    try {
      await publishSurvey(surveyId);
      
      // Navigate to success page (replace to prevent going back to preview)
      // Don't update state before navigation to avoid button being disabled
      router.replace({
        pathname: "/(protected)/(researcher)/survey-publish-success",
        params: {
          surveyId: surveyId,
          questionCount: questions.length.toString(),
          points: survey.rewardPoints.toString(),
          estimatedMinutes: survey.estimatedMinutes.toString(),
        },
      } as any);
    } catch (err: any) {
      console.error("Error publishing survey:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || err.message || "Failed to publish survey. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = () => {
    if (!surveyId) return;
    router.push({
      pathname: "/(protected)/(researcher)/create-survey",
      params: { surveyId: surveyId },
    } as any);
  };

  const openTimeEditModal = () => {
    if (survey) {
      setEditedMinutes(survey.estimatedMinutes.toString());
      setShowTimeEditModal(true);
    }
  };

  const saveTimeEdit = async () => {
    if (!surveyId || !survey) return;

    const minutes = parseInt(editedMinutes, 10);
    if (isNaN(minutes) || minutes < 1) {
      Alert.alert("Error", "Please enter a valid number (at least 1)");
      return;
    }

    setActionLoading(true);
    try {
      const updatedSurvey = await updateSurvey(surveyId, {
        estimatedMinutes: minutes,
      });
      setSurvey(updatedSurvey);
      setShowTimeEditModal(false);
      Alert.alert("Success", "Estimated time updated successfully!");
    } catch (err: any) {
      console.error("Error updating time:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || err.message || "Failed to update time. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4A63D8" />
          <Text style={styles.loadingText}>Loading preview...</Text>
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
        {/* Preview Badge */}
        <View style={styles.previewBadge}>
          <Ionicons name="eye-outline" size={18} color="#2BB6E9" />
          <Text style={styles.previewBadgeText}>Preview</Text>
        </View>

        {/* Survey Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{survey.title}</Text>
          {survey.description && (
            <Text style={styles.description}>{survey.description}</Text>
          )}

          <View style={styles.metadata}>
            <TouchableOpacity
              style={styles.metadataItem}
              onPress={openTimeEditModal}
            >
              <Ionicons name="time-outline" size={18} color="#4B5563" />
              <Text style={styles.metadataText}>
                {survey.estimatedMinutes} min
              </Text>
              <Ionicons name="pencil" size={14} color="#2BB6E9" style={styles.editIcon} />
            </TouchableOpacity>

            <View style={styles.metadataItem}>
              <Ionicons name="list-outline" size={18} color="#4B5563" />
              <Text style={styles.metadataText}>
                {questions.length} questions
              </Text>
            </View>

            <View style={styles.metadataItem}>
              <Ionicons name="star-outline" size={18} color="#8A4DE8" />
              <Text style={[styles.metadataText, styles.pointsText]}>
                {survey.rewardPoints} pts
              </Text>
            </View>
          </View>
        </View>

        {/* Questions Section */}
        <View style={styles.questionsSection}>
          <Text style={styles.sectionTitle}>Questions</Text>

          {questions.length === 0 ? (
            <View style={styles.emptyQuestions}>
              <Ionicons name="help-circle-outline" size={32} color="#9CA3AF" />
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

                <View style={styles.questionType}>
                  <Text style={styles.questionTypeText}>
                    Type: {getQuestionTypeLabel(question.type)}
                  </Text>
                </View>

                {question.options && question.options.length > 0 ? (
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
            ))
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { paddingBottom: bottomNavHeight + 8 }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.archiveButton]}
            onPress={handleArchive}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <>
                <Ionicons name="archive-outline" size={18} color="#6B7280" />
                <Text style={styles.archiveButtonText}>Archive</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.publishButton]}
            onPress={handlePublish}
            disabled={actionLoading || survey?.draft === "published"}
          >
            <LinearGradient
              colors={["#5FA9F5", "#4A63D8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.publishButtonGradient}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.publishButtonText}>Publish</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
            disabled={actionLoading}
          >
            <LinearGradient
              colors={["#2BB6E9", "#35E0E6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.editButtonGradient}
            >
              <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Edit Modal */}
      <Modal
        visible={showTimeEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimeEditModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTimeEditModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Estimated Time</Text>
              <TouchableOpacity onPress={() => setShowTimeEditModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Estimated Minutes</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter estimated time in minutes"
                placeholderTextColor="#9CA3AF"
                value={editedMinutes}
                onChangeText={(text) => setEditedMinutes(text.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTimeEditModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveTimeEdit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save</Text>
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
    backgroundColor: "#FFFFFF",
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F0F9FF",
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  previewBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2BB6E9",
    letterSpacing: 0.3,
  },
  header: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 26,
    marginBottom: 20,
    fontWeight: "400",
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  editIcon: {
    marginLeft: 6,
  },
  metadataText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600",
  },
  pointsText: {
    color: "#8A4DE8",
    fontWeight: "700",
  },
  questionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  emptyQuestions: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyQuestionsText: {
    marginTop: 12,
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    fontWeight: "500",
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    shadowColor: "#4A63D8",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5FA9F5",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  requiredBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  requiredText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2BB6E9",
    letterSpacing: 0.3,
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  questionType: {
    marginBottom: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  questionTypeText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  footer: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1.5,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
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
    gap: 8,
    borderWidth: 1.5,
  },
  archiveButton: {
    backgroundColor: "#FAFBFC",
    borderColor: "#E5E7EB",
  },
  archiveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
  },
  publishButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  publishButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 8,
  },
  publishButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  editButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  editButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 8,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FAFBFC",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  modalBody: {
    padding: 24,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 24,
    borderTopWidth: 1.5,
    borderTopColor: "#E5E7EB",
    gap: 12,
    backgroundColor: "#FAFBFC",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#4A63D8",
    borderWidth: 1.5,
    borderColor: "#4338CA",
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
