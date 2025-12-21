import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonShimmer } from "./SkeletonShimmer";

interface SkeletonTextProps {
  width?: number | string;
  height?: number;
  lines?: number;
  lineSpacing?: number;
  style?: any;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  width = "100%",
  height = 16,
  lines = 1,
  lineSpacing = 8,
  style,
}) => {
  if (lines === 1) {
    return (
      <SkeletonShimmer
        width={width}
        height={height}
        borderRadius={4}
        style={style}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonShimmer
          key={index}
          width={index === lines - 1 ? "75%" : width}
          height={height}
          borderRadius={4}
          style={index < lines - 1 ? { marginBottom: lineSpacing + 4 } : {}}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});

