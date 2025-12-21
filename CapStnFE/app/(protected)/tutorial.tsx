import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TUTORIAL_SLIDES = [
  {
    title: "Welcome to SIGHT",
    description:
      "Your platform for creating surveys and gathering meaningful insights.",
    icon: "hand-left-outline" as const,
  },
  {
    title: "Create Clean Surveys",
    description:
      "Design structured questions that lead to clear, meaningful results.",
    icon: "document-text-outline" as const,
  },
  {
    title: "Analyze Results",
    description:
      "Get instant insights from your survey responses with powerful analytics.",
    icon: "analytics-outline" as const,
  },
  {
    title: "Get Started",
    description: "Choose your path and start your journey with clarity.",
    icon: "rocket-outline" as const,
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

  // Handle scroll events to update current index
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    if (
      index !== currentSlideIndex &&
      index >= 0 &&
      index < TUTORIAL_SLIDES.length
    ) {
      setCurrentSlideIndex(index);
      // Reset auto-slide timer when user manually swipes
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#EEF5FF", "#F9F6FE"]}
        style={styles.gradientContainer}
      >
        <View style={styles.contentContainer}>
          {/* Carousel Section */}
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
                    {/* Icon Container */}
                    <View style={styles.iconContainer}>
                      <View style={styles.iconCard}>
                        <Ionicons name={slide.icon} size={48} color="#4A63D8" />
                      </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.slideTitle}>{slide.title}</Text>

                    {/* Description */}
                    <Text style={styles.slideDescription}>
                      {slide.description}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Carousel Indicators */}
            <View style={styles.indicatorsContainer}>
              {TUTORIAL_SLIDES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentSlideIndex && styles.indicatorActive,
                  ]}
                >
                  {index === currentSlideIndex && (
                    <LinearGradient
                      colors={["#5FA9F5", "#4A63D8"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.indicatorGradient}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Get Started Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleGetStarted}
                activeOpacity={0.8}
                style={styles.getStartedButton}
              >
                <LinearGradient
                  colors={["#5FA9F5", "#4A63D8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
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
  contentContainer: {
    flex: 1,
  },
  carouselSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  carouselScrollView: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  carouselContent: {
    alignItems: "center",
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingTop: 60,
  },
  iconContainer: {
    marginBottom: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCard: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "rgba(238, 245, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  slideDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 40,
    marginBottom: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C8C8C8",
    borderWidth: 0,
  },
  indicatorActive: {
    borderWidth: 0,
    width: 24,
  },
  indicatorGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 40,
  },
  getStartedButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
