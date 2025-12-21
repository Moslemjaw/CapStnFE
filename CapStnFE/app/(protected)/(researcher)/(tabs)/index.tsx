import { StyleSheet, Text, View, ScrollView, Image } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";
import { FadeInView } from "@/components/FadeInView";

export default function ResearcherHome() {
  const bottomNavHeight = useBottomNavHeight();

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/title.png")}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Discover Insights</Text>
          <Text style={styles.subtitle}>Real data, real people, real patterns</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + 8 }]}
      >
        <View style={styles.content}>
          <View style={styles.placeholderContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="analytics-outline" size={64} color="#8A4DE8" />
            </View>
            <Text style={styles.placeholderTitle}>Your Insights Dashboard</Text>
            <Text style={styles.placeholderText}>
              This page will populate with insights and data as you use the app.
            </Text>
            <View style={styles.iconRow}>
              <View style={styles.smallIconContainer}>
                <Ionicons name="bar-chart-outline" size={32} color="#5FA9F5" />
              </View>
              <View style={styles.smallIconContainer}>
                <Ionicons name="pie-chart-outline" size={32} color="#8A4DE8" />
              </View>
              <View style={styles.smallIconContainer}>
                <Ionicons name="trending-up-outline" size={32} color="#5FA9F5" />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  fixedHeader: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    paddingBottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  titleImage: {
    height: 24,
    width: 80,
    marginLeft: -6,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#505050",
  },
  content: {
    padding: 24,
    gap: 16,
    flex: 1,
    justifyContent: "center",
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: "#F5F0FF",
    borderRadius: 50,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: "#505050",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  iconRow: {
    flexDirection: "row",
    gap: 24,
    alignItems: "center",
  },
  smallIconContainer: {
    padding: 12,
    backgroundColor: "#F0F7FF",
    borderRadius: 20,
  },
});
