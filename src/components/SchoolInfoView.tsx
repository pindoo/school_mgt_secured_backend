import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  Users, 
  Calendar, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  School as SchoolIcon 
} from 'lucide-react';
import { School, EmployeeProfile } from '../types';

interface SchoolInfoViewProps {
  school: School | null;
  profile: EmployeeProfile;
  studentsCount: number;
  employeesCount: number;
}

export const SchoolInfoView: React.FC<SchoolInfoViewProps> = ({
  school,
  profile,
  studentsCount,
  employeesCount,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* School Hero Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0">
            <SchoolIcon className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              <ShieldCheck className="h-3 w-3" />
              Verified Educational Institution
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {school?.school_name || `School #${profile.school_id}`}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              School Identifier: {profile.school_id}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* School Name */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
          <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider block mb-1">
            School Name
          </span>
          <p className="text-base font-bold text-white truncate" title={school?.school_name}>
            {school?.school_name || `School #${profile.school_id}`}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1">Official Registry Name</span>
        </div>

        {/* School ID */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
          <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider block mb-1">
            School ID
          </span>
          <p className="text-2xl font-mono font-bold text-blue-400">
            #{profile.school_id}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1">Primary Foreign Key</span>
        </div>

        {/* Total Students */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
          <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider block mb-1">
            Total Students
          </span>
          <p className="text-2xl font-mono font-bold text-emerald-400">
            {studentsCount}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1">Active Enrolled Pupils</span>
        </div>

        {/* Total Employees */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
          <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider block mb-1">
            Total Employees
          </span>
          <p className="text-2xl font-mono font-bold text-amber-400">
            {employeesCount}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1">Principals, Teachers & Staff</span>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
          Institution Details & Row Level Security
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-900 gap-1">
            <span className="text-slate-400">Database Record Created:</span>
            <span className="text-slate-200 font-mono">
              {school?.created_at ? new Date(school.created_at).toLocaleDateString() : 'Active Registration'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-900 gap-1">
            <span className="text-slate-400">Security Architecture:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Row Level Security Active (isolated per school_id)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-900 gap-1">
            <span className="text-slate-400">Your Current Session Role:</span>
            <span className="text-white font-bold capitalize">
              {profile.role} ({profile.full_name})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
