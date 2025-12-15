/**
 * Landing Screen - Main entry point of the app
 * Displays logo, value proposition carousel, and navigation to Login/Register
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components';
import { Colors } from '../src/constants/colors';

const AUTO_SLIDE_INITIAL_DELAY = 6000; // 6 seconds before starting
const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds between slides

// Value proposition slides data
const VALUE_SLIDES = [
  { 
    id: 1, 
    title: 'Placeholder 1',
    description: 'Description for placeholder 1 goes here.',
  },
  { 
    id: 2, 
    title: 'Placeholder 2',
    description: 'Description for placeholder 2 goes here.',
  },
  { 
    id: 3, 
    title: 'Placeholder 3',
    description: 'Description for placeholder 3 goes here.',
  },
  { 
    id: 4, 
    title: 'Placeholder 4',
    description: 'Description for placeholder 4 goes here.',
  },
];

export default function LandingScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<ScrollView>(null);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeSlideRef = useRef(0); // Track current slide for auto-slide
  const router = useRouter();
  
  // Responsive slide dimensions - full width snap for single slide view
  const { width: screenWidth } = Dimensions.get('window');
  const SLIDE_WIDTH = Math.min(screenWidth - 80, 300); // Card width with padding

  // Keep activeSlideRef in sync with activeSlide state
  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  // Auto-slide functionality
  useEffect(() => {
    // Start auto-sliding after initial delay
    const initialTimer = setTimeout(() => {
      startAutoSlide();
    }, AUTO_SLIDE_INITIAL_DELAY);

    return () => {
      clearTimeout(initialTimer);
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, [screenWidth]);

  const startAutoSlide = () => {
    autoSlideTimerRef.current = setInterval(() => {
      const currentSlide = activeSlideRef.current;
      const nextSlide = (currentSlide + 1) % VALUE_SLIDES.length;
      
      // Scroll to the next slide
      carouselRef.current?.scrollTo({
        x: nextSlide * screenWidth,
        animated: true,
      });
      
      setActiveSlide(nextSlide);
      activeSlideRef.current = nextSlide;
    }, AUTO_SLIDE_INTERVAL);
  };

  // Reset auto-slide timer when user manually swipes
  const resetAutoSlideTimer = () => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
    }
    startAutoSlide();
  };

  const handleGetStarted = () => {
    router.push('/(auth)/register');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );
    if (slideIndex !== activeSlideRef.current && slideIndex >= 0 && slideIndex < VALUE_SLIDES.length) {
      setActiveSlide(slideIndex);
      activeSlideRef.current = slideIndex;
    }
  };

  // Called when user finishes dragging
  const handleScrollEnd = () => {
    resetAutoSlideTimer();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>See insights clearly.</Text>
        </View>

        {/* Value Proposition Carousel */}
        <View style={styles.carouselSection}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={16}
            decelerationRate={0.9}
            bounces={true}
            overScrollMode="always"
          >
            {VALUE_SLIDES.map((slide) => (
              <View 
                key={slide.id} 
                style={[styles.slide, { width: screenWidth }]}
              >
                <View style={[styles.slideCard, { width: SLIDE_WIDTH }]}>
                  {/* Placeholder for illustration */}
                  <View style={styles.slideIllustration}>
                    <View style={styles.illustrationPlaceholder} />
                  </View>
                  {/* Title */}
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  {/* Description */}
                  <Text style={styles.slideDescription}>{slide.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {VALUE_SLIDES.map((slide, index) => (
              <View
                key={slide.id}
                style={[
                  styles.paginationDot,
                  activeSlide === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="Log In"
            onPress={handleLogin}
            variant="secondary"
            style={styles.button}
          />
        </View>

        {/* Bottom Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Turn answers into clarity.</Text>
          <Text style={styles.infoDescription}>
            SIGHT transforms raw survey responses into clear, actionable insights
            using intelligent analysis and beautiful visualizations.
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 16,
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  // Carousel styles
  carouselSection: {
    marginBottom: 32,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slideIllustration: {
    width: '100%',
    height: 100,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  illustrationPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  slideDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
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
  // Button styles
  buttonSection: {
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
    gap: 12,
    marginBottom: 40,
    paddingHorizontal: 32,
  },
  button: {
    marginBottom: 0,
  },
  // Info section
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 48,
    marginTop: 'auto',
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});


