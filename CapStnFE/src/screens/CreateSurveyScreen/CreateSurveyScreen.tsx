/**
 * Create Survey Screen
 * Add and manage survey questions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components';
import { Colors } from '../../constants/colors';
import { RootStackParamList } from '../../types';

const RESEARCHER_COLOR = '#6366F1';

// Mock questions data
const MOCK_QUESTIONS = [
  {
    id: '1',
    text: 'How satisfied are you with dining options?',
    type: 'Multiple Choice',
  },
  {
    id: '2',
    text: 'How many meals do you eat on campus daily?',
    type: 'Number',
  },
];

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
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleAddQuestion = () => {
    // TODO: Navigate to question type selection or add question modal
    alert('Add question feature - coming soon!');
  };

  const handleEditQuestion = (questionId: string) => {
    // TODO: Navigate to edit question screen
    alert(`Edit question ${questionId}`);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handlePreviewSurvey = () => {
    navigation.navigate('SurveyPreview', {
      surveyId: route.params?.surveyId || 'new',
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

        {/* Existing Questions */}
        {questions.length > 0 && (
          <View style={styles.questionsSection}>
            {questions.map((question, index) => (
              <View key={question.id} style={styles.questionCard}>
                <View style={styles.questionCardHeader}>
                  <View style={styles.questionContent}>
                    <Text style={styles.questionText}>{question.text}</Text>
                    <View style={styles.questionTypeBadge}>
                      <Text style={styles.questionTypeText}>{question.type}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.dragHandle}>
                    <Ionicons name="reorder-three-outline" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.questionActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditQuestion(question.id)}
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
              </View>
            ))}
          </View>
        )}

        {/* Add New Question Section */}
        <View style={styles.addQuestionSection}>
          <Text style={styles.addQuestionTitle}>Add New Question</Text>
          <TouchableOpacity style={styles.addQuestionButton} onPress={handleAddQuestion}>
            <Text style={styles.addQuestionButtonText}>+ Add Question</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Preview Button */}
      <View style={styles.previewButtonContainer}>
        <TouchableOpacity style={styles.previewButton} onPress={handlePreviewSurvey}>
          <LinearGradient
            colors={[RESEARCHER_COLOR, '#8B5CF6']}
            style={styles.previewButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.previewButtonText}>Preview Survey</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    paddingBottom: 100, // Space for preview button
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
  addQuestionSection: {
    marginBottom: 24,
  },
  addQuestionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  addQuestionButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: RESEARCHER_COLOR,
    borderStyle: 'dashed',
  },
  addQuestionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: RESEARCHER_COLOR,
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
});

export default CreateSurveyScreen;

