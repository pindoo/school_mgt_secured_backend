import React, { useState, useEffect, useCallback } from 'react';
import { clearMockSession, setMockModeActive } from './lib/mockStore';
import { loginWithBackend, getBackendSession, logoutFromBackend } from './lib/authApi';
import { 
  fetchSchoolDetails, 
  fetchStudentsBySchool, 
  fetchEmployeesBySchool,
  addStudent,
  updateStudent,
  deleteStudent
} from './lib/schoolApi';
import { 
  NavigationTab, 
  EmployeeProfile, 
  School, 
  Student, 
  StudentFormData 
} from './types';

// Views and components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { StudentModal } from './components/StudentModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AdmissionsView } from './components/AdmissionsView';
import { EmployeesView } from './components/EmployeesView';
import { AttendanceView } from './components/AttendanceView';
import { ClassesView } from './components/ClassesView';
import { ReportsView } from './components/ReportsView';
import { SchoolInfoView } from './components/SchoolInfoView';
import { SettingsView } from './components/SettingsView';
import { UpdatePasswordView } from './components/UpdatePasswordView';
import { CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function App() {
  // Session & Auth state
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unassignedProfileError, setUnassignedProfileError] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      return hash.includes('type=recovery') || search.includes('type=recovery');
    }
    return false;
  });
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);

  // Authenticated User & School data
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [school, setSchool] = useState<School | null>(null);

  // Core Data
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  // Navigation & UI state
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedGrade, setSelectedGrade] = useState<string | undefined>(undefined);
const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Route protection state (e.g. if user types #/admin or #/principal in browser)
  const [routeRestrictionError, setRouteRestrictionError] = useState<string | null>(null);

  useEffect(() => {
    const handleRouteChange = () => {
      if (!profile) return;
      const role = profile.role?.toLowerCase();

      // Check both hash and pathname
      const hashStr = window.location.hash.toLowerCase().replace(/^#\/?/, '');
      const pathStr = window.location.pathname.toLowerCase().replace(/^\//, '');
      const target = hashStr || pathStr;

      if (target.startsWith('principal')) {
        if (role !== 'principal') {
          setRouteRestrictionError('Access Restricted: You are not authorized to access the Principal Portal or Principal controls.');
          return;
        }
      } else if (target.startsWith('admin')) {
        if (role === 'teacher') {
          setRouteRestrictionError('Access Restricted: Teachers are not authorized to access the Admin Portal.');
          return;
        }
      }

      setRouteRestrictionError(null);
    };

    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [profile]);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch all data for authenticated user's school
  const loadSchoolData = useCallback(async (schoolId: number) => {
    // A. School Details
    const { school: schoolData } = await fetchSchoolDetails(schoolId);
    if (schoolData) {
      setSchool(schoolData);
    }

    // B. Students
    setStudentsLoading(true);
    setStudentsError(null);
    const { students: studentList, error: sErr } = await fetchStudentsBySchool(schoolId);
    setStudentsLoading(false);
    if (sErr) setStudentsError(sErr);
    else setStudents(studentList);

    // C. Employees
    setEmployeesLoading(true);
    setEmployeesError(null);
    const { employees: empList, error: eErr } = await fetchEmployeesBySchool(schoolId);
    setEmployeesLoading(false);
    if (eErr) setEmployeesError(eErr);
    else setEmployees(empList);
  }, []);

  // 2. Verify the server-managed session.
  const initUserSession = useCallback(async () => {
    // Recovery links are handled by UpdatePasswordView.
    const currentHash = typeof window !== 'undefined' ? window.location.hash || '' : '';
    const currentSearch = typeof window !== 'undefined' ? window.location.search || '' : '';
    if (currentHash.includes('type=recovery') || currentSearch.includes('type=recovery')) {
      setIsRecoveryMode(true);
      setSessionChecked(true);
      return;
    }

    try {
      const session = await getBackendSession();

      if (!session.authenticated || !session.profile) {
        setIsAuthenticated(false);
        setProfile(null);
        setUserEmail('');
        setSessionChecked(true);
        return;
      }

      setUnassignedProfileError(false);
      setIsAuthenticated(true);
      setProfile(session.profile);
      setUserEmail(session.email);

      if (session.profile.school_id) {
        await loadSchoolData(session.profile.school_id);
      }
    } catch (e) {
      console.error('Session init error:', e);
      setIsAuthenticated(false);
      setProfile(null);
    } finally {
      setSessionChecked(true);
    }
  }, [loadSchoolData]);

  useEffect(() => {
    initUserSession();
  }, [initUserSession]);

  // 3. Login handler: browser talks only to the SchoolOS backend.
  const handleLogin = async (emailInput: string, passwordInput: string) => {
    setResetSuccessNotice(null);

    try {
      const result = await loginWithBackend(emailInput.trim(), passwordInput);

      if (!result.success || !result.profile) {
        if ((result.error || '').toLowerCase().includes('no employee profile')) {
          setUnassignedProfileError(true);
        }
        return { success: false, error: result.error };
      }

      clearMockSession();
      setMockModeActive(false);
      setUnassignedProfileError(false);
      setProfile(result.profile);
      setUserEmail(result.email || emailInput.trim());
      setIsAuthenticated(true);
      await loadSchoolData(result.profile.school_id);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  // 5. Logout handler
  const handleLogout = async () => {
    clearMockSession();
    setMockModeActive(false);
    await logoutFromBackend();

    setIsAuthenticated(false);
    setProfile(null);
    setSchool(null);
    setUserEmail('');
    setStudents([]);
    setEmployees([]);
    setCurrentTab('dashboard');
    showToast('You have been logged out.');
  };

  // 5. Add / Edit Student Submission
  const handleStudentSubmit = async (formData: StudentFormData): Promise<{ success: boolean; error?: string | null }> => {
    if (!profile?.school_id) {
      return { success: false, error: 'No school assigned to your profile.' };
    }

    if (studentToEdit) {
      // Update
      const { success, error } = await updateStudent(studentToEdit.id, formData, profile.school_id);
      if (success) {
        showToast(`Student ${formData.full_name} updated successfully.`);
        loadSchoolData(profile.school_id);
        setStudentToEdit(null);
        return { success: true };
      }
      return { success: false, error };
    } else {
      // Add
      const { student, error } = await addStudent(formData, profile.school_id);
      if (student) {
        showToast(`Student ${student.full_name} enrolled successfully!`);
        loadSchoolData(profile.school_id);
        return { success: true };
      }
      return { success: false, error };
    }
  };

  // 6. Delete Student Submission (Principals only)
  const handleDeleteConfirm = async (studentId: number): Promise<{ success: boolean; error?: string | null }> => {
    if (!profile?.school_id) return { success: false, error: 'No school ID assigned.' };
    if (profile.role !== 'principal') {
      return { success: false, error: 'Only principals are authorized to delete student records.' };
    }

    const { success, error } = await deleteStudent(studentId, profile.school_id);
    if (success) {
      showToast('Student deleted successfully.');
      loadSchoolData(profile.school_id);
      setStudentToDelete(null);
      return { success: true };
    }
    return { success: false, error };
  };

  // 7. Admissions Page direct enrollment
  const handleAdmissionsEnroll = async (data: StudentFormData) => {
    if (!profile?.school_id) {
      return { success: false, error: 'No school ID bound to active profile.' };
    }
    const { student, error } = await addStudent(data, profile.school_id);
    if (student) {
      loadSchoolData(profile.school_id);
      return { success: true, student };
    }
    return { success: false, error };
  };

  // Quick modals triggers
  const handleOpenAddModal = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleOpenDeleteModal = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  // 1. Password Recovery Screen TAKES PRIORITY OVER ALL OTHER VIEWS (including dashboard and initial load)
  if (isRecoveryMode) {
    return (
      <UpdatePasswordView
        onSuccess={async () => {
          setIsRecoveryMode(false);
          setIsAuthenticated(false);
          setProfile(null);
          setSchool(null);

          // Remove recovery tokens from URL
          if (typeof window !== 'undefined' && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }

          const successMsg = 'Password reset successfully! Please sign in with your new password.';
          showToast(successMsg);
          setResetSuccessNotice(successMsg);
        }}
        onCancel={async () => {
          setIsRecoveryMode(false);
          if (typeof window !== 'undefined' && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
      />
    );
  }

  // 2. If session is still verifying on initial load
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to SchoolOS server...</span>
        </div>
      </div>
    );
  }

  // 3. If not authenticated, render Login Page
  if (!isAuthenticated || !profile) {
    return (
      <LoginView
        onLogin={handleLogin}
        unassignedProfileError={unassignedProfileError}
        successNotice={resetSuccessNotice}
        onClearSuccessNotice={() => setResetSuccessNotice(null)}
      />
    );
  }

  // Authenticated Application Layout
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row selection:bg-blue-600 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          profile={profile}
          school={school}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenSettings={() => setCurrentTab('settings')}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div
              className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 ${
                toastMessage.type === 'success'
                  ? 'bg-slate-900 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-rose-500/50 text-rose-300'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Main Tab Views with Route Protection */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* 1. URL Route Rejection (e.g. typing #/admin as teacher or #/principal as non-principal) */}
          {routeRestrictionError ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Access Restricted</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {routeRestrictionError}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRouteRestrictionError(null);
                    window.location.hash = '';
                    setCurrentTab('dashboard');
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : profile?.role?.toLowerCase() === 'teacher' && ['teachers', 'employees'].includes(currentTab) ? (
            /* 2. Teacher Role UI Restriction for Staff Management Views */
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Access Restricted for Teacher Role</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The <strong className="text-slate-200 capitalize font-mono">{currentTab}</strong> module is reserved for School Principals and Administrators. Staff management is not permitted for teachers under school policy.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Return to Teacher Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  profile={profile}
                  school={school}
                  students={students}
                  employeesCount={employees.length}
                  onNavigate={setCurrentTab}
                  onOpenAddStudent={handleOpenAddModal}
                />
              )}

              {currentTab === 'students' && (
                <StudentsView
                  students={students}
                  isLoading={studentsLoading}
                  error={studentsError}
                  profile={profile}
                  onRefresh={() => loadSchoolData(profile.school_id)}
                  onOpenAddModal={handleOpenAddModal}
                  onOpenEditModal={handleOpenEditModal}
                  onOpenDeleteModal={handleOpenDeleteModal}
                    initialGrade={selectedGrade}
    initialSection={selectedSection}
                  />
              )}

              {currentTab === 'admissions' && (
                <AdmissionsView
                  profile={profile}
                  school={school}
                  students={students}
                  onEnroll={handleAdmissionsEnroll}
                  onViewRoster={() => setCurrentTab('students')}
                />
              )}

              {(currentTab === 'teachers' || currentTab === 'employees') && (
                <EmployeesView
                  employees={employees}
                  isLoading={employeesLoading}
                  error={employeesError}
                  school={school}
                  currentProfile={profile}
                  onRefresh={() => loadSchoolData(profile.school_id)}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendanceView
                  students={students}
                  school={school}
                  profile={profile}
                />
              )}

              {currentTab === 'classes' && (
                <ClassesView
                  students={students}
                  school={school}
                  profile={profile}
                 onSelectClass={(grade, section) => {
  setSelectedGrade(grade);
  setSelectedSection(section);
  setCurrentTab('students');
}}
                                  />
              )}

              {currentTab === 'reports' && (
                <ReportsView
                  students={students}
                  school={school}
                  profile={profile}
                />
              )}

              {currentTab === 'school' && (
                <SchoolInfoView
                  school={school}
                  profile={profile}
                  studentsCount={students.length}
                  employeesCount={employees.length}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  profile={profile}
                  school={school}
                  userEmail={userEmail}
                  onConfigUpdated={() => {
                    if (profile?.school_id) {
                      loadSchoolData(profile.school_id);
                    }
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Global Modals */}
        <StudentModal
          isOpen={isStudentModalOpen}
          onClose={() => {
            setIsStudentModalOpen(false);
            setStudentToEdit(null);
          }}
          onSubmit={handleStudentSubmit}
          studentToEdit={studentToEdit}
          schoolId={profile.school_id}
          schoolName={school?.school_name}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          student={studentToDelete}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setStudentToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/60 py-3.5 px-6 text-center text-xs text-slate-500">
          SchoolOS
        </footer>
      </div>
    </div>
  );
}
