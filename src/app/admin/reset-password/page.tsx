'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

function AdminResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!token) {
      setErrorMsg('Missing or invalid reset token. Please request a new recovery link.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Password reset failed.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-stone-900/60 via-stone-950 to-black pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-stone-800 to-stone-900 border border-stone-700/80 shadow-2xl shadow-black mb-2">
            <ShieldCheck size={28} className="text-stone-200" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white">
            VORQUEN
          </h1>
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-stone-400">
            Set New Owner Password
          </p>
        </div>

        <div className="bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-7 sm:p-8 shadow-2xl shadow-black space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-900/80 rounded-lg flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-5 text-center">
              <CheckCircle2 size={44} className="mx-auto text-emerald-400" />
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-white">Password Updated</h3>
                <p className="text-xs text-stone-400">
                  Your store owner password has been securely updated. Redirecting to sign in...
                </p>
              </div>
              <Link
                href="/admin/login"
                className="inline-block px-6 py-2.5 bg-white text-stone-950 text-xs font-bold uppercase tracking-wider rounded-lg"
              >
                Sign In Now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-300 uppercase tracking-wider font-mono">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-950/90 border border-stone-700/80 rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-300 uppercase tracking-wider font-mono">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm matching password"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-950/90 border border-stone-700/80 rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-stone-100 to-stone-300 hover:from-white hover:to-stone-200 text-stone-950 text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Saving New Password...' : 'Save & Secure Account'}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/admin/login"
                  className="text-xs text-stone-500 hover:text-stone-300 transition underline underline-offset-4"
                >
                  ← Back to Admin Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-400 space-y-3">
          <div className="w-8 h-8 border-2 border-stone-700 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-mono">Loading Password Terminal...</p>
        </div>
      }
    >
      <AdminResetPasswordForm />
    </Suspense>
  );
}
