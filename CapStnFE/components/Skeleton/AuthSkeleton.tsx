import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { SkeletonShimmer, SkeletonBox, SkeletonButton } from "./index";

export const AuthSkeleton: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#EEF5FF", "#F9F6FE"]}
        style={styles.gradientContainer}
      >
        <View style={styles.container}>
          <View style={styles.contentContainer}>
            {/* Branding Section */}
            <View style={styles.brandingSection}>
              <SkeletonShimmer width={120} height={120} borderRadius={60} />
              <SkeletonShimmer
                width={120}
                height={30}
                borderRadius={4}
                style={styles.titleSkeleton}
              />
            </View>

            {/* Feature Carousel Section */}
            <View style={styles.featureSection}>
              <View style={styles.featureCard}>
                <SkeletonShimmer width={40} height={40} borderRadius={20} />
                <SkeletonShimmer
                  width="70%"
                  height={20}
                  borderRadius={4}
                  style={styles.featureHeadline}
                />
                <SkeletonShimmer
                  width="85%"
                  height={16}
                  borderRadius={4}
                  style={styles.featureBody}
                />
              </View>
              <View style={styles.indicators}>
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonShimmer
                    key={i}
                    width={8}
                    height={8}
                    borderRadius={4}
                  />
                ))}
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <SkeletonBox width="100%" height={50} borderRadius={12} />
              <SkeletonBox
                width="100%"
                height={50}
                borderRadius={12}
                style={styles.inputSpacing}
              />
              <SkeletonButton
                width="100%"
                height={50}
                borderRadius={12}
                style={styles.buttonSpacing}
              />
              <SkeletonShimmer
                width="60%"
                height={16}
                borderRadius={4}
                style={styles.linkSpacing}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  brandingSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  titleSkeleton: {
    marginTop: 24,
  },
  featureSection: {
    marginBottom: 48,
    alignItems: "center",
  },
  featureCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 28,
    backgroundColor: "rgba(238, 245, 255, 0.3)",
    borderRadius: 16,
    marginHorizontal: 20,
    width: "90%",
    marginBottom: 20,
  },
  featureHeadline: {
    marginTop: 20,
    marginBottom: 16,
  },
  featureBody: {
    marginTop: 12,
  },
  indicators: {
    flexDirection: "row",
    gap: 12,
  },
  formSection: {
    width: "100%",
  },
  inputSpacing: {
    marginTop: 20,
  },
  buttonSpacing: {
    marginTop: 28,
  },
  linkSpacing: {
    marginTop: 28,
    alignSelf: "center",
  },
});

