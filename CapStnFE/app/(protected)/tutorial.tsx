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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TUTORIAL_SLIDES = [
  {
    title: "Welcome to SIGHT",
    description: "Your platform for creating surveys and gathering meaningful insights.",
    illustration: "👋",
  },
  {
    title: "Create Clean Surveys",
    description: "Design structured questions that lead to clear, meaningful results.",
    illustration: "📝",
  },
  {
    title: "Analyze Results",
    description: "Get instant insights from your survey responses with powerful analytics.",
    illustration: "📊",
  },
  {
    title: "Get Started",
    description: "Choose your path and start your journey with clarity.",
    illustration: "🚀",
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
    if (index !== currentSlideIndex && index >= 0 && index < TUTORIAL_SLIDES.length) {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Decorative Circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        <View style={styles.decorativeCircle4} />

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
                  {/* Illustration Container */}
                  <View style={styles.illustrationContainer}>
                    <View style={styles.illustrationCard}>
                      <Text style={styles.illustrationEmoji}>{slide.illustration}</Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={styles.slideTitle}>{slide.title}</Text>

                  {/* Description */}
                  <Text style={styles.slideDescription}>{slide.description}</Text>
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
                    colors={["#60A5FA", "#34D399"]}
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
                colors={["#60A5FA", "#34D399"]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    position: "relative",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(96, 165, 250, 0.15)",
    top: 40,
    right: -50,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(96, 165, 250, 0.12)",
    top: 120,
    left: -30,
  },
  decorativeCircle3: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    bottom: 200,
    right: 20,
  },
  decorativeCircle4: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(96, 165, 250, 0.08)",
    bottom: 120,
    left: 40,
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
  illustrationContainer: {
    marginBottom: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationCard: {
    width: 200,
    height: 200,
    borderRadius: 24,
    backgroundColor: "rgba(243, 244, 246, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
  },
  illustrationEmoji: {
    fontSize: 80,
    textAlign: "center",
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
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
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
    borderRadius: 24,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
