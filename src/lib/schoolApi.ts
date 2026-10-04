import { DashboardSummary, EmployeeProfile, School, Student, StudentFormData } from '../types';
import { apiRequest } from './api';

export async function fetchUserProfile(_userId?: string): Promise<{
  profile: EmployeeProfile | null;
  error: string | null;
}> {
  const result = await apiRequest<{ profile: EmployeeProfile; user: { email: string } }>('/api/auth/session');
  return { profile: result.data?.profile || null, error: result.error };
}

export async function fetchDashboardSummary(): Promise<{
  summary: DashboardSummary | null;
  error: string | null;
}> {
  const result = await apiRequest<DashboardSummary>('/api/dashboard-summary');
  return { summary: result.data, error: result.error };
}

export async function fetchSchoolDetails(_schoolId?: number): Promise<{
  school: School | null;
  error: string | null;
}> {
  const result = await apiRequest<DashboardSummary>('/api/dashboard-summary');
  return { school: result.data?.school || null, error: result.error };
}

export async function fetchStudentsBySchool(_schoolId?: number): Promise<{
  students: Student[];
  error: string | null;
}> {
  const result = await apiRequest<Student[]>('/api/students');
  return { students: result.data || [], error: result.error };
}

export async function addStudent(
  formData: StudentFormData,
  _schoolId?: number
): Promise<{ student: Student | null; error: string | null }> {
  const result = await apiRequest<Student>('/api/students', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
  return { student: result.data, error: result.error };
}

export async function updateStudent(
  studentId: number,
  formData: StudentFormData,
  _schoolId?: number
): Promise<{ success: boolean; error: string | null }> {
  const result = await apiRequest<{ success: boolean }>(`/api/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(formData),
  });
  return { success: Boolean(result.data?.success), error: result.error };
}

export async function deleteStudent(
  studentId: number,
  _schoolId?: number
): Promise<{ success: boolean; error: string | null }> {
  const result = await apiRequest<{ success: boolean }>(`/api/students/${studentId}`, {
    method: 'DELETE',
  });
  return { success: Boolean(result.data?.success), error: result.error };
}

export async function fetchEmployeesBySchool(_schoolId?: number): Promise<{
  employees: EmployeeProfile[];
  error: string | null;
}> {
  const result = await apiRequest<EmployeeProfile[]>('/api/employees');
  return { employees: result.data || [], error: result.error };
}

export async function testBackendConnection(): Promise<{ success: boolean; message: string }> {
  const result = await apiRequest<{ service: string; status: string }>('/api/health');
  return { success: !result.error, message: result.error || 'SchoolOS backend is online.' };
}
