import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  Users, 
  BookOpen, 
  UserPlus, 
  BarChart3, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Calendar,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { EmployeeProfile, School, Student, NavigationTab } from '../types';

interface DashboardViewProps {
  profile: EmployeeProfile;
  school: School | null;
  students: Student[];
  studentCount: number;
  classCount: number;
  recentStudents: Student[];
  employeesCount: number;
  onNavigate: (tab: NavigationTab) => void;
  onOpenAddStudent: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  school,
  students,
  studentCount,
  classCount,
  recentStudents,
  employeesCount,
  onNavigate,
  onOpenAddStudent,
}) => {
  const role = profile.role?.toLowerCase() || 'teacher';
  const isPrincipal = role === 'principal';
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';

  const welcomeTitle = isPrincipal
    ? `Welcome, Principal ${profile.full_name}`
    : isTeacher
    ? `Welcome, Teacher ${profile.full_name}`
    : `Welcome, Administrator ${profile.full_name}`;

  const canAddStudent = isPrincipal || isAdmin;

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              {isPrincipal ? 'Principal Portal' : isTeacher ? 'Teacher Portal' : 'Admin Portal'} • {school?.school_name || `School #${profile.school_id}`}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {welcomeTitle}
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Connected to Supabase. Records are authoritatively isolated to School ID{' '}
              <span className="font-mono text-slate-200">#{profile.school_id}</span> via database Row Level Security.
            </p>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">RLS Status</p>
                <p className="text-xs font-bold text-emerald-400 font-mono">Enforced by Database</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stat Cards Grid tailored for each role */}
      {isTeacher ? (
        /* Teacher Stat Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Teacher Name & Role */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Teacher</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-white truncate" title={profile.full_name}>
              {profile.full_name}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium mt-1 uppercase">
              Role: Teacher
            </p>
          </div>

          {/* School Name & School ID */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">School</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-base font-bold text-white truncate" title={school?.school_name}>
              {school?.school_name || `School #${profile.school_id}`}
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              School ID: #{profile.school_id}
            </p>
          </div>

          {/* Visible Students */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Visible Students</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {studentCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Pupils in School #{profile.school_id}
            </p>
          </div>

          {/* Assigned / Available Classes */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Classes</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {classCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Grade levels configured
            </p>
          </div>

          {/* Attendance Summary */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Daily Attendance</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono">
              Active
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Roll call register ready
            </p>
          </div>
        </div>
      ) : (
        /* Principal & Admin Stat Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Role Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Role</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-white capitalize">
              {profile.role}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Access Level: {isPrincipal ? 'Full Authority' : 'Administrative'}
            </p>
          </div>

          {/* School Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">School</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-base font-bold text-white truncate" title={school?.school_name}>
              {school?.school_name || `School #${profile.school_id}`}
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              School ID: #{profile.school_id}
            </p>
          </div>

          {/* Total Students Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Students</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {studentCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Enrolled in School #{profile.school_id}
            </p>
          </div>

          {/* Total Teachers / Employees Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Employees</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {employeesCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Faculty & Staff
            </p>
          </div>

          {/* Total Classes Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Classes</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {classCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Active Grade Levels
            </p>
          </div>
        </div>
      )}

      {/* 3. Quick Actions Section */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>Quick Actions ({isTeacher ? 'Teacher Portal' : 'Administrative'})</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* For Teacher: No Add Student or Admissions or Reports */}
          {isTeacher ? (
            <>
              {/* Action 1: View Students */}
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-2">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-white group-hover:text-emerald-400">Student Roster</p>
                  <p className="text-xs text-slate-400 mt-0.5">View enrolled pupils</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
              </button>

              {/* Action 2: Classes */}
              <button
                type="button"
                onClick={() => onNavigate('classes')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-white group-hover:text-blue-400">Classes & Sections</p>
                  <p className="text-xs text-slate-400 mt-0.5">Explore grade levels</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
              </button>

              {/* Action 3: Attendance */}
              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-2">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-white group-hover:text-indigo-400">Class Attendance</p>
                  <p className="text-xs text-slate-400 mt-0.5">Daily roll call</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
              </button>

              {/* Action 4: School Info */}
              <button
                type="button"
                onClick={() => onNavigate('school')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="h-8 w-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center mb-2">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-white group-hover:text-purple-400">School Information</p>
                  <p className="text-xs text-slate-400 mt-0.5">Institutional overview</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
              </button>
            </>
          ) : (
            <>
              {/* Action 1: Add Student */}
              {canAddStudent && (
                <button
                  type="button"
                  onClick={onOpenAddStudent}
                  className="p-4 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-bold text-white group-hover:text-blue-400">Add Student</p>
                    <p className="text-xs text-slate-400 mt-0.5">Enroll new student</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
                </button>
              )}

              {/* Action 2: View Students */}
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-2">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-white group-hover:text-emerald-400">View Students</p>
                  <p className="text-xs text-slate-400 mt-0.5">Explore active roster</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
              </button>

              {/* Action 3: Admissions */}
              <button
                type="button"
                onClick={() => onNavigate('admissions')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-2">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-white group-hover:text-indigo-400">Admissions</p>
                  <p className="text-xs text-slate-400 mt-0.5">Intake registration form</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
              </button>

              {/* Action 4: Reports */}
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="h-8 w-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center mb-2">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-white group-hover:text-purple-400">Reports</p>
                  <p className="text-xs text-slate-400 mt-0.5">Visual demographics & analytics</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4. Activity & Summary Section tailored by Role */}
      {isAdmin ? (
        /* Admin Dashboard: Admissions summary & Reports summary */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Admissions Summary */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-400" />
                  <span>Admissions Summary</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Overview of student intake for School #{profile.school_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('admissions')}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Intake Form</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total Admitted:</span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {studentCount}
                </span>
                <span className="text-[10px] text-slate-500">Active enrollments</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Latest Intake:</span>
                <span className="text-sm font-bold text-emerald-400 mt-1 block truncate">
                  {recentStudents[0]?.full_name || 'None recorded'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {recentStudents[0]?.admission_date || 'No date'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Recent Intake Records:
              </span>
              {recentStudents.slice(0, 3).map((s) => (
                <div key={s.id} className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-400 font-bold">{s.roll_no}</span>
                    <span className="text-slate-200 font-medium">{s.full_name}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Grade {s.class_grade} ({s.section})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reports Summary */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                  <span>Reports Summary</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Academic distribution & demographics
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Full Reports</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Grade Levels:</span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {classCount} Classes
                </span>
                <span className="text-[10px] text-slate-500">Active class groups</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">School Faculty:</span>
                <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                  {employeesCount} Staff
                </span>
                <span className="text-[10px] text-slate-500">Teachers & admin</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>School Authorization:</span>
                <span className="font-mono text-emerald-400 font-bold">Admin Privileges</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Record Deletion:</span>
                <span className="font-mono text-slate-400">Principal Only</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Database Isolation:</span>
                <span className="font-mono text-blue-400 font-bold">RLS School #{profile.school_id}</span>
              </div>
            </div>
          </div>
        </div>
      ) : isTeacher ? (
        /* Teacher Dashboard: Attendance summary & Classes overview */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Attendance Summary */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <span>Attendance Summary</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daily classroom roll call for School #{profile.school_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Open Register</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block font-semibold">Total Pupils</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">
                  {studentCount}
                </span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block font-semibold">Classes</span>
                <span className="text-2xl font-bold font-mono text-indigo-400 mt-1 block">
                  {classCount}
                </span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block font-semibold">Target Rate</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                  100%
                </span>
              </div>
            </div>

            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-emerald-300">Roll Call Status</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Filter by class and section to record daily attendance.</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Take Roll Call
              </button>
            </div>
          </div>

          {/* Teacher Class Roster Overview */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-400" />
                  <span>Enrolled Students Roster</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Students belonging to your assigned school
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View Roster</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {recentStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No students enrolled in your school yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recentStudents.slice(0, 4).map((s) => (
                  <div key={s.id} className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-blue-400 font-bold px-1.5 py-0.5 bg-blue-500/10 rounded">
                        {s.roll_no}
                      </span>
                      <span className="text-slate-200 font-medium">{s.full_name}</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">Grade {s.class_grade} ({s.section || 'A'})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Principal Dashboard: Preserved exactly as working previously */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Admissions */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Recent Student Enrollments
                </h3>
                <p className="text-xs text-slate-400">
                  Latest students added to School #{profile.school_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {recentStudents.length === 0 ? (
              <div className="py-10 text-center text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No student records found in your school.</p>
                {canAddStudent && (
                  <button
                    type="button"
                    onClick={onOpenAddStudent}
                    className="mt-2 text-xs text-blue-400 hover:underline"
                  >
                    Click here to enroll the first student
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentStudents.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold">
                        {s.roll_no ? String(s.roll_no).slice(0, 3) : '#'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{s.full_name}</p>
                        <p className="text-[11px] text-slate-400">
                          Grade {s.class_grade || '—'} • Sec {s.section || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {s.admission_date || 'Enrolled'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Roll: {s.roll_no || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Database RLS & Security Card */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Database Authorization</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your profile is verified with Row Level Security on Supabase.
              </p>

              <div className="mt-4 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">School ID:</span>
                  <span className="text-white font-bold">{profile.school_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee ID:</span>
                  <span className="text-slate-300 truncate max-w-[140px]" title={profile.id}>
                    {profile.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Role:</span>
                  <span className="text-purple-400 uppercase font-sans font-bold text-[11px]">
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Live Supabase Session
              </span>
              <span>RLS Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
