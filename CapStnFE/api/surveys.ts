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

/**
 * Get surveys by creator ID
 */
export const getSurveysByCreatorId = async (
  creatorId: string
): Promise<Survey[]> => {
  try {
    const allSurveys = await getSurveys();
    return allSurveys.filter((survey) => survey.creatorId === creatorId);
  } catch (error) {
    console.error("Error fetching surveys by creator ID:", error);
    throw error;
  }
};

/**
 * Create a new survey
 */
export interface CreateSurveyData {
  title: string;
  description: string;
  rewardPoints: number;
  estimatedMinutes: number;
  creatorId: string;
}

export const createSurvey = async (
  surveyData: CreateSurveyData
): Promise<Survey> => {
  try {
    const { data } = await instance.post<SurveyResponse>(
      "/survey/",
      surveyData
    );
    if (!data.survey) {
      throw new Error("Failed to create survey");
    }
    return data.survey;
  } catch (error) {
    console.error("Error creating survey:", error);
    throw error;
  }
};

/**
 * Publish a survey
 */
export const publishSurvey = async (surveyId: string): Promise<Survey> => {
  try {
    const { data } = await instance.post<SurveyResponse>(
      `/survey/publish/${surveyId}`
    );
    if (!data.survey) {
      throw new Error("Failed to publish survey");
    }
    return data.survey;
  } catch (error) {
    console.error("Error publishing survey:", error);
    throw error;
  }
};

/**
 * Unpublish a survey
 */
export const unpublishSurvey = async (surveyId: string): Promise<Survey> => {
  try {
    const { data } = await instance.post<SurveyResponse>(
      `/survey/unpublish/${surveyId}`
    );
    if (!data.survey) {
      throw new Error("Failed to unpublish survey");
    }
    return data.survey;
  } catch (error) {
    console.error("Error unpublishing survey:", error);
    throw error;
  }
};
