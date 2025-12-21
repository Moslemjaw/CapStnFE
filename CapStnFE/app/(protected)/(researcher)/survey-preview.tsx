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
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{survey?.title || "Survey"}</Text>
            <Text style={styles.headerSubtitle}>Survey preview</Text>
          </View>
          <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Mode Banner */}
        <View style={styles.previewBanner}>
          <Ionicons name="eye-outline" size={20} color="#8A4DE8" />
          <View style={styles.previewBannerTextContainer}>
            <Text style={styles.previewBannerTitle}>Preview Mode</Text>
            <Text style={styles.previewBannerSubtitle}>
              This is how your survey will appear to respondents.
            </Text>
          </View>
        </View>

        {/* Survey Header */}
        <View style={styles.surveyHeader}>
          <View style={styles.surveyHeaderIcon}>
            <Ionicons name="document-text-outline" size={32} color="#5FA9F5" />
          </View>
          {survey.description && survey.description.trim() && (
            <Text style={styles.surveyDescription}>{survey.description}</Text>
          )}
        </View>

        {/* Survey Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>SURVEY SUMMARY</Text>
          <View style={styles.summaryModules}>
            <View style={styles.summaryModule}>
              <Ionicons name="list-outline" size={24} color="#4A63D8" />
              <Text style={styles.moduleValue}>{questions.length}</Text>
              <Text style={styles.moduleLabel}>Questions</Text>
            </View>

            <TouchableOpacity style={styles.summaryModule} onPress={openTimeEditModal}>
              <View style={styles.timeIconContainer}>
                <Ionicons name="time-outline" size={24} color="#2BB6E9" />
                <Ionicons name="pencil" size={10} color="#2BB6E9" style={styles.timeEditIcon} />
              </View>
              <Text style={styles.moduleValue}>~{survey.estimatedMinutes}</Text>
              <Text style={styles.moduleLabel}>Minutes</Text>
            </TouchableOpacity>

            <View style={styles.summaryModule}>
              <Ionicons name="star-outline" size={24} color="#F59E0B" />
              <Text style={styles.moduleValue}>+{survey.rewardPoints}</Text>
              <Text style={styles.moduleLabel}>Points</Text>
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
                  <View style={styles.questionNumberBadge}>
                    <Text style={styles.questionNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.questionHeaderRight}>
                    {question.isRequired && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>REQUIRED</Text>
                      </View>
                    )}
                    <Text style={styles.questionTypeLabel}>
                      {question.type === "text" 
                        ? "Numeric input" 
                        : question.type === "multiple_choice"
                        ? "Single choice"
                        : "Single choice"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.questionText}>{question.text}</Text>

                {question.options && question.options.length > 0 ? (
                  <View style={styles.optionsContainer}>
                    {question.options.map((option, optIndex) => (
                      <View key={optIndex} style={styles.optionButton}>
                        <View style={styles.optionRadio}>
                          <View style={styles.optionRadioDot} />
                        </View>
                        <Text style={styles.optionButtonText}>{option}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.textInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter number..."
                      placeholderTextColor="#9CA3AF"
                      editable={false}
                    />
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { paddingBottom: bottomNavHeight + 8 }]}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
          disabled={actionLoading}
        >
          <LinearGradient
            colors={["#A23DD8", "#D13DB8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.editButtonGradient}
          >
            <Ionicons name="pencil-outline" size={20} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Survey</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.publishButton}
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
                  <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.publishButtonText}>Publish</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.archiveButton}
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
    padding: 24,
  },
  previewBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  previewBannerTextContainer: {
    flex: 1,
  },
  previewBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8A4DE8",
    marginBottom: 2,
  },
  previewBannerSubtitle: {
    fontSize: 12,
    color: "#A23DD8",
    lineHeight: 16,
  },
  surveyHeader: {
    marginBottom: 32,
    alignItems: "center",
  },
  surveyHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  surveyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  surveyQuestionCount: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  surveyDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: "center",
  },
  summaryModules: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryModule: {
    alignItems: "center",
    flex: 1,
  },
  moduleValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginTop: 8,
  },
  moduleLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  timeIconContainer: {
    position: "relative",
  },
  timeEditIcon: {
    position: "absolute",
    bottom: -2,
    right: -6,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  titleImage: {
    height: 28,
    width: 94,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#505050",
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
    marginBottom: 12,
    gap: 12,
  },
  questionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5FA9F5",
  },
  questionHeaderRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requiredBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#EF4444",
    letterSpacing: 0.5,
  },
  questionTypeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 12,
    lineHeight: 24,
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
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "transparent",
  },
  optionButtonText: {
    fontSize: 14,
    color: "#222222",
    flex: 1,
  },
  textInputContainer: {
    marginTop: 12,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#111827",
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
  editButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#A23DD8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  publishButton: {
    flex: 1,
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
  archiveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  archiveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
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
