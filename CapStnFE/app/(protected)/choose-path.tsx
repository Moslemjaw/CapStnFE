import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChoosePath() {
  const router = useRouter();

  const handlePathSelection = (path: "researcher" | "respondent") => {
    if (path === "researcher") {
      router.replace("/(protected)/(researcher)/(tabs)/" as any);
    } else {
      router.replace("/(protected)/(respondent)/(tabs)/" as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Path</Text>
          <Text style={styles.subtitle}>
            Select how you want to use the platform
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handlePathSelection("researcher")}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, styles.researcherIcon]}>
              <Ionicons name="flask-outline" size={48} color="#3B82F6" />
            </View>
            <Text style={styles.optionTitle}>Researcher</Text>
            <Text style={styles.optionDescription}>
              Create surveys, collect data, and analyze responses
            </Text>
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={24} color="#3B82F6" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handlePathSelection("respondent")}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, styles.respondentIcon]}>
              <Ionicons name="person-outline" size={48} color="#22C55E" />
            </View>
            <Text style={styles.optionTitle}>Respondent</Text>
            <Text style={styles.optionDescription}>
              Participate in surveys and share your insights
            </Text>
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={24} color="#22C55E" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "center",
  },
  researcherIcon: {
    backgroundColor: "#DBEAFE",
  },
  respondentIcon: {
    backgroundColor: "#DCFCE7",
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  optionDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  arrowContainer: {
    alignItems: "center",
  },
});
