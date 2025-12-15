/**
 * Survey Preview Screen
 * Preview how respondents will see the survey
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { RootStackParamList } from '../../types';

const RESEARCHER_COLOR = '#6366F1';

type Question = {
  id: string;
  text: string;
  type: 'choice' | 'written';
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  options?: string[];
};

type SurveyPreviewScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SurveyPreview'
>;

type SurveyPreviewScreenRouteProp = RouteProp<RootStackParamList, 'SurveyPreview'>;

interface SurveyPreviewScreenProps {
  navigation: SurveyPreviewScreenNavigationProp;
  route: SurveyPreviewScreenRouteProp;
}

export const SurveyPreviewScreen: React.FC<SurveyPreviewScreenProps> = ({ navigation, route }) => {
  const { surveyId, surveyTitle, surveySubtitle, questions } = route.params;
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Set<number>>>({});

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handlePublish = () => {
    // Navigate to Survey Created success screen
    navigation.navigate('SurveyCreated', {
      surveyId,
      surveyTitle,
      questionsCount: questions.length,
    });
  };

  const handleArchive = () => {
    // Navigate to Survey Archived success screen
    navigation.navigate('SurveyArchived', {
      surveyId,
      surveyTitle,
      questionsCount: questions.length,
    });
  };

  const handleEdit = () => {
    navigation.navigate('CreateSurvey', { surveyId });
  };

  const handleOptionToggle = (questionId: string, optionIndex: number) => {
    setSelectedOptions(prev => {
      const current = prev[questionId] || new Set<number>();
      const question = questions.find(q => q.id === questionId);
      
      if (!question || question.type !== 'choice') return prev;
      
      const min = question.minSelections || 1;
      const max = question.maxSelections || 1;
      const isSingleChoice = min === 1 && max === 1;
      
      const newSet = new Set(current);
      
      if (isSingleChoice) {
        // Single choice: replace selection
        newSet.clear();
        newSet.add(optionIndex);
      } else {
        // Multiple choice: toggle selection
        if (newSet.has(optionIndex)) {
          newSet.delete(optionIndex);
        } else {
          // Check max limit
          if (newSet.size < max) {
            newSet.add(optionIndex);
          }
        }
      }
      
      return { ...prev, [questionId]: newSet };
    });
  };

  const renderQuestion = (question: Question, index: number) => {
    const isSingleChoice = question.type === 'choice' && 
      question.minSelections === 1 && question.maxSelections === 1;
    const isMultipleChoice = question.type === 'choice' && !isSingleChoice;
    const selected = selectedOptions[question.id] || new Set<number>();
    
    return (
      <View key={question.id} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionLabel}>Question {index + 1}</Text>
          {question.required ? (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>Required</Text>
            </View>
          ) : (
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>Optional</Text>
            </View>
          )}
        </View>
        <Text style={styles.questionText}>{question.text}</Text>
        
        {question.type === 'choice' && question.options && (
          <View style={styles.optionsContainer}>
            {question.options.map((option, optIndex) => {
              const isSelected = selected.has(optIndex);
              return (
                <TouchableOpacity
                  key={optIndex}
                  style={styles.optionButton}
                  onPress={() => handleOptionToggle(question.id, optIndex)}
                >
                  {isSingleChoice ? (
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  ) : (
                    <View style={[styles.checkboxOuter, isSelected && styles.checkboxOuterSelected]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color={Colors.white} />
                      )}
                    </View>
                  )}
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
            {isMultipleChoice && question.minSelections && question.maxSelections && (
              <Text style={styles.selectionHint}>
                Select {question.minSelections === question.maxSelections 
                  ? `exactly ${question.minSelections}` 
                  : `${question.minSelections} to ${question.maxSelections}`} option{question.maxSelections > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        )}

        {question.type === 'written' && (
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder={question.required ? "Your answer..." : "Your answer (optional)..."}
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              editable={true}
            />
          </View>
        )}
      </View>
    );
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
          <Text style={styles.title}>Survey Preview</Text>
          <Text style={styles.subtitle}>This is how respondents will see your survey.</Text>
        </View>

        {/* Survey Info Card */}
        <View style={styles.surveyInfoCard}>
          <Text style={styles.surveyTitle}>{surveyTitle}</Text>
          {surveySubtitle && (
            <Text style={styles.surveyDescription}>{surveySubtitle}</Text>
          )}
        </View>

        {/* Questions */}
        {questions.map((question, index) => renderQuestion(question, index))}
      </ScrollView>

      {/* Floating Edit Button */}
      <TouchableOpacity style={styles.editFAB} onPress={handleEdit}>
        <Ionicons name="pencil" size={24} color={Colors.white} />
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.publishButtonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.archiveButton, { flex: 1, marginRight: 8 }]} 
            onPress={handleArchive}
          >
            <Ionicons name="archive-outline" size={20} color="#6B7280" style={styles.archiveButtonIcon} />
            <Text style={styles.archiveButtonText}>Archive</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.publishButton, { flex: 1, marginLeft: 8 }]} 
            onPress={handlePublish}
          >
            <LinearGradient
              colors={[RESEARCHER_COLOR, '#8B5CF6']}
              style={styles.publishButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.publishButtonText}>Publish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 120, // Space for publish button and FAB
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
  surveyInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  surveyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  surveyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  surveyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsBadge: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  requiredBadge: {
    backgroundColor: `${Colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  optionalBadge: {
    backgroundColor: `${Colors.textMuted}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  optionalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxOuterSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  selectionHint: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  textAreaContainer: {
    marginTop: 8,
  },
  textArea: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editFAB: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: RESEARCHER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  publishButtonContainer: {
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
  publishButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  publishButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default SurveyPreviewScreen;

