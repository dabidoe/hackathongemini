/**
 * Types for review-backed location tasks (Google reviews + Gemini).
 */

export interface ReviewLite {
  rating: number;
  text: string;
  author_name: string;
  time?: number;
}

export interface ReviewIntelTask {
  claim: string;
  question: string;
  type: "yes_no" | "photo" | "description";
  confidence: number;
  evidenceQuotes: string[];
}

export interface ReviewIntelOutput {
  consensusSummary: string;
  tasksToVerify: ReviewIntelTask[];
}
