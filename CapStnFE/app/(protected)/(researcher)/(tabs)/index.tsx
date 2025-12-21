import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, StyleSheet as RNStyleSheet } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";
import { HomeSkeleton } from "@/components/Skeleton";
import { getUser } from "@/api/storage";
import { getPublishedSurveys } from "@/api/surveys";
import { getResponsesByUserId } from "@/api/responses";
import { getSurveysByCreatorId } from "@/api/surveys";
import User from "@/types/User";
import { Colors, Typography, Spacing, Shadows } from "@/constants/design";

interface DashboardStats {
  surveysAnswered: number;
  surveysCreated: number;
  totalPoints: number;
  streak: number;
  surveysAvailable: number;
}

export default function ResearcherHome() {
  const router = useRouter();
  const bottomNavHeight = useBottomNavHeight();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    surveysAnswered: 0,
    surveysCreated: 0,
    totalPoints: 0,
    streak: 0,
    surveysAvailable: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userData = await getUser();
      setUser(userData);

      if (userData?._id) {
        const [responses, createdSurveys, availableSurveys] = await Promise.all([
          getResponsesByUserId(userData._id).catch(() => []),
          getSurveysByCreatorId(userData._id).catch(() => []),
          getPublishedSurveys().catch(() => []),
        ]);

        const uniqueSurveysAnswered = new Set(responses.map((r) => r.surveyId));

        setStats({
          surveysAnswered: uniqueSurveysAnswered.size,
          surveysCreated: createdSurveys.length,
          totalPoints: userData.points || 0,
          streak: userData.streak || 0,
          surveysAvailable: availableSurveys.filter(s => s.creatorId !== userData._id).length,
        });
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <FadeInView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
        {/* Gradient Background */}
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF', '#F5F3FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.name?.split(" ")[0] || "Researcher"}
              </Text>
              <Text style={styles.date}>{formatDate()}</Text>
            </View>
            <Image
              source={require("@/assets/title.png")}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + Spacing.lg }]}
        >
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: Colors.surface.blueTint }]}
              onPress={() => router.push("/(protected)/(researcher)/(tabs)/surveys" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="checkbox-outline" size={24} color={Colors.primary.blue} />
              <Text style={[styles.statValue, { color: Colors.primary.blue }]}>{stats.surveysAnswered}</Text>
              <Text style={styles.statLabel}>Answered</Text>
              <View style={styles.statArrow}>
                <Ionicons name="chevron-forward" size={12} color={Colors.primary.blue} style={{ opacity: 0.5 }} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: Colors.surface.purpleTint }]}
              onPress={() => router.push("/(protected)/(researcher)/(tabs)/research" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={24} color={Colors.primary.purple} />
              <Text style={[styles.statValue, { color: Colors.primary.purple }]}>{stats.surveysCreated}</Text>
              <Text style={styles.statLabel}>Created</Text>
              <View style={styles.statArrow}>
                <Ionicons name="chevron-forward" size={12} color={Colors.primary.purple} style={{ opacity: 0.5 }} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: Colors.surface.pinkTint }]}
              onPress={() => router.push("/(protected)/(researcher)/(tabs)/profile" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="diamond-outline" size={24} color={Colors.primary.pink} />
              <Text style={[styles.statValue, { color: Colors.primary.pink }]}>{stats.totalPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
              <View style={styles.statArrow}>
                <Ionicons name="chevron-forward" size={12} color={Colors.primary.pink} style={{ opacity: 0.5 }} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: Colors.surface.tealTint }]}
              onPress={() => router.push("/(protected)/(researcher)/(tabs)/profile" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="flash-outline" size={24} color={Colors.accent.teal} />
              <Text style={[styles.statValue, { color: Colors.accent.teal }]}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
              <View style={styles.statArrow}>
                <Ionicons name="chevron-forward" size={12} color={Colors.accent.teal} style={{ opacity: 0.5 }} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/(protected)/(researcher)/(tabs)/surveys" as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.accent.sky, Colors.primary.blue]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                >
                  <Ionicons name="compass-outline" size={28} color={Colors.background.primary} />
                  <Text style={styles.actionCardTitle}>Browse Surveys</Text>
                  <Text style={styles.actionCardSubtitle}>{stats.surveysAvailable} available</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/(protected)/(researcher)/create-survey" as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primary.purple, Colors.primary.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                >
                  <Ionicons name="add-outline" size={28} color={Colors.background.primary} />
                  <Text style={styles.actionCardTitle}>Create Survey</Text>
                  <Text style={styles.actionCardSubtitle}>Start new research</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/(protected)/(researcher)/(tabs)/sightai" as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.dark.backgroundSecondary, Colors.dark.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                >
                  <Image
                    source={require("@/assets/logo.png")}
                    style={styles.actionCardLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.actionCardTitle}>SightAI</Text>
                  <Text style={styles.actionCardSubtitle}>Analyze data</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/(protected)/(researcher)/(tabs)/research" as any)}
                activeOpacity={0.8}
              >
                <View style={styles.actionCardOutline}>
                  <Ionicons name="briefcase-outline" size={28} color={Colors.primary.blue} />
                  <Text style={[styles.actionCardTitle, { color: Colors.text.primary }]}>My Research</Text>
                  <Text style={[styles.actionCardSubtitle, { color: Colors.text.secondary }]}>
                    {stats.surveysCreated} surveys
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Insights Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Research Journey</Text>
            <View style={styles.insightCard}>
              <View style={styles.insightIconContainer}>
                <Ionicons name="analytics-outline" size={32} color={Colors.primary.purple} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Insights Dashboard</Text>
                <Text style={styles.insightText}>
                  Complete more surveys and create research to unlock personalized analytics and trends.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.insightButton}
                onPress={() => router.push("/(protected)/(researcher)/(tabs)/sightai" as any)}
              >
                <Text style={styles.insightButtonText}>Explore</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary.blue} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Activity Tip */}
          {stats.streak > 0 && (
            <View style={styles.streakBanner}>
              <Ionicons name="flash" size={20} color={Colors.semantic.warning} />
              <Text style={styles.streakText}>
                You're on a {stats.streak}-day streak! Keep going!
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h3,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: 4,
  },
  date: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
  },
  titleImage: {
    height: 28,
    width: 94,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: "48%",
    aspectRatio: 1.3,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  statValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.h2,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.captionSmall,
    color: Colors.text.secondary,
  },
  statArrow: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  actionCard: {
    width: "48%",
    borderRadius: Spacing.card.borderRadius,
    overflow: "hidden",
    ...Shadows.sm,
  },
  actionCardGradient: {
    padding: Spacing.md,
    minHeight: 120,
    justifyContent: "space-between",
  },
  actionCardOutline: {
    padding: Spacing.md,
    minHeight: 120,
    justifyContent: "space-between",
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: Spacing.card.borderRadius,
  },
  actionCardLogo: {
    width: 28,
    height: 28,
  },
  actionCardTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.background.primary,
    marginTop: Spacing.xs,
  },
  actionCardSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.captionSmall,
    color: "rgba(255, 255, 255, 0.8)",
  },
  insightCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.padding,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  insightIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface.purpleTint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  insightContent: {
    marginBottom: Spacing.md,
  },
  insightTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.bodyLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  insightText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  insightButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  insightButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.body,
    color: Colors.primary.blue,
  },
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.semantic.warningLight,
    borderRadius: Spacing.button.borderRadius,
    padding: Spacing.sm,
    gap: Spacing.xs,
    justifyContent: "center",
  },
  streakText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.semantic.warning,
  },
});
