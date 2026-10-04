import { Student, School, EmployeeProfile, StudentFormData } from '../types';
import {
  INITIAL_MOCK_SCHOOLS,
  INITIAL_MOCK_EMPLOYEES,
  INITIAL_MOCK_STUDENTS,
} from './mockData';

const STUDENTS_STORAGE_KEY = 'school_management_mock_students';
const EMPLOYEES_STORAGE_KEY = 'school_management_mock_employees';
const SESSION_STORAGE_KEY = 'school_management_mock_session';
const DEMO_MODE_KEY = 'school_management_demo_mode_active';

export interface MockUserSession {
  user: {
    id: string;
    email: string;
  };
}

export function isMockModeActive(): boolean {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
}

export function setMockModeActive(active: boolean) {
  if (active) {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
  } else {
    localStorage.removeItem(DEMO_MODE_KEY);
  }
}

export function getMockStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading mock students from localStorage', e);
  }
  // Initialize with initial fixture
  saveMockStudents(INITIAL_MOCK_STUDENTS);
  return INITIAL_MOCK_STUDENTS;
}

export function saveMockStudents(students: Student[]) {
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  } catch (e) {
    console.error('Error writing mock students to localStorage', e);
  }
}

export function getMockStoredEmployees(): (EmployeeProfile & { email: string })[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading mock employees from localStorage', e);
  }
  return INITIAL_MOCK_EMPLOYEES;
}

export function getMockSession(): MockUserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading mock session', e);
  }
  return null;
}

export function setMockSession(session: MockUserSession | null) {
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setMockModeActive(true);
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function clearMockSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  setMockModeActive(false);
}

export function getMockUserByEmail(email: string) {
  const employees = getMockStoredEmployees();
  const normalized = email.trim().toLowerCase();
  return employees.find((e) => e.email.toLowerCase() === normalized);
}

export function getMockSchoolDetails(schoolId: number): School | null {
  return INITIAL_MOCK_SCHOOLS.find((s) => s.id === schoolId) || {
    id: schoolId,
    school_name: `School #${schoolId}`,
  };
}

export function getMockStudentsBySchool(schoolId: number): Student[] {
  const all = getMockStoredStudents();
  return all.filter((s) => s.school_id === schoolId);
}

export function getMockEmployeesBySchool(schoolId: number): EmployeeProfile[] {
  const all = getMockStoredEmployees();
  return all.filter((e) => e.school_id === schoolId);
}

export function addMockStudent(formData: StudentFormData, schoolId: number): Student {
  const all = getMockStoredStudents();
  const newId = all.length > 0 ? Math.max(...all.map((s) => s.id)) + 1 : 101;
  const newStudent: Student = {
    id: newId,
    school_id: schoolId,
    roll_no: formData.roll_no.trim(),
    full_name: formData.full_name.trim(),
    date_of_birth: formData.date_of_birth || '',
    gender: formData.gender,
    class_grade: formData.class_grade.trim(),
    section: formData.section.trim(),
    guardian_name: formData.guardian_name.trim(),
    guardian_phone: formData.guardian_phone.trim(),
    residential_address: formData.residential_address.trim(),
    admission_date: formData.admission_date || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  };

  const updated = [newStudent, ...all];
  saveMockStudents(updated);
  return newStudent;
}

export function updateMockStudent(
  studentId: number,
  formData: StudentFormData,
  schoolId: number
): boolean {
  const all = getMockStoredStudents();
  const index = all.findIndex((s) => s.id === studentId && s.school_id === schoolId);
  if (index === -1) return false;

  const existing = all[index];
  all[index] = {
    ...existing,
    roll_no: formData.roll_no.trim(),
    full_name: formData.full_name.trim(),
    date_of_birth: formData.date_of_birth || '',
    gender: formData.gender,
    class_grade: formData.class_grade.trim(),
    section: formData.section.trim(),
    guardian_name: formData.guardian_name.trim(),
    guardian_phone: formData.guardian_phone.trim(),
    residential_address: formData.residential_address.trim(),
    admission_date: formData.admission_date || existing.admission_date,
  };

  saveMockStudents(all);
  return true;
}

export function deleteMockStudent(studentId: number, schoolId: number): boolean {
  const all = getMockStoredStudents();
  const filtered = all.filter((s) => !(s.id === studentId && s.school_id === schoolId));
  if (filtered.length === all.length) return false;
  saveMockStudents(filtered);
  return true;
}
