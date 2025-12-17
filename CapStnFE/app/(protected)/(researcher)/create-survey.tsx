import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createSurvey, CreateSurveyData } from "@/api/surveys";
import { getUser } from "@/api/storage";
import User from "@/types/User";

export default function CreateSurvey() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardPoints, setRewardPoints] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    rewardPoints?: string;
    estimatedMinutes?: string;
  }>({});

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await getUser();
    setUser(userData);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!rewardPoints.trim()) {
      newErrors.rewardPoints = "Reward points is required";
    } else {
      const points = parseInt(rewardPoints, 10);
      if (isNaN(points) || points < 0) {
        newErrors.rewardPoints = "Reward points must be a positive number";
      }
    }

    if (!estimatedMinutes.trim()) {
      newErrors.estimatedMinutes = "Estimated minutes is required";
    } else {
      const minutes = parseInt(estimatedMinutes, 10);
      if (isNaN(minutes) || minutes < 1) {
        newErrors.estimatedMinutes =
          "Estimated minutes must be at least 1";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user?._id) {
      return;
    }

    setLoading(true);
    try {
      const surveyData: CreateSurveyData = {
        title: title.trim(),
        description: description.trim(),
        rewardPoints: parseInt(rewardPoints, 10),
        estimatedMinutes: parseInt(estimatedMinutes, 10),
        creatorId: user._id,
      };

      await createSurvey(surveyData);
      Alert.alert("Success", "Survey created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      console.error("Error creating survey:", err);
      Alert.alert(
        "Error",
        err.message || "Failed to create survey. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* Title Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Enter survey title"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) {
                    setErrors({ ...errors, title: undefined });
                  }
                }}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            {/* Description Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.description && styles.inputError,
                ]}
                placeholder="Enter survey description"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (errors.description) {
                    setErrors({ ...errors, description: undefined });
                  }
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Reward Points Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Reward Points <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.rewardPoints && styles.inputError]}
                placeholder="Enter reward points"
                placeholderTextColor="#9CA3AF"
                value={rewardPoints}
                onChangeText={(text) => {
                  setRewardPoints(text.replace(/[^0-9]/g, ""));
                  if (errors.rewardPoints) {
                    setErrors({ ...errors, rewardPoints: undefined });
                  }
                }}
                keyboardType="number-pad"
              />
              {errors.rewardPoints && (
                <Text style={styles.errorText}>{errors.rewardPoints}</Text>
              )}
            </View>

            {/* Estimated Minutes Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Estimated Minutes <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errors.estimatedMinutes && styles.inputError,
                ]}
                placeholder="Enter estimated time in minutes"
                placeholderTextColor="#9CA3AF"
                value={estimatedMinutes}
                onChangeText={(text) => {
                  setEstimatedMinutes(text.replace(/[^0-9]/g, ""));
                  if (errors.estimatedMinutes) {
                    setErrors({ ...errors, estimatedMinutes: undefined });
                  }
                }}
                keyboardType="number-pad"
              />
              {errors.estimatedMinutes && (
                <Text style={styles.errorText}>{errors.estimatedMinutes}</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Create Survey</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  form: {
    gap: 20,
  },
  fieldContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#EF4444",
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
