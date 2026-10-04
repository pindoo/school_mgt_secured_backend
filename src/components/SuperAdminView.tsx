import React, { useEffect, useState } from 'react';
import { Building2, UserPlus, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  createPlatformSchool,
  fetchManagedUsers,
  fetchPlatformSchools,
  inviteManagedUser,
  updateManagedUserRole,
} from '../lib/schoolApi';
import { EmployeeProfile, ManagedUser, PlatformSchool } from '../types';

interface SuperAdminViewProps {
  profile: EmployeeProfile;
  onToast?: (text: string, type?: 'success' | 'error') => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ profile, onToast }) => {
  const isSuperAdmin = profile.role?.toLowerCase() === 'super_admin';
  const [schools, setSchools] = useState<PlatformSchool[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | ''>('');
  const [schoolName, setSchoolName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<'principal' | 'admin' | 'teacher'>('teacher');
  const [userSchoolId, setUserSchoolId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [savingSchool, setSavingSchool] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const schoolResult = await fetchPlatformSchools();
    if (schoolResult.error) {
      setError(schoolResult.error);
      setLoading(false);
      return;
    }
    setSchools(schoolResult.schools);
    const nextSchool = selectedSchoolId || schoolResult.schools[0]?.id || '';
    setSelectedSchoolId(nextSchool);
    setUserSchoolId(userSchoolId || nextSchool);

    const usersResult = await fetchManagedUsers(typeof nextSchool === 'number' ? nextSchool : undefined);
    if (usersResult.error) setError(usersResult.error);
    else setUsers(usersResult.users);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const loadUsers = async (schoolId: number | '') => {
    const result = await fetchManagedUsers(typeof schoolId === 'number' ? schoolId : undefined);
    if (result.error) setError(result.error);
    else setUsers(result.users);
  };

  const handleCreateSchool = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!schoolName.trim()) return;
    setSavingSchool(true);
    const result = await createPlatformSchool(schoolName.trim());
    setSavingSchool(false);
    if (result.error || !result.school) {
      setError(result.error || 'Unable to create school.');
      return;
    }
    setSchools((current) => [...current, result.school!].sort((a, b) => a.school_name.localeCompare(b.school_name)));
    setSelectedSchoolId(result.school.id);
    setUserSchoolId(result.school.id);
    setSchoolName('');
    onToast?.('School created successfully.');
  };

  const handleInviteUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userEmail.trim() || !userName.trim() || typeof userSchoolId !== 'number') {
      setError('Name, email, role, and school are required.');
      return;
    }
    setSavingUser(true);
    setError(null);
    const result = await inviteManagedUser({
      email: userEmail.trim(),
      full_name: userName.trim(),
      role: userRole,
      school_id: userSchoolId,
    });
    setSavingUser(false);
    if (result.error || !result.user) {
      setError(result.error || 'Unable to invite user.');
      return;
    }
    setUserEmail('');
    setUserName('');
    setUsers((current) => [...current, result.user!].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    onToast?.(`Invitation sent to ${result.user.email}.`);
  };

  const handleRoleChange = async (user: ManagedUser, role: 'principal' | 'admin' | 'teacher') => {
    const result = await updateManagedUserRole(user.user_id, role);
    if (result.error || !result.user) {
      setError(result.error || 'Unable to update role.');
      return;
    }
    setUsers((current) => current.map((item) => item.user_id === user.user_id ? { ...item, role: result.user!.role } : item));
    onToast?.('User role updated.');
  };

  if (!isSuperAdmin) {
    return (
      <section className="max-w-xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center">
        <ShieldCheck className="h-10 w-10 mx-auto text-amber-400 mb-3" />
        <h2 className="text-lg font-bold text-white">Access restricted</h2>
        <p className="text-sm text-slate-400 mt-2">Platform administration is reserved for the Super Admin.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-blue-400 font-semibold">Platform administration</p>
        <h1 className="text-2xl font-bold text-white mt-1">Schools & Users</h1>
        <p className="text-sm text-slate-400 mt-1">Create schools and provision authorized staff. School administrators can manage teachers within their own school.</p>
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <form onSubmit={handleCreateSchool} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-400" />
            <h2 className="font-semibold text-white">Add school</h2>
          </div>
          <input
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="School name"
            maxLength={150}
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          />
          <button disabled={savingSchool} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white">
            {savingSchool ? 'Creating…' : 'Create school'}
          </button>
        </form>

        <form onSubmit={handleInviteUser} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold text-white">Invite staff</h2>
          </div>
          <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Full name" maxLength={120} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Email address" type="email" maxLength={254} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={userSchoolId} onChange={(e) => setUserSchoolId(e.target.value ? Number(e.target.value) : '')} className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white">
              <option value="">Select school</option>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.school_name}</option>)}
            </select>
            <select value={userRole} onChange={(e) => setUserRole(e.target.value as typeof userRole)} className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white">
              <option value="principal">Principal</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <p className="text-xs text-slate-500">An invitation is sent by Supabase Auth. The recipient creates their own password; SchoolOS never receives or stores that password.</p>
          <button disabled={savingUser} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white">
            {savingUser ? 'Sending invitation…' : 'Send invitation'}
          </button>
        </form>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h2 className="font-semibold text-white">School staff</h2>
            <p className="text-xs text-slate-500 mt-1">Passwords are never displayed or managed here.</p>
          </div>
          <div className="flex gap-2">
            <select value={selectedSchoolId} onChange={(e) => { const id = e.target.value ? Number(e.target.value) : ''; setSelectedSchoolId(id); void loadUsers(id); }} className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white">
              <option value="">Select school</option>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.school_name}</option>)}
            </select>
            <button type="button" onClick={() => void load()} className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No staff profiles for this school yet.</div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {users.map((user) => (
              <div key={user.user_id} className="px-5 py-4 flex flex-wrap items-center gap-3 justify-between">
                <div>
                  <p className="font-semibold text-white">{user.full_name}</p>
                  <p className="text-xs text-slate-400">{user.email || 'Email unavailable'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{user.role === 'super_admin' ? 'Super Admin' : 'Role'}</span>
                  {user.role !== 'super_admin' && (
                    <select value={user.role} onChange={(e) => void handleRoleChange(user, e.target.value as any)} className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-2 text-xs text-white">
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                      <option value="principal">Principal</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
