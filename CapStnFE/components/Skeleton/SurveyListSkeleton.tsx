import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBox, SkeletonCard, SkeletonText } from "./index";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export const SurveyListSkeleton: React.FC = () => {
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
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} padding={20} marginBottom={20}>
              <View style={styles.cardHeader}>
                <SkeletonBox width={60} height={20} borderRadius={12} />
                <SkeletonText width={80} height={12} lines={1} />
              </View>
              <SkeletonText width="90%" height={18} lines={2} style={{ marginTop: 12 }} />
              <View style={styles.metricsRow}>
                <SkeletonBox width={80} height={14} borderRadius={4} />
                <SkeletonBox width={80} height={14} borderRadius={4} />
                <SkeletonBox width={60} height={14} borderRadius={4} />
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
  content: {
    padding: 24,
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
});

