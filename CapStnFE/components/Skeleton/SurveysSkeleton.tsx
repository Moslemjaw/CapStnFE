import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { Colors, Spacing, Shadows } from "@/constants/design";

// Premium Skeleton Pulse Component
const SkeletonPulse: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  delay?: number;
  style?: any;
}> = ({ width, height, borderRadius = 8, delay = 0, style }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0.4, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.background.tertiary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SurveysSkeleton: React.FC = () => {
  const bottomNavHeight = useBottomNavHeight();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* Header Skeleton */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerTop}>
          <SkeletonPulse width={100} height={32} borderRadius={6} delay={0} />
          <SkeletonPulse width={94} height={28} borderRadius={6} delay={50} />
        </View>

        {/* Search Bar Skeleton */}
        <SkeletonPulse
          width="100%"
          height={44}
          borderRadius={Spacing.button.borderRadius}
          delay={100}
          style={{ marginBottom: Spacing.sm }}
        />

        {/* Filter Pills Skeleton */}
        <View style={styles.filtersRow}>
          <SkeletonPulse width={90} height={32} borderRadius={100} delay={150} />
          <SkeletonPulse width={85} height={32} borderRadius={100} delay={200} />
          <SkeletonPulse width={70} height={32} borderRadius={100} delay={250} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards Skeleton */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors.surface.blueTint }]}>
            <SkeletonPulse width={24} height={24} borderRadius={12} delay={300} />
            <SkeletonPulse
              width={50}
              height={32}
              borderRadius={6}
              delay={350}
              style={{ marginTop: Spacing.xs }}
            />
            <SkeletonPulse
              width={70}
              height={14}
              borderRadius={4}
              delay={400}
              style={{ marginTop: 4 }}
            />
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.surface.purpleTint }]}>
            <SkeletonPulse width={24} height={24} borderRadius={12} delay={320} />
            <SkeletonPulse
              width={45}
              height={32}
              borderRadius={6}
              delay={370}
              style={{ marginTop: Spacing.xs }}
            />
            <SkeletonPulse
              width={60}
              height={14}
              borderRadius={4}
              delay={420}
              style={{ marginTop: 4 }}
            />
          </View>
        </View>

        {/* Trending Section Skeleton */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SkeletonPulse width={90} height={24} borderRadius={6} delay={450} />
            <SkeletonPulse width={60} height={22} borderRadius={100} delay={500} />
          </View>

          {/* Hero Card Skeleton */}
          <View style={styles.heroCard}>
            <SkeletonPulse width={55} height={22} borderRadius={100} delay={550} />
            <SkeletonPulse
              width="75%"
              height={24}
              borderRadius={6}
              delay={600}
              style={{ marginTop: Spacing.lg }}
            />
            <SkeletonPulse
              width="100%"
              height={16}
              borderRadius={4}
              delay={650}
              style={{ marginTop: Spacing.xs }}
            />
            <SkeletonPulse
              width="85%"
              height={16}
              borderRadius={4}
              delay={700}
              style={{ marginTop: 4 }}
            />
            <View style={styles.metaRow}>
              <SkeletonPulse width={40} height={18} borderRadius={4} delay={750} />
              <SkeletonPulse width={40} height={18} borderRadius={4} delay={780} />
              <SkeletonPulse width={45} height={18} borderRadius={4} delay={810} />
            </View>
            <SkeletonPulse
              width="100%"
              height={40}
              borderRadius={Spacing.button.borderRadiusSmall}
              delay={850}
            />
          </View>

          {/* Compact Cards Grid Skeleton */}
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.compactCard}>
                <SkeletonPulse
                  width={50}
                  height={20}
                  borderRadius={100}
                  delay={900 + i * 50}
                />
                <SkeletonPulse
                  width="85%"
                  height={17}
                  borderRadius={4}
                  delay={950 + i * 50}
                  style={{ marginTop: Spacing.md }}
                />
                <SkeletonPulse
                  width="65%"
                  height={17}
                  borderRadius={4}
                  delay={1000 + i * 50}
                  style={{ marginTop: 4 }}
                />
                <View style={[styles.metaRow, { marginTop: "auto" }]}>
                  <SkeletonPulse width={28} height={14} borderRadius={4} delay={1050 + i * 50} />
                  <SkeletonPulse width={28} height={14} borderRadius={4} delay={1070 + i * 50} />
                  <SkeletonPulse width={32} height={14} borderRadius={4} delay={1090 + i * 50} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* All Surveys Section Skeleton */}
        <View style={styles.section}>
          <SkeletonPulse
            width={100}
            height={24}
            borderRadius={6}
            delay={1200}
            style={{ marginBottom: Spacing.section.headerGap }}
          />

          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.listCard}>
              <SkeletonPulse
                width={55}
                height={22}
                borderRadius={100}
                delay={1250 + i * 100}
              />
              <SkeletonPulse
                width="70%"
                height={20}
                borderRadius={4}
                delay={1300 + i * 100}
                style={{ marginTop: Spacing.lg }}
              />
              <SkeletonPulse
                width="100%"
                height={16}
                borderRadius={4}
                delay={1350 + i * 100}
                style={{ marginTop: Spacing.xs }}
              />
              <SkeletonPulse
                width="80%"
                height={16}
                borderRadius={4}
                delay={1400 + i * 100}
                style={{ marginTop: 4 }}
              />
              <View style={styles.metaRow}>
                <SkeletonPulse width={40} height={18} borderRadius={4} delay={1450 + i * 100} />
                <SkeletonPulse width={40} height={18} borderRadius={4} delay={1480 + i * 100} />
                <SkeletonPulse width={45} height={18} borderRadius={4} delay={1510 + i * 100} />
              </View>
              <SkeletonPulse
                width="100%"
                height={40}
                borderRadius={Spacing.button.borderRadiusSmall}
                delay={1550 + i * 100}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  filtersRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.page.paddingHorizontal,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.card.borderRadius,
  },
  section: {
    marginBottom: Spacing.section.gap,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.section.headerGap,
    gap: Spacing.xs,
  },
  heroCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.padding,
    ...Shadows.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  compactCard: {
    width: "48%",
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.paddingSmall,
    borderWidth: 1,
    borderColor: Colors.border.light,
    minHeight: 140,
  },
  listCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.card.borderRadius,
    padding: Spacing.card.padding,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
});
