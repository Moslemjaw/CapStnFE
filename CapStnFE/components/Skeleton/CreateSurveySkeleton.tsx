import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBox, SkeletonCard, SkeletonText } from "./index";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export const CreateSurveySkeleton: React.FC = () => {
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
          {/* Survey Title Section */}
          <SkeletonCard padding={24} marginBottom={20}>
            <SkeletonText width="30%" height={16} lines={1} />
            <SkeletonBox width="100%" height={50} borderRadius={12} style={{ marginTop: 16 }} />
          </SkeletonCard>

          {/* Description Section */}
          <SkeletonCard padding={24} marginBottom={20}>
            <SkeletonText width="40%" height={16} lines={1} />
            <SkeletonBox width="100%" height={100} borderRadius={12} style={{ marginTop: 16 }} />
          </SkeletonCard>

          {/* Questions Section */}
          <SkeletonText width="50%" height={20} lines={1} style={{ marginBottom: 20 }} />
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} padding={20} marginBottom={20}>
              <View style={styles.questionHeader}>
                <SkeletonText width="30%" height={16} lines={1} />
                <SkeletonBox width={60} height={20} borderRadius={12} />
              </View>
              <SkeletonBox width="100%" height={50} borderRadius={12} style={{ marginTop: 16 }} />
              <View style={styles.questionOptions}>
                <SkeletonBox width={100} height={36} borderRadius={8} />
                <SkeletonBox width={100} height={36} borderRadius={8} />
              </View>
            </SkeletonCard>
          ))}

          {/* Add Question Button */}
          <SkeletonBox width="100%" height={44} borderRadius={12} style={{ marginTop: 12 }} />
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
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  questionOptions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
});

