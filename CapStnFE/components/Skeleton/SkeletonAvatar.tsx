import React from "react";
import { SkeletonShimmer } from "./SkeletonShimmer";

interface SkeletonAvatarProps {
  size?: number;
  style?: any;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 84,
  style,
}) => {
  return (
    <SkeletonShimmer
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

