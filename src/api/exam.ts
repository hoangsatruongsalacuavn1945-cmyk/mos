/**
 * Exam & Submission API Endpoints
 */

import { apiClient } from './client';
import {
  ExamStartRequest,
  ExamStartResponseData,
  ExamAutosaveRequest,
  ExamViolationRequest,
  ExamViolationResponseData,
  ExamSubmitRequest,
  ExamSubmitResponseData,
  LeaderboardResponseData,
  SubmissionItemDto,
} from './types/exam';

export const examApi = {
  start: (data: ExamStartRequest) =>
    apiClient.post<ExamStartResponseData>('/api/exam/start', data),

  autosave: (data: ExamAutosaveRequest) =>
    apiClient.post<{ success: boolean; lastSavedAt: string }>('/api/exam/autosave', data),

  recordViolation: (data: ExamViolationRequest) =>
    apiClient.post<ExamViolationResponseData>('/api/exam/violation', data),

  submit: (data: ExamSubmitRequest) =>
    apiClient.post<ExamSubmitResponseData>('/api/exam/submit', data),

  getLeaderboard: (subject = 'all') =>
    apiClient.get<LeaderboardResponseData>('/api/leaderboard', { params: { subject } }),

  getAttempt: (id: string) =>
    apiClient.get<{ attempt: SubmissionItemDto }>(`/api/attempts/${encodeURIComponent(id)}`),
};
