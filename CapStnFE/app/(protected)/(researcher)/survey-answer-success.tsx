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
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  fixedHeader: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    paddingBottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
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
    marginBottom: 8,
  },
  titleImage: {
    height: 24,
    width: 80,
    marginLeft: -6,
  },
  headerLogo: {
    width: 80,
    height: 80,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#505050",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 12,
    marginTop: 8,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    textAlign: "center",
  },
  thankYouText: {
    fontSize: 14,
    color: "#505050",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  pointsCard: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsCardGradient: {
    padding: 16,
    alignItems: "center",
  },
  coinsIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
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
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 8,
    letterSpacing: 1,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  pointsSubtext: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  statsItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  statsLabel: {
    flex: 1,
    fontSize: 14,
    color: "#505050",
    fontWeight: "500",
  },
  statsValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  statsPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8A4DE8",
  },
  greatJobCard: {
    backgroundColor: "#F3F0F7",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  greatJobTextContainer: {
    flex: 1,
  },
  greatJobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 2,
  },
  greatJobText: {
    fontSize: 13,
    color: "#505050",
    lineHeight: 18,
  },
  primaryButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
  },
  bottomSpacer: {
    height: 20,
  },
});
