import instance from ".";

export interface Answer {
  questionId: string;
  value: string;
}

export interface Response {
  _id: string;
  surveyId: string;
  userId: string;
  startedAt?: string;
  submittedAt: string;
  durationMs?: number;
  isFlaggedSpam?: boolean;
  trustImpact?: number;
  answers: Answer[];
  createdAt?: string;
  updatedAt?: string;
}

interface ResponseData {
  message: string;
  response?: Response;
  responses?: Response[];
}

/**
 * Get all responses for a survey
 */
export const getResponsesBySurveyId = async (
  surveyId: string
): Promise<Response[]> => {
  try {
    const { data } = await instance.get<ResponseData>(
      `/response/survey/${surveyId}`
    );
    return data.responses || [];
  } catch (error) {
    console.error("Error fetching responses by survey ID:", error);
    throw error;
  }
};

/**
 * Get all responses by a user
 */
export const getResponsesByUserId = async (
  userId: string
): Promise<Response[]> => {
  try {
    const { data } = await instance.get<ResponseData>(
      `/response/user/${userId}`
    );
    return data.responses || [];
  } catch (error) {
    console.error("Error fetching responses by user ID:", error);
    throw error;
  }
};

/**
 * Get response by ID
 */
export const getResponseById = async (id: string): Promise<Response> => {
  try {
    const { data } = await instance.get<ResponseData>(`/response/${id}`);
    if (!data.response) {
      throw new Error("Response not found");
    }
    return data.response;
  } catch (error) {
    console.error("Error fetching response by ID:", error);
    throw error;
  }
};

