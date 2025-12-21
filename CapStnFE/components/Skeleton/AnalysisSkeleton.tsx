import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonCard } from "./SkeletonCard";
import { SkeletonText } from "./SkeletonText";
import { SkeletonBox } from "./SkeletonBox";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export const AnalysisSkeleton: React.FC = () => {
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
          {/* Stats Card */}
          <SkeletonCard padding={24} marginBottom={20}>
            <View style={styles.statsRow}>
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

          {/* Key Insights Section */}
          <SkeletonText width="40%" height={20} lines={1} style={{ marginBottom: 20 }} />
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} padding={24} marginBottom={20}>
              <SkeletonText width="70%" height={18} lines={1} />
              <SkeletonText width="100%" height={16} lines={3} style={{ marginTop: 16 }} />
            </SkeletonCard>
          ))}

          {/* Trends Section */}
          <SkeletonText width="50%" height={20} lines={1} style={{ marginTop: 24, marginBottom: 20 }} />
          <SkeletonCard padding={24} marginBottom={20}>
            <SkeletonText width="100%" height={16} lines={4} />
          </SkeletonCard>

          {/* Statistics Section */}
          <SkeletonText width="60%" height={20} lines={1} style={{ marginTop: 24, marginBottom: 20 }} />
          {[1, 2].map((i) => (
            <SkeletonCard key={i} padding={20} marginBottom={20}>
              <SkeletonText width="80%" height={16} lines={1} />
              <SkeletonText width="60%" height={14} lines={1} style={{ marginTop: 12 }} />
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
  content: {
    padding: 24,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
});

