import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  School,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { establishRecoverySession, updatePassword } from '../lib/authApi';

interface UpdatePasswordViewProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const UpdatePasswordView: React.FC<UpdatePasswordViewProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // The recovery link contains short-lived tokens in the URL fragment.
  // Exchange them with our backend immediately; the backend then stores the
  // session in HttpOnly cookies so the browser does not call Supabase directly.
  useEffect(() => {
    let cancelled = false;

    const establishSession = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const queryString = hash.replace(/^#/, '') || search.replace(/^\?/, '');
      const params = new URLSearchParams(queryString);

      const errorDesc = params.get('error_description');
      if (errorDesc) {
        setErrorMsg(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
        return;
      }

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        setErrorMsg('This password recovery link is invalid or has expired.');
        return;
      }

      const result = await establishRecoverySession(accessToken, refreshToken);
      if (cancelled) return;

      if (result.error) {
        setErrorMsg(result.error);
        return;
      }

      // Remove recovery tokens from the address bar after the backend has
      // accepted them. The session itself is now held in HttpOnly cookies.
      window.history.replaceState(null, '', window.location.pathname);
    };

    establishSession();
    return () => {
      cancelled = true;
    };
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword) {
      setErrorMsg('Please enter a new password.');
      return;
    }

    if (newPassword.length < 12) {
      setErrorMsg('Password must be at least 12 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify and try again.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updatePassword(newPassword);

      if (result.error) {
        setErrorMsg(result.error);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while resetting your password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <School className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-white tracking-tight">
              School Management System
            </h1>
            <p className="text-[11px] text-slate-400">
              Account Security & Password Recovery
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Sign In</span>
        </button>
      </header>

      {/* Main Form Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium mb-2 border border-blue-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                Password Recovery Verified
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Set New Password
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your new password below. Make sure it is at least 12 characters long.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-semibold">Reset Failed</p>
                  <p className="mt-0.5 text-slate-300">{errorMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. New Password */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="new-password"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 12 characters)"
                    required
                    minLength={12}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-slate-100 placeholder:text-slate-500 text-xs transition outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 2. Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={12}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-slate-100 placeholder:text-slate-500 text-xs transition outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Match Status Helper */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Passwords do not match yet
                    </span>
                  )}
                </div>
              )}

              {/* Reset Password Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-xs"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Resetting password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition text-center cursor-pointer"
              >
                Cancel and return to sign in
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/50 py-3 px-6 text-center text-xs text-slate-500">
        School Management System • Secure Account Recovery
      </footer>
    </div>
  );
};
