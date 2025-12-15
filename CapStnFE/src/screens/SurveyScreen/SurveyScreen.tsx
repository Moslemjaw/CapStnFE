/**
 * Survey Screen
 * Displays survey questions with multiple choice options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { RootStackParamList } from '../../types';

// Mock questions data
const MOCK_QUESTIONS = [
  {
    id: '1',
    question: 'How many hours do you study per day?',
    options: [
      'Less than 1 hour',
      '1-3 hours',
      '3-5 hours',
      'More than 5 hours',
    ],
  },
  {
    id: '2',
    question: 'Where do you prefer to study?',
    options: [
      'Library',
      'Home',
      'Coffee shop',
      'Campus common areas',
    ],
  },
  {
    id: '3',
    question: 'What time of day do you study best?',
    options: [
      'Early morning',
      'Afternoon',
      'Evening',
      'Late night',
    ],
  },
  {
    id: '4',
    question: 'Do you prefer studying alone or in groups?',
    options: [
      'Always alone',
      'Mostly alone',
      'Mostly in groups',
      'Always in groups',
    ],
  },
  {
    id: '5',
    question: 'How do you take notes?',
    options: [
      'Handwritten notes',
      'Digital notes on laptop',
      'Recording lectures',
      'I don\'t take notes',
    ],
  },
];

type SurveyScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Survey'
>;

type SurveyScreenRouteProp = RouteProp<RootStackParamList, 'Survey'>;

interface SurveyScreenProps {
  navigation: SurveyScreenNavigationProp;
  route: SurveyScreenRouteProp;
}

export const SurveyScreen: React.FC<SurveyScreenProps> = ({ navigation, route }) => {
  const { surveyTitle, points, questionsCount, duration } = route.params;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const totalQuestions = Math.min(questionsCount, MOCK_QUESTIONS.length);
  const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleGoBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(answers[MOCK_QUESTIONS[currentQuestionIndex - 1].id] || null);
    } else {
      navigation.goBack();
    }
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    
    // Save answer
    const newAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(newAnswers);

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(answers[MOCK_QUESTIONS[currentQuestionIndex + 1]?.id] || null);
      } else {
        // Survey completed
        navigation.navigate('SurveyCompleted', {
          surveyTitle,
          points,
          duration,
        });
      }
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{surveyTitle}</Text>
        <View style={styles.questionCounter}>
          <Text style={styles.questionCounterText}>{currentQuestionIndex + 1} / {totalQuestions}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Question Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Label */}
        <Text style={styles.questionLabel}>Question {currentQuestionIndex + 1}</Text>
        
        {/* Question Text */}
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedOption === option && styles.optionButtonSelected,
              ]}
              onPress={() => handleSelectOption(option)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.optionText,
                selectedOption === option && styles.optionTextSelected,
              ]}>
                {option}
              </Text>
              <View style={[
                styles.radioOuter,
                selectedOption === option && styles.radioOuterSelected,
              ]}>
                {selectedOption === option && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Hint */}
      <View style={styles.bottomHint}>
        <Text style={styles.hintText}>Tap an answer to continue</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  questionCounter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  questionCounterText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressBackground: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  questionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 30,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  optionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  bottomHint: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  hintText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});

export default SurveyScreen;

