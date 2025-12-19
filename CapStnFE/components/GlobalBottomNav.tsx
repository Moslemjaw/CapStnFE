import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image, View, StyleSheet, Pressable, Text } from "react-native";
import { useEffect, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

export default function GlobalBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Determine which tab is active based on pathname
  const getActiveTab = () => {
    if (!pathname) return null;
    
    // Check for specific tab routes first
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
    // Default to home for index or root tabs
    if (pathname.includes("/index") || pathname.endsWith("/(tabs)") || pathname.endsWith("/(tabs)/")) {
      return "home";
    }
    // Default to home if we're in the researcher section but no specific match
    if (pathname.includes("/(researcher)")) {
      return "home";
    }
    return null;
  };

  const activeTab = getActiveTab();
  const isSightAIActive = activeTab === "sightai";

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    <View
      style={[
        styles.bottomNav,
        {
          paddingBottom: Math.max(insets.bottom, 5),
          height: 60 + Math.max(insets.bottom, 5),
        },
      ]}
    >
      <Pressable
        style={styles.navItem}
        onPress={() => handleNavigation("/(protected)/(researcher)/(tabs)/index")}
      >
        <Ionicons
          name={activeTab === "home" ? "home" : "home-outline"}
          size={24}
          color={activeTab === "home" ? "#4A63D8" : "#9CA3AF"}
        />
        <Text
          style={[
            styles.navLabel,
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
          name={
            activeTab === "surveys"
              ? "document-text"
              : "document-text-outline"
          }
          size={24}
          color={activeTab === "surveys" ? "#4A63D8" : "#9CA3AF"}
        />
        <Text
          style={[
            styles.navLabel,
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
          name={activeTab === "research" ? "bulb" : "bulb-outline"}
          size={24}
          color={activeTab === "research" ? "#4A63D8" : "#9CA3AF"}
        />
        <Text
          style={[
            styles.navLabel,
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
          color={activeTab === "profile" ? "#4A63D8" : "#9CA3AF"}
        />
        <Text
          style={[
            styles.navLabel,
            activeTab === "profile" && styles.navLabelActive,
          ]}
        >
          Profile
        </Text>
      </Pressable>
    </View>
  );
}

function AnimatedSightAILogo({ isFocused }: { isFocused: boolean }) {
  const router = useRouter();
  const shadowOpacity = useSharedValue(0);
  const shadowRadius = useSharedValue(0);
  const jellyScaleX = useSharedValue(1);
  const jellyScaleY = useSharedValue(1);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const glowIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerGlow = () => {
    shadowOpacity.value = withTiming(0.6, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
    shadowRadius.value = withTiming(25, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });

    const timeout = setTimeout(() => {
      shadowOpacity.value = withTiming(0, {
        duration: 1200,
        easing: Easing.in(Easing.ease),
      });
      shadowRadius.value = withTiming(0, {
        duration: 1200,
        easing: Easing.in(Easing.ease),
      });
    }, 800);
    timeoutsRef.current.push(timeout);
  };

  const triggerJellyEffect = (
    isStrong = false,
    addToRef = true,
    immediate = false
  ) => {
    const scale1 = isStrong ? 0.75 : 0.95;
    const scale2 = isStrong ? 1.3 : 1.05;
    const damping = isStrong ? 5 : 8;
    const stiffness = isStrong ? 120 : 200;

    jellyScaleX.value = withSpring(scale1, {
      damping,
      stiffness,
    });
    jellyScaleY.value = withSpring(scale2, {
      damping,
      stiffness,
    });

    if (immediate) {
      setTimeout(() => {
        jellyScaleX.value = withSpring(scale2, {
          damping,
          stiffness,
        });
        jellyScaleY.value = withSpring(scale1, {
          damping,
          stiffness,
        });

        setTimeout(() => {
          jellyScaleX.value = withSpring(1, {
            damping: isStrong ? 8 : 10,
            stiffness: isStrong ? 250 : 300,
          });
          jellyScaleY.value = withSpring(1, {
            damping: isStrong ? 8 : 10,
            stiffness: isStrong ? 250 : 300,
          });
        }, 50);
      }, 10);
    } else {
      const timeout1 = setTimeout(() => {
        jellyScaleX.value = withSpring(scale2, {
          damping,
          stiffness,
        });
        jellyScaleY.value = withSpring(scale1, {
          damping,
          stiffness,
        });
      }, 100);
      if (addToRef) {
        timeoutsRef.current.push(timeout1);
      }

      const timeout2 = setTimeout(() => {
        jellyScaleX.value = withSpring(1, {
          damping: isStrong ? 8 : 10,
          stiffness: isStrong ? 250 : 300,
        });
        jellyScaleY.value = withSpring(1, {
          damping: isStrong ? 8 : 10,
          stiffness: isStrong ? 250 : 300,
        });
      }, 200);
      if (addToRef) {
        timeoutsRef.current.push(timeout2);
      }
    }
  };

  const triggerCombinedEffect = (isStrong = false) => {
    triggerJellyEffect(isStrong);
    triggerGlow();
  };

  useEffect(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (glowIntervalRef.current) {
      clearInterval(glowIntervalRef.current);
      glowIntervalRef.current = null;
    }

    if (!isFocused) {
      shadowOpacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });
      shadowRadius.value = withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });

      const schedule1 = setTimeout(() => triggerCombinedEffect(false), 5000);
      timeoutsRef.current.push(schedule1);

      const schedule2 = setTimeout(() => triggerCombinedEffect(false), 10000);
      timeoutsRef.current.push(schedule2);

      const schedule3 = setTimeout(() => triggerCombinedEffect(false), 35000);
      timeoutsRef.current.push(schedule3);

      intervalRef.current = setInterval(() => {
        triggerCombinedEffect(false);
      }, 60000);
    } else {
      jellyScaleX.value = 1;
      jellyScaleY.value = 1;
      triggerJellyEffect(true, false, true);

      shadowOpacity.value = withTiming(0.4, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
      shadowRadius.value = withTiming(15, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });

      glowIntervalRef.current = setInterval(() => {
        shadowOpacity.value = withTiming(0.7, {
          duration: 600,
          easing: Easing.out(Easing.ease),
        });
        shadowRadius.value = withTiming(25, {
          duration: 600,
          easing: Easing.out(Easing.ease),
        });

        setTimeout(() => {
          shadowOpacity.value = withTiming(0.4, {
            duration: 1000,
            easing: Easing.in(Easing.ease),
          });
          shadowRadius.value = withTiming(15, {
            duration: 1000,
            easing: Easing.in(Easing.ease),
          });
        }, 600);
      }, 13000);
    }

    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current = [];
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (glowIntervalRef.current) {
        clearInterval(glowIntervalRef.current);
        glowIntervalRef.current = null;
      }
    };
  }, [isFocused]);

  const handlePress = () => {
    triggerJellyEffect(true, false, true);
    triggerGlow();

    if (!isFocused) {
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
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
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

