import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonCard } from "./SkeletonCard";
import { SkeletonText } from "./SkeletonText";
import { SkeletonBox } from "./SkeletonBox";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export const ProfileSkeleton: React.FC = () => {
  const bottomNavHeight = useBottomNavHeight();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight },
        ]}
      >
        <View style={styles.content}>
          {/* Activity Section */}
          <SkeletonText width="40%" height={18} lines={1} style={{ marginBottom: 20 }} />
          <View style={styles.activityGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.activityCard}>
                <SkeletonBox width={24} height={24} borderRadius={12} />
                <SkeletonText width={40} height={28} lines={1} style={{ marginTop: 16 }} />
                <SkeletonText width={80} height={14} lines={1} style={{ marginTop: 8 }} />
              </View>
            ))}
          </View>

          {/* Points Card Skeleton */}
          <SkeletonCard padding={28} marginBottom={40}>
            <View style={styles.pointsContent}>
              <View style={styles.pointsLeft}>
                <SkeletonText width="60%" height={14} lines={1} />
                <SkeletonText width="40%" height={48} lines={1} style={{ marginTop: 12 }} />
                <SkeletonText width="70%" height={12} lines={1} style={{ marginTop: 12 }} />
                <SkeletonBox width="100%" height={6} borderRadius={3} style={{ marginTop: 16 }} />
              </View>
              <SkeletonBox width={40} height={40} borderRadius={20} />
            </View>
          </SkeletonCard>

          {/* Settings Section */}
          <SkeletonText width="50%" height={18} lines={1} style={{ marginBottom: 20 }} />
          <SkeletonCard padding={0} marginBottom={40}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <SkeletonBox width={20} height={20} borderRadius={4} />
                  <SkeletonText width="60%" height={16} lines={1} />
                </View>
                <SkeletonBox width={20} height={20} borderRadius={4} />
              </View>
            ))}
          </SkeletonCard>
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
    flex: 1,
    padding: 24,
  },
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 40,
    gap: 16,
  },
  activityCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pointsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsLeft: {
    flex: 1,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

