import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  Easing,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useContext, useState, useRef, useEffect } from "react";
import { Redirect, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthContext from "@/context/AuthContext";
import UserInfo from "@/types/UserInfo";
import { login } from "@/api/auth";
import { storeToken, storeUser } from "@/api/storage";
import { FadeInView } from "@/components/FadeInView";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURE_CARDS = [
  {
    icon: "medal-outline",
    headline: "Answer surveys. Earn points.",
    body: "Earn points for every question you answer",
  },
  {
    icon: "analytics-outline",
    headline: "Know yourself better",
    body: "Gain insights about who you are",
  },
  {
    icon: "create-outline",
    headline: "Create surveys in minutes",
    body: "Design and publish quickly",
  },
  {
    icon: "shield-checkmark-outline",
    headline: "Powered by sightAI",
    body: "Validates surveys and responses",
  },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { isAuthenticated, isLoading, setIsAuthenticated } = useContext(AuthContext);
  const router = useRouter();

  // Logo rotation and pulse animation
  useEffect(() => {
    const rotationDuration = 210000; // 3.5 minutes = 210,000 milliseconds
    
    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: rotationDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse every 12 seconds
    const createPulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(11000), // Wait 11 seconds before next pulse (total 12 seconds)
      ]).start(() => {
        createPulse(); // Loop the pulse
      });
    };

    createPulse();
  }, []);

  // Auto-slide carousel every 5 seconds
  useEffect(() => {
    const startAutoSlide = () => {
      autoSlideTimerRef.current = setInterval(() => {
        setCurrentCardIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % FEATURE_CARDS.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * SCREEN_WIDTH,
            animated: true,
          });
          return nextIndex;
        });
      }, 5000);
    };

    startAutoSlide();

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, []);

  // Handle scroll events to update current index
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    if (index !== currentCardIndex && index >= 0 && index < FEATURE_CARDS.length) {
      setCurrentCardIndex(index);
      // Reset auto-slide timer when user manually swipes
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
      autoSlideTimerRef.current = setInterval(() => {
        setCurrentCardIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % FEATURE_CARDS.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * SCREEN_WIDTH,
            animated: true,
          });
          return nextIndex;
        });
      }, 5000);
    }
  };

  const { mutate, isPending, error } = useMutation({
    mutationKey: ["Login"],
    mutationFn: (userInfo: UserInfo) => login(userInfo),
    onSuccess: async (data) => {
      console.log("Login success, data:", data);
      if (data?.token) {
        console.log("data.token", data.token);
        await storeToken(data.token);
        // Store user data if available (normalize id to _id)
        if (data?.user) {
          const normalizedUser = {
            ...data.user,
            _id: data.user.id || data.user._id,
          };
          await storeUser(normalizedUser);
        }
        console.log("Token stored, setting authenticated to true");
        setIsAuthenticated(true);
        console.log("Navigating to researcher dashboard");
        router.replace("/(protected)/(researcher)/(tabs)/" as any);
      } else {
        console.log("No token in response:", data);
        Alert.alert("Error", "Invalid response from server");
      }
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please check your credentials and try again.";
      Alert.alert("Login Error", errorMessage);
    },
  });

  const handleLogin = () => {
    if (email && password) {
      mutate({ email, password });
    }
  };


  // If authenticated, redirect to protected routes
  if (isAuthenticated) {
    return <Redirect href={"/(protected)/(researcher)/(tabs)/" as any} />;
  }

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.safeArea}>
    <LinearGradient
      colors={["#EEF5FF", "#F9F6FE"]}
      style={styles.gradientContainer}
    >
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={Platform.OS === "ios" ? 20 : 100}
      extraHeight={120}
      scrollEnabled={false}
    >
        <View style={styles.contentContainer}>
          {/* Branding Section */}
          <View style={styles.brandingSection}>
            {/* Main Logo */}
            <View style={styles.logoContainer}>
              <Animated.Image
                source={require("@/assets/logo.png")}
                style={[
                  styles.logo,
                  {
                    transform: [
                      {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                      {
                        scale: pulseAnim,
                      },
                    ],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.02],
                      outputRange: [1, 0.98],
                    }),
                  },
                ]}
                resizeMode="contain"
              />
            </View>

              {/* Title */}
              <Image
                source={require("@/assets/title.png")}
                style={styles.appTitle}
                resizeMode="contain"
              />
          </View>

            {/* Feature Callout Section */}
            <View style={styles.featureSection}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
              style={styles.carouselScrollView}
              contentContainerStyle={styles.carouselContent}
            >
                {FEATURE_CARDS.map((card, index) => (
                  <View key={index} style={styles.featureCardWrapper}>
                    <View style={styles.featureCard}>
                      <Ionicons
                        name={card.icon as any}
                        size={32}
                        color="#4A63D8"
                        style={styles.icon}
                      />
                      <Text style={styles.featureHeadline}>{card.headline}</Text>
                      <Text style={styles.featureBody}>{card.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

              {/* Pagination Dots */}
            <View style={styles.indicatorsContainer}>
                {FEATURE_CARDS.map((_, index) => {
                  const isActive = index === currentCardIndex;
                  
                  return (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                        isActive && styles.indicatorActive,
                  ]}
                    />
                  );
                })}
            </View>
          </View>

          {/* Login Form Section */}
          <View style={styles.formSection}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {error?.response?.data?.message ||
                    error?.message ||
                    "Login failed. Please try again."}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons 
                name="mail-outline" 
                size={19} 
                color="#9A9A9A"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9A9A9A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons 
                name="lock-closed-outline" 
                size={19} 
                color="#9A9A9A"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9A9A9A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color="#9A9A9A"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isPending}
              activeOpacity={0.8}
            >
              <LinearGradient
                  colors={["#5FA9F5", "#4A63D8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.loginButton,
                  isPending && styles.loginButtonDisabled,
                ]}
              >
                <Text style={styles.loginButtonText}>
                  {isPending ? "Signing In..." : "Log In"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.bottomLinkContainer}>
              <Text style={styles.bottomLinkText}>
                Don't have an account?{" "}
                <Text
                  style={styles.signUpLink}
                  onPress={() => router.navigate("/(auth)/register")}
                >
                    Sign Up
                </Text>
              </Text>
            </View>
          </View>
        </View>
    </KeyboardAwareScrollView>
    </LinearGradient>
    </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 53,
    paddingBottom: 35,
    justifyContent: "center",
  },
  brandingSection: {
    alignItems: "center",
    marginBottom: 26,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  logo: {
    width: 210,
    height: 210,
  },
  appTitle: {
    height: 30,
    width: 120,
    paddingHorizontal: 8,
    marginTop: 12,
  },
  featureSection: {
    marginBottom: 35,
    marginTop: -20,
    alignItems: "center",
  },
  carouselScrollView: {
    marginBottom: 16,
    width: SCREEN_WIDTH,
  },
  carouselContent: {
    alignItems: "center",
  },
  featureCardWrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 21,
    marginHorizontal: 20,
  },
  icon: {
    marginBottom: 14,
    alignSelf: "center",
  },
  featureHeadline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
    marginBottom: 11,
  },
  featureBody: {
    fontSize: 16,
    color: "#505050",
    textAlign: "center",
    lineHeight: 24,
  },
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C8C8C8",
  },
  indicatorActive: {
    backgroundColor: "#4A63D8",
  },
  formSection: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 11.4,
    paddingHorizontal: 14.44,
    marginBottom: 15.2,
  },
  inputIcon: {
    marginRight: 11.4,
  },
  input: {
    flex: 1,
    paddingVertical: 10 * 1.03 * 1.05 * 1.1,
    fontSize: 15 * 0.95 * 0.95 * 1.1 * 1.1 * 1.15,
    lineHeight: 15 * 0.95 * 0.95 * 1.1 * 1.1 * 1.15 * 1.2,
    color: "#1A1A1A",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  eyeButton: {
    padding: 7.6,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  bottomLinkContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  bottomLinkText: {
    fontSize: 14,
    color: "#969696",
  },
  signUpLink: {
    color: "#4A63D8",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
});
