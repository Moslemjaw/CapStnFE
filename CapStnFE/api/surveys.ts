import instance from ".";

export interface Survey {
  _id: string;
  title: string;
  description: string;
  rewardPoints: number;
  estimatedMinutes: number;
  draft: "published" | "unpublished";
  creatorId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SurveyResponse {
  message: string;
  survey?: Survey;
  surveys?: Survey[];
}

/**
 * Get all published surveys
 */
export const getPublishedSurveys = async (): Promise<Survey[]> => {
  try {
    const { data } = await instance.get<SurveyResponse>("/survey/published");
    return data.surveys || [];
  } catch (error) {
    console.error("Error fetching published surveys:", error);
    throw error;
  }
};

/**
 * Get survey by ID
 */
export const getSurveyById = async (id: string): Promise<Survey> => {
  try {
    const { data } = await instance.get<SurveyResponse>(`/survey/${id}`);
    if (!data.survey) {
      throw new Error("Survey not found");
    }
    return data.survey;
  } catch (error) {
    console.error("Error fetching survey by ID:", error);
    throw error;
  }
};

/**
 * Get all surveys
 */
export const getSurveys = async (): Promise<Survey[]> => {
  try {
    const { data } = await instance.get<SurveyResponse>("/survey/");
    return data.surveys || [];
  } catch (error) {
    console.error("Error fetching surveys:", error);
    throw error;
  }
};

