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
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photos to set a profile picture."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          {/* Decorative Circles */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />

          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>

            <Text style={styles.title}>Create your SIGHT account</Text>
            <Text style={styles.subtitle}>Start your journey with clarity.</Text>

            {/* Profile Avatar Upload */}
            <View style={styles.profilePicContainer}>
              <TouchableOpacity
                style={styles.profilePicButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.profilePic} />
                ) : (
                  <View style={styles.profilePicPlaceholder}>
                    <Ionicons name="camera-outline" size={32} color="#6B7280" />
                  </View>
                )}
                <View style={styles.profilePicOverlay}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
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
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

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
                <Text style={styles.helperText}>
                  We'll send you a verification email
                </Text>
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
                <Text style={styles.helperText}>At least 8 characters</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms & Privacy Agreement */}
              <View style={styles.agreementContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
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
                  </Text>
                  {" "}and{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() => setShowPrivacyModal(true)}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>

              <Text style={styles.separatorText}>
                Your path to clear insights starts here.
              </Text>

              <TouchableOpacity
                onPress={handleRegistration}
                disabled={isPending}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#60A5FA", "#34D399"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.continueButton,
                    isPending && styles.continueButtonDisabled,
                  ]}
                >
                  <Text style={styles.continueButtonText}>
                    {isPending ? "Creating Account..." : "Continue"}
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
                    Log in
                  </Text>
                </Text>
              </View>
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
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
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
                    Conditions. If you don't agree, that's totally fine - we'll
                    miss you, but we understand. No hard feelings! (But
                    seriously, you can't use the app without agreeing.)
                  </Text>

                  <Text style={styles.modalSectionTitle}>2. User Accounts</Text>
                  <Text style={styles.modalText}>
                    You are responsible for maintaining the confidentiality of
                    your account credentials. We're not responsible if your cat
                    walks across your keyboard and changes your password (though
                    that would be impressive). Please use strong passwords -
                    "password123" doesn't count as strong, no matter how much
                    you believe it does.
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    3. Survey Creation & Responses
                  </Text>
                  <Text style={styles.modalText}>
                    As a researcher, you may create surveys and collect
                    responses. As a respondent, you may participate in surveys.
                    All survey content must be legal, ethical, and not violate
                    anyone's rights. We reserve the right to remove surveys that
                    ask inappropriate questions (like "What's your favorite
                    color?" when the survey is about medical research - that's
                    just confusing).
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    4. Points & Rewards System
                  </Text>
                  <Text style={styles.modalText}>
                    Points are awarded for completing surveys and can be used
                    within the platform. Points are non-transferable,
                    non-refundable, and cannot be exchanged for actual money (we
                    know, we're disappointed too). Attempting to game the system
                    will result in point deduction - we have trust scores for a
                    reason!
                  </Text>

                  <Text style={styles.modalSectionTitle}>5. AI Analysis</Text>
                  <Text style={styles.modalText}>
                    Our AI analysis features use advanced algorithms to provide
                    insights. While our AI is smart, it's not psychic - it can't
                    predict lottery numbers or tell you if it's going to rain
                    tomorrow. The analysis is provided "as is" and should be
                    used as a tool to aid your research, not as the sole basis
                    for life-changing decisions.
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    6. Survey Ownership & Public Nature
                  </Text>
                  <Text style={styles.modalText}>
                    All surveys created on SIGHT, including all survey content,
                    questions, responses, and any information contained within
                    them, are public and owned by us. By creating or
                    participating in surveys on this platform, you acknowledge
                    that all survey data will be used, analyzed, and owned by
                    SIGHT. We may use this information for research, analysis,
                    publication, or any other purpose we deem appropriate. Your
                    participation constitutes your agreement to this public
                    ownership model. Think of it like contributing to a public
                    research database - your input helps everyone, but the data
                    belongs to the platform (that's us, by the way).
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    7. Prohibited Activities
                  </Text>
                  <Text style={styles.modalText}>
                    You agree not to: spam surveys, create fake accounts,
                    attempt to hack our systems, or use the platform for illegal
                    activities. Basically, don't be a villain. We're trying to
                    do good research here, not create chaos.
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    8. Service Availability
                  </Text>
                  <Text style={styles.modalText}>
                    We strive for 99.9% uptime, but sometimes things break
                    (servers have bad days too). We're not liable for temporary
                    service interruptions, though we'll do our best to fix
                    things quickly. If the app is down, take it as a sign to go
                    outside and touch some grass.
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    9. Limitation of Liability
                  </Text>
                  <Text style={styles.modalText}>
                    SIGHT is provided "as is" without warranties. We're not
                    liable for any indirect, incidental, or consequential
                    damages. In other words, if you make a bad business decision
                    based on survey data, that's on you, not us. We're here to
                    help, but we're not fortune tellers.
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    10. Changes to Terms
                  </Text>
                  <Text style={styles.modalText}>
                    We may update these terms from time to time. We'll notify
                    you of significant changes, but it's your responsibility to
                    review them periodically. If you continue using SIGHT after
                    changes, you're accepting the new terms. (Pro tip: actually
                    read them - you might learn something!)
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    11. Contact Information
                  </Text>
                  <Text style={styles.modalText}>
                    If you have questions about these terms, please contact our
                    support team. We're here to help (and we promise we're
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
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
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
                <Text style={styles.modalSectionTitle}>1. Introduction</Text>
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
                    technology is still in development, and honestly, we're not
                    sure we want to know what you're thinking about during
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
                    While we can't guarantee 100% security (no one can, really),
                    we do our best. Think of it like locking your front door -
                    it doesn't guarantee nothing bad will happen, but it sure
                    helps!
                  </Text>

                  <Text style={styles.modalSectionTitle}>5. Data Sharing</Text>
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
                    unless you explicitly provide it in a response. Think of it
                    like a secret admirer - they know what you said, but not who
                    you are (unless you tell them).
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    7. AI Analysis & Processing
                  </Text>
                  <Text style={styles.modalText}>
                    We use OpenAI's GPT-4 for AI analysis. When we send data to
                    OpenAI, it's processed according to their privacy policies.
                    We ensure that personal identifiers are removed before
                    processing. The AI doesn't know your name, email, or that
                    embarrassing photo from 2012 (we don't either, thankfully).
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
                    information, delete your account, and request a copy of your
                    data. You can also opt out of certain communications. Just
                    contact us - we're reasonable people (most of the time).
                    We'll process your request within 30 days, or sooner if we
                    can (we're not monsters, we just have a lot of requests
                    sometimes).
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    10. Children's Privacy
                  </Text>
                  <Text style={styles.modalText}>
                    SIGHT is not intended for users under 13 years of age. If
                    you're under 13, please get your parent's permission (and
                    maybe ask them to help you read this - it's pretty long, we
                    know). We don't knowingly collect data from children, and if
                    we find out we have, we'll delete it faster than you can say
                    "privacy violation."
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    11. International Data Transfers
                  </Text>
                  <Text style={styles.modalText}>
                    Your data may be processed and stored in different
                    countries. We ensure appropriate safeguards are in place to
                    protect your data regardless of where it's processed. Your
                    data travels more than most people do (and probably has
                    better security too).
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    12. Data Retention
                  </Text>
                  <Text style={styles.modalText}>
                    We retain your data as long as your account is active or as
                    needed to provide services. If you delete your account,
                    we'll delete your personal data within 30 days, though some
                    anonymized data may remain for research purposes. Think of
                    it like cleaning your room - most stuff goes, but some
                    things (like aggregated statistics) stick around because
                    they're useful.
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    13. Changes to Privacy Policy
                  </Text>
                  <Text style={styles.modalText}>
                    We may update this Privacy Policy from time to time. We'll
                    notify you of significant changes via email or in-app
                    notification. Continued use of SIGHT after changes means you
                    accept the updated policy. We recommend checking back
                    occasionally - not because we're trying to hide anything,
                    but because privacy laws evolve (and so do we).
                  </Text>

                  <Text style={styles.modalSectionTitle}>14. Contact Us</Text>
                  <Text style={styles.modalText}>
                    If you have privacy concerns or questions, please contact
                    our privacy team. We're here to help and we take your
                    concerns seriously. We might even respond faster than your
                    internet service provider (that's a low bar, but we'll take
                    it).
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F2937",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    minHeight: "100%",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(96, 165, 250, 0.15)",
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(96, 165, 250, 0.12)",
    top: 80,
    left: -30,
  },
  decorativeCircle3: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    top: 200,
    right: 20,
  },
  content: {
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
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  profilePicButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  profilePic: {
    width: "100%",
    height: "100%",
  },
  profilePicPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  profilePicOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    fontStyle: "italic",
  },
  separatorText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginVertical: 24,
    fontStyle: "italic",
  },
  continueButton: {
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  continueButtonDisabled: {
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
  loginLink: {
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
  backButton: {
    marginBottom: 16,
    padding: 8,
    alignSelf: "flex-start",
  },
  agreementContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
  },
  checkboxContainer: {
    marginTop: 2,
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
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  linkText: {
    color: "#3B82F6",
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
