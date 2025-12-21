import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonShimmer } from "./SkeletonShimmer";

interface SkeletonCardProps {
  padding?: number;
  marginBottom?: number;
  children?: React.ReactNode;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  padding = 16,
  marginBottom = 16,
  children,
}) => {
  return (
    <View
      style={[
        styles.card,
        {
          padding,
          marginBottom,
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});

