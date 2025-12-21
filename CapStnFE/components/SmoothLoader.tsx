import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface SmoothLoaderProps {
  children: React.ReactNode;
  isLoading: boolean;
  duration?: number;
  style?: any;
}

/**
 * SmoothLoader - Provides a subtle fade-in animation when content finishes loading.
 * Uses smooth opacity transitions (250ms) that are non-aggressive and perfect for quickly-loading pages.
 */
export const SmoothLoader: React.FC<SmoothLoaderProps> = ({
  children,
  isLoading,
  duration = 250,
  style,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!isLoading) {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth ease-in-out
      });
    } else {
      opacity.value = 0;
    }
  }, [isLoading, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (isLoading) {
    return null; // Don't show anything while loading - content will fade in when ready
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

