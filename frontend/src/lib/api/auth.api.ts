import api from '../api';
import { AuthResponse } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: 'mechanic' | 'cashier';
  phone?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface CreateAgentPayload {
  email: string;
  full_name: string;
  phone?: string;
  role: 'mechanic' | 'cashier';
}

export interface UpdateAgentPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: 'mechanic' | 'cashier';
  is_active?: boolean;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refresh_token: string) =>
    api.post<RefreshResponse>('/auth/refresh', { refresh_token }).then((r) => r.data),

  logout: () =>
    api.post('/auth/logout').then((r) => r.data),

  register: (data: RegisterPayload) =>
    api.post('/auth/register', data).then((r) => r.data),

  createAgent: (data: CreateAgentPayload) =>
    api.post('/auth/create-agent', data).then((r) => r.data),

  getAgents: () =>
    api.get('/auth/agents').then((r) => r.data),

  updateAgent: (id: string, data: UpdateAgentPayload) =>
    api.patch(`/auth/agents/${id}`, data).then((r) => r.data),

  deleteAgent: (id: string) =>
    api.delete(`/auth/agents/${id}`).then((r) => r.data),

  getProfile: () =>
    api.get('/auth/me').then((r) => r.data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    api.post('/auth/forgot-password', data).then((r) => r.data),

  resetPassword: (data: ResetPasswordPayload) =>
    api.post('/auth/reset-password', data).then((r) => r.data),

  verifyResetToken: (token: string) =>
    api.post('/auth/verify-reset-token', { token }).then((r) => r.data),
};
