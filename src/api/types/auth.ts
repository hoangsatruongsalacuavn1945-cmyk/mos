/**
 * Standardized Authentication & User API Interfaces
 * Bridges DB user representations and Frontend state representations.
 */

import { UserRole } from '../../types/user';

/**
 * Clean, safe User DTO exposed via API (excludes password hashes, secrets)
 */
export interface ApiUser {
  id: string;
  email: string;
  name: string;
  fullName: string;
  role: UserRole;
  studentCode?: string | null;
  classRoom?: string | null;
  targetSubject?: 'word' | 'excel' | 'powerpoint' | 'mixed' | 'all';
  teachingSubjects?: string[];
  assignedTeacherId?: string | null;
  assignedTeacherName?: string | null;
  assignedTeacherEmail?: string | null;
  status: 'active' | 'suspended' | 'inactive';
  streakDays: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherPublicDto {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  subject: 'word' | 'excel' | 'powerpoint' | 'all';
  teachingSubjects?: string[];
  activeStudentsCount?: number;
  avatarBg?: string;
}

// Request Payloads
export interface LoginRequestBody {
  email: string;
  password?: string;
  studentCode?: string;
  role?: UserRole;
}

export interface RegisterRequestBody {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  studentCode?: string;
  classRoom?: string;
  assignedTeacherId?: string;
  targetSubject?: string;
}

// Standardized Auth Responses
export interface AuthLoginResponseData {
  user: ApiUser;
  token: string;
  expiresIn?: number;
}

export interface AuthRegisterResponseData {
  user: ApiUser;
  token: string;
}

export interface AuthSessionResponseData {
  user: ApiUser;
  valid: boolean;
}

export interface TeachersListResponseData {
  teachers: TeacherPublicDto[];
  total: number;
}
