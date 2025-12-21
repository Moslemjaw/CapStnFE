import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonCard, SkeletonText } from "./index";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export const HomeSkeleton: React.FC = () => {
  const bottomNavHeight = useBottomNavHeight();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomNavHeight + 8 },
        ]}
      >
        <View style={styles.content}>
          <SkeletonCard padding={24} marginBottom={20}>
            <SkeletonText width="80%" height={20} lines={1} />
            <SkeletonText width="100%" height={16} lines={2} style={{ marginTop: 16 }} />
          </SkeletonCard>
          <SkeletonCard padding={24} marginBottom={20}>
            <SkeletonText width="75%" height={20} lines={1} />
            <SkeletonText width="100%" height={16} lines={2} style={{ marginTop: 16 }} />
          </SkeletonCard>
          <SkeletonCard padding={24} marginBottom={20}>
            <SkeletonText width="70%" height={20} lines={1} />
            <SkeletonText width="100%" height={16} lines={2} style={{ marginTop: 16 }} />
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
    padding: 24,
    gap: 20,
  },
});

