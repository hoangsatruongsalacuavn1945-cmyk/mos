/**
 * Auth API Endpoints
 */

import { apiClient } from './client';
import {
  LoginRequestBody,
  RegisterRequestBody,
  AuthLoginResponseData,
  AuthRegisterResponseData,
  TeachersListResponseData,
} from './types/auth';

export const authApi = {
  login: (data: LoginRequestBody) =>
    apiClient.post<AuthLoginResponseData>('/api/auth/login', data, { skipAuth: true }),

  quickLogin: (data: { email: string; role?: string }) =>
    apiClient.post<AuthLoginResponseData>('/api/auth/quick-login', data, { skipAuth: true }),

  register: (data: RegisterRequestBody) =>
    apiClient.post<AuthRegisterResponseData>('/api/auth/register', data, { skipAuth: true }),

  getTeachers: () =>
    apiClient.get<TeachersListResponseData>('/api/auth/teachers', { skipAuth: true }),
};
