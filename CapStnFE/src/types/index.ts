/**
 * TypeScript type definitions for SIGHT app
 */

// Navigation types
export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  Tutorial: undefined;
  PathSelection: undefined;
  // Participant flow screens
  ParticipantHome: undefined;
  Survey: {
    surveyId: string;
    surveyTitle: string;
    points: number;
    questionsCount: number;
    duration: number;
  };
  SurveyCompleted: {
    surveyTitle: string;
    points: number;
    duration: number;
  };
  // Researcher flow screens
  ResearcherDashboard: undefined;
  CreateSurvey: {
    surveyId?: string;
  };
  SurveyPreview: {
    surveyId: string;
  };
  SurveyCreated: {
    surveyId: string;
    surveyTitle: string;
    questionsCount: number;
  };
  SurveyArchived: {
    surveyId: string;
    surveyTitle: string;
    questionsCount: number;
  };
};

// User types (for future backend integration)
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Auth types (for future backend integration)
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Button component types
export type ButtonVariant = 'primary' | 'secondary' | 'outline';

