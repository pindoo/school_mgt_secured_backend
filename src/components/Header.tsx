import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  LogOut, 
  Settings, 
  Menu, 
  User,
  GraduationCap
} from 'lucide-react';
import { EmployeeProfile, School } from '../types';

interface HeaderProps {
  profile: EmployeeProfile | null;
  school: School | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  school,
  onLogout,
  onToggleSidebar,
  onOpenSettings,
}) => {
  const roleName = profile?.role ? profile.role.toUpperCase() : 'STAFF';
  const roleColor = 
    profile?.role === 'principal' 
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
      : profile?.role === 'admin'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* School branding */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight truncate max-w-[200px] sm:max-w-md">
                {school?.school_name || `School #${profile?.school_id || ''}`}
              </h2>
              {profile && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${roleColor}`}>
                  {profile.role === 'principal' ? 'Principal Portal' : profile.role === 'teacher' ? 'Teacher Portal' : 'Admin Portal'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-300">
                School ID: #{profile?.school_id}
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="hidden sm:inline text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="h-3 w-3" />
                RLS Authoritative
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role badge */}
        {profile && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${roleColor}`}>
              {roleName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium max-w-[130px] truncate">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{profile.full_name}</span>
            </div>
          </div>
        )}

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Supabase Settings & Diagnostics"
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Logout button */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white text-xs font-medium border border-rose-800/40 transition cursor-pointer shadow-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
