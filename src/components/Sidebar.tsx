import React from 'react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  UserPlus, 
  Users, 
  UserCheck, 
  ClipboardCheck, 
  BookOpen, 
  BarChart3, 
  Building, 
  Settings, 
  X,
  Shield,
  School
} from 'lucide-react';
import { NavigationTab, EmployeeProfile } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  profile: EmployeeProfile | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  isOpenMobile,
  onCloseMobile,
}) => {
  const role = profile?.role?.toLowerCase() || 'teacher';
  const isPrincipal = role === 'principal';
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';
  const isTeacher = role === 'teacher';

  const portalTitle = isPrincipal 
    ? 'Principal Portal' 
    : isTeacher 
    ? 'Teacher Portal' 
    : 'Admin Portal';

  // Navigation items strictly per role specification
  let navItems: Array<{
    tab: NavigationTab;
    label: string;
    icon: any;
    badge: string | null;
  }>;

  if (isPrincipal) {
    navItems = [
      {
        tab: 'dashboard' as NavigationTab,
        label: 'Dashboard',
        icon: LayoutDashboard,
        badge: null,
      },
      {
        tab: 'students' as NavigationTab,
        label: 'Students',
        icon: GraduationCap,
        badge: null,
      },
      {
        tab: 'admissions' as NavigationTab,
        label: 'Admissions',
        icon: UserPlus,
        badge: 'Intake',
      },
      {
        tab: 'teachers' as NavigationTab,
        label: 'Teachers',
        icon: UserCheck,
        badge: null,
      },
      {
        tab: 'employees' as NavigationTab,
        label: 'Employees',
        icon: Users,
        badge: null,
      },
      {
        tab: 'attendance' as NavigationTab,
        label: 'Attendance',
        icon: ClipboardCheck,
        badge: null,
      },
      {
        tab: 'classes' as NavigationTab,
        label: 'Classes',
        icon: BookOpen,
        badge: null,
      },
      {
        tab: 'reports' as NavigationTab,
        label: 'Reports',
        icon: BarChart3,
        badge: null,
      },
      {
        tab: 'school' as NavigationTab,
        label: 'School Information',
        icon: Building,
        badge: null,
      },
      {
        tab: 'settings' as NavigationTab,
        label: 'Profile / Settings',
        icon: Settings,
        badge: null,
      },
    ];
  } else if (isAdmin) {
    navItems = [
      {
        tab: 'dashboard' as NavigationTab,
        label: 'Dashboard',
        icon: LayoutDashboard,
        badge: null,
      },
      {
        tab: 'students' as NavigationTab,
        label: 'Students',
        icon: GraduationCap,
        badge: null,
      },
      {
        tab: 'admissions' as NavigationTab,
        label: 'Admissions',
        icon: UserPlus,
        badge: 'Intake',
      },
      {
        tab: 'attendance' as NavigationTab,
        label: 'Attendance',
        icon: ClipboardCheck,
        badge: null,
      },
      {
        tab: 'classes' as NavigationTab,
        label: 'Classes',
        icon: BookOpen,
        badge: null,
      },
      {
        tab: 'reports' as NavigationTab,
        label: 'Reports',
        icon: BarChart3,
        badge: null,
      },
      {
        tab: 'employees' as NavigationTab,
        label: 'Employees',
        icon: Users,
        badge: null,
      },
      {
        tab: 'school' as NavigationTab,
        label: 'School Information',
        icon: Building,
        badge: null,
      },
      {
        tab: 'settings' as NavigationTab,
        label: 'Profile / Settings',
        icon: Settings,
        badge: null,
      },
    ];
  } else {
    // Teacher Navigation
    navItems = [
      {
        tab: 'dashboard' as NavigationTab,
        label: 'Dashboard',
        icon: LayoutDashboard,
        badge: null,
      },
      {
        tab: 'classes' as NavigationTab,
        label: 'My Classes',
        icon: BookOpen,
        badge: null,
      },
      {
        tab: 'students' as NavigationTab,
        label: 'Students',
        icon: GraduationCap,
        badge: null,
      },
      {
        tab: 'attendance' as NavigationTab,
        label: 'Attendance',
        icon: ClipboardCheck,
        badge: null,
      },
      {
        tab: 'reports' as NavigationTab,
        label: 'Reports',
        icon: BarChart3,
        badge: 'Limited',
      },
      {
        tab: 'settings' as NavigationTab,
        label: 'Profile / Settings',
        icon: Settings,
        badge: null,
      },
    ];
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-50 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <School className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight block">
                School<span className="text-blue-500">OS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
                {portalTitle}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card in Sidebar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold text-xs shrink-0">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {profile?.full_name || 'Staff Member'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-slate-400 capitalize">
                  {profile?.role || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.tab;

            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => {
                  onSelectTab(item.tab);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="truncate">
              RLS Enabled • School #{profile?.school_id}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
