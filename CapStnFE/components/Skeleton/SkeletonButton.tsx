import React from "react";
import { SkeletonShimmer } from "./SkeletonShimmer";

interface SkeletonButtonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  width = "100%",
  height = 44,
  borderRadius = 12,
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

