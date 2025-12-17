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
const CARD_WIDTH = SCREEN_WIDTH * 0.5; // Smaller cards - 50% of screen width

const CAROUSEL_CARDS = [
  {
    number: "1",
    title: "Real-time Data",
    description: "Get instant insights from your survey responses as they come in.",
  },
  {
    number: "2",
    title: "Advanced Analytics",
    description: "Powerful data visualizations that reveal patterns and trends.",
  },
  {
    number: "3",
    title: "Secure Insights",
    description: "Your data is protected with enterprise-grade security measures.",
  },
  {
    number: "4",
    title: "Customizable Reports",
    description: "Create and customize reports tailored to your specific needs.",
  },
];

export default function Index() {
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
          const nextIndex = (prevIndex + 1) % CAROUSEL_CARDS.length;
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
    if (index !== currentCardIndex && index >= 0 && index < CAROUSEL_CARDS.length) {
      setCurrentCardIndex(index);
      // Reset auto-slide timer when user manually swipes
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
      autoSlideTimerRef.current = setInterval(() => {
        setCurrentCardIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % CAROUSEL_CARDS.length;
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // If authenticated, redirect to protected routes
  if (isAuthenticated) {
    return <Redirect href={"/(protected)/(researcher)/(tabs)/" as any} />;
  }

  return (
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
          {/* Decorative Circles */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />

          {/* Branding Section */}
          <View style={styles.brandingSection}>
            {/* Small decorative circle above logo */}
            <View style={styles.smallDecorativeCircle} />
            
            {/* Main Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Tagline */}
            <Text style={styles.tagline}>See insights clearly.</Text>
          </View>

          {/* Carousel Section */}
          <View style={styles.carouselSection}>
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
              {CAROUSEL_CARDS.map((card, index) => (
                <View key={index} style={styles.carouselCardWrapper}>
                  <View style={[styles.carouselCard, { width: CARD_WIDTH }]}>
                    <View style={styles.cardPlaceholderContainer}>
                      <Text style={styles.cardPlaceholder}>Placeholder</Text>
                    </View>
                    <Text style={styles.cardNumber}>{card.number}.</Text>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Carousel Indicators */}
            <View style={styles.indicatorsContainer}>
              {CAROUSEL_CARDS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentCardIndex && styles.indicatorActive,
                  ]}
                >
                  {index === currentCardIndex && (
                    <LinearGradient
                      colors={["#60A5FA", "#34D399"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.indicatorGradient}
                    />
                  )}
                </View>
              ))}
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
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
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
                    color="#6B7280"
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
                colors={["#60A5FA", "#34D399"]}
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
                  Sign up
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    position: "relative",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    top: 40,
    left: -40,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(96, 165, 250, 0.08)",
    top: 200,
    right: -20,
  },
  decorativeCircle3: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(96, 165, 250, 0.06)",
    bottom: 100,
    left: -30,
  },
  brandingSection: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  smallDecorativeCircle: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(96, 165, 250, 0.12)",
    top: -10,
    right: SCREEN_WIDTH / 2 - 30,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  logo: {
    width: 160,
    height: 160,
  },
  appName: {
    fontSize: 48,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 20,
    color: "#6B7280",
    fontWeight: "700",
  },
  carouselSection: {
    marginBottom: 32,
    alignItems: "center",
  },
  carouselScrollView: {
    marginBottom: 16,
    width: SCREEN_WIDTH,
  },
  carouselContent: {
    alignItems: "center",
  },
  carouselCardWrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselCard: {
    backgroundColor: "rgba(96, 165, 250, 0.08)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  cardPlaceholderContainer: {
    marginBottom: 12,
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  cardPlaceholder: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
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
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  indicatorActive: {
    borderWidth: 0,
    width: 24,
  },
  indicatorGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  formSection: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    borderColor: "#E5E7EB",
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
    borderRadius: 24,
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
    color: "#6B7280",
  },
  signUpLink: {
    color: "#3B82F6",
    fontWeight: "500",
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
