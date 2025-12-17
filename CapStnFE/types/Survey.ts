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

export interface SurveyWithMetadata extends Survey {
  questionCount?: number;
  responseCount?: number;
  isAnswered?: boolean;
}

