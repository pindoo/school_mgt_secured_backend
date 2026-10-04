
import { apiRequest } from './api';
import { EmployeeProfile } from '../types';

export async function loginWithBackend(email: string, password: string): Promise<{
  success: boolean;
  profile?: EmployeeProfile;
  email?: string;
  error?: string;
}> {
  const result = await apiRequest<{ user: { email: string }; profile: EmployeeProfile }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (result.error || !result.data) {
    return { success: false, error: result.error || 'Authentication failed.' };
  }

  return {
    success: true,
    profile: result.data.profile,
    email: result.data.user.email,
  };
}

export async function getBackendSession(): Promise<{
  authenticated: boolean;
  profile: EmployeeProfile | null;
  email: string;
  error: string | null;
}> {
  const result = await apiRequest<{ user: { email: string }; profile: EmployeeProfile }>('/api/auth/session');
  if (result.error || !result.data) {
    return { authenticated: false, profile: null, email: '', error: result.error };
  }
  return {
    authenticated: true,
    profile: result.data.profile,
    email: result.data.user.email,
    error: null,
  };
}

export async function logoutFromBackend() {
  return apiRequest('/api/auth/logout', { method: 'POST', body: '{}' });
}

export async function requestPasswordReset(email: string) {
  return apiRequest<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function establishRecoverySession(accessToken: string, refreshToken: string) {
  return apiRequest('/api/auth/recovery', {
    method: 'POST',
    body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
  });
}

export async function updatePassword(password: string) {
  return apiRequest<{ message: string }>('/api/auth/password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}
