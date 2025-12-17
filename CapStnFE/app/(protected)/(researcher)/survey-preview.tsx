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

export default function SurveyPreview() {
  const router = useRouter();
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
          <ActivityIndicator size="large" color="#3B82F6" />
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
          <Ionicons name="eye-outline" size={16} color="#3B82F6" />
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
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text style={styles.metadataText}>
                {survey.estimatedMinutes} min
              </Text>
              <Ionicons name="pencil" size={14} color="#3B82F6" style={styles.editIcon} />
            </TouchableOpacity>

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

                {question.options && question.options.length > 0 && (
                  <View style={styles.optionsContainer}>
                    <Text style={styles.optionsLabel}>Options:</Text>
                    {question.options.map((option, optIndex) => (
                      <View key={optIndex} style={styles.optionItem}>
                        <Ionicons
                          name={
                            question.type === "single_choice"
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
            ))
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
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
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.publishButtonText}>Publish</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
            disabled={actionLoading}
          >
            <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
            <Text style={styles.editButtonText}>Edit</Text>
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
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    marginBottom: 16,
    gap: 6,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  editIcon: {
    marginLeft: 4,
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
  archiveButton: {
    backgroundColor: "#F3F4F6",
  },
  archiveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  publishButton: {
    backgroundColor: "#10B981",
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  editButton: {
    backgroundColor: "#EFF6FF",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#3B82F6",
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
