import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  createAnimatedComponent,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const AnimatedGradient = createAnimatedComponent(LinearGradient);

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  darkMode?: boolean;
}

export function SkeletonBox({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
  darkMode = false,
}: SkeletonBoxProps) {
  const shimmerTranslate = useSharedValue(-400);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(400, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslate.value }],
    };
  });

  const baseColor = darkMode ? "#2D2D3E" : "#E5E7EB";
  const shimmerColor = darkMode 
    ? "rgba(255,255,255,0.15)" 
    : "rgba(255,255,255,0.6)";

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: "200%",
            height: "100%",
            position: "absolute",
            left: 0,
            top: 0,
          },
          animatedStyle,
        ]}
      >
        <AnimatedGradient
          colors={["transparent", shimmerColor, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: "50%",
            height: "100%",
          }}
        />
      </Animated.View>
    </View>
  );
}

interface SkeletonTextProps {
  lines?: number;
  width?: number | string;
  lineHeight?: number;
  style?: ViewStyle;
  darkMode?: boolean;
}

export function SkeletonText({
  lines = 1,
  width = "100%",
  lineHeight = 16,
  style,
  darkMode = false,
}: SkeletonTextProps) {
  return (
    <View style={[{ gap: 8 }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBox
          key={index}
          width={index === lines - 1 ? width : "100%"}
          height={lineHeight}
          borderRadius={4}
          darkMode={darkMode}
        />
      ))}
    </View>
  );
}

interface SkeletonCardProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  darkMode?: boolean;
}

export function SkeletonCard({
  width = "100%",
  height = 120,
  style,
  darkMode = false,
}: SkeletonCardProps) {
  const baseColor = darkMode ? "#1E1E2E" : "#E5E7EB";
  
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: 12,
          backgroundColor: baseColor,
          padding: 16,
          gap: 12,
        },
        style,
      ]}
    >
      <SkeletonBox width="60%" height={20} borderRadius={4} darkMode={darkMode} />
      <SkeletonText lines={2} width="100%" lineHeight={14} darkMode={darkMode} />
      <SkeletonBox width="40%" height={16} borderRadius={4} darkMode={darkMode} />
    </View>
  );
}

const styles = StyleSheet.create({});
