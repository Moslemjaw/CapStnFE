import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useContext } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AuthContext from "@/context/AuthContext";

export default function Index() {
  const { isAuthenticated } = useContext(AuthContext);
  const router = useRouter();

  if (isAuthenticated) {
    return <Redirect href={"/(protected)/choose-path" as any} />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Decorative Circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        {/* Main Gradient Circle */}
        <View style={styles.gradientCircleContainer}>
          <LinearGradient
            colors={["#60A5FA", "#34D399"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientCircle}
          />
        </View>

        {/* App Name and Tagline */}
        <View style={styles.brandingContainer}>
          <Text style={styles.appName}>SIGHT</Text>
          <Text style={styles.tagline}>See insights clearly.</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#60A5FA", "#34D399"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.getStartedButton}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={styles.logInButton}
            activeOpacity={0.8}
          >
            <Text style={styles.logInButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Value Proposition */}
        <View style={styles.valuePropContainer}>
          <Text style={styles.valuePropHeading}>
            Turn answers into clarity.
          </Text>
          <Text style={styles.valuePropDescription}>
            SIGHT transforms raw survey responses into clear, actionable
            insights using intelligent analysis and beautiful visualizations.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    position: "relative",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    top: 40,
    left: -40,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(96, 165, 250, 0.08)",
    top: 200,
    right: -20,
  },
  gradientCircleContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 32,
  },
  gradientCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  brandingContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  appName: {
    fontSize: 48,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "400",
  },
  buttonsContainer: {
    width: "100%",
    marginBottom: 48,
  },
  getStartedButton: {
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  getStartedButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  logInButton: {
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logInButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  valuePropContainer: {
    marginTop: "auto",
    paddingTop: 32,
  },
  valuePropHeading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "left",
  },
  valuePropDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "left",
  },
});
