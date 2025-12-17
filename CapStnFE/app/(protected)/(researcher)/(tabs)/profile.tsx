import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
  Dimensions,
  Animated,
} from "react-native";
import React, { useContext, useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AuthContext from "@/context/AuthContext";
import { getUser, deleteToken } from "@/api/storage";
import User from "@/types/User";

export default function ResearcherProfile() {
  const [user, setUser] = useState<User | null>(null);
  const { setIsAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Animation values
  const termsSlideAnim = useRef(new Animated.Value(0)).current;
  const privacySlideAnim = useRef(new Animated.Value(0)).current;
  const termsOpacityAnim = useRef(new Animated.Value(0)).current;
  const privacyOpacityAnim = useRef(new Animated.Value(0)).current;

  // Tab bar height is 60px as defined in _layout.tsx
  // Tab bar extends into safe area, so we only subtract tab bar height
  const TAB_BAR_HEIGHT = 60;
  const popupHeight = Dimensions.get("window").height * 0.85 - TAB_BAR_HEIGHT;

  // Animate Terms popup
  useEffect(() => {
    if (showTermsModal) {
      Animated.parallel([
        Animated.timing(termsSlideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(termsOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(termsSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(termsOpacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showTermsModal]);

  // Animate Privacy popup
  useEffect(() => {
    if (showPrivacyModal) {
      Animated.parallel([
        Animated.timing(privacySlideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(privacyOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(privacySlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(privacyOpacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showPrivacyModal]);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    console.log("handleLogout called - showing alert");
    // Alert.alert("Log Out", "Are you sure you want to log out?", [
    //   {
    //     text: "Cancel",
    //     style: "cancel",
    //     onPress: () => {
    //       console.log("Logout cancelled");
    //     },
    //   },
    //   {
    //     text: "Log Out",
    //     style: "destructive",
    //     onPress: async () => {
    //       console.log("Log Out button pressed in alert");
    //       try {
    //         console.log("About to call deleteToken()");
    //         await deleteToken();
    //         console.log("deleteToken() completed successfully");
    //         setIsAuthenticated(false);
    //         console.log("isAuthenticated set to false");
    //         // Navigate directly to login page
    //         router.replace("/(auth)/login" as any);
    //         console.log("Navigation triggered");
    //       } catch (error) {
    //         console.error("Logout error:", error);
    //         Alert.alert("Error", "Failed to log out. Please try again.");
    //       }
    //     },
    //   },
    // ]);
    await deleteToken();
    setIsAuthenticated(false);
    router.replace("/(auth)/login" as any);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelName = (level?: number) => {
    if (!level) return "Level 1: Beginner";
    const levels = [
      "Level 1: Beginner",
      "Level 2: Intermediate",
      "Level 3: Advanced",
      "Level 4: Expert",
      "Level 5: Master",
    ];
    return levels[level - 1] || "Level 1: Beginner";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>

          {/* User Info Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name ? getInitials(user.name) : "AA"}
                </Text>
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.name || "Researcher Name"}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || "researcher@example.com"}
              </Text>
            </View>
          </View>

          {/* Stats Section */}
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Points</Text>
              <Text style={styles.statValue}>{user?.points || 0} pts</Text>
              <Text style={styles.statSubtext}>+40 this week</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{user?.streakDays || 0} days</Text>
              <Text style={styles.statSubtext}>
                {getLevelName(user?.level)}
              </Text>
            </View>
          </View>

          {/* About Section */}
          <Text style={styles.sectionTitle}>About SIGHT</Text>
          <View style={styles.aboutSection}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <TouchableOpacity
              style={styles.aboutItem}
              activeOpacity={0.7}
              onPress={() => setShowTermsModal(true)}
            >
              <Text style={styles.aboutText}>Terms & Conditions</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aboutItem}
              activeOpacity={0.7}
              onPress={() => setShowPrivacyModal(true)}
            >
              <Text style={styles.aboutText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Log Out Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Terms & Conditions Custom Popup */}
      {showTermsModal && (
        <SafeAreaView
          style={styles.popupOverlayContainer}
          edges={["bottom"]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.popupOverlay,
              {
                opacity: termsOpacityAnim,
              },
            ]}
            pointerEvents="box-none"
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowTermsModal(false)}
            />
            <Animated.View
              style={[
                styles.popupContent,
                {
                  height: popupHeight,
                  transform: [
                    {
                      translateY: termsSlideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [popupHeight, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.popupHeader}>
                <Text style={styles.popupTitle}>Terms & Conditions</Text>
                <TouchableOpacity
                  onPress={() => setShowTermsModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.popupBody}>
                <ScrollView
                  style={styles.popupScrollView}
                  contentContainerStyle={styles.popupScrollContent}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                >
                  <Text style={styles.popupSectionTitle}>
                    1. Acceptance of Terms
                  </Text>
                  <Text style={styles.popupText}>
                    By accessing and using SIGHT (Survey Insights & Global
                    Health Technology), you agree to be bound by these Terms &
                    Conditions. If you don't agree, that's totally fine - we'll
                    miss you, but we understand. No hard feelings! (But
                    seriously, you can't use the app without agreeing.)
                  </Text>

                  <Text style={styles.popupSectionTitle}>2. User Accounts</Text>
                  <Text style={styles.popupText}>
                    You are responsible for maintaining the confidentiality of
                    your account credentials. We're not responsible if your cat
                    walks across your keyboard and changes your password (though
                    that would be impressive). Please use strong passwords -
                    "password123" doesn't count as strong, no matter how much
                    you believe it does.
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    3. Survey Creation & Responses
                  </Text>
                  <Text style={styles.popupText}>
                    As a researcher, you may create surveys and collect
                    responses. As a respondent, you may participate in surveys.
                    All survey content must be legal, ethical, and not violate
                    anyone's rights. We reserve the right to remove surveys that
                    ask inappropriate questions (like "What's your favorite
                    color?" when the survey is about medical research - that's
                    just confusing).
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    4. Points & Rewards System
                  </Text>
                  <Text style={styles.popupText}>
                    Points are awarded for completing surveys and can be used
                    within the platform. Points are non-transferable,
                    non-refundable, and cannot be exchanged for actual money (we
                    know, we're disappointed too). Attempting to game the system
                    will result in point deduction - we have trust scores for a
                    reason!
                  </Text>

                  <Text style={styles.popupSectionTitle}>5. AI Analysis</Text>
                  <Text style={styles.popupText}>
                    Our AI analysis features use advanced algorithms to provide
                    insights. While our AI is smart, it's not psychic - it can't
                    predict lottery numbers or tell you if it's going to rain
                    tomorrow. The analysis is provided "as is" and should be
                    used as a tool to aid your research, not as the sole basis
                    for life-changing decisions.
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    6. Survey Ownership & Public Nature
                  </Text>
                  <Text style={styles.popupText}>
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

                  <Text style={styles.popupSectionTitle}>
                    7. Prohibited Activities
                  </Text>
                  <Text style={styles.popupText}>
                    You agree not to: spam surveys, create fake accounts,
                    attempt to hack our systems, or use the platform for illegal
                    activities. Basically, don't be a villain. We're trying to
                    do good research here, not create chaos.
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    8. Service Availability
                  </Text>
                  <Text style={styles.popupText}>
                    We strive for 99.9% uptime, but sometimes things break
                    (servers have bad days too). We're not liable for temporary
                    service interruptions, though we'll do our best to fix
                    things quickly. If the app is down, take it as a sign to go
                    outside and touch some grass.
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    9. Limitation of Liability
                  </Text>
                  <Text style={styles.popupText}>
                    SIGHT is provided "as is" without warranties. We're not
                    liable for any indirect, incidental, or consequential
                    damages. In other words, if you make a bad business decision
                    based on survey data, that's on you, not us. We're here to
                    help, but we're not fortune tellers.
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    10. Changes to Terms
                  </Text>
                  <Text style={styles.popupText}>
                    We may update these terms from time to time. We'll notify
                    you of significant changes, but it's your responsibility to
                    review them periodically. If you continue using SIGHT after
                    changes, you're accepting the new terms. (Pro tip: actually
                    read them - you might learn something!)
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    11. Contact Information
                  </Text>
                  <Text style={styles.popupText}>
                    If you have questions about these terms, please contact our
                    support team. We're here to help (and we promise we're
                    friendlier than this legal document makes us sound).
                  </Text>

                  <Text style={styles.popupFooterText}>
                    Last Updated: {new Date().toLocaleDateString()}
                  </Text>
                </ScrollView>
              </View>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      )}

      {/* Privacy Policy Custom Popup */}
      {showPrivacyModal && (
        <SafeAreaView
          style={styles.popupOverlayContainer}
          edges={["bottom"]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.popupOverlay,
              {
                opacity: privacyOpacityAnim,
              },
            ]}
            pointerEvents="box-none"
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowPrivacyModal(false)}
            />
            <Animated.View
              style={[
                styles.popupContent,
                {
                  height: popupHeight,
                  transform: [
                    {
                      translateY: privacySlideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [popupHeight, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.popupHeader}>
                <Text style={styles.popupTitle}>Privacy Policy</Text>
                <TouchableOpacity
                  onPress={() => setShowPrivacyModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.popupBody}>
                <ScrollView
                  style={styles.popupScrollView}
                  contentContainerStyle={styles.popupScrollContent}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                >
                  <Text style={styles.popupSectionTitle}>1. Introduction</Text>
                  <Text style={styles.popupText}>
                    At SIGHT, we take your privacy seriously. Like, really
                    seriously. We know your data is important to you, and it's
                    important to us too. This Privacy Policy explains how we
                    collect, use, and protect your information. Spoiler alert:
                    we're not selling your data to aliens (or anyone else, for
                    that matter).
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    2. Information We Collect
                  </Text>
                  <Text style={styles.popupText}>
                    We collect information you provide directly: name, email,
                    profile images, survey responses, and account activity. We
                    also collect technical data like device information and
                    usage patterns. We don't collect your thoughts (yet - that
                    technology is still in development, and honestly, we're not
                    sure we want to know what you're thinking about during
                    boring surveys).
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    3. How We Use Your Information
                  </Text>
                  <Text style={styles.popupText}>
                    We use your data to: provide and improve our services,
                    process survey responses, generate AI analyses, send you
                    notifications (only the important ones, we promise), and
                    maintain your account. We use aggregated, anonymized data
                    for analytics - your individual responses are kept private
                    unless you explicitly share them.
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    4. Data Storage & Security
                  </Text>
                  <Text style={styles.popupText}>
                    Your data is stored securely using industry-standard
                    encryption. We use MongoDB for data storage and implement
                    security measures to protect against unauthorized access.
                    While we can't guarantee 100% security (no one can, really),
                    we do our best. Think of it like locking your front door -
                    it doesn't guarantee nothing bad will happen, but it sure
                    helps!
                  </Text>

                  <Text style={styles.popupSectionTitle}>5. Data Sharing</Text>
                  <Text style={styles.popupText}>
                    We don't sell your personal information. Period. We may
                    share aggregated, anonymized data with researchers (that's
                    the whole point of the platform), but your individual
                    identity remains protected. The only exception is if
                    required by law - and even then, we'll put up a good fight
                    (legally speaking).
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    6. Survey Responses
                  </Text>
                  <Text style={styles.popupText}>
                    Your survey responses are shared with the survey creator
                    (the researcher) in anonymized form. Researchers can see
                    your answers but not your personal identifying information
                    unless you explicitly provide it in a response. Think of it
                    like a secret admirer - they know what you said, but not who
                    you are (unless you tell them).
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    7. AI Analysis & Processing
                  </Text>
                  <Text style={styles.popupText}>
                    We use OpenAI's GPT-4 for AI analysis. When we send data to
                    OpenAI, it's processed according to their privacy policies.
                    We ensure that personal identifiers are removed before
                    processing. The AI doesn't know your name, email, or that
                    embarrassing photo from 2012 (we don't either, thankfully).
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    8. Cookies & Tracking
                  </Text>
                  <Text style={styles.popupText}>
                    We use authentication tokens (JWT) to keep you logged in.
                    These aren't cookies in the traditional sense, but they
                    serve a similar purpose. We don't use third-party tracking
                    cookies or sell your browsing data. Your activity stays
                    between you and us (and our servers, but they're sworn to
                    secrecy).
                  </Text>

                  <Text style={styles.popupSectionTitle}>9. Your Rights</Text>
                  <Text style={styles.popupText}>
                    You have the right to: access your data, update your
                    information, delete your account, and request a copy of your
                    data. You can also opt out of certain communications. Just
                    contact us - we're reasonable people (most of the time).
                    We'll process your request within 30 days, or sooner if we
                    can (we're not monsters, we just have a lot of requests
                    sometimes).
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    10. Children's Privacy
                  </Text>
                  <Text style={styles.popupText}>
                    SIGHT is not intended for users under 13 years of age. If
                    you're under 13, please get your parent's permission (and
                    maybe ask them to help you read this - it's pretty long, we
                    know). We don't knowingly collect data from children, and if
                    we find out we have, we'll delete it faster than you can say
                    "privacy violation."
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    11. International Data Transfers
                  </Text>
                  <Text style={styles.popupText}>
                    Your data may be processed and stored in different
                    countries. We ensure appropriate safeguards are in place to
                    protect your data regardless of where it's processed. Your
                    data travels more than most people do (and probably has
                    better security too).
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    12. Data Retention
                  </Text>
                  <Text style={styles.popupText}>
                    We retain your data as long as your account is active or as
                    needed to provide services. If you delete your account,
                    we'll delete your personal data within 30 days, though some
                    anonymized data may remain for research purposes. Think of
                    it like cleaning your room - most stuff goes, but some
                    things (like aggregated statistics) stick around because
                    they're useful.
                  </Text>

                  <Text style={styles.popupSectionTitle}>
                    13. Changes to Privacy Policy
                  </Text>
                  <Text style={styles.popupText}>
                    We may update this Privacy Policy from time to time. We'll
                    notify you of significant changes via email or in-app
                    notification. Continued use of SIGHT after changes means you
                    accept the updated policy. We recommend checking back
                    occasionally - not because we're trying to hide anything,
                    but because privacy laws evolve (and so do we).
                  </Text>

                  <Text style={styles.popupSectionTitle}>14. Contact Us</Text>
                  <Text style={styles.popupText}>
                    If you have privacy concerns or questions, please contact
                    our privacy team. We're here to help and we take your
                    concerns seriously. We might even respond faster than your
                    internet service provider (that's a low bar, but we'll take
                    it).
                  </Text>

                  <Text style={styles.popupFooterText}>
                    Last Updated: {new Date().toLocaleDateString()}
                  </Text>
                </ScrollView>
              </View>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 24,
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E0F2FE",
    borderWidth: 2,
    borderColor: "#7DD3FC",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0C4A6E",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  roleTag: {
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: "#3B82F6",
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  aboutSection: {
    marginBottom: 32,
  },
  versionText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  aboutItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  aboutText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
  popupOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  popupContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: "100%",
  },
  popupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  popupBody: {
    flex: 1,
  },
  popupScrollView: {
    flex: 1,
  },
  popupScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  popupSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 20,
    marginBottom: 8,
  },
  popupText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    marginBottom: 16,
  },
  popupFooterText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
});
