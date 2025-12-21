import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
} from "react-native";
import React, { useEffect, useState, useRef, useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getAnalysisById, AnalysisResponse } from "@/api/ai";
import AnalysisContext from "@/context/AnalysisContext";

export default function AnalysisLoading() {
  const router = useRouter();
  const { setIsAnalyzing } = useContext(AnalysisContext);
  const { analysisId, type } = useLocalSearchParams<{
    analysisId: string;
    type: "single" | "multi";
  }>();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Cleanup: clear analyzing state on unmount
    return () => {
      setIsAnalyzing(false);
    };
  }, []);

  useEffect(() => {
    if (analysisId) {
      pollAnalysis();
    }
  }, [analysisId]);

  useEffect(() => {
    if (analysis) {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: analysis.progress / 100,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Navigate to insights when ready
      if (analysis.status === "ready") {
        // Clear analyzing state when analysis completes
        setIsAnalyzing(false);
        setTimeout(() => {
          router.replace({
            pathname: "/(protected)/(researcher)/analysis-insights",
            params: { analysisId: analysis.analysisId },
          } as any);
        }, 1000);
      } else if (analysis.status === "failed") {
        // Clear analyzing state when analysis fails
        setIsAnalyzing(false);
        Alert.alert(
          "Analysis Failed",
          "The analysis failed to complete. Please try again.",
          [
            {
              text: "Go Back",
              onPress: () => router.back(),
            },
          ]
        );
      }
    }
  }, [analysis?.progress, analysis?.status]);

  const pollAnalysis = async () => {
    if (!analysisId) return;

    try {
      const data = await getAnalysisById(analysisId);
      setAnalysis(data);

      // Continue polling if processing
      if (data.status === "processing") {
        setTimeout(() => pollAnalysis(), 2000); // Poll every 2 seconds
      }
    } catch (err: any) {
      console.error("Error fetching analysis:", err);
      setError(err.message || "Failed to fetch analysis status");
    }
  };

  const getProgressMessage = (progress: number) => {
    if (progress < 10) return "Initializing analysis...";
    if (progress < 30) return "Gathering survey data...";
    if (progress < 50) return "Processing responses...";
    if (progress < 70) return "Analyzing patterns...";
    if (progress < 90) return "Generating insights...";
    if (progress < 100) return "Finalizing results...";
    return "Complete!";
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.button}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>Analyzing Survey</Text>
          <Text style={styles.headerSubtitle}>
            {type === "multi"
              ? "Processing multiple surveys"
              : "AI is analyzing your survey data"}
          </Text>
        </View>
      </View>
      <View style={styles.content}>

        {/* Animated Icon */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.iconBackground,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Animated.View
            style={{
              transform: [{ rotate: spin }],
            }}
          >
            <Ionicons name="analytics" size={80} color="#8B5CF6" />
          </Animated.View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {getProgressMessage(analysis?.progress || 0)}
            </Text>
            <Text style={styles.progressPercentage}>
              {analysis?.progress || 0}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>

          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            <ProgressStep
              label="Initialize"
              completed={(analysis?.progress || 0) >= 10}
              active={(analysis?.progress || 0) < 10}
            />
            <ProgressStep
              label="Gather Data"
              completed={(analysis?.progress || 0) >= 30}
              active={
                (analysis?.progress || 0) >= 10 &&
                (analysis?.progress || 0) < 30
              }
            />
            <ProgressStep
              label="Process"
              completed={(analysis?.progress || 0) >= 70}
              active={
                (analysis?.progress || 0) >= 30 &&
                (analysis?.progress || 0) < 70
              }
            />
            <ProgressStep
              label="Generate"
              completed={(analysis?.progress || 0) >= 100}
              active={
                (analysis?.progress || 0) >= 70 &&
                (analysis?.progress || 0) < 100
              }
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#8B5CF6"
          />
          <Text style={styles.infoText}>
            This may take a few minutes depending on the number of responses
          </Text>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            Alert.alert(
              "Cancel Analysis",
              "Are you sure you want to leave? The analysis will continue in the background.",
              [
                { text: "Stay", style: "cancel" },
                { text: "Leave", onPress: () => router.back() },
              ]
            );
          }}
        >
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

interface ProgressStepProps {
  label: string;
  completed: boolean;
  active: boolean;
}

const ProgressStep: React.FC<ProgressStepProps> = ({
  label,
  completed,
  active,
}) => {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepCircle,
          completed && styles.stepCircleCompleted,
          active && styles.stepCircleActive,
        ]}
      >
        {completed ? (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        ) : (
          <View style={styles.stepDot} />
        )}
      </View>
      <Text
        style={[
          styles.stepLabel,
          (completed || active) && styles.stepLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
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
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
    position: "relative",
  },
  iconBackground: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#8B5CF615",
  },
  progressSection: {
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 32,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 4,
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  step: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepCircleCompleted: {
    backgroundColor: "#8B5CF6",
  },
  stepCircleActive: {
    backgroundColor: "#8B5CF6",
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9CA3AF",
  },
  stepLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  stepLabelActive: {
    color: "#111827",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#6B21A8",
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
});
