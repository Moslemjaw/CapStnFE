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

/**
 * Create a new question
 */
export interface CreateQuestionData {
  surveyId: string;
  order: number;
  text: string;
  type: "text" | "multiple_choice" | "single_choice" | "dropdown" | "checkbox";
  options?: string[];
  isRequired: boolean;
}

export const createQuestion = async (
  questionData: CreateQuestionData
): Promise<Question> => {
  try {
    const { data } = await instance.post<QuestionResponse>(
      "/question",
      questionData
    );
    if (!data.question) {
      throw new Error("Failed to create question");
    }
    return data.question;
  } catch (error) {
    console.error("Error creating question:", error);
    throw error;
  }
};

/**
 * Update a question
 */
export interface UpdateQuestionData {
  order?: number;
  text?: string;
  type?: "text" | "multiple_choice" | "single_choice" | "dropdown" | "checkbox";
  options?: string[];
  isRequired?: boolean;
}

export const updateQuestion = async (
  id: string,
  questionData: UpdateQuestionData
): Promise<Question> => {
  try {
    const { data } = await instance.put<QuestionResponse>(
      `/question/${id}`,
      questionData
    );
    if (!data.question) {
      throw new Error("Failed to update question");
    }
    return data.question;
  } catch (error) {
    console.error("Error updating question:", error);
    throw error;
  }
};

/**
 * Delete a question
 */
export const deleteQuestion = async (id: string): Promise<void> => {
  try {
    await instance.delete(`/question/${id}`);
  } catch (error) {
    console.error("Error deleting question:", error);
    throw error;
  }
};
