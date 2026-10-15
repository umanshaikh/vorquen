'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');

      login(data.user);
      if (data.user?.roles?.some((r: string) => ['admin', 'inventory_manager', 'support'].includes(r))) {
        router.push('/admin');
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: 'admin' | 'customer') => {
    if (role === 'admin') {
      setEmail('admin@fashionhub.in');
      setPassword('Admin@123');
    } else {
      setEmail('priya.sharma@example.com');
      setPassword('Customer@123');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white border border-stone-200/80 rounded-sm p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 block">
            FASHION<span className="font-light italic text-stone-500">HUB</span>
          </span>
          <h1 className="text-base font-bold uppercase tracking-wider text-stone-900">Sign in to your account</h1>
          <p className="text-xs text-stone-500">Access your order updates, wishlist, and returns</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Email Address</label>
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
            <label className="block font-medium text-stone-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
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
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={13} />
          </button>
        </form>

        {/* Demo Fast Fill Buttons */}
        <div className="pt-4 border-t border-stone-100 text-center space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-stone-400 block font-bold">Quick Demo Login</span>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleQuickDemo('admin')}
              className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold rounded"
            >
              Demo Admin
            </button>
            <button
              onClick={() => handleQuickDemo('customer')}
              className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold rounded"
            >
              Demo Customer
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-stone-500 pt-2">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-stone-900 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
