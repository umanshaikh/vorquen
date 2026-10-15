'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Truck,
  RotateCcw,
  Tag,
  Settings,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
    { label: 'Shipments', href: '/admin/shipments', icon: Truck },
    { label: 'Returns', href: '/admin/returns', icon: RotateCcw },
    { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isStaff = user?.roles.some((r) =>
    ['admin', 'inventory_manager', 'support'].includes(r)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-300">
        <p className="text-xs uppercase tracking-widest font-mono">Authenticating staff credentials...</p>
      </div>
    );
  }

  if (!user || !isStaff) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded p-8 text-center space-y-4 shadow-sm">
          <ShieldCheck size={48} className="mx-auto text-rose-600" />
          <h2 className="font-serif text-2xl font-bold text-stone-900">Restricted Admin Access</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Administrative functionality is restricted to authorized operators. Please sign in with staff or administrative credentials.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded uppercase tracking-wider"
            >
              Staff Sign In
            </Link>
            <Link href="/" className="text-xs text-stone-500 hover:text-stone-900 underline">
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-300 flex-shrink-0 flex flex-col justify-between border-r border-stone-800">
        <div>
          {/* Brand & Badge */}
          <div className="p-6 border-b border-stone-800 flex items-center justify-between">
            <div>
              <span className="font-serif text-xl font-bold text-white block">
                FASHION<span className="font-light italic text-stone-400">HUB</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-mono">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-medium transition ${
                    isActive
                      ? 'bg-stone-800 text-white shadow-sm font-semibold'
                      : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Exit */}
        <div className="p-4 border-t border-stone-800 space-y-3">
          <div className="px-2">
            <p className="text-[11px] font-bold text-white line-clamp-1">{user.fullName}</p>
            <p className="text-[10px] text-stone-400 font-mono capitalize">
              Role: {user.roles.join(', ')}
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-300 hover:text-white bg-stone-800/80 rounded transition"
          >
            <ArrowLeft size={13} />
            <span>Storefront Live</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
