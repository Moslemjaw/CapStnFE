import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonCard } from "./SkeletonCard";
import { SkeletonText } from "./SkeletonText";
import { SkeletonBox } from "./SkeletonBox";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export const SurveyDetailsSkeleton: React.FC = () => {
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
          {/* Survey Info Card */}
          <SkeletonCard padding={24} marginBottom={20}>
            <SkeletonText width="80%" height={24} lines={1} />
            <SkeletonText width="100%" height={16} lines={2} style={{ marginTop: 16 }} />
            <View style={styles.metaRow}>
              <SkeletonBox width={100} height={14} borderRadius={4} />
              <SkeletonBox width={100} height={14} borderRadius={4} />
              <SkeletonBox width={80} height={14} borderRadius={4} />
            </View>
          </SkeletonCard>

          {/* Questions Section */}
          <SkeletonText width="40%" height={20} lines={1} style={{ marginBottom: 20 }} />
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} padding={20} marginBottom={20}>
              <View style={styles.questionHeader}>
                <SkeletonText width="20%" height={16} lines={1} />
                <SkeletonBox width={60} height={20} borderRadius={12} />
              </View>
              <SkeletonText width="90%" height={18} lines={1} style={{ marginTop: 16 }} />
              <SkeletonText width="100%" height={16} lines={2} style={{ marginTop: 12 }} />
            </SkeletonCard>
          ))}

          {/* Responses Section */}
          <SkeletonText width="50%" height={20} lines={1} style={{ marginTop: 24, marginBottom: 20 }} />
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} padding={20} marginBottom={20}>
              <View style={styles.responseHeader}>
                <SkeletonBox width={40} height={40} borderRadius={20} />
                <View style={styles.responseInfo}>
                  <SkeletonText width="60%" height={16} lines={1} />
                  <SkeletonText width="40%" height={12} lines={1} style={{ marginTop: 6 }} />
                </View>
              </View>
              <SkeletonText width="100%" height={16} lines={2} style={{ marginTop: 16 }} />
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
  metaRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  responseInfo: {
    flex: 1,
  },
});

