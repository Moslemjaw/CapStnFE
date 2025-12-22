import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image, View, StyleSheet, Pressable, Text } from "react-native";
import { useEffect, useContext, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolateColor,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useFrameCallback,
} from "react-native-reanimated";
import AnalysisContext from "@/context/AnalysisContext";
import { Colors, Typography, Spacing, Borders, Shadows, ZIndex } from "@/constants/design";

// Animation configuration constants for smoother, more refined animations
const ANIMATION_CONFIG = {
  idle: {
    scaleRange: { min: 0.99, max: 1.01 },
    duration: { slow: 4000, medium: 600, fast: 300 },
    shadowOpacity: { min: 0.05, max: 0.15 },
    shadowRadius: { min: 6, max: 10 },
  },
  active: {
    scaleRange: { min: 0.97, max: 1.03 },
    duration: { slow: 2000, medium: 400, fast: 200 },
    shadowOpacity: { min: 0.3, max: 0.6 },
    shadowRadius: { min: 16, max: 24 },
  },
  analyzing: {
    scaleRange: { min: 0.92, max: 1.08 },
    duration: { cycle: 800 },
    shadowOpacity: { min: 0.5, max: 0.85 },
    shadowRadius: { min: 20, max: 35 },
  },
  press: {
    spring: { damping: 12, stiffness: 200, mass: 0.8 },
    bounce: { damping: 10, stiffness: 150, mass: 0.6 },
  },
};

// Premium easing curves
const EASING = {
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
  easeOut: Easing.bezier(0, 0, 0.2, 1),
  easeIn: Easing.bezier(0.4, 0, 1, 1),
  organic: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export default function GlobalBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Determine which tab is active based on pathname
  const getActiveTab = () => {
    if (!pathname) return null;
    
    if (pathname.includes("/sightai")) {
      return "sightai";
    }
    if (pathname.includes("/research")) {
      return "research";
    }
    if (pathname.includes("/profile")) {
      return "profile";
    }
    if (pathname.includes("/surveys") && !pathname.includes("/survey-")) {
      return "surveys";
    }
    if (pathname.includes("/survey-") || pathname.includes("/create-survey")) {
      return "surveys";
    }
    if (pathname === "/" || 
        pathname.includes("/index") || 
        pathname.endsWith("/(tabs)") || 
        pathname.endsWith("/(tabs)/")) {
      return "home";
    }
    if (pathname.includes("/(researcher)/(tabs)")) {
      return "home";
    }
    return null;
  };

  const activeTab = getActiveTab();
  // Check if we're on any SightAI-related page
  const isSightAIActive: boolean =
    activeTab === "sightai" ||
    (pathname !== null && pathname !== undefined && (
      pathname.includes("/analysis-loading") ||
      pathname.includes("/analysis-insights") ||
      pathname.includes("/mass-analyses") ||
      pathname.includes("/survey-analyses")
    ));

  // Animate background color for dark mode
  const navBgColor = useSharedValue(isSightAIActive ? 1 : 0);

  useEffect(() => {
    navBgColor.value = withTiming(isSightAIActive ? 1 : 0, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, [isSightAIActive]);

  const animatedNavStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      navBgColor.value,
      [0, 1],
      [Colors.background.primary, Colors.dark.surface]
    ),
    borderTopColor: interpolateColor(
      navBgColor.value,
      [0, 1],
      [Colors.border.light, Colors.dark.border]
    ),
  }));

  const getNavLabelColor = (isActive: boolean) => {
    if (isSightAIActive) {
      return isActive ? Colors.text.inverse : Colors.textDark.tertiary;
    }
    return isActive ? Colors.primary.blue : Colors.text.tertiary;
  };

  const getIconColor = (isActive: boolean) => {
    if (isSightAIActive) {
      return isActive ? Colors.text.inverse : Colors.textDark.tertiary;
    }
    return isActive ? Colors.primary.blue : Colors.text.tertiary;
  };

  const handleNavigation = (route: string) => {
    try {
      const routeSegment = route.split("/").filter(Boolean).pop() || "";
      const isHomeRoute = route.endsWith("/(tabs)/") || route.endsWith("/(tabs)");
      
      if (isHomeRoute) {
        const isOnHome = pathname === "/" || 
                         pathname?.endsWith("/(tabs)") || 
                         pathname?.endsWith("/(tabs)/") ||
                         pathname?.endsWith("/index") ||
                         (pathname?.includes("/(tabs)") && !pathname?.includes("/surveys") && 
                          !pathname?.includes("/research") && !pathname?.includes("/profile") && 
                          !pathname?.includes("/sightai"));
        if (isOnHome) {
          return;
        }
      } else if (routeSegment && pathname?.includes(`/${routeSegment}`)) {
        return;
      }
      
      router.replace(route as any);
    } catch (error) {
      console.error("Navigation error:", error);
      router.push(route as any);
    }
  };

  return (
    <Animated.View
      style={[
        styles.bottomNav,
        animatedNavStyle,
        {
          paddingBottom: Math.max(insets.bottom, 5),
          height: 60 + Math.max(insets.bottom, 5),
        },
      ]}
    >
      <Pressable
        style={styles.navItem}
        onPress={() => handleNavigation("/(protected)/(researcher)/(tabs)/")}
      >
        <Ionicons
          name={activeTab === "home" ? "home" : "home-outline"}
          size={24}
          color={getIconColor(activeTab === "home")}
        />
        <Text
          style={[
            styles.navLabel,
            { color: getNavLabelColor(activeTab === "home") },
            activeTab === "home" && styles.navLabelActive,
          ]}
        >
          Home
        </Text>
      </Pressable>

      <Pressable
        style={styles.navItem}
        onPress={() => handleNavigation("/(protected)/(researcher)/(tabs)/surveys")}
      >
        <Ionicons
          name={activeTab === "surveys" ? "document-text" : "document-text-outline"}
          size={24}
          color={getIconColor(activeTab === "surveys")}
        />
        <Text
          style={[
            styles.navLabel,
            { color: getNavLabelColor(activeTab === "surveys") },
            activeTab === "surveys" && styles.navLabelActive,
          ]}
        >
          Surveys
        </Text>
      </Pressable>

      <View style={styles.navItem}>
        <AnimatedSightAILogo isFocused={isSightAIActive} />
      </View>

      <Pressable
        style={styles.navItem}
        onPress={() => handleNavigation("/(protected)/(researcher)/(tabs)/research")}
      >
        <Ionicons
          name={activeTab === "research" ? "glasses" : "glasses-outline"}
          size={24}
          color={getIconColor(activeTab === "research")}
        />
        <Text
          style={[
            styles.navLabel,
            { color: getNavLabelColor(activeTab === "research") },
            activeTab === "research" && styles.navLabelActive,
          ]}
        >
          Research
        </Text>
      </Pressable>

      <Pressable
        style={styles.navItem}
        onPress={() => handleNavigation("/(protected)/(researcher)/(tabs)/profile")}
      >
        <Ionicons
          name={activeTab === "profile" ? "person" : "person-outline"}
          size={24}
          color={getIconColor(activeTab === "profile")}
        />
        <Text
          style={[
            styles.navLabel,
            { color: getNavLabelColor(activeTab === "profile") },
            activeTab === "profile" && styles.navLabelActive,
          ]}
        >
          Profile
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function AnimatedSightAILogo({ isFocused }: { isFocused: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const context = useContext(AnalysisContext);
  const isAnalyzing = context?.isAnalyzing ?? false;
  const isAnalysisComplete = context?.isAnalysisComplete ?? false;
  const shadowOpacity = useSharedValue(0);
  const shadowRadius = useSharedValue(0);
  const jellyScaleX = useSharedValue(1);
  const jellyScaleY = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pressAnimationActive = useRef(false);
  const currentAnimationState = useRef<'idle' | 'active' | 'analyzing' | 'completing' | null>(null);
  const analyzingAnimationActive = useRef(false);
  const previousIsAnalyzing = useRef(false);

  // Smoothly restore continuous breathing animation after press
  const restoreContinuousAnimation = () => {
    if (!pressAnimationActive.current) return;
    
    if ((pressAnimationActive as any).timeoutId) {
      clearTimeout((pressAnimationActive as any).timeoutId);
      (pressAnimationActive as any).timeoutId = null;
    }
    
    pressAnimationActive.current = false;
    
    cancelAnimation(jellyScaleX);
    cancelAnimation(jellyScaleY);
    cancelAnimation(shadowOpacity);
    cancelAnimation(shadowRadius);
    cancelAnimation(rotation);
    
    const currentContext = context;
    const currentIsAnalyzing = currentContext?.isAnalyzing ?? false;
    const currentIsAnalysisComplete = currentContext?.isAnalysisComplete ?? false;
    
    if (!currentIsAnalyzing && !currentIsAnalysisComplete) {
      if (isFocused) {
        // Active state: Smoother, more prominent breathing
        const cfg = ANIMATION_CONFIG.active;
        
        jellyScaleX.value = withSequence(
          withTiming(cfg.scaleRange.min, { duration: 300, easing: EASING.smooth }),
          withRepeat(
            withSequence(
              withTiming(cfg.scaleRange.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming(cfg.scaleRange.max, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming(1.0, { duration: cfg.duration.fast, easing: EASING.smooth })
            ),
            -1,
            true
          )
        );
        jellyScaleY.value = withSequence(
          withTiming(cfg.scaleRange.max, { duration: 300, easing: EASING.smooth }),
          withRepeat(
            withSequence(
              withTiming(cfg.scaleRange.max, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming(cfg.scaleRange.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming(1.0, { duration: cfg.duration.fast, easing: EASING.smooth })
            ),
            -1,
            true
          )
        );
        
        shadowOpacity.value = withSequence(
          withTiming(cfg.shadowOpacity.min, { duration: 300, easing: EASING.smooth }),
          withRepeat(
            withSequence(
              withTiming(cfg.shadowOpacity.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming(cfg.shadowOpacity.max, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming((cfg.shadowOpacity.min + cfg.shadowOpacity.max) / 2, { duration: cfg.duration.fast, easing: EASING.smooth })
            ),
            -1,
            true
          )
        );
        shadowRadius.value = withSequence(
          withTiming(cfg.shadowRadius.min, { duration: 300, easing: EASING.smooth }),
          withRepeat(
            withSequence(
              withTiming(cfg.shadowRadius.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming(cfg.shadowRadius.max, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming((cfg.shadowRadius.min + cfg.shadowRadius.max) / 2, { duration: cfg.duration.fast, easing: EASING.smooth })
            ),
            -1,
            true
          )
        );
      } else {
        // Idle state: Very subtle, slow breathing
        const cfg = ANIMATION_CONFIG.idle;
        
        jellyScaleX.value = withSequence(
          withTiming(cfg.scaleRange.min, { duration: 400, easing: EASING.smooth }),
          withRepeat(
            withSequence(
              withTiming(cfg.scaleRange.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming(cfg.scaleRange.max, { duration: cfg.duration.slow, easing: EASING.easeInOut })
            ),
            -1,
            true
          )
        );
        jellyScaleY.value = withSequence(
          withTiming(cfg.scaleRange.max, { duration: 400, easing: EASING.smooth }),
          withRepeat(
            withSequence(
              withTiming(cfg.scaleRange.max, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming(cfg.scaleRange.min, { duration: cfg.duration.slow, easing: EASING.easeInOut })
            ),
            -1,
            true
          )
        );
        shadowOpacity.value = withSequence(
          withTiming(cfg.shadowOpacity.min, { duration: 400, easing: EASING.smooth }),
          withRepeat(
            withSequence(
              withTiming(cfg.shadowOpacity.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming(cfg.shadowOpacity.max, { duration: cfg.duration.slow, easing: EASING.easeInOut })
            ),
            -1,
            true
          )
        );
        shadowRadius.value = withSequence(
          withTiming(cfg.shadowRadius.min, { duration: 400, easing: EASING.smooth }),
          withRepeat(
            withSequence(
              withTiming(cfg.shadowRadius.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
              withTiming(cfg.shadowRadius.max, { duration: cfg.duration.slow, easing: EASING.easeInOut })
            ),
            -1,
            true
          )
        );
      }
    }
  };

  useEffect(() => {
    if (pressAnimationActive.current) {
      return;
    }

    let targetState: 'idle' | 'active' | 'analyzing' | 'completing' | null = null;
    if (isAnalysisComplete) {
      targetState = 'completing';
    } else if (isAnalyzing) {
      targetState = 'analyzing';
    } else if (isFocused) {
      targetState = 'active';
    } else {
      targetState = 'idle';
    }

    // Check if we need to start/restart the analyzing animation
    // This ensures rotation starts even if isAnalyzing is already true on mount
    const needsAnalyzingAnimation = targetState === 'analyzing' && 
      (!analyzingAnimationActive.current || currentAnimationState.current !== 'analyzing');

    const stateChanged = currentAnimationState.current !== targetState;
    
    // If state changed or we need to ensure analyzing animation is running, proceed
    if (stateChanged || needsAnalyzingAnimation) {
      cancelAnimation(jellyScaleX);
      cancelAnimation(jellyScaleY);
      cancelAnimation(shadowOpacity);
      cancelAnimation(shadowRadius);
      cancelAnimation(rotation);

      jellyScaleX.value = 1;
      jellyScaleY.value = 1;
      rotation.value = 0;
    } else {
      return;
    }

    previousIsAnalyzing.current = isAnalyzing;
    currentAnimationState.current = targetState;

    if (isAnalysisComplete) {
      // Completion celebration - smooth burst then aggressive pulsing for 3 seconds with very bright glow
      shadowOpacity.value = withSequence(
        withTiming(1.0, { duration: 300, easing: EASING.easeOut }),
        withRepeat(
          withSequence(
            withTiming(1.0, { duration: 150, easing: EASING.easeOut }),
            withTiming(0.7, { duration: 150, easing: EASING.easeIn })
          ),
          Math.floor(3000 / 300), // Pulse for 3 seconds (3000ms / 300ms per cycle)
          false
        ),
        withTiming(0.5, { duration: 600, easing: EASING.smooth })
      );
      shadowRadius.value = withSequence(
        withTiming(160, { duration: 300, easing: EASING.easeOut }),
        withRepeat(
          withSequence(
            withTiming(160, { duration: 150, easing: EASING.easeOut }),
            withTiming(120, { duration: 150, easing: EASING.easeIn })
          ),
          Math.floor(3000 / 300), // Pulse for 3 seconds
          false
        ),
        withTiming(30, { duration: 600, easing: EASING.smooth })
      );
      jellyScaleX.value = withSequence(
        withTiming(1.12, { duration: 250, easing: EASING.organic }),
        withTiming(0.95, { duration: 200, easing: EASING.easeInOut }),
        withRepeat(
          withSequence(
            withTiming(1.15, { duration: 150, easing: EASING.easeOut }),
            withTiming(0.92, { duration: 150, easing: EASING.easeIn })
          ),
          Math.floor(3000 / 300), // Aggressive pulse for 3 seconds
          false
        ),
        withTiming(1.0, { duration: 350, easing: EASING.smooth })
      );
      jellyScaleY.value = withSequence(
        withTiming(1.12, { duration: 250, easing: EASING.organic }),
        withTiming(0.95, { duration: 200, easing: EASING.easeInOut }),
        withRepeat(
          withSequence(
            withTiming(1.15, { duration: 150, easing: EASING.easeOut }),
            withTiming(0.92, { duration: 150, easing: EASING.easeIn })
          ),
          Math.floor(3000 / 300), // Aggressive pulse for 3 seconds
          false
        ),
        withTiming(1.0, { duration: 350, easing: EASING.smooth })
      );
      analyzingAnimationActive.current = false;
      rotation.value = 0;
    } else if (isAnalyzing) {
      // Analyzing state - dynamic pulsing with organic feel and fast rotation
      analyzingAnimationActive.current = true;
      const cfg = ANIMATION_CONFIG.analyzing;
      
      // Continuous rotation - 360 degrees in 186ms = ~5.38 rotations per second (40% faster)
      // Modulo in logoAnimatedStyle wraps the value for continuous appearance
      rotation.value = withRepeat(
        withTiming(360, { duration: 186, easing: Easing.linear }),
        -1,
        false
      );
      
      jellyScaleX.value = withRepeat(
        withSequence(
          withTiming(cfg.scaleRange.min, { duration: cfg.duration.cycle, easing: EASING.easeInOut }),
          withTiming(cfg.scaleRange.max, { duration: cfg.duration.cycle, easing: EASING.easeInOut })
        ),
        -1,
        true
      );
      jellyScaleY.value = withRepeat(
        withSequence(
          withTiming(cfg.scaleRange.max, { duration: cfg.duration.cycle, easing: EASING.easeInOut }),
          withTiming(cfg.scaleRange.min, { duration: cfg.duration.cycle, easing: EASING.easeInOut })
        ),
        -1,
        true
      );

      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(cfg.shadowOpacity.min, { duration: cfg.duration.cycle, easing: EASING.easeInOut }),
          withTiming(cfg.shadowOpacity.max, { duration: cfg.duration.cycle, easing: EASING.easeInOut })
        ),
        -1,
        true
      );
      shadowRadius.value = withRepeat(
        withSequence(
          withTiming(cfg.shadowRadius.min, { duration: cfg.duration.cycle, easing: EASING.easeInOut }),
          withTiming(cfg.shadowRadius.max, { duration: cfg.duration.cycle, easing: EASING.easeInOut })
        ),
        -1,
        true
      );
    } else if (isFocused) {
      // Active state - calm breathing with subtle glow
      analyzingAnimationActive.current = false;
      rotation.value = 0;
      const cfg = ANIMATION_CONFIG.active;
      
      jellyScaleX.value = withRepeat(
        withSequence(
          withTiming(cfg.scaleRange.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
          withTiming(cfg.scaleRange.max, { duration: cfg.duration.slow, easing: EASING.easeInOut })
        ),
        -1,
        true
      );
      jellyScaleY.value = withRepeat(
        withSequence(
          withTiming(cfg.scaleRange.max, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
          withTiming(cfg.scaleRange.min, { duration: cfg.duration.slow, easing: EASING.easeInOut })
        ),
        -1,
        true
      );

      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(cfg.shadowOpacity.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
          withTiming(cfg.shadowOpacity.max, { duration: cfg.duration.slow, easing: EASING.easeInOut })
        ),
        -1,
        true
      );
      shadowRadius.value = withRepeat(
        withSequence(
          withTiming(cfg.shadowRadius.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
          withTiming(cfg.shadowRadius.max, { duration: cfg.duration.slow, easing: EASING.easeInOut })
        ),
        -1,
        true
      );
    } else {
      // Idle state - very subtle, peaceful breathing
      analyzingAnimationActive.current = false;
      rotation.value = 0;
      const cfg = ANIMATION_CONFIG.idle;
      
      jellyScaleX.value = withRepeat(
        withSequence(
          withTiming(cfg.scaleRange.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
          withTiming(cfg.scaleRange.max, { duration: cfg.duration.slow, easing: EASING.easeInOut })
        ),
        -1,
        true
      );
      jellyScaleY.value = withRepeat(
        withSequence(
          withTiming(cfg.scaleRange.max, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
          withTiming(cfg.scaleRange.min, { duration: cfg.duration.slow, easing: EASING.easeInOut })
        ),
        -1,
        true
      );

      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(cfg.shadowOpacity.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
          withTiming(cfg.shadowOpacity.max, { duration: cfg.duration.slow, easing: EASING.easeInOut })
        ),
        -1,
        true
      );
      shadowRadius.value = withRepeat(
        withSequence(
          withTiming(cfg.shadowRadius.min, { duration: cfg.duration.slow, easing: EASING.easeInOut }),
          withTiming(cfg.shadowRadius.max, { duration: cfg.duration.slow, easing: EASING.easeInOut })
        ),
        -1,
        true
      );
    }
  }, [isFocused, isAnalyzing, isAnalysisComplete]);

  useEffect(() => {
    if (previousIsAnalyzing.current === isAnalyzing) {
      return;
    }

    if (!isAnalyzing) {
      analyzingAnimationActive.current = false;
      previousIsAnalyzing.current = false;
    } else {
      previousIsAnalyzing.current = true;
    }
  }, [isAnalyzing]);


  const handlePress = () => {
    if (pressAnimationActive.current || isAnalyzing || isAnalysisComplete) {
      return;
    }

    pressAnimationActive.current = true;
    cancelAnimation(jellyScaleX);
    cancelAnimation(jellyScaleY);
    cancelAnimation(shadowOpacity);
    cancelAnimation(shadowRadius);
    cancelAnimation(rotation);

    jellyScaleX.value = 1;
    jellyScaleY.value = 1;
    rotation.value = 0;

    const { spring, bounce } = ANIMATION_CONFIG.press;

    // Premium jelly press animation - smooth, organic, and satisfying
    jellyScaleX.value = withSequence(
      withSpring(0.88, spring),
      withSpring(1.06, bounce),
      withSpring(0.97, { ...spring, damping: 14 }),
      withTiming(1, { duration: 300, easing: EASING.smooth })
    );
    jellyScaleY.value = withSequence(
      withSpring(1.12, spring),
      withSpring(0.94, bounce),
      withSpring(1.03, { ...spring, damping: 14 }),
      withTiming(1, { duration: 300, easing: EASING.smooth })
    );

    const timeoutId = setTimeout(() => {
      const currentContext = context;
      const currentIsAnalyzing = currentContext?.isAnalyzing ?? false;
      const currentIsAnalysisComplete = currentContext?.isAnalysisComplete ?? false;
      
      if (pressAnimationActive.current && !currentIsAnalyzing && !currentIsAnalysisComplete) {
        restoreContinuousAnimation();
      }
    }, 1000);
    
    (pressAnimationActive as any).timeoutId = timeoutId;

    // Glow flash effect on press
    const targetCfg = isFocused ? ANIMATION_CONFIG.active : ANIMATION_CONFIG.idle;
    shadowOpacity.value = withSequence(
      withTiming(0.9, { duration: 80, easing: EASING.easeOut }),
      withTiming(targetCfg.shadowOpacity.max, { duration: 400, easing: EASING.smooth })
    );
    shadowRadius.value = withSequence(
      withTiming(35, { duration: 80, easing: EASING.easeOut }),
      withTiming(targetCfg.shadowRadius.max, { duration: 400, easing: EASING.smooth })
    );

    const isOnAnalysisPage = pathname && (
      pathname.includes("/analysis-insights") ||
      pathname.includes("/analysis-loading") ||
      pathname.includes("/mass-analyses") ||
      pathname.includes("/survey-analyses")
    );
    
    if (!isFocused || isOnAnalysisPage) {
      router.push("/(protected)/(researcher)/(tabs)/sightai" as any);
    }
  };

  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: shadowOpacity.value,
      shadowRadius: shadowRadius.value,
    };
  });

  const logoAnimatedStyle = useAnimatedStyle(() => {
    // Use modulo to wrap rotation value, allowing continuous incrementing without reset
    const rotationDeg = rotation.value % 360;
    return {
      transform: [
        { rotate: `${rotationDeg}deg` },
        { scaleX: jellyScaleX.value },
        { scaleY: jellyScaleY.value },
      ],
    };
  });

  return (
    <View style={styles.sightaiButtonContainer}>
      <Pressable onPress={handlePress}>
        <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
          <Animated.View style={logoAnimatedStyle}>
            <Image
              source={require("@/assets/logo.png")}
              style={styles.sightaiLogo}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 5,
    borderTopLeftRadius: Borders.radius.xl,
    borderTopRightRadius: Borders.radius.xl,
    justifyContent: "space-around",
    alignItems: "flex-start",
    ...Shadows.md,
    width: "100%",
    zIndex: ZIndex.bottomNav,
    position: "relative",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingTop: 5,
    zIndex: ZIndex.card,
  },
  navLabel: {
    ...Typography.styles.micro,
    marginTop: 2,
    textTransform: "none",
    fontWeight: "500",
  },
  navLabelActive: {
    fontWeight: "600",
  },
  sightaiButtonContainer: {
    top: -12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: ZIndex.dropdown,
    overflow: "visible",
  },
  glowContainer: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary.blue,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: ZIndex.dropdown,
    overflow: "visible",
  },
  sightaiLogo: {
    width: 85,
    height: 85,
  },
});
