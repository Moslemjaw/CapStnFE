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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getSurveyById, publishSurvey, unpublishSurvey, updateSurvey } from "@/api/surveys";
import { getQuestionsBySurveyId } from "@/api/questions";
import { Survey } from "@/api/surveys";
import { Question } from "@/api/questions";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";
import { Colors, Typography, Spacing, Borders, Shadows, ZIndex } from "@/constants/design";

export default function SurveyPreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[Colors.background.primary, Colors.surface.blueTint, Colors.surface.purpleTint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
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

            <TouchableOpacity style={[styles.summaryModule, styles.editableModule]} onPress={openTimeEditModal} activeOpacity={0.7}>
              <View style={styles.timeEditHeader}>
                <Ionicons name="create-outline" size={14} color="#2BB6E9" />
                <Text style={styles.editableLabel}>EDITABLE</Text>
              </View>
              <View style={styles.timeIconContainer}>
                <Ionicons name="time-outline" size={24} color="#2BB6E9" />
              </View>
              <Text style={styles.moduleValue}>~{survey.estimatedMinutes}</Text>
              <Text style={styles.moduleLabel}>Minutes</Text>
              <View style={styles.editButtonIndicator}>
                <Ionicons name="pencil" size={12} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Tap to Edit</Text>
              </View>
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
                <Ionicons name="close" size={24} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Estimated Minutes</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter estimated time in minutes"
                placeholderTextColor={Colors.text.tertiary}
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
                  <ActivityIndicator size="small" color={Colors.text.inverse} />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save</Text>
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
    backgroundColor: Colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.styles.body,
    color: Colors.text.tertiary,
  },
  errorText: {
    marginTop: Spacing.md,
    ...Typography.styles.body,
    color: Colors.status.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: Borders.radius.full,
    backgroundColor: Colors.primary.blue,
    overflow: "hidden",
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.body,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 200,
  },
  previewBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.purpleTint,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Borders.radius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  previewBannerTextContainer: {
    flex: 1,
  },
  previewBannerTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.purple,
    marginBottom: 2,
  },
  previewBannerSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.primary.purple,
    lineHeight: 16,
  },
  surveyHeader: {
    marginBottom: Spacing.xxl,
    alignItems: "center",
  },
  surveyHeaderIcon: {
    width: Spacing.avatar.lg,
    height: Spacing.avatar.lg,
    borderRadius: Borders.radius.full,
    backgroundColor: Colors.surface.blueTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  surveyTitle: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  surveyQuestionCount: {
    ...Typography.styles.body,
    color: Colors.text.tertiary,
    marginBottom: Spacing.md,
  },
  surveyDescription: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.body,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Borders.radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
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
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  moduleLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.xxs,
  },
  timeIconContainer: {
    marginTop: Spacing.xs,
  },
  timeEditHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(43, 182, 233, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Borders.radius.full,
    marginBottom: Spacing.xxs,
  },
  editableLabel: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
    color: "#2BB6E9",
    letterSpacing: 0.5,
  },
  editableModule: {
    backgroundColor: "rgba(43, 182, 233, 0.06)",
    borderWidth: 2,
    borderColor: "#2BB6E9",
    borderStyle: "dashed",
    borderRadius: Borders.radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: -Spacing.xs,
  },
  editButtonIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2BB6E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Borders.radius.full,
    marginTop: Spacing.xs,
  },
  editButtonText: {
    fontSize: Typography.fontSize.caption - 1,
    color: "#FFFFFF",
    fontWeight: Typography.fontWeight.bold,
  },
  fixedHeader: {
    backgroundColor: Colors.background.primary,
    zIndex: 10,
    paddingBottom: 0,
    borderBottomLeftRadius: Borders.radius.xl,
    borderBottomRightRadius: Borders.radius.xl,
    borderBottomWidth: Borders.width.default,
    borderBottomColor: Colors.border.light,
    ...Shadows.md,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  titleImage: {
    height: Spacing.xl,
    width: 94,
  },
  headerTitle: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xxs,
  },
  headerSubtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  questionsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  emptyQuestions: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyQuestionsText: {
    marginTop: Spacing.xs,
    ...Typography.styles.body,
    color: Colors.text.tertiary,
    textAlign: "center",
  },
  questionCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Borders.radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  questionNumberBadge: {
    width: Spacing.xxl,
    height: Spacing.xxl,
    borderRadius: Borders.radius.full,
    backgroundColor: Colors.surface.blueTint,
    alignItems: "center",
    justifyContent: "center",
  },
  questionNumber: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.blue,
  },
  questionHeaderRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  requiredBadge: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    borderRadius: Borders.radius.sm,
    backgroundColor: Colors.surface.error,
  },
  requiredText: {
    fontSize: Typography.fontSize.label,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.error,
    letterSpacing: 0.5,
  },
  questionTypeLabel: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
  },
  questionText: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.body,
  },
  questionType: {
    marginBottom: Spacing.sm + 2,
    paddingVertical: Spacing.xxs + 2,
    paddingHorizontal: Spacing.sm,
    alignSelf: "flex-start",
    borderRadius: Borders.radius.md,
    backgroundColor: Colors.background.secondary,
  },
  questionTypeText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionsContainer: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm + 2,
    borderRadius: Borders.radius.md,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: Borders.radius.full,
    borderWidth: 2,
    borderColor: Colors.border.default,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  optionRadioDot: {
    width: 8,
    height: 8,
    borderRadius: Borders.radius.full,
    backgroundColor: "transparent",
  },
  optionButtonText: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    flex: 1,
  },
  textInputContainer: {
    marginTop: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.background.secondary,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    borderRadius: Borders.radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
  },
  footer: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderTopWidth: Borders.width.thick,
    borderTopColor: Colors.border.default,
    ...Shadows.lg,
    zIndex: ZIndex.fixedButton,
  },
  editButton: {
    borderRadius: Borders.radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  editButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  publishButton: {
    flex: 1,
    borderRadius: Borders.radius.lg,
    overflow: "hidden",
  },
  publishButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  publishButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  archiveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Borders.radius.lg,
    backgroundColor: Colors.background.primary,
    borderWidth: Borders.width.thick,
    borderColor: Colors.border.default,
    gap: Spacing.xs,
  },
  archiveButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: Borders.radius.xxl,
    width: "100%",
    maxWidth: 400,
    shadowColor: Colors.primary.blue,
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
    padding: Spacing.lg,
    borderBottomWidth: Borders.width.thick,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
  },
  modalTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalLabel: {
    ...Typography.styles.label,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  modalInput: {
    backgroundColor: Colors.background.secondary,
    borderWidth: Borders.width.thick,
    borderColor: Colors.border.default,
    borderRadius: Borders.radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  modalFooter: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderTopWidth: Borders.width.thick,
    borderTopColor: Colors.border.default,
    gap: Spacing.sm,
    backgroundColor: Colors.background.secondary,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Borders.radius.lg,
    alignItems: "center",
    backgroundColor: Colors.background.tertiary,
    borderWidth: Borders.width.thick,
    borderColor: Colors.border.default,
  },
  modalCancelButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Borders.radius.lg,
    alignItems: "center",
    backgroundColor: Colors.primary.blue,
  },
  modalSaveButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
});
