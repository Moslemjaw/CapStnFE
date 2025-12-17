import instance from ".";

export interface Question {
  _id: string;
  surveyId: string;
  order: number;
  text: string;
  type: "text" | "multiple_choice" | "single_choice" | "dropdown" | "checkbox";
  options?: string[];
  isRequired: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface QuestionResponse {
  message: string;
  question?: Question;
  questions?: Question[];
}

/**
 * Get all questions for a survey
 */
export const getQuestionsBySurveyId = async (
  surveyId: string
): Promise<Question[]> => {
  try {
    const { data } = await instance.get<QuestionResponse>(
      `/question/survey/${surveyId}`
    );
    return data.questions || [];
  } catch (error) {
    console.error("Error fetching questions by survey ID:", error);
    throw error;
  }
};

/**
 * Get question by ID
 */
export const getQuestionById = async (id: string): Promise<Question> => {
  try {
    const { data } = await instance.get<QuestionResponse>(`/question/${id}`);
    if (!data.question) {
      throw new Error("Question not found");
    }
    return data.question;
  } catch (error) {
    console.error("Error fetching question by ID:", error);
    throw error;
  }
};

