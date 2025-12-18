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
 * Get all unpublished surveys
 */
export const getUnpublishedSurveys = async (): Promise<Survey[]> => {
  try {
    const { data } = await instance.get<SurveyResponse>("/survey/unpublished");
    return data.surveys || [];
  } catch (error) {
    console.error("Error fetching unpublished surveys:", error);
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
 * Get all surveys (both published and unpublished)
 */
export const getSurveys = async (): Promise<Survey[]> => {
  try {
    // Fetch both published and unpublished surveys
    const [published, unpublished] = await Promise.all([
      getPublishedSurveys(),
      getUnpublishedSurveys(),
    ]);
    return [...published, ...unpublished];
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
    // Fetch both published and unpublished surveys, then filter by creatorId
    const [published, unpublished] = await Promise.all([
      getPublishedSurveys(),
      getUnpublishedSurveys(),
    ]);
    const allSurveys = [...published, ...unpublished];
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
    const { data } = await instance.post<SurveyResponse>("/survey", surveyData);
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

/**
 * Update a survey
 */
export interface UpdateSurveyData {
  title?: string;
  description?: string;
  rewardPoints?: number;
  estimatedMinutes?: number;
}

export const updateSurvey = async (
  surveyId: string,
  surveyData: UpdateSurveyData
): Promise<Survey> => {
  try {
    const { data } = await instance.put<SurveyResponse>(
      `/survey/${surveyId}`,
      surveyData
    );
    if (!data.survey) {
      throw new Error("Failed to update survey");
    }
    return data.survey;
  } catch (error) {
    console.error("Error updating survey:", error);
    throw error;
  }
};
