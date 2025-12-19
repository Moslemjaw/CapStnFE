import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import React, { useContext, useState, useRef, useEffect } from "react";
import { Redirect, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AuthContext from "@/context/AuthContext";
import UserInfo from "@/types/UserInfo";
import { login } from "@/api/auth";
import { storeToken, storeUser } from "@/api/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURE_CARDS = [
  {
    icon: "trophy-outline",
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

  const { isAuthenticated, isLoading, setIsAuthenticated } = useContext(AuthContext);
  const router = useRouter();

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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <LinearGradient
        colors={["#EEF5FF", "#F9F6FE"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#4A63D8" />
      </LinearGradient>
    );
  }

  // If authenticated, redirect to protected routes
  if (isAuthenticated) {
    return <Redirect href={"/(protected)/(researcher)/(tabs)/" as any} />;
  }

  return (
    <LinearGradient
      colors={["#EEF5FF", "#F9F6FE"]}
      style={styles.gradientContainer}
    >
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentContainer}>
          {/* Branding Section */}
          <View style={styles.brandingSection}>
            {/* Main Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/logo.png")}
                style={styles.logo}
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
              <TextInput
                style={styles.input}
                  placeholder="example@sight.ai"
                  placeholderTextColor="#969696"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                    placeholderTextColor="#969696"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                      color="#969696"
                  />
                </TouchableOpacity>
              </View>
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
      </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "center",
  },
  brandingSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
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
    marginBottom: 40,
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
    paddingVertical: 24,
    backgroundColor: "rgba(238, 245, 255, 0.3)",
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    marginBottom: 16,
  },
  featureHeadline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
    marginBottom: 12,
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
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCDCDC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCDCDC",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
