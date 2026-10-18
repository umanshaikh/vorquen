'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit password recovery request.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
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
            Owner Password Recovery
          </p>
        </div>

        <div className="bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-7 sm:p-8 shadow-2xl shadow-black space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-900/80 rounded-lg flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-5 text-center">
              <CheckCircle2 size={44} className="mx-auto text-emerald-400" />
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-white">Recovery Request Prepared</h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  If this email is registered to the authorized owner account, password recovery credentials have been generated.
                </p>
              </div>

              {resetUrl && (
                <div className="p-4 bg-stone-950/90 border border-stone-700 rounded-lg text-left space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block">
                    Direct Reset Link (Owner Console Access)
                  </span>
                  <Link
                    href={resetUrl}
                    className="text-xs text-stone-200 hover:text-white underline break-all font-mono block"
                  >
                    Click here to set your new password →
                  </Link>
                </div>
              )}

              <div className="pt-4 border-t border-stone-800">
                <Link
                  href="/admin/login"
                  className="text-xs text-stone-300 hover:text-white underline underline-offset-4"
                >
                  Return to Admin Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs text-stone-400 leading-relaxed">
                Enter your authorized owner email address. A cryptographically secure password reset token will be created.
              </p>

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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-stone-100 to-stone-300 hover:from-white hover:to-stone-200 text-stone-950 text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processing Request...' : 'Generate Reset Token'}
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
