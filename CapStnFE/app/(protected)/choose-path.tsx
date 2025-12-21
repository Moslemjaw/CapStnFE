import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

export default function ChoosePath() {
  const router = useRouter();

  const handlePathSelection = (path: "researcher" | "respondent") => {
    if (path === "researcher") {
      router.replace("/(protected)/(researcher)/(tabs)/" as any);
    } else {
      router.replace("/(protected)/(respondent)/(tabs)/" as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.background.secondary, Colors.surface.blueTint]}
        style={styles.gradientContainer}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
            <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Path</Text>
            <Text style={styles.subtitle}>
              Select how you want to use the platform today
            </Text>
          </View>

          {/* Path Options */}
          <View style={styles.optionsContainer}>
            {/* Researcher Card */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handlePathSelection("researcher")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.surface.blueTint, Colors.background.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.iconCircle, { backgroundColor: Colors.surface.blueTint }]}>
                    <Ionicons name="flask-outline" size={36} color={Colors.primary.blue} />
                  </View>
                  
                  <View style={styles.cardTextSection}>
                    <Text style={styles.optionTitle}>Researcher</Text>
                    <Text style={styles.optionDescription}>
                      Create surveys, collect data, and analyze responses with AI-powered insights
                    </Text>
                  </View>

                  <View style={[styles.arrowCircle, { backgroundColor: Colors.primary.blue }]}>
                    <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} />
                  </View>
                </View>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.success} />
                    <Text style={styles.featureText}>Create unlimited surveys</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.success} />
                    <Text style={styles.featureText}>AI-powered analysis</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.success} />
                    <Text style={styles.featureText}>Export and share results</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Respondent Card */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handlePathSelection("respondent")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.surface.tealTint, Colors.background.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.iconCircle, { backgroundColor: Colors.surface.tealTint }]}>
                    <Ionicons name="person-outline" size={36} color={Colors.accent.teal} />
                  </View>
                  
                  <View style={styles.cardTextSection}>
                    <Text style={styles.optionTitle}>Respondent</Text>
                    <Text style={styles.optionDescription}>
                      Participate in surveys, earn points, and share your valuable insights
                    </Text>
                  </View>

                  <View style={[styles.arrowCircle, { backgroundColor: Colors.accent.teal }]}>
                    <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} />
                  </View>
                </View>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.success} />
                    <Text style={styles.featureText}>Earn points per survey</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.success} />
                    <Text style={styles.featureText}>Personal insights</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.success} />
                    <Text style={styles.featureText}>Track your progress</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer note */}
          <Text style={styles.footerNote}>
            You can switch between roles anytime from your profile
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.sm,
  },
  titleImage: {
    height: 28,
    width: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.styles.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  optionsContainer: {
    gap: Spacing.lg,
    flex: 1,
    justifyContent: "center",
  },
  optionCard: {
    borderRadius: Borders.radius.xl,
    overflow: "hidden",
    ...Shadows.lg,
  },
  cardGradient: {
    padding: Spacing.lg,
    borderRadius: Borders.radius.xl,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTextSection: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  optionTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  optionDescription: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  featuresList: {
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  featureText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
  },
  footerNote: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
