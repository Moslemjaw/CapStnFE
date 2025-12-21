import React from "react";
import { SkeletonShimmer } from "./SkeletonShimmer";

interface SkeletonBoxProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) => {
  return (
    <SkeletonShimmer
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
};

