import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createSurvey, CreateSurveyData, getSurveyById, updateSurvey, unpublishSurvey } from "@/api/surveys";
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

interface LocalQuestion {
  text: string;
  type: "text" | "multiple_choice";
  options?: string[];
  isRequired: boolean;
  digitsOnly?: boolean; // For text questions
  logicType?: "any" | "exact" | "range";
  exactCount?: number;
  minCount?: number;
  maxCount?: number;
}

export default function CreateSurvey() {
  const router = useRouter();
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

  const updateQuestionType = (index: number, type: "text" | "multiple_choice") => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[index];
    updatedQuestions[index] = {
      ...question,
      type,
      // Reset options if switching to text, ensure options exist if switching to choice
      options: type === "text" ? undefined : (question.options && question.options.length >= 2 ? question.options : ["", ""]),
      // Reset digitsOnly when switching to choice
      digitsOnly: type === "text" ? question.digitsOnly : undefined,
    };
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

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
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
          description: description.trim() || "",
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
          const questionData: CreateQuestionData = {
            surveyId: surveyId,
            order: i + 1,
            text: q.text,
            type: q.type,
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
          description: description.trim() || "",
          rewardPoints: calculateRewardPoints(),
          estimatedMinutes: 1,
          creatorId: user._id,
        };

        const survey = await createSurvey(surveyData);

        // Create all questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const questionData: CreateQuestionData = {
            surveyId: survey._id,
            order: i + 1,
            text: q.text,
            type: q.type,
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
        err.response?.data?.message || err.message || "Failed to archive survey. Please try again."
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
          description: description.trim() || "",
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
          const questionData: CreateQuestionData = {
            surveyId: surveyId,
            order: i + 1,
            text: q.text,
            type: q.type,
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
          description: description.trim() || "",
          rewardPoints: calculateRewardPoints(),
          estimatedMinutes: 1,
          creatorId: user._id,
        };

        const survey = await createSurvey(surveyData);

        // Create all questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const questionData: CreateQuestionData = {
            surveyId: survey._id,
            order: i + 1,
            text: q.text,
            type: q.type,
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
        err.response?.data?.message || err.message || "Failed to create/update survey. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>{isEditMode ? "Edit Survey" : "Create Survey"}</Text>
          <Text style={styles.headerSubtitle}>Build your survey with questions and options</Text>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
                {questions.length} {questions.length === 1 ? "question" : "questions"}
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
                <TextInput
                  style={styles.questionTextInput}
                  placeholder="Enter your question..."
                  placeholderTextColor="#9CA3AF"
                  value={question.text}
                  onChangeText={(text) => updateQuestionText(index, text)}
                  multiline
                />

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
                      question.type === "multiple_choice" && styles.typeOptionActive,
                    ]}
                    onPress={() => updateQuestionType(index, "multiple_choice")}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        question.type === "multiple_choice" && styles.typeOptionTextActive,
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
                        <Ionicons name="ellipse" size={16} color="#8A4DE8" style={styles.optionDot} />
                        <TextInput
                          style={styles.optionInput}
                          placeholder={`Option ${optIndex + 1}`}
                          placeholderTextColor="#9CA3AF"
                          value={option}
                          onChangeText={(text) => updateQuestionOption(index, optIndex, text)}
                        />
                        {question.options && question.options.length > 2 && (
                          <TouchableOpacity
                            style={styles.removeOptionButton}
                            onPress={() => removeQuestionOption(index, optIndex)}
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
                    <TouchableOpacity style={styles.singleChoiceButton}>
                      <Text style={styles.singleChoiceButtonText}>Single choice only</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Written Question Options */}
                {question.type === "text" && (
                  <TouchableOpacity
                    style={[
                      styles.digitsOnlyButton,
                      question.digitsOnly && styles.digitsOnlyButtonActive,
                    ]}
                    onPress={() => updateQuestionDigitsOnly(index, !question.digitsOnly)}
                  >
                    <Text
                      style={[
                        styles.digitsOnlyButtonText,
                        question.digitsOnly && styles.digitsOnlyButtonTextActive,
                      ]}
                    >
                      Digits only
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Required Toggle */}
                <View style={styles.requiredRow}>
                  <Text style={styles.requiredLabel}>Required</Text>
                  <Switch
                    value={question.isRequired}
                    onValueChange={(value) => updateQuestionRequired(index, value)}
                    trackColor={{ false: "#D1D5DB", true: "#8A4DE8" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footer, { paddingBottom: bottomNavHeight + 8 }]}>
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
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  questionCount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  optional: {
    color: "#9CA3AF",
    fontWeight: "400",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#EF4444",
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  questionCardHeader: {
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
    color: "#5FA9F5",
    fontSize: 16,
    fontWeight: "700",
  },
  questionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deleteQuestionButton: {
    padding: 4,
  },
  questionTextInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    marginBottom: 16,
    minHeight: 44,
    textAlignVertical: "top",
  },
  questionTypeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  typeOptionActive: {
    backgroundColor: "#8A4DE8",
    borderColor: "#8A4DE8",
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  typeOptionTextActive: {
    color: "#FFFFFF",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  optionDot: {
    marginRight: 4,
  },
  optionInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  removeOptionButton: {
    padding: 4,
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    marginBottom: 12,
    gap: 8,
  },
  addOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  singleChoiceButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#8A4DE8",
    marginBottom: 16,
  },
  singleChoiceButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  digitsOnlyButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  digitsOnlyButtonActive: {
    backgroundColor: "#8A4DE8",
    borderColor: "#8A4DE8",
  },
  digitsOnlyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  digitsOnlyButtonTextActive: {
    color: "#FFFFFF",
  },
  requiredRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  requiredLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  addQuestionButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addQuestionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  addQuestionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  previewButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#A23DD8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  previewButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  archiveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  archiveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
  },
});
