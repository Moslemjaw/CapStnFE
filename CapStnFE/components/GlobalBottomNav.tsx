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
  Easing,
  interpolateColor,
  cancelAnimation,
} from "react-native-reanimated";
import AnalysisContext from "@/context/AnalysisContext";
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

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
  const isSightAIActive =
    activeTab === "sightai" ||
    (pathname && (
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
  const pressAnimationActive = useRef(false);
  const currentAnimationState = useRef<'idle' | 'active' | 'analyzing' | 'completing' | null>(null);
  const analyzingAnimationActive = useRef(false);
  const previousIsAnalyzing = useRef(false);

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
    
    const currentContext = context;
    const currentIsAnalyzing = currentContext?.isAnalyzing ?? false;
    const currentIsAnalysisComplete = currentContext?.isAnalysisComplete ?? false;
    
    if (!currentIsAnalyzing && !currentIsAnalysisComplete) {
      if (isFocused) {
        const startX = 0.95;
        const startY = 1.05;
        
        jellyScaleX.value = withSequence(
          withTiming(startX, { duration: 350, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withRepeat(
            withSequence(
              withTiming(0.95, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(1.05, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(1.0, { duration: 300, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
              withTiming(0.95, { duration: 500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
            ),
            -1,
            false
          )
        );
        jellyScaleY.value = withSequence(
          withTiming(startY, { duration: 350, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withRepeat(
            withSequence(
              withTiming(1.05, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(0.95, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(1.0, { duration: 300, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
              withTiming(1.05, { duration: 500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
            ),
            -1,
            false
          )
        );
        
        shadowOpacity.value = withSequence(
          withTiming(0.4, { duration: 350, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withRepeat(
            withSequence(
              withTiming(0.4, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(0.7, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(0.55, { duration: 300, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
              withTiming(0.4, { duration: 500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
            ),
            -1,
            false
          )
        );
        shadowRadius.value = withSequence(
          withTiming(18, { duration: 350, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withRepeat(
            withSequence(
              withTiming(18, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(25, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(21.5, { duration: 300, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
              withTiming(18, { duration: 500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
            ),
            -1,
            false
          )
        );
      } else {
        const startX = 0.99;
        const startY = 1.01;
        
        jellyScaleX.value = withSequence(
          withTiming(startX, { duration: 350, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withRepeat(
            withSequence(
              withTiming(0.99, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(1.01, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(1.0, { duration: 400, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
              withTiming(0.99, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) })
            ),
            -1,
            false
          )
        );
        jellyScaleY.value = withSequence(
          withTiming(startY, { duration: 350, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withRepeat(
            withSequence(
              withTiming(1.01, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(0.99, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(1.0, { duration: 400, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
              withTiming(1.01, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) })
            ),
            -1,
            false
          )
        );
        shadowOpacity.value = withSequence(
          withTiming(0.1, { duration: 350, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withRepeat(
            withSequence(
              withTiming(0.1, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(0.2, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(0.15, { duration: 400, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
              withTiming(0.1, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) })
            ),
            -1,
            false
          )
        );
        shadowRadius.value = withSequence(
          withTiming(8, { duration: 350, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withRepeat(
            withSequence(
              withTiming(8, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(10, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
              withTiming(9, { duration: 400, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
              withTiming(8, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) })
            ),
            -1,
            false
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

    if (targetState === 'analyzing' && 
        currentAnimationState.current === 'analyzing' && 
        analyzingAnimationActive.current &&
        previousIsAnalyzing.current === isAnalyzing) {
      return;
    }

    previousIsAnalyzing.current = isAnalyzing;

    const stateChanged = currentAnimationState.current !== targetState;
    
    if (stateChanged) {
      cancelAnimation(jellyScaleX);
      cancelAnimation(jellyScaleY);
      cancelAnimation(shadowOpacity);
      cancelAnimation(shadowRadius);

      jellyScaleX.value = 1;
      jellyScaleY.value = 1;
    } else {
      return;
    }

    currentAnimationState.current = targetState;

    if (isAnalysisComplete) {
      shadowOpacity.value = withTiming(1.0, { duration: 400, easing: Easing.out(Easing.ease) });
      shadowRadius.value = withTiming(50, { duration: 400, easing: Easing.out(Easing.ease) });
      jellyScaleX.value = withSequence(
        withTiming(1.15, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) })
      );
      jellyScaleY.value = withSequence(
        withTiming(1.15, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) })
      );
      analyzingAnimationActive.current = false;
    } else if (isAnalyzing) {
      analyzingAnimationActive.current = true;
      
      jellyScaleX.value = withRepeat(
        withSequence(
          withTiming(0.90, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1.10, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1.0, { duration: 200, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(0.90, { duration: 400, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
      jellyScaleY.value = withRepeat(
        withSequence(
          withTiming(1.10, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0.90, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1.0, { duration: 200, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(1.10, { duration: 400, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );

      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0.9, { duration: 800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0.75, { duration: 200, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(0.6, { duration: 400, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
      shadowRadius.value = withRepeat(
        withSequence(
          withTiming(25, { duration: 800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(40, { duration: 800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(32.5, { duration: 200, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(25, { duration: 400, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
    } else if (isFocused) {
      analyzingAnimationActive.current = false;
      jellyScaleX.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1.05, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1.0, { duration: 300, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(0.95, { duration: 500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
      jellyScaleY.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0.95, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1.0, { duration: 300, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(1.05, { duration: 500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );

      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0.7, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0.55, { duration: 300, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(0.4, { duration: 500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
      shadowRadius.value = withRepeat(
        withSequence(
          withTiming(18, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(25, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(21.5, { duration: 300, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(18, { duration: 500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
    } else {
      analyzingAnimationActive.current = false;
      
      jellyScaleX.value = withRepeat(
        withSequence(
          withTiming(0.99, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1.01, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1.0, { duration: 400, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(0.99, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
      jellyScaleY.value = withRepeat(
        withSequence(
          withTiming(1.01, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0.99, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1.0, { duration: 400, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(1.01, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );

      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.1, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0.2, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0.15, { duration: 400, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(0.1, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
      shadowRadius.value = withRepeat(
        withSequence(
          withTiming(8, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(10, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(9, { duration: 400, easing: Easing.bezier(0.33, 0, 0.67, 1) }),
          withTiming(8, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
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

    jellyScaleX.value = 1;
    jellyScaleY.value = 1;

    jellyScaleX.value = withSequence(
      withSpring(0.92, { damping: 10, stiffness: 180 }),
      withSpring(1.08, { damping: 9, stiffness: 150 }),
      withSpring(0.96, { damping: 11, stiffness: 200 }),
      withSpring(1.04, { damping: 12, stiffness: 220 }),
      withTiming(1.02, { duration: 400, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 600, easing: Easing.bezier(0.33, 0, 0.67, 1) })
    );
    jellyScaleY.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 180 }),
      withSpring(0.92, { damping: 9, stiffness: 150 }),
      withSpring(1.04, { damping: 11, stiffness: 200 }),
      withSpring(0.96, { damping: 12, stiffness: 220 }),
      withTiming(0.98, { duration: 400, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 600, easing: Easing.bezier(0.33, 0, 0.67, 1) })
    );

    const timeoutId = setTimeout(() => {
      const currentContext = context;
      const currentIsAnalyzing = currentContext?.isAnalyzing ?? false;
      const currentIsAnalysisComplete = currentContext?.isAnalysisComplete ?? false;
      
      if (pressAnimationActive.current && !currentIsAnalyzing && !currentIsAnalysisComplete) {
        restoreContinuousAnimation();
      }
    }, 1700);
    
    (pressAnimationActive as any).timeoutId = timeoutId;

    shadowOpacity.value = withSequence(
      withTiming(0.95, { duration: 120, easing: Easing.out(Easing.ease) }),
      withTiming(isFocused ? 0.7 : 0.2, { duration: 500, easing: Easing.in(Easing.ease) })
    );
    shadowRadius.value = withSequence(
      withTiming(40, { duration: 120, easing: Easing.out(Easing.ease) }),
      withTiming(isFocused ? 25 : 10, { duration: 500, easing: Easing.in(Easing.ease) })
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
    return {
      transform: [
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
    ...Shadows.sm,
    width: "100%",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingTop: 5,
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
    top: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  glowContainer: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary.blue,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 10,
  },
  sightaiLogo: {
    width: 85,
    height: 85,
  },
});
