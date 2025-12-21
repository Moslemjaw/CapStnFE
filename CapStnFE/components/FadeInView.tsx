import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from "react-native-reanimated";

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle | ViewStyle[];
  slideFrom?: "none" | "bottom" | "top" | "left" | "right";
  slideDistance?: number;
  useSpring?: boolean;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 400,
  delay = 0,
  style,
  slideFrom = "bottom",
  slideDistance = 20,
  useSpring = false,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    const animation = useSpring
      ? withSpring(1, {
          damping: 15,
          stiffness: 100,
          mass: 0.5,
        })
      : withTiming(1, {
          duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });

    progress.value = delay > 0 ? withDelay(delay, animation) : animation;
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = slideFrom === "left" 
      ? interpolate(progress.value, [0, 1], [-slideDistance, 0])
      : slideFrom === "right"
      ? interpolate(progress.value, [0, 1], [slideDistance, 0])
      : 0;

    const translateY = slideFrom === "top"
      ? interpolate(progress.value, [0, 1], [-slideDistance, 0])
      : slideFrom === "bottom"
      ? interpolate(progress.value, [0, 1], [slideDistance, 0])
      : 0;

    return {
      opacity: progress.value,
      transform: [
        { translateX },
        { translateY },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

interface StaggeredFadeInProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  initialDelay?: number;
  duration?: number;
  slideFrom?: "none" | "bottom" | "top" | "left" | "right";
  slideDistance?: number;
}

export const StaggeredFadeIn: React.FC<StaggeredFadeInProps> = ({
  children,
  staggerDelay = 50,
  initialDelay = 0,
  duration = 400,
  slideFrom = "bottom",
  slideDistance = 15,
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <FadeInView
          key={index}
          delay={initialDelay + index * staggerDelay}
          duration={duration}
          slideFrom={slideFrom}
          slideDistance={slideDistance}
        >
          {child}
        </FadeInView>
      ))}
    </>
  );
};

interface ScaleInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle | ViewStyle[];
  initialScale?: number;
}

export const ScaleInView: React.FC<ScaleInViewProps> = ({
  children,
  duration = 400,
  delay = 0,
  style,
  initialScale = 0.9,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    const animation = withSpring(1, {
      damping: 12,
      stiffness: 120,
      mass: 0.5,
    });

    progress.value = delay > 0 ? withDelay(delay, animation) : animation;
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [
        { scale: interpolate(progress.value, [0, 1], [initialScale, 1]) },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

interface PulseViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  pulseScale?: number;
  duration?: number;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  style,
  pulseScale = 1.02,
  duration = 2000,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(pulseScale, {
      duration: duration / 2,
      easing: Easing.inOut(Easing.ease),
    });

    const interval = setInterval(() => {
      scale.value = scale.value === 1
        ? withTiming(pulseScale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
        : withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) });
    }, duration / 2);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};
