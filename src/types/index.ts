export type UserRole = 'super_admin' | 'principal' | 'teacher' | 'admin' | string;

export interface School {
  id: number;
  created_at?: string;
  school_name: string;
}

export interface EmployeeProfile {
  id: string;
  user_id: string;
  school_id: number;
  role: UserRole;
  full_name: string;
}

export interface Student {
  id: number;
  created_at?: string;
  school_id: number;
  roll_no: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  class_grade: string;
  section: string;
  guardian_name: string;
  guardian_phone: string;
  residential_address: string;
  admission_date: string;
}

export type StudentFormData = Omit<Student, 'id' | 'created_at' | 'school_id'>;

export interface DashboardSummary {
  school: School | null;
  studentCount: number;
  employeeCount: number;
  classCount: number;
  recentStudents: Student[];
}

export type NavigationTab = 
  | 'dashboard'
  | 'schools'
  | 'students'
  | 'admissions'
  | 'teachers'
  | 'employees'
  | 'attendance'
  | 'classes'
  | 'reports'
  | 'school'
  | 'settings';
