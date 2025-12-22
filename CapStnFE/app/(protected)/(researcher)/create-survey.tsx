import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  createSurvey,
  CreateSurveyData,
  getSurveyById,
  updateSurvey,
  unpublishSurvey,
} from "@/api/surveys";
import {
  createQuestion,
  CreateQuestionData,
  Question,
  getQuestionsBySurveyId,
  updateQuestion,
  deleteQuestion,
} from "@/api/questions";
import { getUser } from "@/api/storage";
import User from "@/types/User";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

interface LocalQuestion {
  text: string;
  type: "text" | "multiple_choice";
  options?: string[];
  isRequired: boolean;
  digitsOnly?: boolean; // For text questions
  allowMultipleSelection?: boolean; // For multiple choice questions - true = can select multiple, false = single choice only
  logicType?: "any" | "exact" | "range";
  exactCount?: number;
  minCount?: number;
  maxCount?: number;
}

export default function CreateSurvey() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const { surveyId } = useLocalSearchParams<{ surveyId?: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
  }>({});
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    loadUser();
    if (surveyId) {
      loadSurveyForEdit();
    }
  }, [surveyId]);

  const loadUser = async () => {
    const userData = await getUser();
    setUser(userData);
  };

  const loadSurveyForEdit = async () => {
    if (!surveyId) return;

    setLoading(true);
    try {
      const [surveyData, questionsData] = await Promise.all([
        getSurveyById(surveyId),
        getQuestionsBySurveyId(surveyId),
      ]);

      // Sort questions by order
      const sortedQuestions = questionsData.sort((a, b) => a.order - b.order);

      // Populate form with survey data
      setTitle(surveyData.title);
      setDescription(surveyData.description || "");

      // Convert API questions to LocalQuestion format
      const localQuestions: LocalQuestion[] = sortedQuestions.map((q) => ({
        text: q.text,
        type: q.type === "text" ? "text" : "multiple_choice",
        options: q.options,
        isRequired: q.isRequired,
        allowMultipleSelection: q.type === "multiple_choice" || q.type === "checkbox", // multiple_choice/checkbox = can select multiple
        logicType: "any", // Default, as we don't store this in the API yet
      }));

      setQuestions(localQuestions);
      setIsEditMode(true);
    } catch (err: any) {
      console.error("Error loading survey for edit:", err);
      Alert.alert("Error", "Failed to load survey for editing");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = "Survey name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate reward points based on number of questions
  const calculateRewardPoints = (): number => {
    return questions.length;
  };

  const handleDeleteQuestion = (index: number) => {
    Alert.alert(
      "Delete Question",
      "Are you sure you want to delete this question?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setQuestions(questions.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const updateQuestionText = (index: number, text: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], text };
    setQuestions(updatedQuestions);
  };

  const updateQuestionType = (
    index: number,
    type: "text" | "multiple_choice"
  ) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[index];
    updatedQuestions[index] = {
      ...question,
      type,
      // Reset options if switching to text, ensure options exist if switching to choice
      options:
        type === "text"
          ? undefined
          : question.options && question.options.length >= 2
          ? question.options
          : ["", ""],
      // Reset digitsOnly when switching to choice
      digitsOnly: type === "text" ? question.digitsOnly : undefined,
      // Default to single choice when switching to multiple choice
      allowMultipleSelection: type === "multiple_choice" ? (question.allowMultipleSelection ?? false) : undefined,
    };
    setQuestions(updatedQuestions);
  };

  const updateQuestionMultipleSelection = (index: number, allowMultiple: boolean) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], allowMultipleSelection: allowMultiple };
    setQuestions(updatedQuestions);
  };

  const updateQuestionRequired = (index: number, isRequired: boolean) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], isRequired };
    setQuestions(updatedQuestions);
  };

  const updateQuestionDigitsOnly = (index: number, digitsOnly: boolean) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], digitsOnly };
    setQuestions(updatedQuestions);
  };

  const addQuestionOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    if (question.options) {
      updatedQuestions[questionIndex] = {
        ...question,
        options: [...question.options, ""],
      };
      setQuestions(updatedQuestions);
    }
  };

  const removeQuestionOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    if (question.options && question.options.length > 2) {
      updatedQuestions[questionIndex] = {
        ...question,
        options: question.options.filter((_, i) => i !== optionIndex),
      };
      setQuestions(updatedQuestions);
    }
  };

  const updateQuestionOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    if (question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updatedQuestions[questionIndex] = {
        ...question,
        options: newOptions,
      };
      setQuestions(updatedQuestions);
    }
  };

  const addNewQuestion = () => {
    const newQuestion: LocalQuestion = {
      text: "",
      type: "text",
      isRequired: true,
      digitsOnly: false,
      allowMultipleSelection: false,
      logicType: "any",
    };
    setQuestions([...questions, newQuestion]);
  };

  const getQuestionTypeLabel = (question: LocalQuestion) => {
    if (question.type === "text") {
      return "Text Answer";
    }
    return "Multiple Choice";
  };

  const handleArchive = async () => {
    if (!validateForm() || !user?._id) {
      return;
    }

    setLoading(true);
    try {
      let finalSurveyId: string;

      if (isEditMode && surveyId) {
        // Edit mode: Update existing survey
        await updateSurvey(surveyId, {
          title: title.trim(),
          description: description.trim(),
          rewardPoints: calculateRewardPoints(),
        });

        // Get existing questions and update/delete as needed
        const existingQuestions = await getQuestionsBySurveyId(surveyId);

        // Delete all existing questions
        for (const q of existingQuestions) {
          await deleteQuestion(q._id);
        }

        // Create updated questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          // Map allowMultipleSelection to proper API type
          let apiType: "text" | "multiple_choice" | "single_choice" | "dropdown" | "checkbox" = q.type;
          if (q.type === "multiple_choice") {
            apiType = q.allowMultipleSelection ? "multiple_choice" : "single_choice";
          }
          const questionData: CreateQuestionData = {
            surveyId: surveyId,
            order: i + 1,
            text: q.text,
            type: apiType,
            options: q.options,
            isRequired: q.isRequired,
          };
          await createQuestion(questionData);
        }

        // Archive the survey
        await unpublishSurvey(surveyId);
        finalSurveyId = surveyId;
      } else {
        // Create mode: Create new survey
        const surveyData: CreateSurveyData = {
          title: title.trim(),
          description: description.trim(),
          rewardPoints: calculateRewardPoints(),
          estimatedMinutes: 1,
          creatorId: user._id,
          despectipationPath: "-",
        };

        const survey = await createSurvey(surveyData);

        // Create all questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          // Map allowMultipleSelection to proper API type
          let apiType: "text" | "multiple_choice" | "single_choice" | "dropdown" | "checkbox" = q.type;
          if (q.type === "multiple_choice") {
            apiType = q.allowMultipleSelection ? "multiple_choice" : "single_choice";
          }
          const questionData: CreateQuestionData = {
            surveyId: survey._id,
            order: i + 1,
            text: q.text,
            type: apiType,
            options: q.options,
            isRequired: q.isRequired,
          };
          await createQuestion(questionData);
        }

        finalSurveyId = survey._id;
      }

      // Navigate to archive success page
      router.replace({
        pathname: "/(protected)/(researcher)/survey-archive-success",
        params: {
          surveyId: finalSurveyId,
          questionCount: questions.length.toString(),
          points: calculateRewardPoints().toString(),
          estimatedMinutes: "1",
        },
      } as any);
    } catch (err: any) {
      console.error("Error archiving survey:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message ||
          err.message ||
          "Failed to archive survey. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!validateForm() || !user?._id) {
      return;
    }

    if (questions.length === 0) {
      Alert.alert("Error", "Please add at least one question to preview");
      return;
    }

    setLoading(true);
    try {
      let finalSurveyId: string;

      if (isEditMode && surveyId) {
        // Edit mode: Update existing survey
        await updateSurvey(surveyId, {
          title: title.trim(),
          description: description.trim(),
          rewardPoints: calculateRewardPoints(),
        });

        // Get existing questions and update/delete as needed
        const existingQuestions = await getQuestionsBySurveyId(surveyId);

        // Delete all existing questions
        for (const q of existingQuestions) {
          await deleteQuestion(q._id);
        }

        // Create updated questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          // Map allowMultipleSelection to proper API type
          let apiType: "text" | "multiple_choice" | "single_choice" | "dropdown" | "checkbox" = q.type;
          if (q.type === "multiple_choice") {
            apiType = q.allowMultipleSelection ? "multiple_choice" : "single_choice";
          }
          const questionData: CreateQuestionData = {
            surveyId: surveyId,
            order: i + 1,
            text: q.text,
            type: apiType,
            options: q.options,
            isRequired: q.isRequired,
          };
          await createQuestion(questionData);
        }

        finalSurveyId = surveyId;
      } else {
        // Create mode: Create new survey
        const surveyData: CreateSurveyData = {
          title: title.trim(),
          description: description.trim(),
          rewardPoints: calculateRewardPoints(),
          estimatedMinutes: 1,
          creatorId: user._id,
          despectipationPath: "-",
        };

        const survey = await createSurvey(surveyData);

        // Create all questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          // Map allowMultipleSelection to proper API type
          let apiType: "text" | "multiple_choice" | "single_choice" | "dropdown" | "checkbox" = q.type;
          if (q.type === "multiple_choice") {
            apiType = q.allowMultipleSelection ? "multiple_choice" : "single_choice";
          }
          const questionData: CreateQuestionData = {
            surveyId: survey._id,
            order: i + 1,
            text: q.text,
            type: apiType,
            options: q.options,
            isRequired: q.isRequired,
          };
          await createQuestion(questionData);
        }

        finalSurveyId = survey._id;
      }

      router.push({
        pathname: "/(protected)/(researcher)/survey-preview",
        params: { surveyId: finalSurveyId },
      } as any);
    } catch (err: any) {
      console.error("Error creating/updating survey for preview:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message ||
          err.message ||
          "Failed to create/update survey. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {isEditMode ? "Edit Survey" : "Create Survey"}
            </Text>
          </View>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/title.png")}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={[styles.keyboardView, styles.scrollView]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        enableResetScrollToCoords={false}
        extraScrollHeight={Platform.OS === "ios" ? 100 : 150}
        extraHeight={Platform.OS === "ios" ? 100 : 150}
        keyboardOpeningTime={0}
      >
          {/* Survey Information Section */}
          <View style={styles.section}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Survey Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Enter survey title..."
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) {
                    setErrors({ ...errors, title: undefined });
                  }
                }}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Description <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your survey..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Questions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Questions</Text>
              <Text style={styles.questionCount}>
                {questions.length}{" "}
                {questions.length === 1 ? "question" : "questions"}
              </Text>
            </View>

            {questions.map((question, index) => (
              <View key={index} style={styles.questionCard}>
                {/* Question Header */}
                <View style={styles.questionCardHeader}>
                  <View style={styles.questionNumberBadge}>
                    <Text style={styles.questionNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.questionLabel}>QUESTION</Text>
                  <TouchableOpacity
                    style={styles.deleteQuestionButton}
                    onPress={() => handleDeleteQuestion(index)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Question Text Input */}
                <View>
                  <TextInput
                    style={styles.questionTextInput}
                    placeholder="Enter your question..."
                    placeholderTextColor="#9CA3AF"
                    value={question.text}
                    onChangeText={(text) => updateQuestionText(index, text)}
                    multiline
                  />
                </View>

                {/* Question Type Toggle */}
                <Text style={styles.questionTypeLabel}>Question Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      question.type === "text" && styles.typeOptionActive,
                    ]}
                    onPress={() => updateQuestionType(index, "text")}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        question.type === "text" && styles.typeOptionTextActive,
                      ]}
                    >
                      Written
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      question.type === "multiple_choice" &&
                        styles.typeOptionActive,
                    ]}
                    onPress={() => updateQuestionType(index, "multiple_choice")}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        question.type === "multiple_choice" &&
                          styles.typeOptionTextActive,
                      ]}
                    >
                      Choice
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Choice Question Options */}
                {question.type === "multiple_choice" && (
                  <>
                    {question.options?.map((option, optIndex) => (
                      <View key={optIndex} style={styles.optionRow}>
                        <Ionicons
                          name="ellipse"
                          size={16}
                          color="#8A4DE8"
                          style={styles.optionDot}
                        />
                        <TextInput
                          style={styles.optionInput}
                          placeholder={`Option ${optIndex + 1}`}
                          placeholderTextColor="#9CA3AF"
                          value={option}
                          onChangeText={(text) =>
                            updateQuestionOption(index, optIndex, text)
                          }
                        />
                        {question.options && question.options.length > 2 && (
                          <TouchableOpacity
                            style={styles.removeOptionButton}
                            onPress={() =>
                              removeQuestionOption(index, optIndex)
                            }
                          >
                            <Ionicons name="close" size={20} color="#6B7280" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addOptionButton}
                      onPress={() => addQuestionOption(index)}
                    >
                      <Ionicons name="add" size={20} color="#9CA3AF" />
                      <Text style={styles.addOptionText}>Add Option</Text>
                    </TouchableOpacity>
                    
                    {/* Selection Type Toggle */}
                    <View style={styles.selectionTypeContainer}>
                      <Text style={styles.selectionTypeLabel}>Selection Type</Text>
                      <View style={styles.selectionTypeToggle}>
                        <TouchableOpacity
                          style={[
                            styles.selectionTypeOption,
                            !question.allowMultipleSelection && styles.selectionTypeOptionActive,
                          ]}
                          onPress={() => updateQuestionMultipleSelection(index, false)}
                        >
                          <Ionicons 
                            name="radio-button-on" 
                            size={16} 
                            color={!question.allowMultipleSelection ? "#FFFFFF" : "#9CA3AF"} 
                          />
                          <Text
                            style={[
                              styles.selectionTypeOptionText,
                              !question.allowMultipleSelection && styles.selectionTypeOptionTextActive,
                            ]}
                          >
                            Single
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.selectionTypeOption,
                            question.allowMultipleSelection && styles.selectionTypeOptionActive,
                          ]}
                          onPress={() => updateQuestionMultipleSelection(index, true)}
                        >
                          <Ionicons 
                            name="checkbox" 
                            size={16} 
                            color={question.allowMultipleSelection ? "#FFFFFF" : "#9CA3AF"} 
                          />
                          <Text
                            style={[
                              styles.selectionTypeOptionText,
                              question.allowMultipleSelection && styles.selectionTypeOptionTextActive,
                            ]}
                          >
                            Multiple
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}

                {/* Written Question Options */}
                {question.type === "text" && (
                  <TouchableOpacity
                    style={[
                      styles.digitsOnlyButton,
                      question.digitsOnly && styles.digitsOnlyButtonActive,
                    ]}
                    onPress={() =>
                      updateQuestionDigitsOnly(index, !question.digitsOnly)
                    }
                  >
                    <Text
                      style={[
                        styles.digitsOnlyButtonText,
                        question.digitsOnly &&
                          styles.digitsOnlyButtonTextActive,
                      ]}
                    >
                      Numbers only
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Required Toggle */}
                <View style={styles.requiredRow}>
                  <Text style={styles.requiredLabel}>Required</Text>
                  <Switch
                    value={question.isRequired}
                    onValueChange={(value) =>
                      updateQuestionRequired(index, value)
                    }
                    trackColor={{ false: "#D1D5DB", true: "#8A4DE8" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            ))}
          </View>
      </KeyboardAwareScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View style={[styles.footer, { paddingBottom: bottomNavHeight + Spacing.sm }]}>
        <TouchableOpacity
          style={styles.addQuestionButton}
          onPress={addNewQuestion}
          disabled={loading}
        >
          <LinearGradient
            colors={["#5FA9F5", "#4A63D8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addQuestionButtonGradient}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addQuestionButtonText}>Add Question</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={handlePreview}
            disabled={loading}
          >
            <LinearGradient
              colors={["#A23DD8", "#D13DB8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.previewButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.previewButtonText}>Preview</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.archiveButton}
            onPress={handleArchive}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <>
                <Ionicons name="archive-outline" size={20} color="#6B7280" />
                <Text style={styles.archiveButtonText}>Archive</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    overflow: "visible",
  },
  fixedHeader: {
    backgroundColor: Colors.background.primary,
    zIndex: 10,
    paddingBottom: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: Borders.radius.xl,
    borderBottomRightRadius: Borders.radius.xl,
    borderBottomWidth: Borders.width.default,
    borderBottomColor: Colors.border.light,
    ...Shadows.md,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextContainer: {
    flex: 1,
    paddingTop: 0,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: Spacing.xxs,
  },
  titleImage: {
    height: Spacing.icon.xl,
    width: 106,
    marginLeft: -Spacing.xxs,
  },
  headerTitle: {
    ...Typography.styles.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.xxs,
  },
  headerSubtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 300,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
  },
  questionCount: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.styles.label,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.status.error,
  },
  optional: {
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.normal,
  },
  input: {
    backgroundColor: Colors.background.primary,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    borderRadius: Borders.radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.sm,
  },
  errorText: {
    marginTop: Spacing.xxs,
    fontSize: Typography.fontSize.caption,
    color: Colors.status.error,
  },
  questionCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Borders.radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  questionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    color: Colors.primary.blue,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
  },
  questionLabel: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deleteQuestionButton: {
    padding: Spacing.xxs,
  },
  questionTextInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Borders.radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    minHeight: 44,
    textAlignVertical: "top",
  },
  questionTypeLabel: {
    ...Typography.styles.label,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  typeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Borders.radius.full,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    alignItems: "center",
    backgroundColor: Colors.background.primary,
  },
  typeOptionActive: {
    backgroundColor: Colors.primary.purple,
    borderColor: Colors.primary.purple,
  },
  typeOptionText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
    textAlign: "center",
  },
  typeOptionTextActive: {
    color: Colors.text.inverse,
    textAlign: "center",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  optionDot: {
    marginRight: Spacing.xxs,
  },
  optionInput: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: Borders.radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
  },
  removeOptionButton: {
    padding: Spacing.xxs,
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Borders.radius.sm,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    borderStyle: "dashed",
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  addOptionText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
  },
  selectionTypeContainer: {
    marginBottom: Spacing.md,
  },
  selectionTypeLabel: {
    ...Typography.styles.label,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  selectionTypeToggle: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  selectionTypeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Borders.radius.full,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
    gap: 6,
  },
  selectionTypeOptionActive: {
    backgroundColor: Colors.primary.purple,
    borderColor: Colors.primary.purple,
  },
  selectionTypeOptionText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
  },
  selectionTypeOptionTextActive: {
    color: Colors.text.inverse,
  },
  digitsOnlyButton: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Borders.radius.full,
    backgroundColor: Colors.background.primary,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    marginBottom: Spacing.md,
  },
  digitsOnlyButtonActive: {
    backgroundColor: Colors.primary.purple,
    borderColor: Colors.primary.purple,
  },
  digitsOnlyButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
  },
  digitsOnlyButtonTextActive: {
    color: Colors.text.inverse,
  },
  requiredRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  requiredLabel: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderTopWidth: Borders.width.default,
    borderTopColor: Colors.border.default,
    overflow: "visible",
    ...Shadows.lg,
  },
  addQuestionButton: {
    borderRadius: Borders.radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addQuestionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  addQuestionButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    textAlign: "center",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    overflow: "visible",
  },
  previewButton: {
    flex: 1,
    borderRadius: Borders.radius.lg,
    overflow: "hidden",
    borderWidth: 0,
    shadowColor: Colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  previewButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    borderRadius: Borders.radius.lg,
  },
  previewButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    textAlign: "center",
  },
  archiveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
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
    textAlign: "center",
  },
});
