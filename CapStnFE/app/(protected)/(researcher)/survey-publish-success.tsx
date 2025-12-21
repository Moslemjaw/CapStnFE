import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import React from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { FadeInView } from "@/components/FadeInView";
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

export default function SurveyPublishSuccess() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { surveyId, questionCount, points, estimatedMinutes } =
    useLocalSearchParams<{
      surveyId: string;
      questionCount: string;
      points: string;
      estimatedMinutes: string;
    }>();

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
            Your survey has been published
          </Text>
        </View>
      </View>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={["#5FA9F5", "#4A63D8", "#8A4DE8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.iconGradient}
          >
            <Ionicons name="checkmark" size={60} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Survey Published!</Text>
        <Text style={styles.subtitle}>
          Your survey has been successfully published and is now available for
          respondents.
        </Text>

        {/* Survey Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Survey Overview</Text>

          <View style={styles.overviewItem}>
            <Ionicons name="list-outline" size={20} color="#4A63D8" />
            <Text style={styles.overviewLabel}>Questions:</Text>
            <Text style={styles.overviewValue}>{questionCount || 0}</Text>
          </View>

          <View style={styles.overviewItem}>
            <Ionicons name="star-outline" size={20} color="#8A4DE8" />
            <Text style={styles.overviewLabel}>Points:</Text>
            <Text style={styles.overviewValue}>{points || 0} pts</Text>
          </View>

          <View style={styles.overviewItem}>
            <Ionicons name="time-outline" size={20} color="#2BB6E9" />
            <Text style={styles.overviewLabel}>Estimated Time:</Text>
            <Text style={styles.overviewValue}>
              {estimatedMinutes || 0} min
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.button} onPress={handleGoToResearch}>
          <LinearGradient
            colors={["#5FA9F5", "#4A63D8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Back to Research</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
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
  },
  overviewCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Borders.radius.lg,
    padding: Spacing.lg,
    width: "100%",
    marginBottom: Spacing.xxl,
    ...Shadows.sm,
  },
  overviewTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  overviewItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  overviewLabel: {
    flex: 1,
    ...Typography.styles.body,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  overviewValue: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  button: {
    borderRadius: Borders.radius.lg,
    overflow: "hidden",
    width: "100%",
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.xs,
  },
  buttonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
});
