'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      login(data.user);
      router.push('/account');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white border border-stone-200/80 rounded-sm p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 block">
            FASHION<span className="font-light italic text-stone-500">HUB</span>
          </span>
          <h1 className="text-base font-bold uppercase tracking-wider text-stone-900">Create your account</h1>
          <p className="text-xs text-stone-500">Enjoy curated releases and order tracking</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Priya Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <User size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <Mail size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Mobile Phone (Optional)</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <Phone size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Password (min 6 characters) *</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <Lock size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-stone-800 transition flex items-center justify-center gap-1.5 shadow"
          >
            <span>{loading ? 'Creating Account...' : 'Register'}</span>
            <ArrowRight size={13} />
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-stone-900 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
