/**
 * Survey Completed Screen
 * Shows success message, points earned, level progress, and streak
 */

import React from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components';
import { Colors } from '../../constants/colors';
import { RootStackParamList } from '../../types';

// Mock user stats
const MOCK_USER_STATS = {
  levelProgress: 75,
  currentLevel: 1,
  streak: 2,
};

type SurveyCompletedScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SurveyCompleted'
>;

type SurveyCompletedScreenRouteProp = RouteProp<RootStackParamList, 'SurveyCompleted'>;

interface SurveyCompletedScreenProps {
  navigation: SurveyCompletedScreenNavigationProp;
  route: SurveyCompletedScreenRouteProp;
}

export const SurveyCompletedScreen: React.FC<SurveyCompletedScreenProps> = ({ navigation, route }) => {
  const { surveyTitle, points, duration } = route.params;

  const handleReturnHome = () => {
    navigation.navigate('ParticipantHome');
  };

  const handleViewMoreSurveys = () => {
    navigation.navigate('ParticipantHome');
  };

  const handleGoBack = () => {
    navigation.goBack();
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

        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <LinearGradient
            colors={[Colors.primaryLight, Colors.primary]}
            style={styles.successIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark" size={48} color={Colors.white} />
          </LinearGradient>
        </View>

        {/* Success Title */}
        <Text style={styles.successTitle}>Survey Completed</Text>
        <Text style={styles.successSubtitle}>You've helped unlock new insights.</Text>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          {/* Points Earned */}
          <Text style={styles.pointsEarned}>+{points} pts</Text>
          <Text style={styles.pointsLabel}>Points earned</Text>

          {/* Level Progress */}
          <View style={styles.levelProgressContainer}>
            <View style={styles.levelProgressHeader}>
              <Text style={styles.levelProgressLabel}>Level Progress</Text>
              <Text style={styles.levelProgressPercent}>{MOCK_USER_STATS.levelProgress}%</Text>
            </View>
            <View style={styles.levelProgressBar}>
              <View style={[styles.levelProgressFill, { width: `${MOCK_USER_STATS.levelProgress}%` }]} />
            </View>
            <Text style={styles.levelHint}>You're close to Level {MOCK_USER_STATS.currentLevel + 1}</Text>
          </View>

          {/* Streak */}
          <View style={styles.streakContainer}>
            <Ionicons name="flash" size={18} color="#F59E0B" />
            <Text style={styles.streakText}>{MOCK_USER_STATS.streak}-day streak</Text>
          </View>
        </View>

        {/* Survey Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Survey:</Text>
            <Text style={styles.summaryValue}>{surveyTitle}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>~{duration} minutes</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}></Text>
            <Text style={styles.summarySuccess}>Responses submitted successfully</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Return to Home"
            onPress={handleReturnHome}
            variant="primary"
          />
          <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewMoreSurveys}>
            <Text style={styles.viewMoreText}>View More Surveys</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 24,
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
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  successIconContainer: {
    marginBottom: 24,
    alignSelf: 'center',
  },
  successIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    alignSelf: 'center',
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  pointsEarned: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  levelProgressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  levelProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelProgressLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  levelProgressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  levelHint: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B45309',
  },
  summaryContainer: {
    width: '100%',
    marginBottom: 32,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    width: 70,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  summarySuccess: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  actionsContainer: {
    width: '100%',
    gap: 16,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewMoreText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default SurveyCompletedScreen;

