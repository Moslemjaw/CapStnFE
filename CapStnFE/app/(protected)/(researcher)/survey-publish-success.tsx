import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function SurveyPublishSuccess() {
  const router = useRouter();
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
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
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
    padding: 24,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  titleImage: {
    height: 28,
    width: 92,
    marginLeft: -8,
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#505050",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  overviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  overviewItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  overviewLabel: {
    flex: 1,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  button: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
