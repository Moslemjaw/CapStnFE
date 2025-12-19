import { StyleSheet, Text, View, ScrollView, Image } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useBottomNavHeight } from "@/utils/bottomNavHeight";

export default function ResearcherHome() {
  const bottomNavHeight = useBottomNavHeight();

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Image
              source={require("@/assets/title.png")}
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Discover Insights</Text>
          <Text style={styles.subtitle}>Real data, real people, real patterns</Text>
          <LinearGradient
            colors={["#5FA9F5", "#8A4DE8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + 16 }]}
      >
        <View style={styles.content}>
          {/* Content will be added here later */}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: 24,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  titleImage: {
    height: 24,
    width: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#505050",
    marginBottom: 16,
  },
  divider: {
    height: 2,
    borderRadius: 1,
  },
  content: {
    padding: 24,
    gap: 16,
  },
});
