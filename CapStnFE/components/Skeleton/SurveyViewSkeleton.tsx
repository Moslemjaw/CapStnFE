import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { SkeletonCard } from "./SkeletonCard";
import { SkeletonText } from "./SkeletonText";
import { SkeletonBox } from "./SkeletonBox";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { Colors, Spacing } from "@/constants/design";

export const SurveyViewSkeleton: React.FC = () => {
  const bottomNavHeight = useBottomNavHeight();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[Colors.background.secondary, Colors.surface.purpleTint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <SkeletonText width={120} height={28} lines={1} />
        <SkeletonBox width={94} height={28} borderRadius={4} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Survey Info */}
        <View style={styles.surveyInfo}>
          <SkeletonText width="90%" height={16} lines={2} style={{ marginBottom: Spacing.sm }} />
          <SkeletonBox width="100%" height={6} borderRadius={3} style={{ marginBottom: Spacing.xs }} />
          <SkeletonText width={100} height={14} lines={1} />
        </View>

        {/* Questions Section */}
        <View style={styles.questionsSection}>
          <SkeletonText width={100} height={20} lines={1} style={{ marginBottom: Spacing.md }} />
          
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} padding={16} marginBottom={12}>
              <View style={styles.questionHeader}>
                <SkeletonText width={80} height={14} lines={1} />
                <SkeletonBox width={60} height={20} borderRadius={8} />
              </View>
              <SkeletonText width="100%" height={18} lines={2} style={{ marginTop: Spacing.sm, marginBottom: Spacing.sm }} />
              <SkeletonBox width="100%" height={48} borderRadius={8} />
            </SkeletonCard>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.lg,
  },
  surveyInfo: {
    marginBottom: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  questionsSection: {
    marginBottom: Spacing.md,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
});

