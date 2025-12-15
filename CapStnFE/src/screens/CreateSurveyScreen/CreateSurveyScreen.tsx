/**
 * Create Survey Screen
 * Add and manage survey questions with drag-and-drop and inline form
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  UIManager,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { RootStackParamList } from '../../types';

const RESEARCHER_COLOR = '#6366F1';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type QuestionType = 'choice' | 'written';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  minSelections?: number; // For choice type
  maxSelections?: number; // For choice type
  options?: string[]; // For choice type
}

type CreateSurveyScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateSurvey'
>;

type CreateSurveyScreenRouteProp = RouteProp<RootStackParamList, 'CreateSurvey'>;

interface CreateSurveyScreenProps {
  navigation: CreateSurveyScreenNavigationProp;
  route: CreateSurveyScreenRouteProp;
}

export const CreateSurveyScreen: React.FC<CreateSurveyScreenProps> = ({ navigation, route }) => {
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveySubtitle, setSurveySubtitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [showTrashBin, setShowTrashBin] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const dragAnim = useRef(new Animated.ValueXY()).current;
  const screenHeight = Dimensions.get('window').height;
  
  // Form state for adding/editing question
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('choice');
  const [isRequired, setIsRequired] = useState(true);
  const [minSelections, setMinSelections] = useState('1');
  const [maxSelections, setMaxSelections] = useState('1');
  const [options, setOptions] = useState<string[]>(['', '']);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleAddQuestion = () => {
    resetForm();
    setEditingQuestion(null);
    setShowInlineForm(true);
  };

  const handleEditQuestion = (question: Question) => {
    setQuestionText(question.text);
    setQuestionType(question.type);
    setIsRequired(question.required);
    setMinSelections(question.minSelections?.toString() || '1');
    setMaxSelections(question.maxSelections?.toString() || '1');
    setOptions(question.options ? [...question.options] : ['', '']);
    setEditingQuestion(question);
    setShowInlineForm(true);
  };

  const handleSaveQuestion = () => {
    if (!questionText.trim()) {
      alert('Please enter a question text');
      return;
    }

    if (questionType === 'choice') {
      const min = parseInt(minSelections) || 1;
      const max = parseInt(maxSelections) || 1;
      
      if (min < 1) {
        alert('Minimum selections must be at least 1');
        return;
      }
      
      if (max < min) {
        alert('Maximum selections must be greater than or equal to minimum');
        return;
      }

      const validOptions = options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert('Please add at least 2 options');
        return;
      }

      if (max > validOptions.length) {
        alert(`Maximum selections cannot exceed the number of options (${validOptions.length})`);
        return;
      }
    }

    const questionData: Question = {
      id: editingQuestion?.id || `q-${Date.now()}`,
      text: questionText.trim(),
      type: questionType,
      required: isRequired,
      minSelections: questionType === 'choice' ? parseInt(minSelections) || 1 : undefined,
      maxSelections: questionType === 'choice' ? parseInt(maxSelections) || 1 : undefined,
      options: questionType === 'choice' 
        ? options.filter(opt => opt.trim())
        : undefined,
    };

    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? questionData : q));
    } else {
      setQuestions([...questions, questionData]);
    }

    setShowInlineForm(false);
    resetForm();
  };

  const handleCancelForm = () => {
    setShowInlineForm(false);
    resetForm();
  };

  const resetForm = () => {
    setQuestionText('');
    setQuestionType('choice');
    setIsRequired(true);
    setMinSelections('1');
    setMaxSelections('1');
    setOptions(['', '']);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
  };

  const handleToggleSelection = (questionId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      return newSet;
    });
  };

  const handleBulkMarkRequired = () => {
    setQuestions(questions.map(q => 
      selectedQuestions.has(q.id) ? { ...q, required: true } : q
    ));
    setSelectedQuestions(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkMarkOptional = () => {
    setQuestions(questions.map(q => 
      selectedQuestions.has(q.id) ? { ...q, required: false } : q
    ));
    setSelectedQuestions(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkDelete = () => {
    setQuestions(questions.filter(q => !selectedQuestions.has(q.id)));
    setSelectedQuestions(new Set());
    setIsSelectionMode(false);
  };

  const handleCancelSelection = () => {
    setSelectedQuestions(new Set());
    setIsSelectionMode(false);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const createPanResponder = React.useCallback((questionId: string, questionIndex: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only start dragging if moved significantly and not in selection mode
        return !isSelectionMode && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5);
      },
      onPanResponderGrant: (evt) => {
        if (!isSelectionMode) {
          setDraggedQuestionId(questionId);
          setShowTrashBin(true);
          setDragStartY(evt.nativeEvent.pageY);
          dragAnim.setOffset({ x: 0, y: 0 });
          dragAnim.setValue({ x: 0, y: 0 });
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (draggedQuestionId === questionId && !isSelectionMode) {
          dragAnim.setValue({ x: gestureState.dx, y: gestureState.dy });
          setDragPosition({ x: gestureState.dx, y: gestureState.dy });
          
          // Check if near trash bin (bottom 150px of screen)
          const currentY = evt.nativeEvent.pageY;
          if (currentY > screenHeight - 150) {
            // Highlight trash bin
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (draggedQuestionId === questionId) {
          const currentY = evt.nativeEvent.pageY;
          const trashBinThreshold = screenHeight - 150;
          
          // Check if dropped in trash bin area
          if (currentY > trashBinThreshold) {
            // Delete question
            handleDeleteQuestion(questionId);
          } else {
            // Reorder: calculate new index based on drag distance
            const questionHeight = 120; // Approximate height of question card
            const dragDistance = gestureState.dy;
            const indexChange = Math.round(dragDistance / questionHeight);
            const newIndex = Math.max(0, Math.min(questions.length - 1, questionIndex + indexChange));
            
            if (newIndex !== questionIndex) {
              const newQuestions = [...questions];
              const [movedQuestion] = newQuestions.splice(questionIndex, 1);
              newQuestions.splice(newIndex, 0, movedQuestion);
              setQuestions(newQuestions);
            }
          }
          
          // Reset drag state
          Animated.spring(dragAnim, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            dragAnim.setOffset({ x: 0, y: 0 });
            dragAnim.setValue({ x: 0, y: 0 });
          });
          
          setDraggedQuestionId(null);
          setShowTrashBin(false);
          setDragPosition({ x: 0, y: 0 });
        }
      },
    });
  }, [isSelectionMode, draggedQuestionId, questions, screenHeight]);

  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case 'choice':
        return 'Choice';
      case 'written':
        return 'Written Answer';
      default:
        return type;
    }
  };

  const getSelectionRangeLabel = (question: Question): string => {
    if (question.type === 'choice' && question.minSelections && question.maxSelections) {
      return `${question.minSelections}-${question.maxSelections}`;
    }
    return '';
  };

  const validateSurvey = (): string[] => {
    const errors: string[] = [];
    if (!surveyTitle.trim()) {
      errors.push('Survey title is required');
    }
    if (questions.length === 0) {
      errors.push('At least one question is required');
    }
    return errors;
  };

  const handlePreviewSurvey = () => {
    const errors = validateSurvey();
    if (errors.length > 0) {
      // Show alert
      alert(`Please fix the following issues:\n\n${errors.join('\n')}`);
      // Show inline error
      setValidationError(errors.join(', '));
      return;
    }
    
    // Clear any previous errors
    setValidationError('');
    
    // Navigate with survey data
    navigation.navigate('SurveyPreview', {
      surveyId: route.params?.surveyId || 'new',
      surveyTitle: surveyTitle.trim(),
      surveySubtitle: surveySubtitle.trim() || undefined,
      questions: questions,
    });
  };

  const handleArchiveSurvey = () => {
    const errors = validateSurvey();
    if (errors.length > 0) {
      // Show alert
      alert(`Please fix the following issues:\n\n${errors.join('\n')}`);
      // Show inline error
      setValidationError(errors.join(', '));
      return;
    }
    
    // Clear any previous errors
    setValidationError('');
    
    const surveyId = route.params?.surveyId || `survey-${Date.now()}`;
    const questionsCount = questions.length;

    navigation.navigate('SurveyArchived', {
      surveyId,
      surveyTitle: surveyTitle.trim(),
      questionsCount,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Questions</Text>
            <Text style={styles.subtitle}>Build your survey question by question</Text>
          </View>

          {/* Survey Title and Subtitle */}
          <View style={styles.surveyMetadataCard}>
            <View style={styles.metadataSection}>
              <Text style={styles.metadataLabel}>
                Survey Title <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.metadataInput}
                placeholder="Enter survey title..."
                placeholderTextColor={Colors.textMuted}
                value={surveyTitle}
                onChangeText={(text) => {
                  setSurveyTitle(text);
                  // Clear validation error when user starts typing
                  if (validationError) setValidationError('');
                }}
              />
            </View>
            <View style={[styles.metadataSection, styles.metadataSectionLast]}>
              <Text style={styles.metadataLabel}>Survey Subtitle (Optional)</Text>
              <TextInput
                style={styles.metadataInput}
                placeholder="Enter survey subtitle..."
                placeholderTextColor={Colors.textMuted}
                value={surveySubtitle}
                onChangeText={setSurveySubtitle}
              />
            </View>
          </View>

          {/* Selection Mode Header */}
          {isSelectionMode && (
            <View style={styles.selectionHeader}>
              <Text style={styles.selectionCount}>
                {selectedQuestions.size} selected
              </Text>
              <TouchableOpacity onPress={handleCancelSelection}>
                <Text style={styles.cancelSelectionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bulk Actions */}
          {isSelectionMode && selectedQuestions.size > 0 && (
            <View style={styles.bulkActions}>
              <TouchableOpacity 
                style={[styles.bulkActionButton, styles.requiredButton]}
                onPress={handleBulkMarkRequired}
              >
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.bulkActionText}>Mark Required</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.bulkActionButton, styles.optionalButton]}
                onPress={handleBulkMarkOptional}
              >
                <Ionicons name="ellipse-outline" size={18} color={Colors.textMuted} />
                <Text style={styles.bulkActionText}>Mark Optional</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.bulkActionButton, styles.deleteButton]}
                onPress={handleBulkDelete}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
                <Text style={styles.bulkActionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Existing Questions */}
          {questions.length > 0 ? (
            <View style={styles.questionsSection}>
              {questions.map((question, index) => {
                const isSelected = selectedQuestions.has(question.id);
                const isDragging = draggedQuestionId === question.id;
                const panResponder = createPanResponder(question.id, index);
                
                return (
                  <Animated.View
                    key={question.id}
                    style={[
                      styles.questionCard,
                      isSelected && styles.questionCardSelected,
                      isDragging && styles.questionCardDragging,
                      isDragging && {
                        transform: [
                          { translateX: dragAnim.x },
                          { translateY: dragAnim.y },
                        ],
                        opacity: 0.8,
                        zIndex: 1000,
                        elevation: 10,
                      },
                    ]}
                    {...panResponder.panHandlers}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => !isDragging && handleToggleSelection(question.id)}
                      onLongPress={() => !isDragging && handleToggleSelection(question.id)}
                      disabled={isDragging}
                    >
                      <View style={styles.questionCardHeader}>
                        <View style={styles.questionContent}>
                          <View style={styles.questionHeaderRow}>
                            <Text style={styles.questionNumber}>Q{index + 1}</Text>
                            <View style={[
                              styles.requiredBadge,
                              !question.required && styles.optionalBadge
                            ]}>
                              <Text style={[
                                styles.requiredBadgeText,
                                !question.required && styles.optionalBadgeText
                              ]}>
                                {question.required ? 'Required' : 'Optional'}
                              </Text>
                            </View>
                            {question.type === 'choice' && question.minSelections && question.maxSelections && (
                              <View style={styles.selectionRangeBadge}>
                                <Text style={styles.selectionRangeText}>
                                  {question.minSelections}-{question.maxSelections} selections
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.questionText}>{question.text}</Text>
                          <View style={styles.questionTypeBadge}>
                            <Text style={styles.questionTypeText}>
                              {getQuestionTypeLabel(question.type)}
                            </Text>
                          </View>
                        </View>
                        {isSelectionMode ? (
                          <View style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected
                          ]}>
                            {isSelected && (
                              <Ionicons name="checkmark" size={20} color={Colors.white} />
                            )}
                          </View>
                        ) : (
                          <TouchableOpacity style={styles.dragHandle}>
                            <Ionicons name="reorder-three-outline" size={20} color={Colors.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {!isSelectionMode && !isDragging && (
                        <View style={styles.questionActions}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleEditQuestion(question)}
                          >
                            <Ionicons name="pencil" size={18} color={Colors.textSecondary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDeleteQuestion(question.id)}
                          >
                            <Ionicons name="trash-outline" size={18} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            !showInlineForm && (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={Colors.textMuted} />
                <Text style={styles.emptyStateText}>No questions yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add your first question to get started
                </Text>
              </View>
            )
          )}

          {/* Inline Question Form */}
          {showInlineForm && (
            <View style={styles.inlineForm}>
              <View style={styles.inlineFormHeader}>
                <Text style={styles.inlineFormTitle}>
                  {editingQuestion ? 'Edit Question' : 'Add Question'}
                </Text>
                <TouchableOpacity onPress={handleCancelForm}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.inlineFormScroll} showsVerticalScrollIndicator={false}>
                {/* Question Text */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Question Text *</Text>
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="Enter your question..."
                    placeholderTextColor={Colors.textMuted}
                    value={questionText}
                    onChangeText={setQuestionText}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Question Type */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Question Type *</Text>
                  <View style={styles.typeOptions}>
                    <TouchableOpacity
                      style={[
                        styles.typeOption,
                        questionType === 'choice' && styles.typeOptionSelected
                      ]}
                      onPress={() => setQuestionType('choice')}
                    >
                      <Ionicons 
                        name="radio-button-on" 
                        size={20} 
                        color={questionType === 'choice' ? RESEARCHER_COLOR : Colors.textMuted} 
                      />
                      <Text style={[
                        styles.typeOptionText,
                        questionType === 'choice' && styles.typeOptionTextSelected
                      ]}>
                        Choice
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeOption,
                        questionType === 'written' && styles.typeOptionSelected
                      ]}
                      onPress={() => setQuestionType('written')}
                    >
                      <Ionicons 
                        name="create-outline" 
                        size={20} 
                        color={questionType === 'written' ? RESEARCHER_COLOR : Colors.textMuted} 
                      />
                      <Text style={[
                        styles.typeOptionText,
                        questionType === 'written' && styles.typeOptionTextSelected
                      ]}>
                        Written Answer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Min/Max Selections for Choice */}
                {questionType === 'choice' && (
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Selection Range *</Text>
                    <View style={styles.selectionRangeRow}>
                      <View style={styles.selectionInputContainer}>
                        <Text style={styles.selectionInputLabel}>Min</Text>
                        <TextInput
                          style={styles.selectionInput}
                          placeholder="1"
                          placeholderTextColor={Colors.textMuted}
                          value={minSelections}
                          onChangeText={setMinSelections}
                          keyboardType="number-pad"
                        />
                      </View>
                      <Text style={styles.selectionRangeSeparator}>-</Text>
                      <View style={styles.selectionInputContainer}>
                        <Text style={styles.selectionInputLabel}>Max</Text>
                        <TextInput
                          style={styles.selectionInput}
                          placeholder="1"
                          placeholderTextColor={Colors.textMuted}
                          value={maxSelections}
                          onChangeText={setMaxSelections}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                    <Text style={styles.selectionRangeHint}>
                      Example: 1-1 (single choice), 1-2 (one or two), 2-4 (two to four)
                    </Text>
                  </View>
                )}

                {/* Options for Choice Questions */}
                {questionType === 'choice' && (
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Options *</Text>
                    {options.map((option, index) => (
                      <View key={index} style={styles.optionInputRow}>
                        <TextInput
                          style={styles.optionInput}
                          placeholder={`Option ${index + 1}`}
                          placeholderTextColor={Colors.textMuted}
                          value={option}
                          onChangeText={(value) => handleUpdateOption(index, value)}
                        />
                        {options.length > 2 && (
                          <TouchableOpacity
                            style={styles.removeOptionButton}
                            onPress={() => handleRemoveOption(index)}
                          >
                            <Ionicons name="close-circle" size={24} color={Colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addOptionButton}
                      onPress={handleAddOption}
                    >
                      <Ionicons name="add-circle" size={20} color={RESEARCHER_COLOR} />
                      <Text style={styles.addOptionText}>Add Option</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Required/Optional Toggle */}
                <View style={styles.formSection}>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLabelContainer}>
                      <Text style={styles.formLabel}>Required</Text>
                      <Text style={styles.toggleDescription}>
                        {isRequired 
                          ? 'Respondents must answer this question' 
                          : 'Respondents can skip this question'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.toggleSwitch,
                        isRequired && styles.toggleSwitchActive
                      ]}
                      onPress={() => setIsRequired(!isRequired)}
                    >
                      <View style={[
                        styles.toggleThumb,
                        isRequired && styles.toggleThumbActive
                      ]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveQuestion}
                >
                  <LinearGradient
                    colors={[RESEARCHER_COLOR, '#8B5CF6']}
                    style={styles.saveButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingQuestion ? 'Update Question' : 'Add Question'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Add New Question Button (when form is hidden) */}
          {!showInlineForm && (
            <View style={styles.addQuestionSection}>
              <TouchableOpacity style={styles.addQuestionButton} onPress={handleAddQuestion}>
                <Ionicons name="add-circle-outline" size={24} color={RESEARCHER_COLOR} />
                <Text style={styles.addQuestionButtonText}>Add Question</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Trash Bin (visible when dragging) */}
        {showTrashBin && (
          <View style={[styles.trashBin, { bottom: 100 }]}>
            <Ionicons name="trash" size={32} color={Colors.error} />
            <Text style={styles.trashBinText}>Drop to delete</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.previewButtonContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.archiveButton, { flex: 1, marginRight: 8 }]} 
              onPress={handleArchiveSurvey}
            >
              <Ionicons name="archive-outline" size={20} color="#6B7280" style={styles.archiveButtonIcon} />
              <Text style={styles.archiveButtonText}>Archive</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.previewButton, { flex: 1, marginLeft: 8 }]} 
              onPress={handlePreviewSurvey}
            >
              <LinearGradient
                colors={[RESEARCHER_COLOR, '#8B5CF6']}
                style={styles.previewButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.previewButtonText}>Preview</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {validationError ? (
            <View style={styles.errorMessageContainer}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorMessageText}>{validationError}</Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cancelSelectionText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
  },
  requiredButton: {
    borderColor: Colors.success,
  },
  optionalButton: {
    borderColor: Colors.border,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
  bulkActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  questionsSection: {
    marginBottom: 24,
    gap: 16,
  },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  questionCardSelected: {
    borderColor: RESEARCHER_COLOR,
    borderWidth: 2,
    backgroundColor: `${RESEARCHER_COLOR}08`,
  },
  questionCardDragging: {
    zIndex: 1000,
    elevation: 10,
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionContent: {
    flex: 1,
    marginRight: 12,
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: RESEARCHER_COLOR,
  },
  requiredBadge: {
    backgroundColor: `${Colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  optionalBadge: {
    backgroundColor: `${Colors.textMuted}15`,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  optionalBadgeText: {
    color: Colors.textMuted,
  },
  selectionRangeBadge: {
    backgroundColor: `${RESEARCHER_COLOR}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectionRangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: RESEARCHER_COLOR,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  questionTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${RESEARCHER_COLOR}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questionTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: RESEARCHER_COLOR,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: RESEARCHER_COLOR,
    borderColor: RESEARCHER_COLOR,
  },
  dragHandle: {
    padding: 4,
  },
  questionActions: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  addQuestionSection: {
    marginBottom: 24,
  },
  addQuestionButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 2,
    borderColor: RESEARCHER_COLOR,
    borderStyle: 'dashed',
  },
  addQuestionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: RESEARCHER_COLOR,
  },
  // Inline Form Styles
  inlineForm: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inlineFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  inlineFormTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inlineFormScroll: {
    maxHeight: 600,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  formTextInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeOptions: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeOptionSelected: {
    borderColor: RESEARCHER_COLOR,
    backgroundColor: `${RESEARCHER_COLOR}08`,
  },
  typeOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: RESEARCHER_COLOR,
    fontWeight: '600',
  },
  selectionRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  selectionInputContainer: {
    flex: 1,
  },
  selectionInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  selectionInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  selectionRangeSeparator: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 20,
  },
  selectionRangeHint: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  optionInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeOptionButton: {
    padding: 4,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  addOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: RESEARCHER_COLOR,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: RESEARCHER_COLOR,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  trashBin: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: `${Colors.error}15`,
    borderTopWidth: 2,
    borderTopColor: Colors.error,
    zIndex: 1000,
  },
  trashBinText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
    marginTop: 8,
  },
  previewButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 0,
  },
  archiveButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  archiveButtonIcon: {
    marginRight: 6,
  },
  archiveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  previewButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  surveyMetadataCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metadataSection: {
    marginBottom: 16,
  },
  metadataSectionLast: {
    marginBottom: 0,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: Colors.error,
  },
  metadataInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  errorMessageText: {
    fontSize: 13,
    color: Colors.error,
    flex: 1,
  },
});

export default CreateSurveyScreen;
