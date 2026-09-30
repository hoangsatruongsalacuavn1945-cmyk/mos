/**
 * Standardized Exam & Submission API Interfaces
 * Resolves discrepancies between DB exam records and frontend test runners.
 */

import { MOSSubject } from '../../types/mos';

export interface ApiQuestionOption {
  id: string;
  text: string;
}

/**
 * Safe client-side question DTO (without answer keys or explanations during test)
 */
export interface SafeExamQuestionDto {
  id: string;
  subject: MOSSubject;
  domainId: string;
  domainName: string;
  title: string;
  scenario?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple-choice' | 'scenario-task' | 'ribbon-locate' | 'shortcut-drill';
  points: number;
  options: ApiQuestionOption[];
}

export interface ExamStartRequest {
  subject: MOSSubject;
  questionCount?: number;
  studentId?: string;
  studentName?: string;
}

export interface ExamStartResponseData {
  sessionId: string;
  sessionToken: string;
  subject: MOSSubject;
  expiresAt: string;
  durationMinutes: number;
  questions: SafeExamQuestionDto[];
}

export interface ExamAutosaveRequest {
  sessionId: string;
  answers: Record<string, string>;
  remainingSeconds: number;
  violationsCount?: number;
}

export interface ExamViolationRequest {
  sessionId: string;
  reason: string;
  timestamp: string;
}

export interface ExamViolationResponseData {
  violationsCount: number;
  maxViolations: number;
  isTerminated: boolean;
  message?: string;
}

export interface ExamSubmitRequest {
  sessionId: string;
  sessionToken: string;
  subject: MOSSubject;
  userAnswers: Record<string, string>;
  timeSpentSeconds: number;
  violationsCount?: number;
  antiCheatLogs?: string[];
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  classRoom?: string;
}

export interface DomainScoreDto {
  total: number;
  correct: number;
  percentage: number;
}

export interface WrongQuestionDetailDto {
  title: string;
  domainName: string;
  userAnswerText: string;
  correctAnswerText: string;
  officialRibbonPath: string;
  explanation: string;
}

export interface ExamSubmitResponseData {
  submissionId: string;
  subject: MOSSubject;
  score: number; // 0 - 1000
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  violationsCount: number;
  domainScores: Record<string, DomainScoreDto>;
  wrongQuestions: WrongQuestionDetailDto[];
  submittedAt: string;
}

export interface LeaderboardItemDto {
  rank: number;
  studentName: string;
  studentCode: string;
  classRoom: string;
  subject: MOSSubject;
  score: number;
  timeSpentSeconds: number;
  submittedAt: string;
}

export interface LeaderboardResponseData {
  leaderboard: LeaderboardItemDto[];
  total: number;
  subject: string;
}

export interface SubmissionItemDto {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classRoom: string;
  subject: MOSSubject;
  type: 'mock-exam' | 'practical' | 'theory-quiz' | 'file-grader';
  score: number;
  passed: boolean;
  timeSpentSeconds: number;
  totalQuestions: number;
  correctCount: number;
  teacherId?: string;
  teacherName?: string;
  teacherFeedback?: string;
  teacherFeedbackAt?: string;
  teacherRating?: 'excellent' | 'good' | 'needs-improvement';
  violationsCount: number;
  status: 'pending' | 'reviewed';
  submittedAt: string;
}
