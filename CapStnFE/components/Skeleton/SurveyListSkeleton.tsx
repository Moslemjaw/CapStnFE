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

export const SurveyListSkeleton: React.FC = () => {
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
            <DarkSkeletonBox width={106} height={32} borderRadius={4} />
            <View style={styles.headerTextContainer}>
              <DarkSkeletonBox width={150} height={32} borderRadius={4} style={{ marginBottom: 8 }} />
              <DarkSkeletonBox width={200} height={16} borderRadius={4} />
            </View>
          </View>
        </View>
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavHeight + 16 }}
        >
          {/* Search Bar Skeleton */}
          <View style={styles.searchContainer}>
            <DarkSkeletonBox width="100%" height={40} borderRadius={8} />
          </View>

          {/* Filter Chips Skeleton */}
          <View style={styles.filterContainer}>
            <DarkSkeletonBox width={60} height={28} borderRadius={16} />
            <DarkSkeletonBox width={80} height={28} borderRadius={16} />
            <DarkSkeletonBox width={90} height={28} borderRadius={16} />
          </View>

          {/* Survey Cards Skeleton */}
          <View style={styles.content}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.surveyCard}>
                <View style={styles.cardContent}>
                  <DarkSkeletonBox width={24} height={24} borderRadius={12} />
                  <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                      <DarkSkeletonText width="70%" height={18} lines={1} />
                      <DarkSkeletonBox width={60} height={20} borderRadius={8} />
                    </View>
                    <View style={styles.metricsRow}>
                      <DarkSkeletonBox width={100} height={14} borderRadius={4} />
                      <DarkSkeletonBox width={80} height={14} borderRadius={4} />
                    </View>
                  </View>
                </View>
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
    alignItems: "center",
    gap: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  surveyCard: {
    backgroundColor: "#1E1E2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
});

