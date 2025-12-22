import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonShimmer } from "./SkeletonShimmer";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { Colors, Spacing } from "@/constants/design";

// Dark theme skeleton components
const DarkSkeletonBox: React.FC<{ width?: number | string; height?: number | string; borderRadius?: number; style?: any }> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) => {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#2D2D3E",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <SkeletonShimmer
        width={width}
        height={height}
        borderRadius={borderRadius}
        style={[{ backgroundColor: "#2D2D3E" }, style]}
      />
    </View>
  );
};

const DarkSkeletonText: React.FC<{ width?: number | string; height?: number; lines?: number; style?: any }> = ({
  width = "100%",
  height = 16,
  lines = 1,
  style,
}) => {
  return (
    <View style={[{ gap: 8 }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <DarkSkeletonBox
          key={i}
          width={i === lines - 1 ? width : "100%"}
          height={height}
          borderRadius={4}
          style={{ marginBottom: i < lines - 1 ? 8 : 0 }}
        />
      ))}
    </View>
  );
};

const DarkSkeletonCard: React.FC<{ padding?: number; marginBottom?: number; children?: React.ReactNode }> = ({
  padding = 16,
  marginBottom = 16,
  children,
}) => {
  return (
    <View
      style={[
        styles.darkCard,
        {
          padding,
          marginBottom,
        },
      ]}
    >
      {children}
    </View>
  );
};

export const AnalysisSkeleton: React.FC = () => {
  const bottomNavHeight = useBottomNavHeight();

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* Light background layer */}
      <View style={styles.lightBackground} />
      
      {/* Dark overlay */}
      <View style={styles.darkOverlay} />
      
      {/* Content container */}
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomNavHeight + 120 },
          ]}
        >
          <View style={styles.content}>
            {/* Stats Card */}
            <DarkSkeletonCard padding={24} marginBottom={20}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <DarkSkeletonBox width={24} height={24} borderRadius={12} />
                  <DarkSkeletonText width={60} height={28} lines={1} style={{ marginTop: 12 }} />
                  <DarkSkeletonText width={80} height={12} lines={1} style={{ marginTop: 6 }} />
                </View>
                <View style={styles.statItem}>
                  <DarkSkeletonBox width={24} height={24} borderRadius={12} />
                  <DarkSkeletonText width={60} height={28} lines={1} style={{ marginTop: 12 }} />
                  <DarkSkeletonText width={80} height={12} lines={1} style={{ marginTop: 6 }} />
                </View>
              </View>
            </DarkSkeletonCard>

            {/* Key Insights Section */}
            <DarkSkeletonText width="40%" height={20} lines={1} style={{ marginBottom: 20 }} />
            {[1, 2, 3].map((i) => (
              <DarkSkeletonCard key={i} padding={24} marginBottom={20}>
                <DarkSkeletonText width="70%" height={18} lines={1} />
                <DarkSkeletonText width="100%" height={16} lines={3} style={{ marginTop: 16 }} />
              </DarkSkeletonCard>
            ))}

            {/* Trends Section */}
            <DarkSkeletonText width="50%" height={20} lines={1} style={{ marginTop: 24, marginBottom: 20 }} />
            <DarkSkeletonCard padding={24} marginBottom={20}>
              <DarkSkeletonText width="100%" height={16} lines={4} />
            </DarkSkeletonCard>

            {/* Statistics Section */}
            <DarkSkeletonText width="60%" height={20} lines={1} style={{ marginTop: 24, marginBottom: 20 }} />
            {[1, 2].map((i) => (
              <DarkSkeletonCard key={i} padding={20} marginBottom={20}>
                <DarkSkeletonText width="80%" height={16} lines={1} />
                <DarkSkeletonText width="60%" height={14} lines={1} style={{ marginTop: 12 }} />
              </DarkSkeletonCard>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background.primary,
    zIndex: 0,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.dark.background,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  content: {
    padding: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  darkCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
});

