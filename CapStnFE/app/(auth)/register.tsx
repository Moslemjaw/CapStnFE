import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  Modal,
  Pressable,
} from "react-native";
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
      // Store user data if available (normalize id to _id)
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
      Alert.alert(
        "Validation Error",
        "Passwords do not match. Please try again."
      );
      return;
    }
    if (password.length < 8) {
      Alert.alert(
        "Validation Error",
        "Password must be at least 8 characters long."
      );
      return;
    }
    if (!agreedToTerms) {
      Alert.alert(
        "Agreement Required",
        "Please agree to the Terms & Conditions and Privacy Policy to continue."
      );
      return;
    }
    mutate();
  };

  const pickImage = async () => {
    try {
      // Request permissions for media library
      const { status: libraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (libraryStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your photos to set a profile picture."
        );
        return;
      }

      // Show action sheet to choose between camera and library
      Alert.alert(
        "Select Profile Picture",
        "Choose an option",
        [
          {
            text: "Camera",
            onPress: async () => {
              // Request camera permissions
              const { status: cameraStatus } =
                await ImagePicker.requestCameraPermissionsAsync();

              if (cameraStatus !== "granted") {
                Alert.alert(
                  "Permission Required",
                  "We need access to your camera to take a profile picture."
                );
                return;
              }

              // Launch camera with square crop (1:1) for circular profile picture
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1], // Square aspect ratio for circular profile display
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
              // Launch image library with square crop (1:1) for circular profile picture
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1], // Square aspect ratio for circular profile display
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setImage(result.assets[0].uri);
              }
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <View style={styles.content}>
              {/* Branding Section */}
              <View style={styles.brandingSection}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require("@/assets/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Join </Text>
                  <Image
                    source={require("@/assets/title.png")}
                    style={styles.titleImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.subtitle}>
                  Create your account and start exploring
                </Text>
              </View>

              {/* Profile Avatar Upload */}
              <View style={styles.profilePicContainer}>
                <View style={styles.avatarWrapper}>
                  <TouchableOpacity
                    style={styles.profilePicButton}
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={styles.profilePic}
                      />
                    ) : (
                      <LinearGradient
                        colors={["#EEF5FF", "#E8D5FF"]}
                        style={styles.profilePicPlaceholder}
                      >
                        <Ionicons
                          name="person-outline"
                          size={48}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cameraIconButton}
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cameraIconContainer}>
                      <Ionicons
                        name="camera-outline"
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                  </TouchableOpacity>
                </View>
                <Text style={styles.optionalText}>Optional</Text>
              </View>

              <View style={styles.form}>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                      {error?.response?.data?.message ||
                        error?.message ||
                        "Registration failed. Please try again."}
                    </Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#969696"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
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
                      placeholder="Password"
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
                  {password.length > 0 && password.length < 8 && (
                    <Text style={styles.errorValidationText}>
                      Password must be at least 8 characters
                    </Text>
                  )}
                  {password.length >= 8 && (
                    <Text style={styles.helperText}>At least 8 characters</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Retype Password"
                      placeholderTextColor="#969696"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onBlur={() => setConfirmPasswordBlurred(true)}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color="#969696"
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPasswordBlurred && password !== confirmPassword && (
                    <Text style={styles.errorValidationText}>
                      Passwords do not match
                    </Text>
                  )}
                </View>

                {/* Terms & Privacy Agreement */}
                <View style={styles.agreementContainer}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        agreedToTerms && styles.checkboxChecked,
                      ]}
                    >
                      {agreedToTerms && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.agreementText}>
                    I agree to the{" "}
                    <Text
                      style={styles.linkText}
                      onPress={() => setShowTermsModal(true)}
                    >
                      Terms & Conditions
                    </Text>{" "}
                    and{" "}
                    <Text
                      style={styles.linkText}
                      onPress={() => setShowPrivacyModal(true)}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleRegistration}
                  disabled={isPending}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#5FA9F5", "#4A63D8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.signUpButton,
                      isPending && styles.signUpButtonDisabled,
                    ]}
                  >
                    <Text style={styles.signUpButtonText}>
                      {isPending ? "Creating Account..." : "Sign Up"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.bottomLinkContainer}>
                  <Text style={styles.bottomLinkText}>
                    Already have an account?{" "}
                    <Text
                      style={styles.loginLink}
                      onPress={() => router.navigate("/(auth)/login")}
                    >
                      Log In
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Terms & Conditions Modal */}
          <Modal
            visible={showTermsModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTermsModal(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowTermsModal(false)}
              >
                <Pressable
                  style={styles.modalContent}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Terms & Conditions</Text>
                    <TouchableOpacity
                      onPress={() => setShowTermsModal(false)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    style={styles.modalBody}
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text style={styles.modalSectionTitle}>
                      1. Acceptance of Terms
                    </Text>
                    <Text style={styles.modalText}>
                      By accessing and using SIGHT (Survey Insights & Global
                      Health Technology), you agree to be bound by these Terms &
                      Conditions. If you don't agree, that's totally fine -
                      we'll miss you, but we understand. No hard feelings! (But
                      seriously, you can't use the app without agreeing.)
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      2. User Accounts
                    </Text>
                    <Text style={styles.modalText}>
                      You are responsible for maintaining the confidentiality of
                      your account credentials. We're not responsible if your
                      cat walks across your keyboard and changes your password
                      (though that would be impressive). Please use strong
                      passwords - "password123" doesn't count as strong, no
                      matter how much you believe it does.
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      3. Survey Creation & Responses
                    </Text>
                    <Text style={styles.modalText}>
                      As a researcher, you may create surveys and collect
                      responses. As a respondent, you may participate in
                      surveys. All survey content must be legal, ethical, and
                      not violate anyone's rights. We reserve the right to
                      remove surveys that ask inappropriate questions (like
                      "What's your favorite color?" when the survey is about
                      medical research - that's just confusing).
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      4. Points & Rewards System
                    </Text>
                    <Text style={styles.modalText}>
                      Points are awarded for completing surveys and can be used
                      within the platform. Points are non-transferable,
                      non-refundable, and cannot be exchanged for actual money
                      (we know, we're disappointed too). Attempting to game the
                      system will result in point deduction - we have trust
                      scores for a reason!
                    </Text>

                    <Text style={styles.modalSectionTitle}>5. AI Analysis</Text>
                    <Text style={styles.modalText}>
                      Our AI analysis features use advanced algorithms to
                      provide insights. While our AI is smart, it's not psychic
                      - it can't predict lottery numbers or tell you if it's
                      going to rain tomorrow. The analysis is provided "as is"
                      and should be used as a tool to aid your research, not as
                      the sole basis for life-changing decisions.
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      6. Survey Ownership & Public Nature
                    </Text>
                    <Text style={styles.modalText}>
                      All surveys created on SIGHT, including all survey
                      content, questions, responses, and any information
                      contained within them, are public and owned by us. By
                      creating or participating in surveys on this platform, you
                      acknowledge that all survey data will be used, analyzed,
                      and owned by SIGHT. We may use this information for
                      research, analysis, publication, or any other purpose we
                      deem appropriate. Your participation constitutes your
                      agreement to this public ownership model. Think of it like
                      contributing to a public research database - your input
                      helps everyone, but the data belongs to the platform
                      (that's us, by the way).
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      7. Prohibited Activities
                    </Text>
                    <Text style={styles.modalText}>
                      You agree not to: spam surveys, create fake accounts,
                      attempt to hack our systems, or use the platform for
                      illegal activities. Basically, don't be a villain. We're
                      trying to do good research here, not create chaos.
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      8. Service Availability
                    </Text>
                    <Text style={styles.modalText}>
                      We strive for 99.9% uptime, but sometimes things break
                      (servers have bad days too). We're not liable for
                      temporary service interruptions, though we'll do our best
                      to fix things quickly. If the app is down, take it as a
                      sign to go outside and touch some grass.
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      9. Limitation of Liability
                    </Text>
                    <Text style={styles.modalText}>
                      SIGHT is provided "as is" without warranties. We're not
                      liable for any indirect, incidental, or consequential
                      damages. In other words, if you make a bad business
                      decision based on survey data, that's on you, not us.
                      We're here to help, but we're not fortune tellers.
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      10. Changes to Terms
                    </Text>
                    <Text style={styles.modalText}>
                      We may update these terms from time to time. We'll notify
                      you of significant changes, but it's your responsibility
                      to review them periodically. If you continue using SIGHT
                      after changes, you're accepting the new terms. (Pro tip:
                      actually read them - you might learn something!)
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      11. Contact Information
                    </Text>
                    <Text style={styles.modalText}>
                      If you have questions about these terms, please contact
                      our support team. We're here to help (and we promise we're
                      friendlier than this legal document makes us sound).
                    </Text>

                    <Text style={styles.modalFooterText}>
                      Last Updated: {new Date().toLocaleDateString()}
                    </Text>
                  </ScrollView>
                </Pressable>
              </Pressable>
            </SafeAreaView>
          </Modal>

          {/* Privacy Policy Modal */}
          <Modal
            visible={showPrivacyModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowPrivacyModal(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowPrivacyModal(false)}
              >
                <Pressable
                  style={styles.modalContent}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Privacy Policy</Text>
                    <TouchableOpacity
                      onPress={() => setShowPrivacyModal(false)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    style={styles.modalBody}
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text style={styles.modalSectionTitle}>
                      1. Introduction
                    </Text>
                    <Text style={styles.modalText}>
                      At SIGHT, we take your privacy seriously. Like, really
                      seriously. We know your data is important to you, and it's
                      important to us too. This Privacy Policy explains how we
                      collect, use, and protect your information. Spoiler alert:
                      we're not selling your data to aliens (or anyone else, for
                      that matter).
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      2. Information We Collect
                    </Text>
                    <Text style={styles.modalText}>
                      We collect information you provide directly: name, email,
                      profile images, survey responses, and account activity. We
                      also collect technical data like device information and
                      usage patterns. We don't collect your thoughts (yet - that
                      technology is still in development, and honestly, we're
                      not sure we want to know what you're thinking about during
                      boring surveys).
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      3. How We Use Your Information
                    </Text>
                    <Text style={styles.modalText}>
                      We use your data to: provide and improve our services,
                      process survey responses, generate AI analyses, send you
                      notifications (only the important ones, we promise), and
                      maintain your account. We use aggregated, anonymized data
                      for analytics - your individual responses are kept private
                      unless you explicitly share them.
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      4. Data Storage & Security
                    </Text>
                    <Text style={styles.modalText}>
                      Your data is stored securely using industry-standard
                      encryption. We use MongoDB for data storage and implement
                      security measures to protect against unauthorized access.
                      While we can't guarantee 100% security (no one can,
                      really), we do our best. Think of it like locking your
                      front door - it doesn't guarantee nothing bad will happen,
                      but it sure helps!
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      5. Data Sharing
                    </Text>
                    <Text style={styles.modalText}>
                      We don't sell your personal information. Period. We may
                      share aggregated, anonymized data with researchers (that's
                      the whole point of the platform), but your individual
                      identity remains protected. The only exception is if
                      required by law - and even then, we'll put up a good fight
                      (legally speaking).
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      6. Survey Responses
                    </Text>
                    <Text style={styles.modalText}>
                      Your survey responses are shared with the survey creator
                      (the researcher) in anonymized form. Researchers can see
                      your answers but not your personal identifying information
                      unless you explicitly provide it in a response. Think of
                      it like a secret admirer - they know what you said, but
                      not who you are (unless you tell them).
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      7. AI Analysis & Processing
                    </Text>
                    <Text style={styles.modalText}>
                      We use OpenAI's GPT-4 for AI analysis. When we send data
                      to OpenAI, it's processed according to their privacy
                      policies. We ensure that personal identifiers are removed
                      before processing. The AI doesn't know your name, email,
                      or that embarrassing photo from 2012 (we don't either,
                      thankfully).
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      8. Cookies & Tracking
                    </Text>
                    <Text style={styles.modalText}>
                      We use authentication tokens (JWT) to keep you logged in.
                      These aren't cookies in the traditional sense, but they
                      serve a similar purpose. We don't use third-party tracking
                      cookies or sell your browsing data. Your activity stays
                      between you and us (and our servers, but they're sworn to
                      secrecy).
                    </Text>

                    <Text style={styles.modalSectionTitle}>9. Your Rights</Text>
                    <Text style={styles.modalText}>
                      You have the right to: access your data, update your
                      information, delete your account, and request a copy of
                      your data. You can also opt out of certain communications.
                      Just contact us - we're reasonable people (most of the
                      time). We'll process your request within 30 days, or
                      sooner if we can (we're not monsters, we just have a lot
                      of requests sometimes).
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      10. Children's Privacy
                    </Text>
                    <Text style={styles.modalText}>
                      SIGHT is not intended for users under 13 years of age. If
                      you're under 13, please get your parent's permission (and
                      maybe ask them to help you read this - it's pretty long,
                      we know). We don't knowingly collect data from children,
                      and if we find out we have, we'll delete it faster than
                      you can say "privacy violation."
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      11. International Data Transfers
                    </Text>
                    <Text style={styles.modalText}>
                      Your data may be processed and stored in different
                      countries. We ensure appropriate safeguards are in place
                      to protect your data regardless of where it's processed.
                      Your data travels more than most people do (and probably
                      has better security too).
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      12. Data Retention
                    </Text>
                    <Text style={styles.modalText}>
                      We retain your data as long as your account is active or
                      as needed to provide services. If you delete your account,
                      we'll delete your personal data within 30 days, though
                      some anonymized data may remain for research purposes.
                      Think of it like cleaning your room - most stuff goes, but
                      some things (like aggregated statistics) stick around
                      because they're useful.
                    </Text>

                    <Text style={styles.modalSectionTitle}>
                      13. Changes to Privacy Policy
                    </Text>
                    <Text style={styles.modalText}>
                      We may update this Privacy Policy from time to time. We'll
                      notify you of significant changes via email or in-app
                      notification. Continued use of SIGHT after changes means
                      you accept the updated policy. We recommend checking back
                      occasionally - not because we're trying to hide anything,
                      but because privacy laws evolve (and so do we).
                    </Text>

                    <Text style={styles.modalSectionTitle}>14. Contact Us</Text>
                    <Text style={styles.modalText}>
                      If you have privacy concerns or questions, please contact
                      our privacy team. We're here to help and we take your
                      concerns seriously. We might even respond faster than your
                      internet service provider (that's a low bar, but we'll
                      take it).
                    </Text>

                    <Text style={styles.modalFooterText}>
                      Last Updated: {new Date().toLocaleDateString()}
                    </Text>
                  </ScrollView>
                </Pressable>
              </Pressable>
            </SafeAreaView>
          </Modal>
        </KeyboardAvoidingView>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "center",
  },
  brandingSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 120,
    height: 120,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#222222",
    marginRight: -3,
  },
  titleImage: {
    height: 36,
    width: 108,
    marginTop: 3,
    marginLeft: -3,
  },
  subtitle: {
    fontSize: 16,
    color: "#505050",
    textAlign: "center",
  },
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  profilePicButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
  },
  profilePic: {
    width: "100%",
    height: "100%",
    borderRadius: 60, // Ensure circular shape
  },
  profilePicPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIconButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  cameraIconContainer: {
    backgroundColor: "#4A63D8",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  optionalText: {
    fontSize: 14,
    color: "#969696",
    marginTop: 8,
  },
  form: {
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
  helperText: {
    fontSize: 12,
    color: "#969696",
    marginTop: 6,
  },
  errorValidationText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 6,
  },
  signUpButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  signUpButtonDisabled: {
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
  loginLink: {
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
  agreementContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
  },
  checkboxContainer: {
    marginTop: 0,
    justifyContent: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#4A63D8",
    borderColor: "#4A63D8",
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  linkText: {
    color: "#4A63D8",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "left",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },
  modalFooterText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginTop: 16,
    textAlign: "center",
  },
});
