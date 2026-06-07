/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Difficulty = 'Junior' | 'Mid-Level' | 'Senior';

export type QuestionCategory = 'Behavioral' | 'Technical' | 'Situational' | 'Role-Specific';

export interface Interviewer {
  id: string;
  name: string;
  title: string;
  avatar: string; // Emoji description or display icon
  colorClass: string; // Tailwind theme accent
  borderColorClass: string;
  persona: string;
  description: string;
  welcomeMessage: string;
}

export interface InterviewTopic {
  id: string;
  title: string;
  icon: string; // Lucide icon identifier
  description: string;
  difficultyLevels: string[];
}

export interface GeneratedQuestion {
  question: string;
  hint: string;
  expectedKeywords: string[];
  category: QuestionCategory;
}

export interface ScorecardMetric {
  score: number; // Score between 0 and 100
  notes: string; // Specific constructive observation about this exact criteria
}

export interface FeedbackScorecard {
  clarity: ScorecardMetric;
  relevance: ScorecardMetric;
  completeness: ScorecardMetric;
  confidence: ScorecardMetric;
}

export interface EvaluationResult {
  score: number;
  rating: 'Outstanding' | 'Proficient' | 'Good' | 'Needs Improvement';
  strengths: string[];
  missedConcepts: string[];
  detailedFeedback: string;
  exemplaryAnswer: string;
  scorecard: FeedbackScorecard;
}

export interface RoundHistoryItem {
  roundNumber: number;
  topic: string;
  difficulty: Difficulty;
  category: QuestionCategory;
  interviewerName: string;
  question: string;
  candidateAnswer: string;
  evaluation?: EvaluationResult;
  timestamp: string;
}

export interface InterviewSession {
  id: string;
  difficulty: Difficulty;
  topic: string;
  interviewerId: string;
  roundsCount: number; // e.g. 3 or 5
  status: 'SETUP' | 'INTERVIEWING' | 'EVALUATING' | 'COMPLETED';
  currentRoundIndex: number;
  history: RoundHistoryItem[];
}
