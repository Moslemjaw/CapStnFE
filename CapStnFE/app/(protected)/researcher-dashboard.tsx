/**
 * Researcher Dashboard Screen
 * Main dashboard for researchers to manage surveys and view insights
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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';

const RESEARCHER_COLOR = '#6366F1'; // Indigo for Researcher branding

// Mock data
const MOCK_STATS = {
  activeSurveys: 3,
  totalResponses: 124,
  insights: 8,
};

const MOCK_SURVEYS = [
  {
    id: '1',
    title: 'Campus Food Feedback',
    status: 'Active',
    responseCount: 12,
    updatedAt: '2 days ago',
  },
  {
    id: '2',
    title: 'Student Study Habits',
    status: 'Active',
    responseCount: 47,
    updatedAt: '5 days ago',
  },
  {
    id: '3',
    title: 'Library Services Review',
    status: 'Completed',
    responseCount: 65,
    updatedAt: '1 week ago',
  },
];

export default function ResearcherDashboardScreen() {
  const router = useRouter();
  
  const handleGoBack = () => {
    router.back();
  };

  const handleNewSurvey = () => {
    router.push('/(protected)/create-survey');
  };

  const handleAnalyzeSurveys = () => {
    // TODO: Navigate to analyze multiple surveys screen
    alert('Analyze Multiple Surveys feature coming soon!');
  };

  const handleViewSurvey = (surveyId: string) => {
    // TODO: Navigate to survey details/analytics
    alert(`View survey ${surveyId} details`);
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
          <Text style={styles.title}>Researcher Dashboard</Text>
          <Text style={styles.subtitle}>Manage surveys and explore Insights</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={24} color={RESEARCHER_COLOR} />
            <Text style={styles.statValue}>{MOCK_STATS.activeSurveys}</Text>
            <Text style={styles.statLabel}>Active Surveys</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={RESEARCHER_COLOR} />
            <Text style={styles.statValue}>{MOCK_STATS.totalResponses}</Text>
            <Text style={styles.statLabel}>Responses</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="analytics" size={24} color={RESEARCHER_COLOR} />
            <Text style={styles.statValue}>{MOCK_STATS.insights}</Text>
            <Text style={styles.statLabel}>Insights</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzeSurveys}>
            <LinearGradient
              colors={['#F59E0B', '#F97316']}
              style={styles.analyzeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.analyzeButtonText}>+ Analyze Multiple Surveys</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* My Surveys Section */}
        <View style={styles.surveysSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Surveys</Text>
            <TouchableOpacity style={styles.newSurveyButton} onPress={handleNewSurvey}>
              <LinearGradient
                colors={[RESEARCHER_COLOR, '#8B5CF6']}
                style={styles.newSurveyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.newSurveyButtonText}>+ New Survey</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Survey Cards */}
          {MOCK_SURVEYS.map((survey) => (
            <TouchableOpacity
              key={survey.id}
              style={styles.surveyCard}
              onPress={() => handleViewSurvey(survey.id)}
            >
              <View style={styles.surveyCardHeader}>
                <Text style={styles.surveyCardTitle}>{survey.title}</Text>
                <View style={[
                  styles.statusBadge,
                  survey.status === 'Active' ? styles.statusBadgeActive : styles.statusBadgeCompleted,
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    survey.status === 'Active' ? styles.statusBadgeTextActive : styles.statusBadgeTextCompleted,
                  ]}>
                    {survey.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.surveyCardSummary}>
                {survey.responseCount} responses · Updated {survey.updatedAt}
              </Text>
              <View style={styles.surveyCardActions}>
                <TouchableOpacity style={styles.surveyActionButton}>
                  <Ionicons name="eye-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.surveyActionButton}>
                  <Ionicons name="bar-chart-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.surveyActionButton}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionButtonsRow: {
    marginBottom: 24,
  },
  analyzeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  analyzeButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  surveysSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  newSurveyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  newSurveyButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  newSurveyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
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
  surveyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  surveyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeCompleted: {
    backgroundColor: Colors.border,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeTextActive: {
    color: '#065F46',
  },
  statusBadgeTextCompleted: {
    color: Colors.textSecondary,
  },
  surveyCardSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  surveyCardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  surveyActionButton: {
    padding: 4,
  },
});


