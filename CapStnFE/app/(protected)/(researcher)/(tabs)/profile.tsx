import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AuthContext from "@/context/AuthContext";
import { getUser, deleteToken, storeUser } from "@/api/storage";
import User from "@/types/User";
import { getImageUrl } from "@/utils/imageUtils";
import { getResponsesByUserId } from "@/api/responses";
import { getSurveyById, getSurveysByCreatorId } from "@/api/surveys";
import { getAllAnalyses } from "@/api/ai";
import { calculateStreak } from "@/utils/userProgress";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";
import { ProfileSkeleton } from "@/components/Skeleton";
import { Colors, Typography, Spacing, Shadows, Borders } from "@/constants/design";

export default function ResearcherProfile() {
  const [user, setUser] = useState<User | null>(null);
  const { setIsAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [weeklyPoints, setWeeklyPoints] = useState<number>(0);
  const [loadingWeeklyPoints, setLoadingWeeklyPoints] = useState(false);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [loadingStreak, setLoadingStreak] = useState(false);

  // Activity metrics
  const [surveysAnswered, setSurveysAnswered] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [surveysCreated, setSurveysCreated] = useState<number>(0);
  const [aiAnalyses, setAiAnalyses] = useState<number>(0);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Format duration: show minutes if < 60 min, hours if >= 60 min
  const formatDuration = (ms: number): { value: string; label: string } => {
    const totalMinutes = ms / 60000;
    if (totalMinutes < 60) {
      return {
        value: totalMinutes.toFixed(1),
        label: "Minutes Spent",
      };
    } else {
      const hours = totalMinutes / 60;
      return {
        value: hours.toFixed(1),
        label: "Hours Spent",
      };
    }
  };

  // Animation values
  const termsSlideAnim = useRef(new Animated.Value(0)).current;
  const privacySlideAnim = useRef(new Animated.Value(0)).current;
  const termsOpacityAnim = useRef(new Animated.Value(0)).current;
  const privacyOpacityAnim = useRef(new Animated.Value(0)).current;

  const TAB_BAR_HEIGHT = 60;
  const popupHeight = Dimensions.get("window").height * 0.85 - TAB_BAR_HEIGHT;

  // Animate Terms popup
  useEffect(() => {
    if (showTermsModal) {
      Animated.parallel([
        Animated.timing(termsSlideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(termsOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(termsSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(termsOpacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showTermsModal]);

  // Animate Privacy popup
  useEffect(() => {
    if (showPrivacyModal) {
      Animated.parallel([
        Animated.timing(privacySlideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(privacyOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(privacySlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(privacyOpacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showPrivacyModal]);

  const calculateTotalAndWeeklyPoints = useCallback(async (userId: string) => {
    try {
      setLoadingWeeklyPoints(true);
      const responses = await getResponsesByUserId(userId);
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);

      const weeklyResponses = responses.filter((response) => {
        if (!response.submittedAt) return false;
        const submittedDate = new Date(response.submittedAt);
        return submittedDate >= startOfWeek;
      });

      const uniqueSurveyIds = [...new Set(responses.map((r) => r.surveyId))];
      const surveyPromises = uniqueSurveyIds.map((surveyId) =>
        getSurveyById(surveyId).catch(() => null)
      );
      const surveys = await Promise.all(surveyPromises);

      const surveyPointsMap = new Map<string, number>();
      surveys.forEach((survey) => {
        if (survey) {
          surveyPointsMap.set(survey._id, survey.rewardPoints || 0);
        }
      });

      const lifetimePoints = responses.reduce((sum, response) => {
        const points = surveyPointsMap.get(response.surveyId) || 0;
        return sum + points;
      }, 0);

      const weekPoints = weeklyResponses.reduce((sum, response) => {
        const points = surveyPointsMap.get(response.surveyId) || 0;
        return sum + points;
      }, 0);

      setTotalPoints(lifetimePoints);
      setWeeklyPoints(weekPoints);
    } catch (err) {
      console.error("Error calculating points:", err);
      setTotalPoints(0);
      setWeeklyPoints(0);
    } finally {
      setLoadingWeeklyPoints(false);
    }
  }, []);

  const loadStreak = useCallback(async (userId: string) => {
    if (!userId) {
      setCurrentStreak(0);
      setLoadingStreak(false);
      return;
    }
    try {
      setLoadingStreak(true);
      const streak = await calculateStreak(userId);
      setCurrentStreak(streak);
      const userData = await getUser();
      if (userData) {
        const updatedUser = { ...userData, streakDays: streak };
        await storeUser(updatedUser);
        setUser(updatedUser);
      }
    } catch (err) {
      console.error("Error calculating streak:", err);
      setCurrentStreak(0);
    } finally {
      setLoadingStreak(false);
    }
  }, []);

  const loadActivityMetrics = useCallback(async (userId: string) => {
    try {
      setLoadingActivity(true);
      const responses = await getResponsesByUserId(userId);
      const createdSurveys = await getSurveysByCreatorId(userId);
      const createdSurveyIds = new Set(createdSurveys.map((s) => s._id));

      const validResponses = responses.filter((r) => {
        const isNotSelfCreated = !createdSurveyIds.has(r.surveyId);
        const isNotSpam = !r.isFlaggedSpam;
        return isNotSelfCreated && isNotSpam;
      });

      const uniqueSurveyIds = new Set(validResponses.map((r) => r.surveyId));
      setSurveysAnswered(uniqueSurveyIds.size);

      const totalMs = validResponses.reduce((sum, r) => sum + (r.durationMs || 0), 0);
      setDurationMs(totalMs);
      setSurveysCreated(createdSurveys.length);

      const analysesData = await getAllAnalyses();
      const aiAnalysesCount = analysesData.analyses?.length || analysesData.count || 0;
      setAiAnalyses(aiAnalysesCount);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("Authentication expired - redirecting to login");
        return;
      }
      console.error("Error loading activity metrics:", err);
      setSurveysAnswered(0);
      setDurationMs(0);
      setSurveysCreated(0);
      setAiAnalyses(0);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  const loadUser = useCallback(async () => {
    setInitialLoading(true);
    const userData = await getUser();
    setUser(userData);
    setImageError(false);

    if (userData?._id) {
      await Promise.all([
        calculateTotalAndWeeklyPoints(userData._id),
        loadStreak(userData._id),
        loadActivityMetrics(userData._id),
      ]);
    }
    setInitialLoading(false);
  }, [calculateTotalAndWeeklyPoints, loadStreak, loadActivityMetrics]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleLogout = async () => {
    await deleteToken();
    setIsAuthenticated(false);
    router.replace("/(auth)/login" as any);
  };

  const calculateLevel = (points: number) => {
    const thresholds = [0, 100, 300, 600, 1000];
    const levelNames = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];

    let currentLevel = 1;
    for (let i = 0; i < thresholds.length; i++) {
      if (points >= thresholds[i]) {
        currentLevel = i + 1;
      }
    }
    if (currentLevel > 5) currentLevel = 5;

    const currentThreshold = thresholds[currentLevel - 1] || 0;
    const nextThreshold = thresholds[currentLevel] || thresholds[thresholds.length - 1];
    const progressPoints = points - currentThreshold;
    const neededPoints = nextThreshold - currentThreshold;
    const progressPercent = currentLevel >= 5 ? 100 : (progressPoints / neededPoints) * 100;

    return {
      level: currentLevel,
      levelName: levelNames[currentLevel - 1],
      currentThreshold,
      nextThreshold,
      progressPoints,
      neededPoints,
      progressPercent: Math.min(progressPercent, 100),
      isMaxLevel: currentLevel >= 5,
    };
  };

  const levelInfo = calculateLevel(totalPoints);
  const imageUrl = getImageUrl(user?.image || "");

  if (initialLoading) {
    return <ProfileSkeleton />;
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
        {/* Fixed Header Section */}
        <View style={styles.fixedHeader}>
          <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
            <Text style={styles.title}>Profile</Text>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/title.png")}
                style={styles.titleImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* User Profile Card */}
          <View style={styles.userProfileCard}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                {user?.image && !imageError && imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.avatar}
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <Image
                    source={require("@/assets/logo.png")}
                    style={styles.avatar}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{levelInfo.level}</Text>
                </View>
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || "Researcher"}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || "researcher@example.com"}
              </Text>
              <View style={styles.levelTag}>
                <Text style={styles.levelTagText}>{levelInfo.levelName}</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + Spacing.xl }]}
        >
          {/* Activity Stats Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <View style={styles.statsGrid}>
              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push("/(protected)/(researcher)/(tabs)/surveys" as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconContainer, { backgroundColor: Colors.surface.tealTint }]}>
                  <Ionicons name="checkmark-circle" size={22} color={Colors.accent.teal} />
                </View>
                <Text style={styles.statValue}>
                  {loadingActivity ? "..." : surveysAnswered}
                </Text>
                <Text style={styles.statLabel}>Answered</Text>
                <View style={styles.statArrow}>
                  <Ionicons name="chevron-forward" size={12} color={Colors.text.tertiary} />
                </View>
              </TouchableOpacity>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: Colors.surface.blueTint }]}>
                  <Ionicons name="time" size={22} color={Colors.primary.blue} />
                </View>
                <Text style={styles.statValue}>
                  {loadingActivity ? "..." : formatDuration(durationMs).value}
                </Text>
                <Text style={styles.statLabel}>
                  {loadingActivity ? "Minutes" : formatDuration(durationMs).label.split(" ")[0]}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push("/(protected)/(researcher)/(tabs)/research" as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconContainer, { backgroundColor: Colors.surface.purpleTint }]}>
                  <Ionicons name="document-text" size={22} color={Colors.primary.purple} />
                </View>
                <Text style={styles.statValue}>
                  {loadingActivity ? "..." : surveysCreated}
                </Text>
                <Text style={styles.statLabel}>Created</Text>
                <View style={styles.statArrow}>
                  <Ionicons name="chevron-forward" size={12} color={Colors.text.tertiary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push("/(protected)/(researcher)/(tabs)/sightai" as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconContainer, { backgroundColor: Colors.surface.pinkTint }]}>
                  <Ionicons name="sparkles" size={22} color={Colors.primary.pink} />
                </View>
                <Text style={styles.statValue}>
                  {loadingActivity ? "..." : aiAnalyses}
                </Text>
                <Text style={styles.statLabel}>Analyses</Text>
                <View style={styles.statArrow}>
                  <Ionicons name="chevron-forward" size={12} color={Colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Points & Progress Card */}
          <View style={styles.section}>
            <View style={styles.pointsCard}>
              <LinearGradient
                colors={[Colors.primary.purple, Colors.primary.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pointsGradient}
              >
                <View style={styles.pointsHeader}>
                  <View>
                    <Text style={styles.pointsLabel}>Total Points</Text>
                    <Text style={styles.pointsValue}>
                      {loadingWeeklyPoints ? "..." : totalPoints.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.trophyContainer}>
                    <Ionicons name="trophy" size={36} color="rgba(255,255,255,0.9)" />
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>
                      Next: {levelInfo.nextThreshold.toLocaleString()} pts
                    </Text>
                    <Text style={styles.progressPercent}>
                      {Math.round(levelInfo.progressPercent)}%
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${levelInfo.progressPercent}%` }]} />
                  </View>
                </View>

                <View style={styles.weeklyStats}>
                  <View style={styles.weeklyStatItem}>
                    <Ionicons name="flame" size={18} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.weeklyStatValue}>
                      {loadingStreak ? "..." : currentStreak}
                    </Text>
                    <Text style={styles.weeklyStatLabel}>Day Streak</Text>
                  </View>
                  <View style={styles.weeklyDivider} />
                  <View style={styles.weeklyStatItem}>
                    <Ionicons name="trending-up" size={18} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.weeklyStatValue}>
                      {loadingWeeklyPoints ? "..." : weeklyPoints}
                    </Text>
                    <Text style={styles.weeklyStatLabel}>This Week</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings & Legal</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity
                style={styles.settingsItem}
                activeOpacity={0.6}
                onPress={() => setShowPrivacyModal(true)}
              >
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.settingsIconContainer, { backgroundColor: Colors.surface.blueTint }]}>
                    <Ionicons name="shield-checkmark" size={18} color={Colors.primary.blue} />
                  </View>
                  <Text style={styles.settingsItemText}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <TouchableOpacity
                style={styles.settingsItem}
                activeOpacity={0.6}
                onPress={() => setShowTermsModal(true)}
              >
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.settingsIconContainer, { backgroundColor: Colors.surface.purpleTint }]}>
                    <Ionicons name="document-text" size={18} color={Colors.primary.purple} />
                  </View>
                  <Text style={styles.settingsItemText}>Terms & Conditions</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <TouchableOpacity
                style={styles.settingsItem}
                activeOpacity={0.6}
                onPress={handleLogout}
              >
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.settingsIconContainer, { backgroundColor: Colors.semantic.errorLight }]}>
                    <Ionicons name="log-out-outline" size={18} color={Colors.semantic.error} />
                  </View>
                  <Text style={[styles.settingsItemText, styles.logoutText]}>Sign Out</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.semantic.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerBranding}>
              <Image
                source={require("@/assets/logo.png")}
                style={styles.footerLogo}
                resizeMode="contain"
              />
              <Text style={styles.footerBrandText}>sight</Text>
            </View>
            <Text style={styles.footerVersion}>Version 1.3.5</Text>
            <Text style={styles.footerCopyright}>© 2024 sight. All rights reserved.</Text>
          </View>
        </ScrollView>

        {/* Terms & Conditions Modal */}
        {showTermsModal && (
          <SafeAreaView style={styles.popupOverlayContainer} edges={["bottom"]} pointerEvents="box-none">
            <Animated.View style={[styles.popupOverlay, { opacity: termsOpacityAnim }]} pointerEvents="box-none">
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTermsModal(false)} />
              <Animated.View
                style={[
                  styles.popupContent,
                  {
                    height: popupHeight,
                    transform: [{
                      translateY: termsSlideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [popupHeight, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.popupHeader}>
                  <View style={styles.popupDragIndicator} />
                  <Text style={styles.popupTitle}>Terms & Conditions</Text>
                  <TouchableOpacity onPress={() => setShowTermsModal(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.popupBody} contentContainerStyle={styles.popupScrollContent} showsVerticalScrollIndicator={true} bounces={true}>
                  <Text style={styles.popupSectionTitle}>1. Acceptance of Terms</Text>
                  <Text style={styles.popupText}>
                    By accessing and using SIGHT (Survey Insights & Global Health Technology), you agree to be bound by these Terms & Conditions. If you don't agree, that's totally fine - we'll miss you, but we understand.
                  </Text>
                  <Text style={styles.popupSectionTitle}>2. User Accounts</Text>
                  <Text style={styles.popupText}>
                    You are responsible for maintaining the confidentiality of your account credentials. Please use strong passwords - "password123" doesn't count as strong.
                  </Text>
                  <Text style={styles.popupSectionTitle}>3. Survey Creation & Responses</Text>
                  <Text style={styles.popupText}>
                    As a researcher, you may create surveys and collect responses. All survey content must be legal, ethical, and not violate anyone's rights.
                  </Text>
                  <Text style={styles.popupSectionTitle}>4. Points & Rewards System</Text>
                  <Text style={styles.popupText}>
                    Points are awarded for completing surveys and can be used within the platform. Points are non-transferable and non-refundable.
                  </Text>
                  <Text style={styles.popupSectionTitle}>5. AI Analysis</Text>
                  <Text style={styles.popupText}>
                    Our AI analysis features use advanced algorithms to provide insights. The analysis is provided "as is" and should be used as a tool to aid your research.
                  </Text>
                  <Text style={styles.popupSectionTitle}>6. Survey Ownership</Text>
                  <Text style={styles.popupText}>
                    All surveys created on SIGHT, including all survey content, questions, responses, and any information contained within them, are public and owned by us.
                  </Text>
                  <Text style={styles.popupFooterText}>Last Updated: {new Date().toLocaleDateString()}</Text>
                </ScrollView>
              </Animated.View>
            </Animated.View>
          </SafeAreaView>
        )}

        {/* Privacy Policy Modal */}
        {showPrivacyModal && (
          <SafeAreaView style={styles.popupOverlayContainer} edges={["bottom"]} pointerEvents="box-none">
            <Animated.View style={[styles.popupOverlay, { opacity: privacyOpacityAnim }]} pointerEvents="box-none">
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPrivacyModal(false)} />
              <Animated.View
                style={[
                  styles.popupContent,
                  {
                    height: popupHeight,
                    transform: [{
                      translateY: privacySlideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [popupHeight, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.popupHeader}>
                  <View style={styles.popupDragIndicator} />
                  <Text style={styles.popupTitle}>Privacy Policy</Text>
                  <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.popupBody} contentContainerStyle={styles.popupScrollContent} showsVerticalScrollIndicator={true} bounces={true}>
                  <Text style={styles.popupSectionTitle}>1. Introduction</Text>
                  <Text style={styles.popupText}>
                    At SIGHT, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information.
                  </Text>
                  <Text style={styles.popupSectionTitle}>2. Information We Collect</Text>
                  <Text style={styles.popupText}>
                    We collect information you provide directly: name, email, profile images, survey responses, and account activity.
                  </Text>
                  <Text style={styles.popupSectionTitle}>3. How We Use Your Information</Text>
                  <Text style={styles.popupText}>
                    We use your data to provide and improve our services, process survey responses, and generate AI analyses.
                  </Text>
                  <Text style={styles.popupSectionTitle}>4. Data Storage & Security</Text>
                  <Text style={styles.popupText}>
                    Your data is stored securely using industry-standard encryption. We implement security measures to protect against unauthorized access.
                  </Text>
                  <Text style={styles.popupSectionTitle}>5. Data Sharing</Text>
                  <Text style={styles.popupText}>
                    We don't sell your personal information. Period. We may share aggregated, anonymized data with researchers.
                  </Text>
                  <Text style={styles.popupSectionTitle}>6. Your Rights</Text>
                  <Text style={styles.popupText}>
                    You have the right to access your data, update your information, delete your account, and request a copy of your data.
                  </Text>
                  <Text style={styles.popupFooterText}>Last Updated: {new Date().toLocaleDateString()}</Text>
                </ScrollView>
              </Animated.View>
            </Animated.View>
          </SafeAreaView>
        )}
      </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  fixedHeader: {
    backgroundColor: Colors.background.primary,
    zIndex: 10,
    borderBottomLeftRadius: Borders.radius.xl,
    borderBottomRightRadius: Borders.radius.xl,
    ...Shadows.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },
  header: {
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleImage: {
    height: 28,
    width: 94,
  },
  title: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
  },
  userProfileCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  avatarSection: {
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary.purple,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },
  levelBadgeText: {
    ...Typography.styles.captionSmall,
    color: Colors.text.inverse,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  levelTag: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surface.purpleTint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Borders.radius.full,
  },
  levelTagText: {
    ...Typography.styles.captionSmall,
    color: Colors.primary.purple,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: Spacing.page.paddingHorizontal,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.styles.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.background.primary,
    borderRadius: Borders.radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    position: "relative",
    ...Shadows.sm,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  statArrow: {
    position: "absolute",
    top: 8,
    right: 8,
    opacity: 0.5,
  },
  pointsCard: {
    borderRadius: Borders.radius.xl,
    overflow: "hidden",
    ...Shadows.lg,
  },
  pointsGradient: {
    padding: Spacing.xl,
  },
  pointsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  pointsLabel: {
    ...Typography.styles.caption,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: Typography.fontSize.display,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
    lineHeight: 48,
  },
  trophyContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    ...Typography.styles.captionSmall,
    color: "rgba(255,255,255,0.75)",
  },
  progressPercent: {
    ...Typography.styles.captionSmall,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.text.inverse,
    borderRadius: 3,
  },
  weeklyStats: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: Borders.radius.md,
    paddingVertical: Spacing.sm,
  },
  weeklyStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  weeklyStatValue: {
    ...Typography.styles.h5,
    color: Colors.text.inverse,
  },
  weeklyStatLabel: {
    ...Typography.styles.captionSmall,
    color: "rgba(255,255,255,0.7)",
  },
  weeklyDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  settingsCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Borders.radius.lg,
    ...Shadows.sm,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginHorizontal: Spacing.md,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Borders.radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsItemText: {
    ...Typography.styles.body,
    color: Colors.text.primary,
  },
  logoutText: {
    color: Colors.semantic.error,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  footerBranding: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  footerLogo: {
    width: 24,
    height: 24,
  },
  footerBrandText: {
    ...Typography.styles.body,
    fontWeight: "600",
    color: Colors.primary.purple,
  },
  footerVersion: {
    ...Typography.styles.captionSmall,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  footerCopyright: {
    ...Typography.styles.captionSmall,
    color: Colors.text.tertiary,
  },
  // Modal Styles
  popupOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  popupContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: Borders.radius.xxl,
    borderTopRightRadius: Borders.radius.xxl,
    width: "100%",
  },
  popupDragIndicator: {
    position: "absolute",
    top: Spacing.xs,
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.default,
  },
  popupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  popupTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  popupBody: {
    flex: 1,
  },
  popupScrollContent: {
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.xxl,
  },
  popupSectionTitle: {
    ...Typography.styles.h5,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  popupText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  popupFooterText: {
    ...Typography.styles.captionSmall,
    color: Colors.text.tertiary,
    marginTop: Spacing.xl,
    textAlign: "center",
    fontStyle: "italic",
  },
});
