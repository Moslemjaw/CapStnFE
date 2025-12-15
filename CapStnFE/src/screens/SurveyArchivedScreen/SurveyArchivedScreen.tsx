/**
 * Survey Archived Screen
 * Shows success message after archiving a survey
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

type SurveyArchivedScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SurveyArchived'
>;

type SurveyArchivedScreenRouteProp = RouteProp<RootStackParamList, 'SurveyArchived'>;

interface SurveyArchivedScreenProps {
  navigation: SurveyArchivedScreenNavigationProp;
  route: SurveyArchivedScreenRouteProp;
}

export const SurveyArchivedScreen: React.FC<SurveyArchivedScreenProps> = ({ navigation, route }) => {
  const { surveyTitle, questionsCount } = route.params;

  // Calculate estimated duration (roughly 1 minute per question)
  const estimatedDuration = Math.max(1, Math.round(questionsCount * 1.2));

  const handleReturnDashboard = () => {
    navigation.navigate('ResearcherDashboard');
  };

  const handleViewArchived = () => {
    // TODO: Navigate to archived surveys section
    navigation.navigate('ResearcherDashboard');
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

        {/* Archive Icon */}
        <View style={styles.archiveIconContainer}>
          <LinearGradient
            colors={['#9CA3AF', '#6B7280']}
            style={styles.archiveIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="archive" size={48} color={Colors.white} />
          </LinearGradient>
        </View>

        {/* Success Title */}
        <Text style={styles.successTitle}>Survey Archived</Text>
        <Text style={styles.successSubtitle}>Your survey has been safely archived and is no longer accepting responses.</Text>

        {/* Survey Info Card */}
        <View style={styles.infoCard}>
          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <Ionicons name="archive-outline" size={12} color="#6B7280" />
            <Text style={styles.statusText}>Archived</Text>
          </View>

          {/* Survey Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Survey:</Text>
              <Text style={styles.detailValue}>{surveyTitle}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Questions:</Text>
              <Text style={styles.detailValue}>{questionsCount} questions</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Est. Duration:</Text>
              <Text style={styles.detailValue}>~{estimatedDuration} minutes</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}></Text>
              <Text style={styles.detailSuccess}>Survey archived successfully</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Return to Dashboard"
            onPress={handleReturnDashboard}
            variant="primary"
          />
          <TouchableOpacity style={styles.viewArchivedButton} onPress={handleViewArchived}>
            <Text style={styles.viewArchivedText}>View Archived Surveys</Text>
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
  archiveIconContainer: {
    marginBottom: 24,
    alignSelf: 'center',
  },
  archiveIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B7280',
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
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailsContainer: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  detailSuccess: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  actionsContainer: {
    width: '100%',
    gap: 16,
  },
  viewArchivedButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewArchivedText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default SurveyArchivedScreen;

