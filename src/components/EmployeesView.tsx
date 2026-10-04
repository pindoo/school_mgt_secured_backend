import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  Building2, 
  KeyRound, 
  UserCheck
} from 'lucide-react';
import { EmployeeProfile, School } from '../types';
import { inviteManagedUser } from '../lib/schoolApi';

interface EmployeesViewProps {
  employees: EmployeeProfile[];
  isLoading: boolean;
  error: string | null;
  school: School | null;
  currentProfile: EmployeeProfile;
  onRefresh: () => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  isLoading,
  error,
  school,
  currentProfile,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        emp.full_name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q);

      const matchRole = roleFilter === 'ALL' || emp.role.toLowerCase() === roleFilter.toLowerCase();
      return matchSearch && matchRole;
    });
  }, [employees, searchQuery, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              School Staff & Faculty Roster
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              School #{currentProfile.school_id}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Displaying verified employee profiles for <span className="text-slate-300 font-medium">{school?.school_name || `School #${currentProfile.school_id}`}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => { setInviteError(null); setIsInviteOpen(true); }}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
          >
            Add Teacher
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition disabled:opacity-50 cursor-pointer"
            title="Refresh employees"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty and employees by name or role..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-xs text-slate-200 outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="principal">Principals</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-16 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-200">Loading staff records...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-5 bg-rose-950/30 border border-rose-500/40 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-rose-200">Unable to load employees</h4>
            <p className="text-xs text-slate-300 mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Employees Table */}
      {!isLoading && !error && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Role</th>
                  
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEmployees.map((emp) => {
                  const isCurrent = emp.id === currentProfile.id || emp.user_id === currentProfile.user_id;
                  const roleStyle = 
                    emp.role === 'principal'
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                      : emp.role === 'admin'
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-900/50 transition">
                      {/* Full Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                            {emp.full_name ? emp.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-1.5">
                              {emp.full_name}
                              {isCurrent && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Profile ID: {emp.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-medium border uppercase ${roleStyle}`}>
                          {emp.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Total Staff: {filteredEmployees.length}</span>
            <span className="font-mono">School staff</span>
          </div>
        </div>
      )}

      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white">Add Teacher</h3>
            <p className="text-xs text-slate-400 mt-1">The teacher will receive an email invitation and create their own password.</p>
            {inviteError && <p className="mt-3 text-xs text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-3 py-2">{inviteError}</p>}
            <form
              className="space-y-3 mt-5"
              onSubmit={async (event) => {
                event.preventDefault();
                setInviteSaving(true);
                setInviteError(null);
                const result = await inviteManagedUser({
                  email: inviteEmail.trim(),
                  full_name: inviteName.trim(),
                  role: 'teacher',
                  school_id: currentProfile.school_id,
                });
                setInviteSaving(false);
                if (result.error) {
                  setInviteError(result.error);
                  return;
                }
                setInviteName('');
                setInviteEmail('');
                setIsInviteOpen(false);
                onRefresh();
              }}
            >
              <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} required maxLength={120} placeholder="Teacher full name" className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required maxLength={254} type="email" placeholder="Teacher email address" className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsInviteOpen(false)} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs">Cancel</button>
                <button disabled={inviteSaving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold">{inviteSaving ? 'Sending…' : 'Send invitation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
