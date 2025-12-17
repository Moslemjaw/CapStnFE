import { StyleSheet, Text, View, ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResearcherResearch() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Research</Text>
          <Text style={styles.subtitle}>Manage your surveys and create new ones</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              Research Dashboard Coming Soon
            </Text>
            <Text style={styles.placeholderSubtext}>
              This is where you'll be able to view all the surveys you've created
              and create new surveys for your research.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  content: {
    padding: 24,
    gap: 16,
  },
  placeholderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "center",
  },
});
