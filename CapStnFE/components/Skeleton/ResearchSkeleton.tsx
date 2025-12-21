import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBox, SkeletonCard, SkeletonText } from "./index";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export const ResearchSkeleton: React.FC = () => {
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
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <SkeletonText width="40%" height={20} lines={1} />
            <SkeletonText width="15%" height={16} lines={1} />
          </View>

          {/* Survey Cards */}
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} padding={20} marginBottom={20}>
              <View style={styles.cardHeader}>
                <SkeletonBox width={60} height={20} borderRadius={12} />
                <SkeletonText width={80} height={12} lines={1} />
              </View>
              <SkeletonText width="90%" height={18} lines={2} style={{ marginTop: 12 }} />
              <View style={styles.metricsRow}>
                <SkeletonBox width={100} height={14} borderRadius={4} />
                <SkeletonBox width={100} height={14} borderRadius={4} />
              </View>
              <SkeletonBox width="100%" height={44} borderRadius={8} style={{ marginTop: 20 }} />
              <View style={styles.secondaryActions}>
                <SkeletonBox width="48%" height={40} borderRadius={8} />
                <SkeletonBox width="48%" height={40} borderRadius={8} />
              </View>
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
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
});

