/**
 * Tutorial Screen - Onboarding slides after signup
 * Introduces users to the app's key features
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components';
import { Colors } from '../src/constants/colors';

// Tutorial slides data
const TUTORIAL_SLIDES = [
  {
    id: 1,
    icon: 'document-text-outline',
    title: 'Create Clean Surveys',
    description: 'Design structured questions that lead to clear, meaningful results.',
  },
  {
    id: 2,
    icon: 'share-social-outline',
    title: 'Share with Ease',
    description: 'Distribute your surveys effortlessly via link, email, or QR code.',
  },
  {
    id: 3,
    icon: 'bar-chart-outline',
    title: 'Analyze Responses',
    description: 'Watch insights emerge as responses flow in with real-time analytics.',
  },
  {
    id: 4,
    icon: 'bulb-outline',
    title: 'Get Smart Insights',
    description: 'AI-powered analysis transforms raw data into actionable recommendations.',
  },
];

export default function TutorialScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  
  const { width: screenWidth } = Dimensions.get('window');
  const isLastSlide = activeSlide === TUTORIAL_SLIDES.length - 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );
    if (slideIndex >= 0 && slideIndex < TUTORIAL_SLIDES.length) {
      setActiveSlide(slideIndex);
    }
  };

  const handleNext = () => {
    if (isLastSlide) {
      // Navigate to Path Selection after tutorial
      router.push('/path-selection');
    } else {
      const nextSlide = activeSlide + 1;
      scrollRef.current?.scrollTo({
        x: nextSlide * screenWidth,
        animated: true,
      });
      setActiveSlide(nextSlide);
    }
  };

  const handleSkip = () => {
    // Skip tutorial and go to Path Selection
    router.push('/path-selection');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back and Skip */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {!isLastSlide && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate={0.9}
        bounces={false}
        style={styles.slideContainer}
      >
        {TUTORIAL_SLIDES.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width: screenWidth }]}>
            {/* Illustration */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLine} />
                  <View style={styles.cardDot} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardLineShort} />
                  <View style={styles.cardLineShort} />
                  <View style={styles.cardLineMedium} />
                </View>
                <Ionicons 
                  name={slide.icon as any} 
                  size={32} 
                  color={Colors.primary} 
                  style={styles.cardIcon}
                />
              </View>
              {/* Decorative circles */}
              <View style={[styles.decorCircle, styles.decorCircle1]} />
              <View style={[styles.decorCircle, styles.decorCircle2]} />
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {TUTORIAL_SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[
                styles.paginationDot,
                activeSlide === index && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isLastSlide ? "Get Started" : "Next"}
            onPress={handleNext}
            variant="primary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    zIndex: 10,
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
  skipText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  slideContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    marginBottom: 40,
    position: 'relative',
  },
  illustrationCard: {
    width: 180,
    height: 140,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLine: {
    width: 60,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
  cardDot: {
    width: 20,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  cardBody: {
    gap: 8,
  },
  cardLineShort: {
    width: '70%',
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  cardLineMedium: {
    width: '50%',
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  cardIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  decorCircle: {
    position: 'absolute',
    backgroundColor: Colors.primaryLight,
    opacity: 0.2,
    borderRadius: 100,
  },
  decorCircle1: {
    width: 100,
    height: 100,
    top: 10,
    right: 40,
  },
  decorCircle2: {
    width: 60,
    height: 60,
    bottom: 20,
    left: 50,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  buttonContainer: {
    width: '100%',
  },
});

