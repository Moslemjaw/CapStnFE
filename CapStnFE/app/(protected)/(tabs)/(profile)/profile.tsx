import { me } from "@/api/auth";
import { deleteToken } from "@/api/storage";
import AuthContext from "@/context/AuthContext";
import { getImageUrl } from "@/utils/imageUtils";
import { formatCookingTime } from "@/utils/timeUtils";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const { setIsAutheticated } = useContext(AuthContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(
    null
  );

  // Fetch current user data (priority - show this first)
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: me,
    staleTime: 30000, // Cache for 30 seconds
    retry: 2,
    retryDelay: 1000,
  });

  const handleLogout = async () => {
    console.log("handleLogout called");

    const performLogout = async () => {
      console.log("Logout confirmed - deleting token...");
      try {
        await deleteToken();
        console.log("Token deleted - setting auth to false...");
        setIsAutheticated(false);
        console.log("Auth set to false - navigating to login...");
        router.replace("/(auth)/login" as any);
      } catch (error) {
        console.error("Error during logout:", error);
        Alert.alert("Error", "Failed to logout. Please try again.");
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to logout?");
      if (confirmed) {
        await performLogout();
      } else {
        console.log("User cancelled logout (web)");
      }
    } else {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            console.log("User cancelled logout");
          },
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: performLogout,
        },
      ]);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    ></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  logoutIconButton: {
    position: "absolute",
    top: 12,
    right: 16,
    zIndex: 1000,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  profileImageContainer: {
    marginRight: 32,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImagePlaceholderText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  ratingStatContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userInfo: {
    padding: 20,
    paddingBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  recipesSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  recipeGridItemWrapper: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  loadingRecipesContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  recipesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -1,
  },
  recipeGridItem: {
    width: "33.333%",
    aspectRatio: 1,
    padding: 1,
  },
  recipeGridItemInner: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  },
  recipeGridImage: {
    width: "100%",
    height: "100%",
  },
  recipeGridPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  recipeGridPlaceholderText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  recipeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    paddingHorizontal: 10,
  },
  recipeTitleOverlay: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  recipeTimeOverlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeTimeText: {
    fontSize: 11,
    color: "#FFFFFF",
  },
  emptyRecipesContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyRecipesText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  createRecipeButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createRecipeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
