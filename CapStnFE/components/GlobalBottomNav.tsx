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
} from "react-native-reanimated";
import AnalysisContext from "@/context/AnalysisContext";

export default function GlobalBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Determine which tab is active based on pathname
  const getActiveTab = () => {
    if (!pathname) return null;
    
    // Check for specific tab routes first (order matters - check specific routes before general)
    if (pathname.includes("/sightai")) {
      return "sightai";
    }
    if (pathname.includes("/research")) {
      return "research";
    }
    if (pathname.includes("/profile")) {
      return "profile";
    }
    // Check for surveys tab (but not survey detail pages)
    if (pathname.includes("/surveys") && !pathname.includes("/survey-")) {
      return "surveys";
    }
    // Check for survey-related pages - highlight surveys tab
    if (pathname.includes("/survey-") || pathname.includes("/create-survey")) {
      return "surveys";
    }
    // Check for home/index - this should match when none of the above matched
    // and we're in the tabs section
    if (pathname === "/" || 
        pathname.includes("/index") || 
        pathname.endsWith("/(tabs)") || 
        pathname.endsWith("/(tabs)/")) {
      return "home";
    }
    // If we're in the researcher/(tabs) section but didn't match any specific tab,
    // it's likely the home/index route
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
      ["#FFFFFF", "#1E1E2E"]
    ),
    borderTopColor: interpolateColor(
      navBgColor.value,
      [0, 1],
      ["#E5E7EB", "#2D2D3E"]
    ),
  }));

  const getNavLabelColor = (isActive: boolean) => {
    if (isSightAIActive) {
      return isActive ? "#FFFFFF" : "#9CA3AF";
    }
    return isActive ? "#4A63D8" : "#9CA3AF";
  };

  const getIconColor = (isActive: boolean) => {
    if (isSightAIActive) {
      return isActive ? "#FFFFFF" : "#9CA3AF";
    }
    return isActive ? "#4A63D8" : "#9CA3AF";
  };

  const handleNavigation = (route: string) => {
    try {
      // Get the last segment of the route (e.g., "surveys", "profile", etc.)
      const routeSegment = route.split("/").filter(Boolean).pop() || "";
      
      // For home/index route (ends with "/" or "(tabs)"), check differently
      const isHomeRoute = route.endsWith("/(tabs)/") || route.endsWith("/(tabs)");
      
      if (isHomeRoute) {
        // Check if we're on the home/index page
        const isOnHome = pathname === "/" || 
                         pathname?.endsWith("/(tabs)") || 
                         pathname?.endsWith("/(tabs)/") ||
                         pathname?.endsWith("/index") ||
                         (pathname?.includes("/(tabs)") && !pathname?.includes("/surveys") && 
                          !pathname?.includes("/research") && !pathname?.includes("/profile") && 
                          !pathname?.includes("/sightai"));
        if (isOnHome) {
          return; // Already on home
        }
      } else if (routeSegment && pathname?.includes(`/${routeSegment}`)) {
        return; // Already on this route
      }
      
      // Use replace for tab navigation to avoid stacking
      router.replace(route as any);
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback: try push if replace fails
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
            activeTab === "home" && styles.navLabelActive,
            isSightAIActive && styles.navLabelDark,
            isSightAIActive && activeTab === "home" && styles.navLabelActiveDark,
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
          name={
            activeTab === "surveys"
              ? "document-text"
              : "document-text-outline"
          }
          size={24}
          color={getIconColor(activeTab === "surveys")}
        />
        <Text
          style={[
            styles.navLabel,
            activeTab === "surveys" && styles.navLabelActive,
            isSightAIActive && styles.navLabelDark,
            isSightAIActive && activeTab === "surveys" && styles.navLabelActiveDark,
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
            activeTab === "research" && styles.navLabelActive,
            isSightAIActive && styles.navLabelDark,
            isSightAIActive && activeTab === "research" && styles.navLabelActiveDark,
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
            activeTab === "profile" && styles.navLabelActive,
            isSightAIActive && styles.navLabelDark,
            isSightAIActive && activeTab === "profile" && styles.navLabelActiveDark,
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
  // Safe context access with default values
  const context = useContext(AnalysisContext);
  const isAnalyzing = context?.isAnalyzing ?? false;
  const isAnalysisComplete = context?.isAnalysisComplete ?? false;
  const shadowOpacity = useSharedValue(0);
  const shadowRadius = useSharedValue(0);
  const jellyScaleX = useSharedValue(1);
  const jellyScaleY = useSharedValue(1);
  const pressAnimationActive = useRef(false);
  // Track current animation state to prevent unnecessary restarts
  const currentAnimationState = useRef<'idle' | 'active' | 'analyzing' | 'completing' | null>(null);
  const analyzingAnimationActive = useRef(false);
  const previousIsAnalyzing = useRef(false);

  // Simplified restore function that smoothly fades into continuous animation
  const restoreContinuousAnimation = () => {
    if (!pressAnimationActive.current) return;
    
    // Clear any pending timeouts
    if ((pressAnimationActive as any).timeoutId) {
      clearTimeout((pressAnimationActive as any).timeoutId);
      (pressAnimationActive as any).timeoutId = null;
    }
    
    pressAnimationActive.current = false;
    
    // Cancel any ongoing animations
    cancelAnimation(jellyScaleX);
    cancelAnimation(jellyScaleY);
    cancelAnimation(shadowOpacity);
    cancelAnimation(shadowRadius);
    
    // Get fresh context values
    const currentContext = context;
    const currentIsAnalyzing = currentContext?.isAnalyzing ?? false;
    const currentIsAnalysisComplete = currentContext?.isAnalysisComplete ?? false;
    
    // Only restore if not analyzing or completing
    if (!currentIsAnalyzing && !currentIsAnalysisComplete) {
      // Smoothly fade from current state to the starting point of continuous animation
      // Then start the continuous animation seamlessly
      if (isFocused) {
        // Active idle animation - smoothly fade to starting point, then start loop
        const startX = 0.95;
        const startY = 1.05;
        
        // Smooth fade transition to starting point, then seamlessly start continuous loop
        jellyScaleX.value = withSequence(
          withTiming(startX, {
            duration: 350,
            easing: Easing.bezier(0.33, 0, 0.67, 1)
          }),
          withRepeat(
            withSequence(
              withTiming(0.95, {
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(1.05, {
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(1.0, {
                duration: 300,
                easing: Easing.bezier(0.33, 0, 0.67, 1),
              }),
              withTiming(0.95, {
                duration: 500,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              })
            ),
            -1,
            false
          )
        );
        jellyScaleY.value = withSequence(
          withTiming(startY, {
            duration: 350,
            easing: Easing.bezier(0.33, 0, 0.67, 1)
          }),
          withRepeat(
            withSequence(
              withTiming(1.05, {
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(0.95, {
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(1.0, {
                duration: 300,
                easing: Easing.bezier(0.33, 0, 0.67, 1),
              }),
              withTiming(1.05, {
                duration: 500,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              })
            ),
            -1,
            false
          )
        );
        
        // Smooth fade for glow as well
        shadowOpacity.value = withSequence(
          withTiming(0.4, {
            duration: 350,
            easing: Easing.bezier(0.33, 0, 0.67, 1)
          }),
          withRepeat(
            withSequence(
              withTiming(0.4, {
                duration: 1800,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(0.7, {
                duration: 1800,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(0.55, {
                duration: 300,
                easing: Easing.bezier(0.33, 0, 0.67, 1),
              }),
              withTiming(0.4, {
                duration: 500,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              })
            ),
            -1,
            false
          )
        );
        shadowRadius.value = withSequence(
          withTiming(18, {
            duration: 350,
            easing: Easing.bezier(0.33, 0, 0.67, 1)
          }),
          withRepeat(
            withSequence(
              withTiming(18, {
                duration: 1800,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(25, {
                duration: 1800,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(21.5, {
                duration: 300,
                easing: Easing.bezier(0.33, 0, 0.67, 1),
              }),
              withTiming(18, {
                duration: 500,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              })
            ),
            -1,
            false
          )
        );
      } else {
        // Idle animation - smoothly fade to starting point, then start loop
        const startX = 0.99;
        const startY = 1.01;
        
        jellyScaleX.value = withSequence(
          withTiming(startX, {
            duration: 350,
            easing: Easing.bezier(0.33, 0, 0.67, 1)
          }),
          withRepeat(
            withSequence(
              withTiming(0.99, {
                duration: 3000,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(1.01, {
                duration: 3000,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(1.0, {
                duration: 400,
                easing: Easing.bezier(0.33, 0, 0.67, 1),
              }),
              withTiming(0.99, {
                duration: 600,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              })
            ),
            -1,
            false
          )
        );
        jellyScaleY.value = withSequence(
          withTiming(startY, {
            duration: 350,
            easing: Easing.bezier(0.33, 0, 0.67, 1)
          }),
          withRepeat(
            withSequence(
              withTiming(1.01, {
                duration: 3000,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(0.99, {
                duration: 3000,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(1.0, {
                duration: 400,
                easing: Easing.bezier(0.33, 0, 0.67, 1),
              }),
              withTiming(1.01, {
                duration: 600,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              })
            ),
            -1,
            false
          )
        );
        shadowOpacity.value = withSequence(
          withTiming(0.1, {
            duration: 350,
            easing: Easing.bezier(0.33, 0, 0.67, 1)
          }),
          withRepeat(
            withSequence(
              withTiming(0.1, {
                duration: 3000,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(0.2, {
                duration: 3000,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(0.15, {
                duration: 400,
                easing: Easing.bezier(0.33, 0, 0.67, 1),
              }),
              withTiming(0.1, {
                duration: 600,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              })
            ),
            -1,
            false
          )
        );
        shadowRadius.value = withSequence(
          withTiming(8, {
            duration: 350,
            easing: Easing.bezier(0.33, 0, 0.67, 1)
          }),
          withRepeat(
            withSequence(
              withTiming(8, {
                duration: 3000,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(10, {
                duration: 3000,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              }),
              withTiming(9, {
                duration: 400,
                easing: Easing.bezier(0.33, 0, 0.67, 1),
              }),
              withTiming(8, {
                duration: 600,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
              })
            ),
            -1,
            false
          )
        );
      }
    }
  };

  useEffect(() => {
    // Skip if press animation is active
    if (pressAnimationActive.current) {
      return;
    }

    // Determine target animation state
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

    // If analyzing animation is already running and we're still analyzing, don't restart
    // This prevents the animation from breaking when isFocused changes during analysis
    if (targetState === 'analyzing' && 
        currentAnimationState.current === 'analyzing' && 
        analyzingAnimationActive.current &&
        previousIsAnalyzing.current === isAnalyzing) {
      return; // Already running, don't restart
    }

    // Update previous state tracking
    previousIsAnalyzing.current = isAnalyzing;

    // Only cancel and reset if we're transitioning to a different state
    const stateChanged = currentAnimationState.current !== targetState;
    
    if (stateChanged) {
      // Cancel all previous animations before starting new ones
      cancelAnimation(jellyScaleX);
      cancelAnimation(jellyScaleY);
      cancelAnimation(shadowOpacity);
      cancelAnimation(shadowRadius);

      // CRITICAL: Reset values to exactly 1.0 before starting any continuous animation
      // This ensures animations always start from a clean state
      jellyScaleX.value = 1;
      jellyScaleY.value = 1;
    } else {
      // State hasn't changed, don't restart animation
      return;
    }

    // Update current state
    currentAnimationState.current = targetState;

    // State priority: Completion > Analyzing > Active Idle > Idle
    if (isAnalysisComplete) {
      // 5. Completion: Bright shine animation
      shadowOpacity.value = withTiming(1.0, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
      shadowRadius.value = withTiming(50, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
      jellyScaleX.value = withSequence(
        withTiming(1.15, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, {
          duration: 400,
          easing: Easing.in(Easing.ease),
        })
      );
      jellyScaleY.value = withSequence(
        withTiming(1.15, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, {
          duration: 400,
          easing: Easing.in(Easing.ease),
        })
      );
      // After completion, transition will happen automatically when isAnalysisComplete becomes false
      analyzingAnimationActive.current = false;
    } else if (isAnalyzing) {
      // 4. Analyzing: Continuous pronounced jelly effect - smooth looping
      // Mark analyzing animation as active
      analyzingAnimationActive.current = true;
      
      jellyScaleX.value = withRepeat(
        withSequence(
          withTiming(0.90, {
            duration: 600,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(1.10, {
            duration: 600,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(1.0, {
            duration: 200,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(0.90, {
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );
      jellyScaleY.value = withRepeat(
        withSequence(
          withTiming(1.10, {
            duration: 600,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0.90, {
            duration: 600,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(1.0, {
            duration: 200,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(1.10, {
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );

      // Enhanced glow during analysis - smooth pulsing with fade
      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, {
            duration: 800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0.9, {
            duration: 800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0.75, {
            duration: 200,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(0.6, {
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );
      shadowRadius.value = withRepeat(
        withSequence(
          withTiming(25, {
            duration: 800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(40, {
            duration: 800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(32.5, {
            duration: 200,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(25, {
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );
      // Note: analyzingAnimationActive will be set to false when isAnalyzing becomes false
    } else if (isFocused) {
      // Clear analyzing flag when transitioning away from analyzing
      analyzingAnimationActive.current = false;
      // 2. Active Idle: Stronger, more pronounced breathing on SightAI pages
      jellyScaleX.value = withRepeat(
        withSequence(
          withTiming(0.95, {
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(1.05, {
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(1.0, {
            duration: 300,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(0.95, {
            duration: 500,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );
      jellyScaleY.value = withRepeat(
        withSequence(
          withTiming(1.05, {
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0.95, {
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(1.0, {
            duration: 300,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(1.05, {
            duration: 500,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );

      // Stronger glow pulse - smooth loop with fade
      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, {
            duration: 1800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0.7, {
            duration: 1800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0.55, {
            duration: 300,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(0.4, {
            duration: 500,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );
      shadowRadius.value = withRepeat(
        withSequence(
          withTiming(18, {
            duration: 1800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(25, {
            duration: 1800,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(21.5, {
            duration: 300,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(18, {
            duration: 500,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );
    } else {
      // Clear analyzing flag when transitioning away from analyzing
      analyzingAnimationActive.current = false;
      
      // 1. Idle: Minimal continuous breathing - more visible with fade
      jellyScaleX.value = withRepeat(
        withSequence(
          withTiming(0.99, {
            duration: 3000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(1.01, {
            duration: 3000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(1.0, {
            duration: 400,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(0.99, {
            duration: 600,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );
      jellyScaleY.value = withRepeat(
        withSequence(
          withTiming(1.01, {
            duration: 3000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0.99, {
            duration: 3000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(1.0, {
            duration: 400,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(1.01, {
            duration: 600,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );

      // Very subtle glow pulse - smooth loop with fade
      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.1, {
            duration: 3000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0.2, {
            duration: 3000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0.15, {
            duration: 400,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(0.1, {
            duration: 600,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );
      shadowRadius.value = withRepeat(
        withSequence(
          withTiming(8, {
            duration: 3000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(10, {
            duration: 3000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(9, {
            duration: 400,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
          withTiming(8, {
            duration: 600,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          })
        ),
        -1,
        false
      );
    }
  }, [isFocused, isAnalyzing, isAnalysisComplete]);

  // Separate effect to handle isAnalyzing changes independently
  // This ensures analyzing animation persists even when isFocused changes
  useEffect(() => {
    // Only handle transitions when isAnalyzing changes
    if (previousIsAnalyzing.current === isAnalyzing) {
      return; // No change, skip
    }

    // If isAnalyzing becomes false, clear the analyzing animation flag
    if (!isAnalyzing) {
      analyzingAnimationActive.current = false;
      previousIsAnalyzing.current = false;
    } else {
      previousIsAnalyzing.current = true;
    }
  }, [isAnalyzing]);

  const handlePress = () => {
    // Don't trigger if already animating or if analyzing
    if (pressAnimationActive.current || isAnalyzing || isAnalysisComplete) {
      return;
    }

    // 3. Press Feedback: Enhanced 5-step jelly effect with organic wobble
    pressAnimationActive.current = true;
    cancelAnimation(jellyScaleX);
    cancelAnimation(jellyScaleY);
    cancelAnimation(shadowOpacity);
    cancelAnimation(shadowRadius);

    // CRITICAL: Reset to 1.0 first to ensure clean starting state
    jellyScaleX.value = 1;
    jellyScaleY.value = 1;

    // Enhanced jelly effect: compress → expand → wobble → very gradual fluid settle
    // Pattern: 1.0 → 0.92 → 1.08 → 0.96 → 1.04 → 1.02 → 1.0
    // Using slower springs for bounce, then very smooth timing animations for fluid final settle
    jellyScaleX.value = withSequence(
      withSpring(0.92, { damping: 10, stiffness: 180 }), // Initial compress - slower
      withSpring(1.08, { damping: 9, stiffness: 150 }), // Expand - slower
      withSpring(0.96, { damping: 11, stiffness: 200 }), // Wobble back - slower
      withSpring(1.04, { damping: 12, stiffness: 220 }), // Wobble forward - slower
      withTiming(1.02, { 
        duration: 400, 
        easing: Easing.out(Easing.ease) 
      }), // First smooth step down - slower
      withTiming(1, { 
        duration: 600, 
        easing: Easing.bezier(0.33, 0, 0.67, 1) // Ultra-smooth, fluid final settle - slower
      })
    );
    jellyScaleY.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 180 }), // Initial expand (opposite) - slower
      withSpring(0.92, { damping: 9, stiffness: 150 }), // Compress - slower
      withSpring(1.04, { damping: 11, stiffness: 200 }), // Wobble forward - slower
      withSpring(0.96, { damping: 12, stiffness: 220 }), // Wobble back - slower
      withTiming(0.98, { 
        duration: 400, 
        easing: Easing.out(Easing.ease) 
      }), // First smooth step up - slower
      withTiming(1, { 
        duration: 600, 
        easing: Easing.bezier(0.33, 0, 0.67, 1) // Ultra-smooth, fluid final settle - slower
      })
    );

    // Trigger restore after animation completes
    // Total animation: ~600ms springs + 400ms first smooth step + 600ms final settle = ~1600ms
    const timeoutId = setTimeout(() => {
      // Double-check we should restore
      const currentContext = context;
      const currentIsAnalyzing = currentContext?.isAnalyzing ?? false;
      const currentIsAnalysisComplete = currentContext?.isAnalysisComplete ?? false;
      
      if (pressAnimationActive.current && !currentIsAnalyzing && !currentIsAnalysisComplete) {
        restoreContinuousAnimation();
      }
    }, 1700); // 1700ms to ensure all animation steps complete smoothly and fluidly
    
    // Store timeout for cleanup if needed
    (pressAnimationActive as any).timeoutId = timeoutId;

    // Enhanced bright glow flash
    shadowOpacity.value = withSequence(
      withTiming(0.95, {
        duration: 120,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(isFocused ? 0.7 : 0.2, {
        duration: 500,
        easing: Easing.in(Easing.ease),
      })
    );
    shadowRadius.value = withSequence(
      withTiming(40, {
        duration: 120,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(isFocused ? 25 : 10, {
        duration: 500,
        easing: Easing.in(Easing.ease),
      })
    );

    // Navigate to sightai if:
    // 1. Not currently focused on sightai page, OR
    // 2. On analysis-related pages (analysis-insights, analysis-loading, etc.)
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: "space-around",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
    width: "100%",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingTop: 5,
  },
  navLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#4A63D8",
  },
  navLabelDark: {
    color: "#9CA3AF",
  },
  navLabelActiveDark: {
    color: "#FFFFFF",
  },
  sightaiButtonContainer: {
    top: -5,
    alignItems: "center",
    justifyContent: "center",
  },
  glowContainer: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A63D8",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 10,
  },
  sightaiLogo: {
    width: 101,
    height: 101,
  },
});

