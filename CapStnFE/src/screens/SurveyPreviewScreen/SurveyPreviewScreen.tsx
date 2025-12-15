/**
 * Survey Preview Screen
 * Preview how respondents will see the survey
 */

import React from 'react';
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

// Mock survey data
const MOCK_SURVEY = {
  id: '1',
  title: 'Campus Food Feedback',
  description: 'Help us understand your dining preferences and experiences on campus. Your feedback will improve meal options for everyone.',
  points: 15,
  duration: 5,
  questions: [
    {
      id: '1',
      text: 'How satisfied are you with dining options on campus?',
      type: 'Multiple Choice',
      options: [
        'Very satisfied',
        'Somewhat satisfied',
        'Neutral',
        'Not satisfied',
      ],
    },
    {
      id: '2',
      text: 'How many meals do you eat on campus daily?',
      type: 'Number',
    },
    {
      id: '3',
      text: 'Which dining location do you visit most frequently?',
      type: 'Multiple Choice',
      options: [
        'Main Cafeteria',
        'Student Union Food Court',
        'Library Café',
        'Sports Center Snack Bar',
      ],
    },
    {
      id: '4',
      text: 'Any additional comments about campus dining?',
      type: 'Text',
    },
  ],
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
  const survey = MOCK_SURVEY;

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handlePublish = () => {
    // Navigate to Survey Created success screen
    navigation.navigate('SurveyCreated', {
      surveyId: survey.id,
      surveyTitle: survey.title,
      questionsCount: survey.questions.length,
    });
  };

  const handleArchive = () => {
    // Navigate to Survey Archived success screen
    navigation.navigate('SurveyArchived', {
      surveyId: survey.id,
      surveyTitle: survey.title,
      questionsCount: survey.questions.length,
    });
  };

  const handleEdit = () => {
    navigation.navigate('CreateSurvey', { surveyId: survey.id });
  };

  const renderQuestion = (question: typeof MOCK_SURVEY.questions[0], index: number) => {
    return (
      <View key={question.id} style={styles.questionCard}>
        <Text style={styles.questionLabel}>Question {index + 1}</Text>
        <Text style={styles.questionText}>{question.text}</Text>
        
        {question.type === 'Multiple Choice' && question.options && (
          <View style={styles.optionsContainer}>
            {question.options.map((option, optIndex) => (
              <View key={optIndex} style={styles.optionButton}>
                <View style={styles.radioOuter}>
                  <View style={styles.radioInner} />
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </View>
            ))}
          </View>
        )}

        {question.type === 'Number' && (
          <View style={styles.numberInputContainer}>
            <TextInput
              style={styles.numberInput}
              placeholder="0-5"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              editable={false}
            />
          </View>
        )}

        {question.type === 'Text' && (
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Share your thoughts..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              editable={false}
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
          <Text style={styles.surveyTitle}>{survey.title}</Text>
          <Text style={styles.surveyDescription}>{survey.description}</Text>
          <View style={styles.surveyMeta}>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsBadgeText}>+{survey.points} pts</Text>
            </View>
            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.durationText}>{survey.duration} min</Text>
            </View>
          </View>
        </View>

        {/* Questions */}
        {survey.questions.map((question, index) => renderQuestion(question, index))}
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
  questionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
    marginBottom: 8,
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
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  numberInputContainer: {
    marginTop: 8,
  },
  numberInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
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

