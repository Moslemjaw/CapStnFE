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
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURE_CARDS = [
  {
    icon: "trophy-outline",
    headline: "Earn rewards for insights",
    body: "Complete surveys and accumulate points",
  },
  {
    icon: "analytics-outline",
    headline: "Discover who you are",
    body: "AI-powered analysis reveals patterns",
  },
  {
    icon: "create-outline",
    headline: "Design surveys in minutes",
    body: "Intuitive tools for researchers",
  },
  {
    icon: "sparkles-outline",
    headline: "Powered by SightAI",
    body: "Advanced validation and insights",
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

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    if (index !== currentCardIndex && index >= 0 && index < FEATURE_CARDS.length) {
      setCurrentCardIndex(index);
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
      if (data?.token) {
        await storeToken(data.token);
        if (data?.user) {
          const normalizedUser = {
            ...data.user,
            _id: data.user.id || data.user._id,
          };
          await storeUser(normalizedUser);
        }
        setIsAuthenticated(true);
        router.replace("/(protected)/(researcher)/(tabs)/" as any);
      } else {
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

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient
          colors={[Colors.background.secondary, Colors.surface.purpleTint]}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color={Colors.primary.blue} />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={"/(protected)/(researcher)/(tabs)/" as any} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[Colors.background.secondary, Colors.surface.purpleTint]}
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
        >
            <View style={styles.contentContainer}>
              {/* Branding Section */}
              <View style={styles.brandingSection}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require("@/assets/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
                <Image
                  source={require("@/assets/title.png")}
                  style={styles.appTitle}
                  resizeMode="contain"
                />
              </View>

              {/* Feature Carousel */}
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
                        <View style={styles.featureIconContainer}>
                          <Ionicons
                            name={card.icon as any}
                            size={28}
                            color={Colors.primary.blue}
                          />
                        </View>
                        <Text style={styles.featureHeadline}>{card.headline}</Text>
                        <Text style={styles.featureBody}>{card.body}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Pagination Dots */}
                <View style={styles.indicatorsContainer}>
                  {FEATURE_CARDS.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        index === currentCardIndex && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Login Form */}
              <View style={styles.formSection}>
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color={Colors.semantic.error} />
                    <Text style={styles.errorText}>
                      {error?.response?.data?.message ||
                        error?.message ||
                        "Login failed. Please try again."}
                    </Text>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color={Colors.text.tertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={Colors.text.tertiary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      key="username"

                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={Colors.text.tertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.text.tertiary}
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
                        size={20}
                        color={Colors.text.tertiary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isPending || !email || !password}
                  activeOpacity={0.8}
                  style={styles.loginButtonWrapper}
                >
                  <LinearGradient
                    colors={
                      isPending || !email || !password
                        ? [Colors.text.tertiary, Colors.text.tertiary]
                        : [Colors.accent.sky, Colors.primary.blue]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginButton}
                  >
                    {isPending ? (
                      <ActivityIndicator size="small" color={Colors.text.inverse} />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.bottomLinkContainer}>
                  <Text style={styles.bottomLinkText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.navigate("/(auth)/register")}>
                    <Text style={styles.signUpLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
        </KeyboardAwareScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    justifyContent: "center",
  },
  brandingSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 180,
    height: 180,
  },
  appTitle: {
    height: 32,
    width: 120,
  },
  featureSection: {
    marginBottom: Spacing.xxl,
    alignItems: "center",
  },
  carouselScrollView: {
    width: SCREEN_WIDTH,
    marginBottom: Spacing.md,
  },
  carouselContent: {
    alignItems: "center",
  },
  featureCardWrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  featureCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    width: "100%",
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface.blueTint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  featureHeadline: {
    ...Typography.styles.h5,
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  featureBody: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border.default,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: Colors.primary.blue,
  },
  formSection: {
    width: "100%",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.semantic.errorLight,
    borderRadius: Borders.radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  errorText: {
    ...Typography.styles.bodySmall,
    color: Colors.semantic.error,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.styles.label,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.primary,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: Borders.radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputContainerFocused: {
    borderColor: Colors.primary.blue,
    ...Shadows.xs,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.styles.body,
    color: Colors.text.primary,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  loginButtonWrapper: {
    marginTop: Spacing.lg,
    borderRadius: Borders.radius.md,
    overflow: "hidden",
    ...Shadows.primary,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md + 2,
    gap: Spacing.xs,
  },
  loginButtonText: {
    ...Typography.styles.button,
    color: Colors.text.inverse,
  },
  bottomLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  bottomLinkText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  signUpLink: {
    ...Typography.styles.body,
    color: Colors.primary.blue,
    fontWeight: "600",
  },
});
