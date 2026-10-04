
import { EmployeeProfile, School, Student, StudentFormData } from '../types';
import {
  isMockModeActive,
  getMockStoredEmployees,
  getMockSchoolDetails,
  getMockStudentsBySchool,
  getMockEmployeesBySchool,
  addMockStudent,
  updateMockStudent,
  deleteMockStudent,
} from './mockStore';
import { apiRequest } from './api';

function apiError(error: string | null) {
  return error || 'Operation failed.';
}

export async function fetchUserProfile(_userId?: string): Promise<{
  profile: EmployeeProfile | null;
  error: string | null;
}> {
  if (isMockModeActive()) {
    const employees = getMockStoredEmployees();
    const found = employees.find(
      (e) => e.user_id === _userId || e.id === _userId || e.email?.toLowerCase() === _userId?.toLowerCase()
    );
    if (!found) return { profile: null, error: null };
    return {
      profile: {
        id: found.id,
        user_id: found.user_id,
        school_id: found.school_id,
        role: found.role,
        full_name: found.full_name,
      },
      error: null,
    };
  }

  const result = await apiRequest<{ profile: EmployeeProfile; user: { email: string } }>('/api/auth/session');
  return {
    profile: result.data?.profile || null,
    error: result.error,
  };
}

export async function fetchSchoolDetails(_schoolId?: number): Promise<{
  school: School | null;
  error: string | null;
}> {
  if (isMockModeActive()) {
    return { school: getMockSchoolDetails(_schoolId || 0), error: null };
  }

  const result = await apiRequest<{ school: School; students: Student[]; employees: EmployeeProfile[] }>('/api/bootstrap');
  return { school: result.data?.school || null, error: result.error };
}

export async function fetchStudentsBySchool(_schoolId?: number): Promise<{
  students: Student[];
  error: string | null;
}> {
  if (isMockModeActive()) {
    return { students: getMockStudentsBySchool(_schoolId || 0), error: null };
  }

  const result = await apiRequest<Student[]>('/api/students');
  return { students: result.data || [], error: result.error };
}

export function formatSupabaseError(error: any): string {
  return error?.message || String(error || 'An unexpected error occurred.');
}

export async function addStudent(
  formData: StudentFormData,
  _schoolId?: number
): Promise<{ student: Student | null; error: string | null }> {
  if (isMockModeActive()) {
    const created = addMockStudent(formData, _schoolId || 0);
    return { student: created, error: null };
  }

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
  if (isMockModeActive()) {
    const updated = updateMockStudent(studentId, formData, _schoolId || 0);
    return { success: updated, error: updated ? null : 'Student record not found.' };
  }

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
  if (isMockModeActive()) {
    const deleted = deleteMockStudent(studentId, _schoolId || 0);
    return { success: deleted, error: deleted ? null : 'Student record not found.' };
  }

  const result = await apiRequest<{ success: boolean }>(`/api/students/${studentId}`, {
    method: 'DELETE',
  });

  return { success: Boolean(result.data?.success), error: result.error };
}

export async function testCrossSchoolSecurity(currentSchoolId: number): Promise<{
  testedSchoolId: number;
  result: 'blocked_zero_rows' | 'rejected_error' | 'leaked';
  message: string;
  rowCount: number;
}> {
  const targetSchoolId = currentSchoolId === 1 ? 2 : 1;

  if (isMockModeActive()) {
    return {
      testedSchoolId: targetSchoolId,
      result: 'blocked_zero_rows',
      message: 'Cross-school access blocked in sandbox mode.',
      rowCount: 0,
    };
  }

  const result = await testQuerySchool(targetSchoolId);
  return {
    testedSchoolId: targetSchoolId,
    result: result.blocked ? (result.error ? 'rejected_error' : 'blocked_zero_rows') : 'leaked',
    message: result.message,
    rowCount: result.rowCount,
  };
}

export async function testUnauthorizedDelete(
  studentId: number,
  targetSchoolId: number
): Promise<{ rejected: boolean; error: string | null; message: string }> {
  if (isMockModeActive()) {
    return { rejected: true, error: null, message: 'DELETE blocked in sandbox mode.' };
  }

  const result = await apiRequest<{ rejected: boolean; error: string | null; message: string }>(
    '/api/security/unauthorized-delete',
    { method: 'POST', body: JSON.stringify({ studentId, schoolId: targetSchoolId }) }
  );
  return result.data || {
    rejected: true,
    error: result.error,
    message: apiError(result.error),
  };
}

export async function testQuerySchool(targetSchoolId: number): Promise<{
  testedSchoolId: number;
  rowCount: number;
  error: string | null;
  blocked: boolean;
  message: string;
}> {
  if (isMockModeActive()) {
    return {
      testedSchoolId: targetSchoolId,
      rowCount: 0,
      error: null,
      blocked: true,
      message: `Access blocked: 0 records returned for School #${targetSchoolId}.`,
    };
  }

  const result = await apiRequest<{
    testedSchoolId: number;
    rowCount: number;
    error: string | null;
    blocked: boolean;
    message: string;
  }>(`/api/security/query-school?schoolId=${encodeURIComponent(targetSchoolId)}`);

  return result.data || {
    testedSchoolId: targetSchoolId,
    rowCount: 0,
    error: result.error,
    blocked: true,
    message: apiError(result.error),
  };
}

export async function testUnauthorizedInsert(
  targetSchoolId: number
): Promise<{ rejected: boolean; error: string | null; message: string }> {
  if (isMockModeActive()) {
    return { rejected: true, error: null, message: 'Insert blocked in sandbox mode.' };
  }

  const result = await apiRequest<{ rejected: boolean; error: string | null; message: string }>(
    '/api/security/unauthorized-insert',
    { method: 'POST', body: JSON.stringify({ schoolId: targetSchoolId }) }
  );
  return result.data || {
    rejected: true,
    error: result.error,
    message: apiError(result.error),
  };
}

export async function fetchEmployeesBySchool(_schoolId?: number): Promise<{
  employees: EmployeeProfile[];
  error: string | null;
}> {
  if (isMockModeActive()) {
    return { employees: getMockEmployeesBySchool(_schoolId || 0), error: null };
  }

  const result = await apiRequest<{ school: School; students: Student[]; employees: EmployeeProfile[] }>('/api/bootstrap');
  return { employees: result.data?.employees || [], error: result.error };
}

export async function testBackendConnection(): Promise<{ success: boolean; message: string }> {
  const result = await apiRequest<{ service: string; status: string }>('/api/health');
  return {
    success: !result.error,
    message: result.error || 'SchoolOS backend is online.',
  };
}
