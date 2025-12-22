import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getSurveyById, publishSurvey } from "@/api/surveys";
import { Survey } from "@/api/surveys";
import { FadeInView } from "@/components/FadeInView";
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

// Animated Checkmark Component
function AnimatedCheckmark({ progress }: { progress: Animated.Value }) {
  // Create a drawing effect: start small, grow, then complete
  const scale = progress.interpolate({
    inputRange: [0, 0.5, 0.8, 1],
    outputRange: [0, 0.4, 0.9, 1],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.4, 0.7, 1],
    outputRange: [0, 0.3, 0.8, 1],
  });

  // Rotate from bottom-left to final position (drawing motion)
  const rotate = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: ['-90deg', '-20deg', '0deg'],
  });

  const circleScale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  const circleOpacity = progress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <View style={styles.checkmarkContainer}>
      <Animated.View
        style={[
          styles.checkmarkWrapper,
          {
            opacity,
            transform: [{ scale }, { rotate }],
          },
        ]}
      >
        {/* Circle background */}
        <Animated.View
          style={[
            styles.checkmarkCircle,
            {
              opacity: circleOpacity,
              transform: [{ scale: circleScale }],
            },
          ]}
        />
        <Ionicons name="archive" size={58} color="#FFFFFF" style={styles.checkmarkIcon} />
      </Animated.View>
    </View>
  );
}

export default function SurveyArchiveSuccess() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { surveyId, questionCount, points, estimatedMinutes } =
    useLocalSearchParams<{
      surveyId: string;
      questionCount: string;
      points: string;
      estimatedMinutes: string;
    }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const checkmarkProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (surveyId) {
      loadSurvey();
    }
  }, [surveyId]);

  useEffect(() => {
    // Animate checkmark drawing effect with easing
    Animated.sequence([
      Animated.timing(checkmarkProgress, {
        toValue: 0.6,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(checkmarkProgress, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const loadSurvey = async () => {
    if (!surveyId) return;
    try {
      const surveyData = await getSurveyById(surveyId);
      setSurvey(surveyData);
    } catch (err: any) {
      console.error("Error loading survey:", err);
    }
  };

  const handlePublishNow = async () => {
    if (!surveyId) return;

    setActionLoading(true);
    try {
      await publishSurvey(surveyId);
      router.replace({
        pathname: "/(protected)/(researcher)/survey-publish-success",
        params: {
          surveyId: surveyId,
          questionCount: questionCount || "0",
          points: points || "0",
          estimatedMinutes: estimatedMinutes || "0",
        },
      } as any);
    } catch (err: any) {
      console.error("Error publishing survey:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message ||
          err.message ||
          "Failed to publish survey. Please try again."
      );
      setActionLoading(false);
    }
  };

  const handleEditSurvey = () => {
    if (!surveyId) return;
    router.push({
      pathname: "/(protected)/(researcher)/create-survey",
      params: { surveyId: surveyId },
    } as any);
  };

  const handleGoToResearch = () => {
    router.replace("/(protected)/(researcher)/(tabs)/research" as any);
  };

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[Colors.background.primary, Colors.surface.blueTint, Colors.surface.purpleTint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerRow}>
            <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
          </View>
        </View>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>Survey Archived!</Text>

          {/* Points Earned Card */}
          <View style={styles.pointsCard}>
            <LinearGradient
              colors={["#FF6FAE", "#8A4DE8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pointsCardGradient}
            >
              <AnimatedCheckmark progress={checkmarkProgress} />
              <Text style={styles.pointsValue}>{survey?.title || "Survey"}</Text>
              <Text style={styles.pointsSubtext}>Saved to your archives</Text>
            </LinearGradient>
          </View>

          {/* Completion Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Ionicons name="bar-chart-outline" size={20} color="#4A63D8" />
              <Text style={styles.statsTitle}>Survey Summary</Text>
            </View>

            <View style={styles.statsItem}>
              <Ionicons name="list-outline" size={20} color="#4A63D8" />
              <Text style={styles.statsLabel}>Questions</Text>
              <View style={styles.statsValueContainer}>
                <Text style={styles.statsValue}>
                  {questionCount || 0}
                </Text>
              </View>
            </View>

            <View style={styles.statsItem}>
              <Ionicons name="time-outline" size={20} color="#8A4DE8" />
              <Text style={styles.statsLabel}>Estimated Time</Text>
              <View style={styles.statsValueContainer}>
                <Text style={styles.statsValue}>
                  ~{estimatedMinutes || 0} min
                </Text>
              </View>
            </View>

            <View style={styles.statsItem}>
              <Ionicons name="star-outline" size={20} color="#8A4DE8" />
              <Text style={styles.statsLabel}>Points</Text>
              <View style={styles.statsValueContainer}>
                <Text style={styles.statsValue}>
                  +{points || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.primaryButton, actionLoading && styles.buttonDisabled]}
            onPress={handlePublishNow}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={actionLoading ? ["#9CA3AF", "#6B7280", "#4B5563"] : ["#5FA9F5", "#4A63D8", "#8A4DE8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Publish Now</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, actionLoading && styles.buttonDisabled]}
            onPress={handleEditSurvey}
            disabled={actionLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={20} color={actionLoading ? "#9CA3AF" : "#222222"} />
            <Text style={[styles.secondaryButtonText, actionLoading && styles.buttonTextDisabled]}>Edit Survey</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={handleGoToResearch}
            disabled={actionLoading}
            activeOpacity={0.6}
          >
            <Text style={[styles.backLinkText, actionLoading && styles.buttonTextDisabled]}>Back to Research</Text>
          </TouchableOpacity>

          {/* Spacer for bottom nav */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  fixedHeader: {
    backgroundColor: Colors.background.primary,
    zIndex: 10,
    paddingBottom: 0,
    borderBottomWidth: Borders.width.default,
    borderBottomColor: Colors.border.light,
  },
  header: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  titleImage: {
    height: Spacing.xl,
    width: 94,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    alignItems: "center",
  },
  title: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  pointsCard: {
    width: "100%",
    borderRadius: Borders.radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  pointsCardGradient: {
    padding: Spacing.md,
    alignItems: "center",
  },
  checkmarkContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
    width: 80,
    height: 80,
  },
  checkmarkWrapper: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  checkmarkCircle: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  checkmarkIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 1,
  },
  pointsLabel: {
    fontSize: Typography.fontSize.label,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
    letterSpacing: 1,
  },
  pointsValue: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginTop: Spacing.xxs,
    textAlign: "center",
  },
  pointsSubtext: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.inverse,
    opacity: 0.9,
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Borders.radius.lg,
    padding: Spacing.md,
    width: "100%",
    marginBottom: Spacing.sm,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  statsTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
  },
  statsItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  statsLabel: {
    flex: 1,
    ...Typography.styles.body,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  statsValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statsValue: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  greatJobCard: {
    backgroundColor: Colors.surface.purpleTint,
    borderRadius: Borders.radius.md,
    padding: Spacing.sm + 2,
    width: "100%",
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  greatJobTextContainer: {
    flex: 1,
  },
  greatJobTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  greatJobText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  primaryButton: {
    width: "100%",
    borderRadius: Borders.radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xs,
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    opacity: 1,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.xs,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  secondaryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background.primary,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    borderRadius: Borders.radius.lg,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    opacity: 1,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  backLink: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  backLinkText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.blue,
  },
  bottomSpacer: {
    height: 100,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTextDisabled: {
    opacity: 0.6,
  },
});
