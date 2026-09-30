/**
 * Standardized Admin & Management API Interfaces
 */

import { ApiUser } from './auth';

export interface AuditLogItemDto {
  id: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  target?: string;
  details?: Record<string, unknown> | string;
  ip?: string;
  timestamp: string;
}

export interface AdminUsersListResponseData {
  users: ApiUser[];
  total: number;
}

export interface AdminAuditLogsResponseData {
  logs: AuditLogItemDto[];
  total: number;
}

export interface CreateTeacherRequestBody {
  name: string;
  email: string;
  password?: string;
  subject: 'word' | 'excel' | 'powerpoint' | 'all';
  title?: string;
  department?: string;
  phone?: string;
}

export interface BackupSheetsResponseData {
  success: boolean;
  spreadsheetUrl?: string;
  message?: string;
  syncedRowsCount?: number;
  syncedAt: string;
}
