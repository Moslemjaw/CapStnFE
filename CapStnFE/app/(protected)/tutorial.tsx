import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TUTORIAL_SLIDES = [
  {
    title: "Welcome to sight",
    description: "Your platform for creating surveys and gathering meaningful insights from data.",
    icon: "hand-left-outline" as const,
    gradient: [Colors.surface.blueTint, Colors.background.secondary] as const,
    iconColor: Colors.primary.blue,
  },
  {
    title: "Create Clean Surveys",
    description: "Design structured questions that lead to clear, actionable results.",
    icon: "document-text-outline" as const,
    gradient: [Colors.surface.purpleTint, Colors.background.secondary] as const,
    iconColor: Colors.primary.purple,
  },
  {
    title: "AI-Powered Analysis",
    description: "Get instant insights from your survey responses with sightAI analytics.",
    icon: "sparkles-outline" as const,
    gradient: [Colors.surface.pinkTint, Colors.background.secondary] as const,
    iconColor: Colors.primary.pink,
  },
  {
    title: "Start Your Journey",
    description: "Begin exploring, creating, and discovering insights today.",
    icon: "rocket-outline" as const,
    gradient: [Colors.surface.tealTint, Colors.background.secondary] as const,
    iconColor: Colors.accent.teal,
  },
];

export default function Tutorial() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  // Auto-slide carousel every 5 seconds
  useEffect(() => {
    const startAutoSlide = () => {
      autoSlideTimerRef.current = setInterval(() => {
        setCurrentSlideIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % TUTORIAL_SLIDES.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * SCREEN_WIDTH,
            animated: true,
          });
          return nextIndex;
        });
      }, 5000);
    };

    startAutoSlide();

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, []);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    if (index !== currentSlideIndex && index >= 0 && index < TUTORIAL_SLIDES.length) {
      setCurrentSlideIndex(index);
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
      autoSlideTimerRef.current = setInterval(() => {
        setCurrentSlideIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % TUTORIAL_SLIDES.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * SCREEN_WIDTH,
            animated: true,
          });
          return nextIndex;
        });
      }, 5000);
    }
  };

  const handleGetStarted = () => {
    router.replace("/(protected)/(researcher)/(tabs)/" as any);
  };

  const handleNext = () => {
    if (currentSlideIndex < TUTORIAL_SLIDES.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentSlideIndex(nextIndex);
    }
  };

  const handleSkip = () => {
    router.replace("/(protected)/(researcher)/(tabs)/" as any);
  };

  const isLastSlide = currentSlideIndex === TUTORIAL_SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={TUTORIAL_SLIDES[currentSlideIndex].gradient}
        style={styles.gradientContainer}
      >
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoSection}>
          <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Carousel */}
        <View style={styles.carouselSection}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            style={styles.carouselScrollView}
            contentContainerStyle={styles.carouselContent}
          >
            {TUTORIAL_SLIDES.map((slide, index) => (
              <View key={index} style={styles.slideWrapper}>
                <View style={styles.slide}>
                  {/* Icon */}
                  <View style={[styles.iconCard, { backgroundColor: Colors.background.primary }]}>
                    <Ionicons name={slide.icon} size={48} color={slide.iconColor} />
                  </View>

                  {/* Title */}
                  <Text style={styles.slideTitle}>{slide.title}</Text>

                  {/* Description */}
                  <Text style={styles.slideDescription}>{slide.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Indicators */}
          <View style={styles.indicatorsContainer}>
            {TUTORIAL_SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentSlideIndex && styles.indicatorActive,
                  index === currentSlideIndex && { backgroundColor: TUTORIAL_SLIDES[index].iconColor },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Button Section */}
        <View style={styles.buttonContainer}>
          {isLastSlide ? (
            <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.8} style={styles.buttonWrapper}>
              <LinearGradient
                colors={[Colors.accent.sky, Colors.primary.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleNext} activeOpacity={0.8} style={styles.buttonWrapper}>
              <View style={styles.nextButton}>
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.primary.blue} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: Spacing.xl,
    right: Spacing.page.paddingHorizontal,
    zIndex: 10,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  logoSection: {
    alignItems: "center",
    paddingTop: Spacing.huge,
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
  },
  carouselSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselScrollView: {
    width: SCREEN_WIDTH,
    flexGrow: 0,
  },
  carouselContent: {
    alignItems: "center",
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.page.paddingHorizontal,
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  iconCard: {
    width: 100,
    height: 100,
    borderRadius: Borders.radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xxl,
    ...Shadows.md,
  },
  slideTitle: {
    ...Typography.styles.h1,
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  slideDescription: {
    ...Typography.styles.bodyLarge,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 300,
  },
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xxl,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border.default,
  },
  indicatorActive: {
    width: 28,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.xl,
  },
  buttonWrapper: {
    borderRadius: Borders.radius.lg,
    overflow: "hidden",
    ...Shadows.primary,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md + 4,
    gap: Spacing.xs,
  },
  primaryButtonText: {
    ...Typography.styles.buttonLarge,
    color: Colors.text.inverse,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md + 4,
    gap: Spacing.xs,
    backgroundColor: Colors.background.primary,
    borderRadius: Borders.radius.lg,
    borderWidth: 2,
    borderColor: Colors.primary.blue,
  },
  nextButtonText: {
    ...Typography.styles.buttonLarge,
    color: Colors.primary.blue,
  },
});
