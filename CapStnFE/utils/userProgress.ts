import { getResponsesByUserId } from "@/api/responses";
import { getUser, storeUser } from "@/api/storage";
import User from "@/types/User";

/**
 * Calculates streak based on user responses
 * Streak increments by 1 each day a survey is answered
 * If a day is missed, streak resets to 1
 * 
 * Logic:
 * - Get all unique dates when surveys were answered
 * - Check if answered today
 * - If yes, check consecutive days backwards
 * - If yesterday was answered, increment streak
 * - If there's a gap, reset to 1
 */
export const calculateStreak = async (userId: string): Promise<number> => {
  try {
    // Get all user responses
    const responses = await getResponsesByUserId(userId);

    if (responses.length === 0) {
      return 0;
    }

    // Get unique dates when surveys were answered (normalize to start of day)
    const answeredDatesSet = new Set<string>();
    responses.forEach((response) => {
      if (response.submittedAt) {
        const date = new Date(response.submittedAt);
        date.setHours(0, 0, 0, 0);
        answeredDatesSet.add(date.toISOString());
      }
    });

    if (answeredDatesSet.size === 0) {
      return 0;
    }

    // Convert to Date objects and sort (most recent first)
    const answeredDates = Array.from(answeredDatesSet)
      .map((iso) => new Date(iso))
      .sort((a, b) => b.getTime() - a.getTime());

    // Get today's date (normalized to start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user answered today
    const mostRecentDate = answeredDates[0];
    const answeredToday = mostRecentDate.getTime() === today.getTime();

    if (!answeredToday) {
      // If no survey today, streak is 0
      return 0;
    }

    // Calculate consecutive days starting from today
    let streak = 1; // Today counts as day 1
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday

    // Check consecutive days backwards
    for (let i = 1; i < answeredDates.length; i++) {
      const answeredDate = answeredDates[i];
      answeredDate.setHours(0, 0, 0, 0);

      // Check if this date matches the expected consecutive date
      if (answeredDate.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // Move to previous day
      } else if (answeredDate.getTime() < checkDate.getTime()) {
        // Gap found - there's a missing day, streak ends
        break;
      }
      // If answeredDate > checkDate, continue (might be duplicate or out of order)
    }

    return streak;
  } catch (error) {
    console.error("Error calculating streak:", error);
    return 0;
  }
};

/**
 * Updates user progress (points and streak) after answering a survey
 */
export const updateUserProgress = async (
  surveyId: string,
  rewardPoints: number
): Promise<void> => {
  try {
    const user = await getUser();
    if (!user || !user._id) {
      console.error("User not found");
      return;
    }

    // Calculate new streak
    const newStreak = await calculateStreak(user._id);

    // Calculate new points
    const currentPoints = user.points || 0;
    const newPoints = currentPoints + rewardPoints;

    // Calculate new level (1 level per 100 points)
    const newLevel = Math.floor(newPoints / 100) + 1;

    // Update user
    const updatedUser: User = {
      ...user,
      points: newPoints,
      streakDays: newStreak,
      level: newLevel,
    };

    // Store updated user
    await storeUser(updatedUser);

    console.log("User progress updated:", {
      points: newPoints,
      streak: newStreak,
      level: newLevel,
    });
  } catch (error) {
    console.error("Error updating user progress:", error);
  }
};

