'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  FolderTree,
  Boxes,
  ShoppingBag,
  Users,
  CreditCard,
  Truck,
  RotateCcw,
  Tag,
  Star,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage =
    pathname === '/admin/login' ||
    pathname === '/admin/forgot-password' ||
    pathname === '/admin/reset-password';

  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(!isAuthPage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthPage) return;

    let mounted = true;
    fetch('/api/admin/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthenticated');
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          setAdminUser(data.admin);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          router.push(`/admin/login?returnUrl=${encodeURIComponent(pathname)}`);
        }
      });

    return () => {
      mounted = false;
    };
  }, [pathname, isAuthPage, router]);

  // Auth pages render without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-300 space-y-4">
        <div className="w-10 h-10 border-2 border-stone-700 border-t-white rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-[0.25em] font-mono text-stone-400">
          Verifying VORQUEN Owner Authorization...
        </p>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  const navGroups = [
    {
      group: 'Core',
      items: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Analytics & Reports', href: '/admin/analytics', icon: BarChart3 },
      ],
    },
    {
      group: 'Catalog & Stock',
      items: [
        { label: 'All Products', href: '/admin/products', icon: Package },
        { label: 'Add New Product', href: '/admin/products/add', icon: PlusCircle },
        { label: 'Categories', href: '/admin/categories', icon: FolderTree },
        { label: 'Inventory Matrix', href: '/admin/inventory', icon: Boxes },
      ],
    },
    {
      group: 'Fulfillment & Sales',
      items: [
        { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
        { label: 'Customers', href: '/admin/customers', icon: Users },
        { label: 'Payments', href: '/admin/payments', icon: CreditCard },
        { label: 'Shipments', href: '/admin/shipments', icon: Truck },
        { label: 'Returns & Refunds', href: '/admin/returns', icon: RotateCcw },
      ],
    },
    {
      group: 'Marketing & System',
      items: [
        { label: 'Coupons & Promos', href: '/admin/coupons', icon: Tag },
        { label: 'Customer Reviews', href: '/admin/reviews', icon: Star },
        { label: 'Store Settings', href: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row text-stone-900 selection:bg-stone-900 selection:text-white">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-stone-950 text-white px-4 py-3 border-b border-stone-800 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={20} className="text-amber-400" />
          <span className="font-serif text-lg font-bold tracking-tight">VORQUEN</span>
          <span className="text-[9px] uppercase tracking-widest text-stone-400 font-mono">
            Owner Portal
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-stone-300 hover:text-white"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-stone-950 text-stone-300 border-r border-stone-800 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-6 border-b border-stone-800/80 bg-stone-950 flex-shrink-0">
            <Link href="/admin/dashboard" className="block group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-700 to-stone-900 border border-stone-600 flex items-center justify-center text-white shadow-md">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className="font-serif text-xl font-bold tracking-tight text-white block group-hover:text-stone-200 transition">
                    VORQUEN
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-amber-400 font-mono block -mt-0.5">
                    Owner Console
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links (Scrollable) */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-stone-800">
            {navGroups.map((grp) => (
              <div key={grp.group} className="space-y-1">
                <span className="px-3 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 font-semibold block mb-1">
                  {grp.group}
                </span>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin/dashboard'
                      ? pathname === '/admin' || pathname === '/admin/dashboard'
                      : pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-stone-800 text-white font-semibold shadow-sm border border-stone-700/80'
                          : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-amber-400' : 'text-stone-400'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Authenticated Owner Profile & Controls */}
          <div className="p-4 border-t border-stone-800/80 bg-stone-950 flex-shrink-0 space-y-3">
            {adminUser && (
              <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white truncate max-w-[140px]">
                    {adminUser.fullName}
                  </p>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-amber-950 text-amber-300 border border-amber-800/60 rounded">
                    Owner
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-mono truncate">{adminUser.email}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded text-xs transition border border-stone-800"
                title="Open Live Storefront"
              >
                <ExternalLink size={13} />
                <span>Storefront</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 rounded text-xs transition border border-rose-900/40"
                title="Sign Out"
              >
                <LogOut size={13} />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Administrative Workspace */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
