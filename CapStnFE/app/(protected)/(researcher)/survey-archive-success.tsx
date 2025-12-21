import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getSurveyById, publishSurvey } from "@/api/surveys";
import { Survey } from "@/api/surveys";
import { FadeInView } from "@/components/FadeInView";
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

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

  useEffect(() => {
    if (surveyId) {
      loadSurvey();
    }
  }, [surveyId]);

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
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/title.png")}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>Success</Text>
          <Text style={styles.headerSubtitle}>
            Your survey has been archived
          </Text>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={["#5FA9F5", "#4A63D8", "#8A4DE8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name="archive" size={60} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Survey Archived!</Text>
        <Text style={styles.subtitle}>
          Your survey has been successfully saved to your archives. You can
          publish it anytime.
        </Text>

        {/* Survey Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>SURVEY SUMMARY</Text>
          <Text style={styles.surveyTitleText}>
            {survey?.title || "Survey"}
          </Text>

          <View style={styles.summaryModules}>
            <View style={styles.summaryModule}>
              <Ionicons name="list-outline" size={24} color="#4A63D8" />
              <Text style={styles.moduleValue}>{questionCount || 0}</Text>
              <Text style={styles.moduleLabel}>Questions</Text>
            </View>

            <View style={styles.summaryModule}>
              <Ionicons name="time-outline" size={24} color="#2BB6E9" />
              <Text style={styles.moduleValue}>~{estimatedMinutes || 0}</Text>
              <Text style={styles.moduleLabel}>Minutes</Text>
            </View>

            <View style={styles.summaryModule}>
              <Ionicons name="star-outline" size={24} color="#F59E0B" />
              <Text style={styles.moduleValue}>+{points || 0}</Text>
              <Text style={styles.moduleLabel}>Points</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.publishButton}
          onPress={handlePublishNow}
          disabled={actionLoading}
        >
          <LinearGradient
            colors={["#A23DD8", "#D13DB8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.publishButtonGradient}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.publishButtonText}>Publish Now</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditSurvey}
          disabled={actionLoading}
        >
          <Ionicons name="pencil-outline" size={18} color="#6B7280" />
          <Text style={styles.editButtonText}>Edit Survey</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={handleGoToResearch}
          disabled={actionLoading}
        >
          <Text style={styles.backLinkText}>Back to Research</Text>
        </TouchableOpacity>
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
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  titleImage: {
    height: Spacing.xl,
    width: 92,
    marginLeft: -Spacing.xs,
    marginTop: -Spacing.xxs,
  },
  headerTitle: {
    ...Typography.styles.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    alignItems: "center",
    paddingBottom: 100,
  },
  iconContainer: {
    marginBottom: Spacing.xxl,
  },
  iconGradient: {
    width: 120,
    height: 120,
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
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    lineHeight: Typography.lineHeight.body,
    paddingHorizontal: Spacing.xs,
  },
  summaryCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Borders.radius.lg,
    padding: Spacing.lg,
    width: "100%",
    marginBottom: Spacing.xxl,
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  surveyTitleText: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  summaryModules: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  summaryModule: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: Borders.radius.md,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: Borders.width.default,
    borderColor: Colors.border.default,
    ...Shadows.xs,
  },
  timeIconContainer: {
    position: "relative",
    marginBottom: Spacing.xs,
  },
  timeEditIcon: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  moduleValue: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xxs,
  },
  moduleLabel: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  publishButton: {
    borderRadius: Borders.radius.lg,
    overflow: "hidden",
    width: "100%",
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  publishButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.xs,
  },
  publishButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Borders.radius.lg,
    backgroundColor: Colors.background.primary,
    borderWidth: Borders.width.thick,
    borderColor: Colors.border.default,
    width: "100%",
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  editButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.tertiary,
  },
  backLink: {
    paddingVertical: Spacing.sm,
  },
  backLinkText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.blue,
  },
});
