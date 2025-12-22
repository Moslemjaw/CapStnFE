import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useContext, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AuthContext from "@/context/AuthContext";
import { register } from "@/api/auth";
import { storeToken, storeUser } from "@/api/storage";
import { Colors, Typography, Spacing, Borders, Shadows } from "@/constants/design";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [confirmPasswordBlurred, setConfirmPasswordBlurred] = useState(false);
  
  const router = useRouter();
  const { setIsAuthenticated } = useContext(AuthContext);

  const { mutate, isPending, error } = useMutation({
    mutationKey: ["register"],
    mutationFn: () => register({ email, password }, image || "", name),
    onSuccess: async (data) => {
      await storeToken(data.token);
      if (data?.user) {
        const normalizedUser = {
          ...data.user,
          _id: data.user.id || data.user._id,
        };
        await storeUser(normalizedUser);
      }
      setIsAuthenticated(true);
      router.replace("/(protected)/tutorial" as any);
    },
    onError: (error: any) => {
      console.error("Register error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed. Please try again.";
      Alert.alert("Registration Error", errorMessage);
    },
  });

  const handleRegistration = () => {
    if (!email || !password || !name) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match. Please try again.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Validation Error", "Password must be at least 8 characters long.");
      return;
    }
    if (!agreedToTerms) {
      Alert.alert("Agreement Required", "Please agree to the Terms & Conditions and Privacy Policy to continue.");
      return;
    }
    mutate();
  };

  const pickImage = async () => {
    try {
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (libraryStatus !== "granted") {
        Alert.alert("Permission Required", "We need access to your photos to set a profile picture.");
        return;
      }

      Alert.alert("Select Profile Picture", "Choose an option", [
        {
          text: "Camera",
          onPress: async () => {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus !== "granted") {
              Alert.alert("Permission Required", "We need access to your camera to take a profile picture.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setImage(result.assets[0].uri);
            }
          },
        },
        {
          text: "Photo Library",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setImage(result.assets[0].uri);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const isFormValid = name && email && password && confirmPassword && password === confirmPassword && password.length >= 8 && agreedToTerms;

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
          scrollEnabled={true}
        >
            <View style={styles.content}>
              {/* Branding Section */}
              <View style={styles.brandingSection}>
                <View style={styles.logoContainer}>
                  <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
                </View>
                <View style={styles.titleRow}>
                  <Text style={styles.joinText}>Join </Text>
                  <Image source={require("@/assets/title.png")} style={styles.titleImage} resizeMode="contain" />
                </View>
              </View>

              {/* Profile Avatar */}
              <View style={styles.avatarSection}>
                <TouchableOpacity style={styles.avatarButton} onPress={pickImage} activeOpacity={0.8}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.avatarImage} />
                  ) : (
                    <LinearGradient
                      colors={[Colors.surface.blueTint, Colors.surface.purpleTint]}
                      style={styles.avatarPlaceholder}
                    >
                      <Ionicons name="person-outline" size={40} color={Colors.primary.purple} />
                    </LinearGradient>
                  )}
                  <View style={styles.cameraButton}>
                    <Ionicons name="camera" size={16} color={Colors.text.inverse} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.optionalText}>Tap to add photo (optional)</Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color={Colors.semantic.error} />
                    <Text style={styles.errorText}>
                      {error?.response?.data?.message || error?.message || "Registration failed. Please try again."}
                    </Text>
                  </View>
                )}

                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={19} color={Colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your full name"
                      placeholderTextColor={Colors.text.tertiary}
                      value={name}
                      onChangeText={setName}


                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={19} color={Colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={Colors.text.tertiary}
                      value={email}
                      onChangeText={setEmail}


                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={19} color={Colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Create a password"
                      placeholderTextColor={Colors.text.tertiary}
                      value={password}
                      onChangeText={setPassword}


                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                  </View>
                  {password.length > 0 && password.length < 8 && (
                    <View style={styles.validationRow}>
                      <Ionicons name="close-circle" size={14} color={Colors.semantic.error} />
                      <Text style={styles.errorValidationText}>At least 8 characters required</Text>
                    </View>
                  )}
                  {password.length >= 8 && (
                    <View style={styles.validationRow}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.semantic.success} />
                      <Text style={styles.successValidationText}>Password meets requirements</Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={19} color={Colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Retype your password"
                      placeholderTextColor={Colors.text.tertiary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}

                      onBlur={() => setConfirmPasswordBlurred(true)}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                      <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={19} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                  </View>
                  {confirmPasswordBlurred && password !== confirmPassword && confirmPassword.length > 0 && (
                    <View style={styles.validationRow}>
                      <Ionicons name="close-circle" size={14} color={Colors.semantic.error} />
                      <Text style={styles.errorValidationText}>Passwords do not match</Text>
                    </View>
                  )}
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <View style={styles.validationRow}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.semantic.success} />
                      <Text style={styles.successValidationText}>Passwords match</Text>
                    </View>
                  )}
                </View>

                {/* Terms Agreement */}
                <View style={styles.agreementContainer}>
                  <TouchableOpacity
                    style={styles.checkboxButton}
                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                      {agreedToTerms && <Ionicons name="checkmark" size={14} color={Colors.text.inverse} />}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.agreementText}>
                    I agree to the{" "}
                    <Text style={styles.linkText} onPress={() => setShowTermsModal(true)}>Terms & Conditions</Text>
                    {" "}and{" "}
                    <Text style={styles.linkText} onPress={() => setShowPrivacyModal(true)}>Privacy Policy</Text>
                  </Text>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  onPress={handleRegistration}
                  disabled={isPending || !isFormValid}
                  activeOpacity={0.8}
                  style={styles.signUpButtonWrapper}
                >
                  <LinearGradient
                    colors={isPending || !isFormValid ? [Colors.text.tertiary, Colors.text.tertiary] : [Colors.accent.sky, Colors.primary.blue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.signUpButton}
                  >
                    <Text style={styles.signUpButtonText}>
                      {isPending ? "Creating Account..." : "Create Account"}
                    </Text>
                    {!isPending && <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} />}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.bottomLinkContainer}>
                  <Text style={styles.bottomLinkText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.navigate("/(auth)/login")}>
                    <Text style={styles.loginLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
        </KeyboardAwareScrollView>

        {/* Terms Modal */}
        <Modal visible={showTermsModal} transparent animationType="slide" onRequestClose={() => setShowTermsModal(false)}>
          <SafeAreaView style={styles.modalContainer}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowTermsModal(false)}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalDragIndicator} />
                  <Text style={styles.modalTitle}>Terms & Conditions</Text>
                  <TouchableOpacity onPress={() => setShowTermsModal(false)} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={24} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={true}>
                  <Text style={styles.modalSectionTitle}>1. Acceptance of Terms</Text>
                  <Text style={styles.modalText}>By accessing and using SIGHT, you agree to be bound by these Terms & Conditions.</Text>
                  <Text style={styles.modalSectionTitle}>2. User Accounts</Text>
                  <Text style={styles.modalText}>You are responsible for maintaining the confidentiality of your account credentials.</Text>
                  <Text style={styles.modalSectionTitle}>3. Survey Creation & Responses</Text>
                  <Text style={styles.modalText}>All survey content must be legal, ethical, and not violate anyone's rights.</Text>
                  <Text style={styles.modalSectionTitle}>4. Points & Rewards</Text>
                  <Text style={styles.modalText}>Points are non-transferable and non-refundable.</Text>
                  <Text style={styles.modalSectionTitle}>5. AI Analysis</Text>
                  <Text style={styles.modalText}>Analysis is provided "as is" and should be used as a research tool.</Text>
                  <Text style={styles.modalFooterText}>Last Updated: {new Date().toLocaleDateString()}</Text>
                </ScrollView>
              </Pressable>
            </Pressable>
          </SafeAreaView>
        </Modal>

        {/* Privacy Modal */}
        <Modal visible={showPrivacyModal} transparent animationType="slide" onRequestClose={() => setShowPrivacyModal(false)}>
          <SafeAreaView style={styles.modalContainer}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowPrivacyModal(false)}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalDragIndicator} />
                  <Text style={styles.modalTitle}>Privacy Policy</Text>
                  <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={24} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={true}>
                  <Text style={styles.modalSectionTitle}>1. Introduction</Text>
                  <Text style={styles.modalText}>At SIGHT, we take your privacy seriously.</Text>
                  <Text style={styles.modalSectionTitle}>2. Information We Collect</Text>
                  <Text style={styles.modalText}>We collect information you provide directly: name, email, profile images, and survey responses.</Text>
                  <Text style={styles.modalSectionTitle}>3. How We Use Your Information</Text>
                  <Text style={styles.modalText}>We use your data to provide and improve our services.</Text>
                  <Text style={styles.modalSectionTitle}>4. Data Security</Text>
                  <Text style={styles.modalText}>Your data is stored securely using industry-standard encryption.</Text>
                  <Text style={styles.modalSectionTitle}>5. Your Rights</Text>
                  <Text style={styles.modalText}>You have the right to access, update, and delete your data.</Text>
                  <Text style={styles.modalFooterText}>Last Updated: {new Date().toLocaleDateString()}</Text>
                </ScrollView>
              </Pressable>
            </Pressable>
          </SafeAreaView>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingTop: 21,
    paddingBottom: 21,
  },
  brandingSection: {
    alignItems: "center",
    marginBottom: 18,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 11,
  },
  logo: {
    width: 100,
    height: 100,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  joinText: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
  },
  titleImage: {
    height: 34,
    width: 100,
    marginTop: 2,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 21,
  },
  avatarButton: {
    position: "relative",
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.blue,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },
  optionalText: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    marginTop: 7,
  },
  form: {
    width: "100%",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.semantic.errorLight,
    borderRadius: Borders.radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  errorText: {
    ...Typography.styles.bodySmall,
    color: Colors.semantic.error,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.md * 0.95,
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
    borderRadius: Borders.radius.md * 0.95,
    paddingHorizontal: Spacing.md * 0.95 * 0.95,
  },
  inputContainerFocused: {
    borderColor: Colors.primary.blue,
    ...Shadows.xs,
  },
  inputIcon: {
    marginRight: Spacing.sm * 0.95,
  },
  input: {
    flex: 1,
    paddingVertical: 10 * 1.03 * 1.05,
    ...Typography.styles.body,
    fontSize: Typography.fontSize.body * 0.95 * 0.95 * 1.1 * 1.1 * 1.15,
    lineHeight: Typography.fontSize.body * 0.95 * 0.95 * 1.1 * 1.1 * 1.15 * 1.2,
    color: Colors.text.primary,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  eyeButton: {
    padding: Spacing.xs * 0.95,
  },
  validationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    marginLeft: 4,
  },
  errorValidationText: {
    ...Typography.styles.captionSmall,
    color: Colors.semantic.error,
  },
  successValidationText: {
    ...Typography.styles.captionSmall,
    color: Colors.semantic.success,
  },
  agreementContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  checkboxButton: {
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.blue,
  },
  agreementText: {
    flex: 1,
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  linkText: {
    color: Colors.primary.blue,
    fontWeight: "600",
  },
  signUpButtonWrapper: {
    borderRadius: Borders.radius.md,
    overflow: "hidden",
    ...Shadows.primary,
  },
  signUpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: Spacing.xs,
  },
  signUpButtonText: {
    ...Typography.styles.button,
    fontSize: 20,
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
  loginLink: {
    ...Typography.styles.body,
    color: Colors.primary.blue,
    fontWeight: "600",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: Borders.radius.xxl,
    borderTopRightRadius: Borders.radius.xxl,
    maxHeight: "85%",
    ...Shadows.xl,
  },
  modalDragIndicator: {
    position: "absolute",
    top: Spacing.xs,
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.default,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.page.paddingHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    flexGrow: 1,
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingHorizontal: Spacing.page.paddingHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  modalSectionTitle: {
    ...Typography.styles.h5,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  modalText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  modalFooterText: {
    ...Typography.styles.captionSmall,
    color: Colors.text.tertiary,
    marginTop: Spacing.xl,
    textAlign: "center",
    fontStyle: "italic",
  },
});
