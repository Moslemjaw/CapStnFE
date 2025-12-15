/**
 * Participant Home Screen
 * Dashboard showing points, available surveys, and user stats
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

// Mock data for available surveys
const MOCK_SURVEYS = [
  {
    id: '1',
    title: 'Student Study Habits Survey',
    description: 'Help us understand your study routines.',
    points: 15,
    duration: 6,
    questionsCount: 5,
  },
  {
    id: '2',
    title: 'Campus Food Feedback',
    description: 'Share your thoughts on dining options.',
    points: 10,
    duration: 4,
    questionsCount: 4,
  },
];

// Mock user data
const MOCK_USER = {
  name: 'User',
  totalPoints: 340,
  weeklyPoints: 40,
  level: 1,
  levelProgress: 75,
  streak: 2,
};

export default function ParticipantHomeScreen() {
  const router = useRouter();
  
  const handleStartSurvey = (survey: typeof MOCK_SURVEYS[0]) => {
    router.push({
      pathname: '/(protected)/survey',
      params: {
        surveyId: survey.id,
        surveyTitle: survey.title,
        points: survey.points.toString(),
        questionsCount: survey.questionsCount.toString(),
        duration: survey.duration.toString(),
      },
    } as any);
  };

  const handleGoBack = () => {
    router.back();
  };

  const activeSurveyCount = MOCK_SURVEYS.length;

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

        {/* Welcome Header */}
        <View style={styles.header}>
          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <View style={styles.avatarCircle}>
              <Ionicons name="headset-outline" size={20} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.surveyCountText}>
            You have {activeSurveyCount} active survey{activeSurveyCount !== 1 ? 's' : ''} available.
          </Text>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsContent}>
            <Text style={styles.pointsLabel}>Your Points</Text>
            <Text style={styles.pointsValue}>{MOCK_USER.totalPoints} pts</Text>
            <Text style={styles.pointsGain}>+{MOCK_USER.weeklyPoints} pts this week</Text>
          </View>
          <View style={styles.pointsIconContainer}>
            <Ionicons name="star" size={28} color={Colors.white} />
          </View>
        </View>

        {/* Available Surveys Section */}
        <View style={styles.surveysSection}>
          <Text style={styles.sectionTitle}>Available Surveys</Text>
          
          {MOCK_SURVEYS.map((survey) => (
            <View key={survey.id} style={styles.surveyCard}>
              <View style={styles.surveyHeader}>
                <View style={styles.surveyTitleRow}>
                  <Text style={styles.surveyTitle}>{survey.title}</Text>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeText}>+{survey.points} pts</Text>
                  </View>
                </View>
                <Text style={styles.surveyDescription}>{survey.description} {survey.duration} minutes.</Text>
              </View>
              
              <View style={styles.surveyFooter}>
                <View style={styles.durationContainer}>
                  <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.durationText}>{survey.duration} min</Text>
                </View>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handleStartSurvey(survey)}
                >
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
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
    marginBottom: 20,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surveyCountText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pointsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pointsContent: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  pointsGain: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  pointsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surveysSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  surveyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  surveyHeader: {
    marginBottom: 16,
  },
  surveyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  pointsBadge: {
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  surveyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  surveyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  startButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});

