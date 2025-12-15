/**
 * Path Selection Screen
 * Users choose their path: Respondent or Researcher
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';

const { width } = Dimensions.get('window');

export default function PathSelectionScreen() {
  const router = useRouter();
  
  const handleSelectPath = (pathId: 'participant' | 'researcher') => {
    console.log('Selected path:', pathId);
    
    if (pathId === 'participant') {
      router.push('/(protected)/participant-home');
    } else {
      router.push('/(protected)/researcher-dashboard');
    }
  };

  const handleGoBack = () => {
    router.back();
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
          <Text style={styles.title}>Who are you?</Text>
          <Text style={styles.subtitle}>
            Select how you'll be using <Text style={styles.highlightText}>SIGHT</Text>
          </Text>
        </View>

        {/* Path Options */}
        <View style={styles.optionsContainer}>
          
          {/* Participant Card */}
          <TouchableOpacity
            style={styles.pathCard}
            onPress={() => handleSelectPath('participant')}
            activeOpacity={0.85}
          >
            <View style={[styles.cardGradient, styles.respondentGradient]}>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mic" size={32} color={Colors.primary} />
                </View>
              </View>
              
              <Text style={styles.cardTitle}>Participant</Text>
              <Text style={styles.cardDescription}>
                Participate in surveys, share your feedback, and earn rewards for your contribution
              </Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.featureText}>Answer surveys</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.featureText}>Share feedback</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.featureText}>Earn rewards</Text>
                </View>
              </View>

              <View style={styles.selectButton}>
                <Text style={styles.selectButtonText}>Join as Participant</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Researcher Card */}
          <TouchableOpacity
            style={styles.pathCard}
            onPress={() => handleSelectPath('researcher')}
            activeOpacity={0.85}
          >
            <View style={[styles.cardGradient, styles.researcherGradient]}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, styles.researcherIconCircle]}>
                  <Ionicons name="glasses" size={32} color="#6366F1" />
                </View>
              </View>
              
              <Text style={styles.cardTitle}>Researcher</Text>
              <Text style={styles.cardDescription}>
                Launch surveys, gather data, and unlock powerful insights for your projects
              </Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#6366F1" />
                  <Text style={styles.featureText}>Design custom surveys</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#6366F1" />
                  <Text style={styles.featureText}>Access analytics</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#6366F1" />
                  <Text style={styles.featureText}>Get data-driven insights</Text>
                </View>
              </View>

              <View style={[styles.selectButton, styles.researcherButton]}>
                <Text style={styles.selectButtonText}>Start as Researcher</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Ionicons name="swap-horizontal" size={16} color={Colors.textMuted} />
          <Text style={styles.footerText}>
            You can switch roles anytime from settings
          </Text>
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
    marginBottom: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  highlightText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 0,
  },
  pathCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardGradient: {
    padding: 24,
    borderRadius: 20,
  },
  respondentGradient: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: `${Colors.primary}20`,
  },
  researcherGradient: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: '#6366F120',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  researcherIconCircle: {
    backgroundColor: '#6366F112',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  featuresList: {
    gap: 10,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  researcherButton: {
    backgroundColor: '#6366F1',
  },
  selectButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});


