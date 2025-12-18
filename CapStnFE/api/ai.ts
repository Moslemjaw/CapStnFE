import instance from ".";

export interface Finding {
  title: string;
  description: string;
}

export interface Insight {
  theme: string;
  title: string;
  description: string;
  examples: string[];
}

export interface Correlation {
  description: string;
  evidence: string;
}

export interface SurveySummary {
  surveyId: string;
  responseCountUsed: number;
  findings: Finding[];
  insights: Insight[];
  correlations: Correlation[];
  caveats: string[];
}

export interface DataQuality {
  confidenceScore: number;
  confidenceExplanation: string;
  notes: string[];
}

export interface AnalysisData {
  overview: string;
  surveys: SurveySummary[];
  dataQualityNotes: DataQuality;
}

export interface AnalysisResponse {
  message?: string;
  analysisId: string;
  status: "processing" | "ready" | "failed";
  progress: number;
  type: "single" | "multi";
  data?: AnalysisData;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnalysisListResponse {
  message: string;
  analyses: AnalysisResponse[];
  count: number;
}

// Test AI API removed - only for backend testing

/**
 * Create AI Analysis
 * Endpoint: POST /analyse
 * Authentication: Required
 *
 * @param surveyIds - Single survey ID (string) or array of survey IDs
 */
export const createAnalysis = async (
  surveyIds: string | string[]
): Promise<AnalysisResponse> => {
  try {
    const { data } = await instance.post<AnalysisResponse>("/analyse", {
      surveyIds,
    });
    return data;
  } catch (error) {
    console.error("Error creating analysis:", error);
    throw error;
  }
};

/**
 * Get all analyses for authenticated user
 * Endpoint: GET /analyse
 * Authentication: Required
 */
export const getAllAnalyses = async (): Promise<AnalysisListResponse> => {
  try {
    const { data } = await instance.get<AnalysisListResponse>("/analyse");
    return data;
  } catch (error) {
    console.error("Error fetching analyses:", error);
    throw error;
  }
};

/**
 * Get analysis by ID
 * Endpoint: GET /analyse/:analysisId
 * Authentication: Required
 *
 * @param analysisId - The ID of the analysis to retrieve
 */
export const getAnalysisById = async (
  analysisId: string
): Promise<AnalysisResponse> => {
  try {
    const { data } = await instance.get<AnalysisResponse>(
      `/analyse/${analysisId}`
    );
    return data;
  } catch (error) {
    console.error("Error fetching analysis:", error);
    throw error;
  }
};
