/**
 * Admin Management API Endpoints
 */

import { apiClient } from './client';
import {
  AdminUsersListResponseData,
  AdminAuditLogsResponseData,
  CreateTeacherRequestBody,
  BackupSheetsResponseData,
} from './types/admin';

export const adminApi = {
  getUsers: () =>
    apiClient.get<AdminUsersListResponseData>('/api/admin/users'),

  getAuditLogs: (params?: { page?: number; limit?: number }) =>
    apiClient.get<AdminAuditLogsResponseData>('/api/admin/audit-logs', { params }),

  createTeacher: (data: CreateTeacherRequestBody) =>
    apiClient.post<{ success: boolean; teacher: any }>('/api/admin/create-teacher', data),

  backupSheets: () =>
    apiClient.post<BackupSheetsResponseData>('/api/admin/backup-sheets'),
};
