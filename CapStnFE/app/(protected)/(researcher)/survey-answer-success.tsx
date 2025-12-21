import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getSurveyById } from "@/api/surveys";
import { Survey } from "@/api/surveys";
import { FadeInView } from "@/components/FadeInView";
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

export default function SurveyAnswerSuccess() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    surveyId,
    requiredAnswered,
    optionalAnswered,
    pointsEarned,
    durationMs,
    totalQuestions,
    totalRequired,
    totalOptional,
  } = useLocalSearchParams<{
    surveyId: string;
    requiredAnswered: string;
    optionalAnswered: string;
    pointsEarned: string;
    durationMs: string;
    totalQuestions: string;
    totalRequired: string;
    totalOptional: string;
  }>();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (surveyId) {
      loadSurveyData();
    }
  }, [surveyId]);

  const loadSurveyData = async () => {
    if (!surveyId) return;
    try {
      const surveyData = await getSurveyById(surveyId);
      setSurvey(surveyData);
    } catch (err) {
      console.error("Error loading survey:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: string): { value: string; label: string } => {
    const duration = parseInt(ms) || 0;
    const totalMinutes = duration / 60000; // Convert milliseconds to minutes
    if (totalMinutes < 60) {
      return {
        value: totalMinutes.toFixed(2),
        label: "Minutes",
      };
    } else {
      const hours = totalMinutes / 60;
      return {
        value: hours.toFixed(2),
        label: "Hours",
      };
    }
  };

  const reqAnswered = parseInt(requiredAnswered) || 0;
  const optAnswered = parseInt(optionalAnswered) || 0;
  const totalAns = reqAnswered + optAnswered;
  const totalQ = parseInt(totalQuestions) || 0;
  const totalReq = parseInt(totalRequired) || 0;
  const totalOpt = parseInt(totalOptional) || 0;

  const handleFindMoreSurveys = () => {
    router.replace("/(protected)/(researcher)/(tabs)/surveys" as any);
  };

  const handleViewResponses = () => {
    if (surveyId) {
      router.push({
        pathname: "/(protected)/(researcher)/survey-view",
        params: { surveyId },
      } as any);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4A63D8" />
        </View>
      </SafeAreaView>
    );
  }

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
            <View style={styles.headerTextContainer}>
              <View style={styles.logoContainer}>
                <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
              </View>
              <Text style={styles.headerTitle}>Success</Text>
              <Text style={styles.headerSubtitle}>Survey completed successfully</Text>
            </View>
            <Image source={require("@/assets/logo.png")} style={styles.headerLogo} resizeMode="contain" />
          </View>
        </View>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#5FA9F5", "#4A63D8", "#8A4DE8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.iconGradient}
            >
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Survey Submitted!</Text>

          {/* Thank You Message */}
          <Text style={styles.thankYouText}>
            Thank you for sharing your insights. Your response helps us understand better.
          </Text>

          {/* Points Earned Card */}
          <View style={styles.pointsCard}>
            <LinearGradient
              colors={["#FF6FAE", "#8A4DE8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pointsCardGradient}
            >
              <View style={styles.coinsIconContainer}>
                <View style={styles.coinStack}>
                  <View style={[styles.coin, styles.coin1]} />
                  <View style={[styles.coin, styles.coin2]} />
                  <View style={[styles.coin, styles.coin3]} />
                </View>
              </View>
              <Text style={styles.pointsLabel}>POINTS EARNED</Text>
              <Text style={styles.pointsValue}>+{pointsEarned || 0}</Text>
              <Text style={styles.pointsSubtext}>Added to your account</Text>
            </LinearGradient>
          </View>

          {/* Completion Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Ionicons name="bar-chart-outline" size={20} color="#4A63D8" />
              <Text style={styles.statsTitle}>Your Completion Stats</Text>
            </View>

            <View style={styles.statsItem}>
              <Ionicons name="time-outline" size={20} color="#8A4DE8" />
              <Text style={styles.statsLabel}>Time Spent</Text>
              <Text style={styles.statsValue}>
                {formatDuration(durationMs || "0").value} {formatDuration(durationMs || "0").label}
              </Text>
            </View>

            <View style={styles.statsItem}>
              <Ionicons 
                name={reqAnswered === totalReq ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={reqAnswered === totalReq ? "#10B981" : "#4A63D8"} 
              />
              <Text style={styles.statsLabel}>Required Questions</Text>
              <View style={styles.statsValueContainer}>
                <Text style={styles.statsValue}>
                  {reqAnswered}/{totalReq}
                </Text>
              </View>
            </View>

            <View style={styles.statsItem}>
              <Ionicons 
                name={optAnswered === totalOpt && totalOpt > 0 ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={optAnswered === totalOpt && totalOpt > 0 ? "#10B981" : "#4A63D8"} 
              />
              <Text style={styles.statsLabel}>Optional Questions</Text>
              <View style={styles.statsValueContainer}>
                <Text style={styles.statsValue}>
                  {optAnswered}/{totalOpt}
                </Text>
              </View>
            </View>

            <View style={styles.statsItem}>
              <Ionicons 
                name={totalAns === totalQ && totalQ > 0 ? "checkmark-circle" : "layers-outline"} 
                size={20} 
                color={totalAns === totalQ && totalQ > 0 ? "#10B981" : "#8A4DE8"} 
              />
              <Text style={styles.statsLabel}>Total Answered</Text>
              <View style={styles.statsValueContainer}>
                <Text style={styles.statsValue}>
                  {totalAns}/{totalQ}
                </Text>
              </View>
            </View>
          </View>

          {/* Great Job Card */}
          <View style={styles.greatJobCard}>
            <Ionicons name="trophy" size={32} color="#4A63D8" />
            <View style={styles.greatJobTextContainer}>
              <Text style={styles.greatJobTitle}>Great Job!</Text>
              <Text style={styles.greatJobText}>
                Your detailed responses are valuable and help us understand better!
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleFindMoreSurveys}
          >
            <LinearGradient
              colors={["#5FA9F5", "#4A63D8", "#8A4DE8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Find More Surveys</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewResponses}
          >
            <Ionicons name="eye-outline" size={20} color="#222222" />
            <Text style={styles.secondaryButtonText}>View My Responses</Text>
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
    borderBottomLeftRadius: Borders.radius.xl,
    borderBottomRightRadius: Borders.radius.xl,
    borderBottomWidth: Borders.width.default,
    borderBottomColor: Colors.border.light,
    ...Shadows.md,
  },
  header: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTextContainer: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  titleImage: {
    height: Spacing.lg,
    width: 80,
    marginLeft: -Spacing.xxs,
  },
  headerLogo: {
    width: Spacing.avatar.lg + Spacing.md,
    height: Spacing.avatar.lg + Spacing.md,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xxs,
  },
  headerSubtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: Borders.radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  thankYouText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.body,
    paddingHorizontal: Spacing.md,
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
  coinsIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  coinStack: {
    position: "relative",
    width: 40,
    height: 32,
  },
  coin: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: Borders.radius.full,
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  coin1: {
    top: 0,
    left: 0,
    zIndex: 3,
  },
  coin2: {
    top: 4,
    left: 8,
    zIndex: 2,
    opacity: 0.9,
  },
  coin3: {
    top: 8,
    left: 16,
    zIndex: 1,
    opacity: 0.8,
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
  statsPercentage: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.purple,
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
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  bottomSpacer: {
    height: 100,
  },
});
