import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeletonShimmer } from "./SkeletonShimmer";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

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

export const SightAISkeleton: React.FC = () => {
  const bottomNavHeight = useBottomNavHeight();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Light background (visible when overlay is transparent) */}
      <View style={styles.lightBackground} />
      
      {/* Dark overlay */}
      <View style={styles.darkOverlay} />
      
      {/* Content container */}
      <View style={styles.contentContainer}>
        {/* Fixed Header Section */}
        <View style={styles.fixedHeader}>
          <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
            <DarkSkeletonBox width={120} height={32} borderRadius={4} />
            <DarkSkeletonBox width={106} height={32} borderRadius={4} />
          </View>
        </View>
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavHeight + 16 }}
        >
          {/* AI Card Skeleton */}
          <View style={styles.aiCardContainer}>
            <View style={styles.aiCard}>
              <DarkSkeletonBox width={64} height={64} borderRadius={32} style={styles.aiIcon} />
              <DarkSkeletonText width="70%" height={28} lines={1} style={styles.aiTitle} />
              <DarkSkeletonText width="100%" height={16} lines={2} style={styles.aiDescription} />
              <DarkSkeletonBox width="100%" height={52} borderRadius={12} style={styles.aiButton} />
            </View>
          </View>

          {/* Stats Container */}
          <View style={styles.statsContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.statCard}>
                <DarkSkeletonBox width={40} height={24} borderRadius={4} />
                <DarkSkeletonBox width={60} height={14} borderRadius={4} style={{ marginTop: 8 }} />
              </View>
            ))}
          </View>

          {/* Insights Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DarkSkeletonBox width={150} height={20} borderRadius={4} />
              <DarkSkeletonBox width={80} height={14} borderRadius={4} />
            </View>
            
            {[1, 2].map((i) => (
              <View key={i} style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <View style={styles.insightCardHeaderLeft}>
                    <DarkSkeletonBox width={24} height={24} borderRadius={12} />
                    <DarkSkeletonBox width={80} height={12} borderRadius={4} style={{ marginLeft: 8 }} />
                  </View>
                  <DarkSkeletonBox width={20} height={20} borderRadius={10} />
                </View>
                <DarkSkeletonBox width="80%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />
                <DarkSkeletonText width="100%" height={14} lines={3} />
                <View style={styles.tagsContainer}>
                  <DarkSkeletonBox width={60} height={24} borderRadius={6} />
                  <DarkSkeletonBox width={70} height={24} borderRadius={6} />
                  <DarkSkeletonBox width={50} height={24} borderRadius={6} />
                </View>
                <DarkSkeletonBox width={120} height={14} borderRadius={4} style={{ marginTop: 12 }} />
              </View>
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
    backgroundColor: "#FFFFFF",
    zIndex: 0,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F0F1E",
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    zIndex: 2,
  },
  fixedHeader: {
    backgroundColor: "transparent",
    zIndex: 10,
    paddingBottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E2E",
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  aiCardContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  aiCard: {
    backgroundColor: "#1E1E2E",
    borderRadius: 20,
    padding: 24,
    minHeight: 200,
    alignItems: "center",
  },
  aiIcon: {
    marginBottom: 16,
  },
  aiTitle: {
    marginBottom: 12,
  },
  aiDescription: {
    marginBottom: 24,
  },
  aiButton: {
    width: "100%",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1E1E2E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: "#1E1E2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  insightCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
});

