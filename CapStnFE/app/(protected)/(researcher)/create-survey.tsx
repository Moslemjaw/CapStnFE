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
  Modal,
  Pressable,
  Switch,
} from "react-native";
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
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<{
    title?: string;
  }>({});

  // Question builder form state
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"text" | "choices">("text");
  const [digitsOnly, setDigitsOnly] = useState(false);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isRequired, setIsRequired] = useState(true);
  const [logicType, setLogicType] = useState<"any" | "exact" | "range">("any");
  const [exactCount, setExactCount] = useState("");
  const [minCount, setMinCount] = useState("");
  const [maxCount, setMaxCount] = useState("");

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

  const openQuestionModal = (index?: number) => {
    if (index !== undefined) {
      // Edit mode
      const question = questions[index];
      setQuestionText(question.text);
      setQuestionType(question.type === "text" ? "text" : "choices");
      setDigitsOnly(question.digitsOnly || false);
      setOptions(question.options && question.options.length >= 2 ? question.options : ["", ""]);
      setIsRequired(question.isRequired);
      setLogicType(question.logicType || "any");
      setExactCount(question.exactCount?.toString() || "");
      setMinCount(question.minCount?.toString() || "");
      setMaxCount(question.maxCount?.toString() || "");
      setEditingQuestionIndex(index);
    } else {
      // Add mode
      resetQuestionForm();
      setEditingQuestionIndex(null);
    }
    setShowQuestionModal(true);
  };

  const resetQuestionForm = () => {
    setQuestionText("");
    setQuestionType("text");
    setDigitsOnly(false);
    setOptions(["", ""]);
    setIsRequired(true);
    setLogicType("any");
    setExactCount("");
    setMinCount("");
    setMaxCount("");
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    resetQuestionForm();
    setEditingQuestionIndex(null);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const saveQuestion = () => {
    if (!questionText.trim()) {
      Alert.alert("Error", "Question text is required");
      return;
    }

    if (questionType === "choices") {
      const validOptions = options.filter((opt) => opt.trim() !== "");
      if (validOptions.length < 2) {
        Alert.alert("Error", "At least 2 options are required for choice questions");
        return;
      }

      if (logicType === "exact" && (!exactCount || parseInt(exactCount) < 1)) {
        Alert.alert("Error", "Please enter a valid exact count");
        return;
      }
      if (logicType === "range") {
        const min = parseInt(minCount);
        const max = parseInt(maxCount);
        if (isNaN(min) || isNaN(max) || min < 1 || max < min || max > validOptions.length) {
          Alert.alert("Error", "Please enter valid min and max counts");
          return;
        }
      }
    }

    const newQuestion: LocalQuestion = {
      text: questionText.trim(),
      type: questionType === "text" ? "text" : "multiple_choice",
      isRequired,
      digitsOnly: questionType === "text" ? digitsOnly : undefined,
      options: questionType === "choices" ? options.filter((opt) => opt.trim() !== "") : undefined,
      logicType: questionType === "choices" ? logicType : undefined,
      exactCount: questionType === "choices" && logicType === "exact" ? parseInt(exactCount) : undefined,
      minCount: questionType === "choices" && logicType === "range" ? parseInt(minCount) : undefined,
      maxCount: questionType === "choices" && logicType === "range" ? parseInt(maxCount) : undefined,
    };

    if (editingQuestionIndex !== null) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
      setQuestions(updatedQuestions);
    } else {
      // Add new question
      setQuestions([...questions, newQuestion]);
    }

    closeQuestionModal();
  };

  const deleteQuestion = (index: number) => {
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
          description: description.trim() || "No description provided",
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
          description: description.trim() || "No description provided",
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
          description: description.trim() || "No description provided",
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
          description: description.trim() || "No description provided",
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
            <Text style={styles.sectionTitle}>Survey Information</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Survey Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Enter survey name"
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
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter survey description (optional)"
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
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openQuestionModal()}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Question</Text>
              </TouchableOpacity>
            </View>

            {questions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="help-circle-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No questions added yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Click "Add Question" to get started
                </Text>
              </View>
            ) : (
              questions.map((question, index) => (
                <View key={index} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <View style={styles.questionNumberBadge}>
                      <Text style={styles.questionNumber}>{index + 1}</Text>
                    </View>
                    <View style={styles.questionInfo}>
                      <Text style={styles.questionText} numberOfLines={2}>
                        {question.text}
                      </Text>
                      <View style={styles.questionMeta}>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>
                            {getQuestionTypeLabel(question)}
                          </Text>
                        </View>
                        {question.isRequired ? (
                          <View style={styles.requiredBadge}>
                            <Text style={styles.requiredBadgeText}>Required</Text>
                          </View>
                        ) : (
                          <View style={styles.optionalBadge}>
                            <Text style={styles.optionalBadgeText}>Optional</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.questionActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openQuestionModal(index)}
                    >
                      <Ionicons name="pencil" size={18} color="#3B82F6" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteQuestion(index)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footer, { paddingBottom: bottomNavHeight + 16 }]}>
          <TouchableOpacity
            style={[styles.actionButtonFooter, styles.archiveButton]}
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
          <TouchableOpacity
            style={[styles.actionButtonFooter, styles.previewButton]}
            onPress={handlePreview}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
                <Text style={styles.previewButtonText}>Preview</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Question Builder Modal */}
      <Modal
        visible={showQuestionModal}
        transparent
        animationType="fade"
        onRequestClose={closeQuestionModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeQuestionModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingQuestionIndex !== null ? "Edit Question" : "Add Question"}
              </Text>
              <TouchableOpacity onPress={closeQuestionModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Question Text */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>
                  Question Text <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="Enter your question"
                  placeholderTextColor="#9CA3AF"
                  value={questionText}
                  onChangeText={setQuestionText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Type Selection */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      questionType === "text" && styles.typeOptionActive,
                    ]}
                    onPress={() => setQuestionType("text")}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        questionType === "text" && styles.typeOptionTextActive,
                      ]}
                    >
                      Text Answer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      questionType === "choices" && styles.typeOptionActive,
                    ]}
                    onPress={() => setQuestionType("choices")}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        questionType === "choices" && styles.typeOptionTextActive,
                      ]}
                    >
                      Choices
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Text Answer Options */}
              {questionType === "text" && (
                <View style={styles.modalField}>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Digits only</Text>
                    <Switch
                      value={digitsOnly}
                      onValueChange={setDigitsOnly}
                      trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              )}

              {/* Choice Options */}
              {questionType === "choices" && (
                <>
                  {/* Options List */}
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Options</Text>
                    {options.map((option, index) => (
                      <View key={index} style={styles.optionRow}>
                        <TextInput
                          style={styles.optionInput}
                          placeholder={`Option ${index + 1}`}
                          placeholderTextColor="#9CA3AF"
                          value={option}
                          onChangeText={(text) => updateOption(index, text)}
                        />
                        {options.length > 2 && (
                          <TouchableOpacity
                            style={styles.removeOptionButton}
                            onPress={() => removeOption(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addOptionButton}
                      onPress={addOption}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
                      <Text style={styles.addOptionText}>Add Option</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Logic Options */}
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Selection Logic</Text>
                    <Text style={styles.logicDescription}>
                      Any: Select any number of options (acts like single choice if only one is selected)
                    </Text>
                    <Text style={styles.logicDescription}>
                      Exact: Must select exactly the specified number of options
                    </Text>
                    <Text style={styles.logicDescription}>
                      Range: Must select between min and max number of options
                    </Text>
                    <View style={styles.logicSelector}>
                      <TouchableOpacity
                        style={[
                          styles.logicOption,
                          logicType === "any" && styles.logicOptionActive,
                        ]}
                        onPress={() => setLogicType("any")}
                      >
                        <Text
                          style={[
                            styles.logicOptionText,
                            logicType === "any" && styles.logicOptionTextActive,
                          ]}
                        >
                          Any
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.logicOption,
                          logicType === "exact" && styles.logicOptionActive,
                        ]}
                        onPress={() => setLogicType("exact")}
                      >
                        <Text
                          style={[
                            styles.logicOptionText,
                            logicType === "exact" && styles.logicOptionTextActive,
                          ]}
                        >
                          Exact
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.logicOption,
                          logicType === "range" && styles.logicOptionActive,
                        ]}
                        onPress={() => setLogicType("range")}
                      >
                        <Text
                          style={[
                            styles.logicOptionText,
                            logicType === "range" && styles.logicOptionTextActive,
                          ]}
                        >
                          Range
                        </Text>
                      </TouchableOpacity>
                    </View>

                      {logicType === "exact" && (
                        <View style={styles.logicInputRow}>
                          <Text style={styles.logicInputLabel}>Exact count:</Text>
                          <TextInput
                            style={styles.logicInput}
                            placeholder="Number"
                            placeholderTextColor="#9CA3AF"
                            value={exactCount}
                            onChangeText={(text) => setExactCount(text.replace(/[^0-9]/g, ""))}
                            keyboardType="number-pad"
                          />
                        </View>
                      )}

                      {logicType === "range" && (
                        <View style={styles.logicInputRow}>
                          <Text style={styles.logicInputLabel}>Min:</Text>
                          <TextInput
                            style={styles.logicInput}
                            placeholder="Min"
                            placeholderTextColor="#9CA3AF"
                            value={minCount}
                            onChangeText={(text) => setMinCount(text.replace(/[^0-9]/g, ""))}
                            keyboardType="number-pad"
                          />
                          <Text style={styles.logicInputLabel}>Max:</Text>
                          <TextInput
                            style={styles.logicInput}
                            placeholder="Max"
                            placeholderTextColor="#9CA3AF"
                            value={maxCount}
                            onChangeText={(text) => setMaxCount(text.replace(/[^0-9]/g, ""))}
                            keyboardType="number-pad"
                          />
                        </View>
                      )}
                  </View>
                </>
              )}

              {/* Required Toggle */}
              <View style={styles.modalField}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Required</Text>
                  <Switch
                    value={isRequired}
                    onValueChange={setIsRequired}
                    trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeQuestionModal}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveQuestion}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
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
    marginBottom: 16,
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
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  emptyStateSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  questionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  questionNumber: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  questionInfo: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: "row",
    gap: 8,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
  },
  requiredBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
  },
  requiredBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
  },
  optionalBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  optionalBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  questionActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
  },
  deleteButtonText: {
    color: "#EF4444",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 24,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  actionButtonFooter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  archiveButton: {
    backgroundColor: "#F3F4F6",
  },
  archiveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  previewButton: {
    backgroundColor: "#3B82F6",
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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
    maxWidth: 500,
    maxHeight: "90%",
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
    maxHeight: 500,
    padding: 20,
  },
  modalField: {
    marginBottom: 20,
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
  modalTextArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  typeOptionActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  typeOptionTextActive: {
    color: "#3B82F6",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  optionInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignSelf: "flex-start",
  },
  addOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  logicSelector: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  logicDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    lineHeight: 16,
  },
  logicOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  logicOptionActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  logicOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  logicOptionTextActive: {
    color: "#3B82F6",
  },
  logicInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  logicInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  logicInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
