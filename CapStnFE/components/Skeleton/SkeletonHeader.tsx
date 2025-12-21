import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonShimmer } from "./SkeletonShimmer";

interface SkeletonHeaderProps {
  showLogo?: boolean;
  showSubtitle?: boolean;
}

export const SkeletonHeader: React.FC<SkeletonHeaderProps> = ({
  showLogo = true,
  showSubtitle = true,
}) => {
  return (
    <View style={styles.header}>
      {showLogo && (
        <SkeletonShimmer
          width={80}
          height={24}
          borderRadius={4}
          style={styles.logo}
        />
      )}
      <SkeletonShimmer
        width="60%"
        height={32}
        borderRadius={4}
        style={styles.title}
      />
      {showSubtitle && (
        <SkeletonShimmer
          width="80%"
          height={16}
          borderRadius={4}
          style={styles.subtitle}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  logo: {
    marginBottom: 10,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 4,
  },
});

