import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import React, { useContext, useState } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AuthContext from "@/context/AuthContext";
import UserInfo from "@/types/UserInfo";
import { login } from "@/api/auth";
import { storeToken, storeUser } from "@/api/storage";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { setIsAuthenticated } = useContext(AuthContext);
  const router = useRouter();

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
        console.log("Navigating to choose path");
        router.replace("/(protected)/choose-path" as any);
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

  const handleForgotPassword = () => {
    Alert.alert("Forgot Password", "Password reset functionality coming soon!");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.contentCard}>
        {/* Decorative Circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />

        <View style={styles.content}>
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>
            Log in to continue your SIGHT experience.
          </Text>

          <View style={styles.form}>
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
                placeholder="ali@example.com"
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
              style={styles.forgotPasswordLink}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

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
                  style={styles.createAccountLink}
                  onPress={() => router.navigate("/(auth)/register")}
                >
                  Create one
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F2937",
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(96, 165, 250, 0.15)",
    top: -40,
    right: -40,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(96, 165, 250, 0.12)",
    top: 60,
    left: -30,
  },
  decorativeCircle3: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    bottom: 40,
    left: -20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "left",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 32,
    textAlign: "left",
  },
  form: {
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
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "500",
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
  createAccountLink: {
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
