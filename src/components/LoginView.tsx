import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  ShieldCheck,
  School,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { requestPasswordReset } from '../lib/authApi';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string | null }>;
  unassignedProfileError: boolean;
  successNotice?: string | null;
  onClearSuccessNotice?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  unassignedProfileError,
  successNotice,
  onClearSuccessNotice,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // View mode: standard login or forgot password flow
  const [viewMode, setViewMode] = useState<'login' | 'forgot_password'>('login');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Connection settings drawer

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    const result = await onLogin(email.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResetSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setResetLoading(true);

    try {
      const result = await requestPasswordReset(trimmedEmail);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setResetSuccessMsg(`If the account exists, a password reset link has been sent to ${trimmedEmail}. Please check your inbox.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch password reset request.');
    } finally {
      setResetLoading(false);
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
              Secure Staff Authentication
            </p>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {viewMode === 'login' ? (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium mb-2 border border-blue-500/20">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Authorized Staff Access
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Sign In
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your registered school credentials to access your school dashboard.
                  </p>
                </div>

                {/* Password Reset Success Notice */}
                {successNotice && (
                  <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed flex-1">
                      <p className="font-semibold text-emerald-300">Password Reset Successful</p>
                      <p className="mt-0.5 text-slate-300">{successNotice}</p>
                    </div>
                  </div>
                )}

                {/* Error Banners */}
                {unassignedProfileError && (
                  <div className="mb-5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <p className="font-semibold">Profile Assignment Required</p>
                      <p className="mt-0.5 text-slate-300">
                        Your account is authenticated, but no employee profile has been assigned. Please contact your administrator.
                      </p>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <p className="font-semibold">Authentication Failed</p>
                      <p className="mt-0.5 text-slate-300">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {/* Login Form: Strictly Email, Password, Login Button */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 1. Email */}
                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@school.edu"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-slate-100 placeholder:text-slate-500 text-xs transition outline-none"
                      />
                    </div>
                  </div>

                  {/* 2. Password with Forgot Password link */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label 
                        htmlFor="password" 
                        className="block text-xs font-medium text-slate-300"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('forgot_password');
                          setErrorMsg(null);
                          setResetSuccessMsg(null);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-slate-100 placeholder:text-slate-500 text-xs transition outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 3. Login Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-xs"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4" />
                          <span>Login to SchoolOS</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium mb-2 border border-blue-500/20">
                    <KeyRound className="h-3.5 w-3.5" />
                    Account Recovery
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Reset Password
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your registered staff email to receive a password reset link.
                  </p>
                </div>

                {/* Reset Success Banner */}
                {resetSuccessMsg && (
                  <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <p className="font-semibold">Reset Link Sent</p>
                      <p className="mt-0.5 text-slate-300">{resetSuccessMsg}</p>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <p className="font-semibold">Reset Request Failed</p>
                      <p className="mt-0.5 text-slate-300">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                  <div>
                    <label 
                      htmlFor="reset-email" 
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        id="reset-email"
                        name="resetEmail"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@school.edu"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-slate-100 placeholder:text-slate-500 text-xs transition outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-xs"
                    >
                      {resetLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Sending reset link...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          <span>Send Password Reset Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('login');
                        setErrorMsg(null);
                        setResetSuccessMsg(null);
                      }}
                      className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/50 py-3 px-6 text-center text-xs text-slate-500">
        School Management System • Secure server-side authentication
      </footer>
    </div>
  );
};
