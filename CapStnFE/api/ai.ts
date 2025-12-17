import instance from ".";

/**
 * Test AI connection and get analysis response
 * This endpoint tests the AI API connection
 */
export const testAI = async () => {
  try {
    const { data } = await instance.post("/api/ai/test");
    return data;
  } catch (error) {
    console.error("AI test error:", error);
    throw error;
  }
};

/**
 * Analyze survey data using AI
 * This will be implemented when we have survey data to analyze
 */
export const analyzeSurveyData = async (surveyData: any) => {
  try {
    // This endpoint will be implemented in the backend
    const { data } = await instance.post("/api/ai/analyze", surveyData);
    return data;
  } catch (error) {
    console.error("AI analysis error:", error);
    throw error;
  }
};
