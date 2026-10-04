import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, ShieldCheck, RefreshCw, Lock, CheckCircle2 } from 'lucide-react';
import { testBackendConnection } from '../lib/schoolApi';
import { EmployeeProfile, School } from '../types';

interface SettingsViewProps {
  profile: EmployeeProfile | null;
  school: School | null;
  userEmail?: string;
  onConfigUpdated?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, school, userEmail }) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConnectionTest = async () => {
    setTestingConnection(true);
    const result = await testBackendConnection();
    setTestResult(result);
    setTestingConnection(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-2">
          <SettingsIcon className="h-3.5 w-3.5" />
          Settings & Security
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Security & System Status</h2>
        <p className="text-xs text-slate-400 mt-1">SchoolOS keeps authentication and database access behind the backend API.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4"><ShieldCheck className="h-5 w-5 text-emerald-400" /><h3 className="font-bold text-white">Authentication</h3></div>
          <div className="space-y-3 text-sm">
            <Status label="Backend-only authentication" />
            <Status label="HttpOnly session cookies" />
            <Status label="Password never stored by SchoolOS frontend" />
            <Status label="Supabase Auth password hashing" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4"><Database className="h-5 w-5 text-blue-400" /><h3 className="font-bold text-white">Database protection</h3></div>
          <div className="space-y-3 text-sm">
            <Status label="Browser cannot call Supabase directly" />
            <Status label="Server derives school access from session" />
            <Status label="Supabase RLS remains enabled" />
            <Status label="API responses marked no-store" />
          </div>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="font-bold text-white">Backend connection</h3>
            <p className="text-xs text-slate-500 mt-1">This check verifies the API is reachable without exposing database details.</p>
          </div>
          <button onClick={handleConnectionTest} disabled={testingConnection} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700 disabled:opacity-60">
            {testingConnection ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Test connection
          </button>
        </div>
        {testResult && (
          <div className={`rounded-xl border p-4 text-sm ${testResult.success ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-red-500/20 bg-red-500/5 text-red-300'}`}>
            {testResult.message}
          </div>
        )}
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4"><Lock className="h-5 w-5 text-purple-400" /><h3 className="font-bold text-white">Current session</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <Info label="Staff" value={profile?.full_name || '—'} />
          <Info label="Role" value={profile?.role || '—'} />
          <Info label="School" value={school?.school_name || `School #${profile?.school_id || '—'}`} />
        </div>
        <p className="text-xs text-slate-500 mt-4">{userEmail ? `Signed in as ${userEmail}` : 'Authenticated staff session'}</p>
      </div>
    </div>
  );
};

function Status({ label }: { label: string }) {
  return <div className="flex items-center gap-2 text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />{label}</div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="p-3 rounded-xl bg-slate-900 border border-slate-800"><div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div><div className="font-semibold text-white mt-1 truncate">{value}</div></div>;
}
