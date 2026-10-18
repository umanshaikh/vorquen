'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          twoFactorCode: twoFactorCode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please verify credentials.');
        setLoading(false);
        return;
      }

      if (data.requireTwoFactor) {
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }

      // Successful owner authentication
      router.push(returnUrl);
      router.refresh();
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-stone-100 selection:bg-stone-100 selection:text-stone-950">
      {/* Background Accent Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-stone-900/60 via-stone-950 to-black pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-stone-800 to-stone-900 border border-stone-700/80 shadow-2xl shadow-black mb-2">
            <ShieldCheck size={28} className="text-stone-200" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
            VORQUEN
          </h1>
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-stone-400">
            Private Store Owner Portal
          </p>
        </div>

        {/* Security Notice Banner */}
        <div className="p-3.5 bg-stone-900/70 border border-stone-800 rounded-lg flex items-start gap-3 text-stone-400 text-xs">
          <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Restricted access. This administrative portal is strictly reserved for the authorized store owner. All access attempts are logged and monitored.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-7 sm:p-8 shadow-2xl shadow-black space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-900/80 rounded-lg flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-stone-300 uppercase tracking-wider font-mono">
                Owner Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@vorquen.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950/90 border border-stone-700/80 rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-stone-300 uppercase tracking-wider font-mono">
                  Password
                </label>
                <Link
                  href="/admin/forgot-password"
                  className="text-[11px] text-stone-400 hover:text-stone-200 transition underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950/90 border border-stone-700/80 rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition"
                />
              </div>
            </div>

            {/* Optional 2FA Field */}
            {showTwoFactor && (
              <div className="space-y-1.5 pt-2 border-t border-stone-800">
                <label className="block text-xs font-medium text-amber-300 uppercase tracking-wider font-mono">
                  Two-Factor Authentication Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="6-digit code or backup PIN"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-950/90 border border-amber-600/60 rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-400 transition font-mono tracking-widest"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-stone-100 to-stone-300 hover:from-white hover:to-stone-200 text-stone-950 text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-stone-900/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Sign In as Store Owner</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="pt-4 border-t border-stone-800/80 text-center">
            <Link
              href="/"
              className="text-xs text-stone-500 hover:text-stone-300 transition underline underline-offset-4"
            >
              ← Return to VORQUEN Storefront
            </Link>
          </div>
        </div>

        {/* Security Watermark */}
        <p className="text-center text-[10px] text-stone-600 font-mono tracking-wider">
          VORQUEN SECURE ATELIER OS • HARDENED OWNER ACCESS PROTOCOL
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-400 space-y-3">
          <div className="w-8 h-8 border-2 border-stone-700 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-mono">Initializing Secure Login Terminal...</p>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
