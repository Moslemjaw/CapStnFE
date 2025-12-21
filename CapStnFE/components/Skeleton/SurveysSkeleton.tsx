import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBox, SkeletonCard, SkeletonText } from "./index";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export const SurveysSkeleton: React.FC = () => {
  const bottomNavHeight = useBottomNavHeight();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight + 4 },
        ]}
      >
        {/* Stats Card Skeleton */}
        <View style={styles.statsCard}>
          <SkeletonCard padding={24} marginBottom={20}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <SkeletonBox width={24} height={24} borderRadius={12} />
                <SkeletonText width={60} height={28} lines={1} style={{ marginTop: 12 }} />
                <SkeletonText width={80} height={12} lines={1} style={{ marginTop: 6 }} />
              </View>
              <View style={styles.statItem}>
                <SkeletonBox width={24} height={24} borderRadius={12} />
                <SkeletonText width={60} height={28} lines={1} style={{ marginTop: 12 }} />
                <SkeletonText width={80} height={12} lines={1} style={{ marginTop: 6 }} />
              </View>
            </View>
          </SkeletonCard>
        </View>

        {/* Featured Section Skeleton */}
        <View style={styles.content}>
          <SkeletonText width="50%" height={20} lines={1} style={{ marginBottom: 20 }} />
          
          {/* Large Featured Card */}
          <SkeletonCard padding={24} marginBottom={20}>
            <SkeletonText width="70%" height={22} lines={1} />
            <SkeletonText width="100%" height={16} lines={3} style={{ marginTop: 16 }} />
            <View style={styles.detailsRow}>
              <SkeletonBox width={80} height={16} borderRadius={4} />
              <SkeletonBox width={80} height={16} borderRadius={4} />
              <SkeletonBox width={60} height={16} borderRadius={4} />
            </View>
            <SkeletonBox width="100%" height={44} borderRadius={12} style={{ marginTop: 20 }} />
          </SkeletonCard>

          {/* Small Featured Cards Grid */}
          <View style={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.gridItem}>
                <SkeletonCard padding={16} marginBottom={0}>
                  <SkeletonText width="90%" height={15} lines={2} />
                  <View style={styles.smallDetailsRow}>
                    <SkeletonBox width={50} height={12} borderRadius={4} />
                    <SkeletonBox width={50} height={12} borderRadius={4} />
                  </View>
                  <SkeletonBox width="100%" height={36} borderRadius={8} style={{ marginTop: 12 }} />
                </SkeletonCard>
              </View>
            ))}
          </View>

          {/* All Surveys Section */}
          <SkeletonText width="40%" height={20} lines={1} style={{ marginTop: 40, marginBottom: 20 }} />
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} padding={20} marginBottom={20}>
              <SkeletonText width="80%" height={18} lines={1} />
              <SkeletonText width="100%" height={14} lines={2} style={{ marginTop: 12 }} />
              <View style={styles.detailsRow}>
                <SkeletonBox width={70} height={14} borderRadius={4} />
                <SkeletonBox width={70} height={14} borderRadius={4} />
                <SkeletonBox width={50} height={14} borderRadius={4} />
              </View>
              <SkeletonBox width="100%" height={40} borderRadius={12} style={{ marginTop: 16 }} />
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
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },
  statsCard: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 8,
  },
  statsContent: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 40,
  },
  gridItem: {
    width: "48%",
  },
  detailsRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
  },
  smallDetailsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
});

