'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  CreditCard,
  Package,
  ShoppingBag,
  Users,
  RotateCcw,
  Tag,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'today' | 'last_7_days' | 'last_30_days' | 'custom'>('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('period', period);
      if (period === 'custom' && startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics();
  };

  const handleExportCSV = async (type: 'sales' | 'orders' | 'inventory') => {
    setExportingType(type);
    try {
      const res = await fetch(`/api/admin/analytics/export?type=${type}`);
      if (!res.ok) throw new Error('Failed to generate CSV export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vorquen-${type}-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Error exporting CSV');
    } finally {
      setExportingType(null);
    }
  };

  const formatPrice = (val: number = 0) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 border border-stone-200 rounded-sm shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-amber-500" size={24} />
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Executive Analytics &amp; Reports
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Reconciled financial intelligence, sales performance, and audit-ready data exports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-stone-100 p-1 rounded text-xs">
            {(['today', 'last_7_days', 'last_30_days', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded font-medium capitalize transition ${
                  period === p
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {p.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200">
            <button
              onClick={() => handleExportCSV('sales')}
              disabled={Boolean(exportingType)}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Download size={13} />
              <span>{exportingType === 'sales' ? 'Exporting...' : 'Sales CSV'}</span>
            </button>
            <button
              onClick={() => handleExportCSV('orders')}
              disabled={Boolean(exportingType)}
              className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Download size={13} />
              <span>{exportingType === 'orders' ? 'Exporting...' : 'Orders CSV'}</span>
            </button>
            <button
              onClick={() => handleExportCSV('inventory')}
              disabled={Boolean(exportingType)}
              className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Download size={13} />
              <span>{exportingType === 'inventory' ? 'Exporting...' : 'Stock CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Filter Panel */}
      {period === 'custom' && (
        <form
          onSubmit={handleCustomFilterSubmit}
          className="bg-sand-50/80 border border-sand-200 p-4 rounded flex flex-wrap items-center gap-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1.5 border border-stone-300 rounded bg-white"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1.5 border border-stone-300 rounded bg-white"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-stone-900 text-white rounded font-medium hover:bg-stone-800 transition"
          >
            Apply Range Filter
          </button>
        </form>
      )}

      {loading || !analytics ? (
        <div className="p-16 text-center text-stone-400 bg-white border border-stone-200 rounded">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs uppercase tracking-widest font-mono">Calculating live store metrics...</p>
        </div>
      ) : (
        <>
          {/* Reconciled Revenue Intelligence Grid */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Reconciled Financial Intelligence
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-stone-200 rounded shadow-sm">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                  <span>Gross Sales</span>
                  <ShoppingBag size={16} className="text-stone-400" />
                </div>
                <div className="font-serif text-2xl font-bold text-stone-900">
                  {formatPrice(analytics.grossSales || analytics.totalSales)}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">Pre-discount order volume</p>
              </div>

              <div className="bg-white p-5 border border-stone-200 rounded shadow-sm">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                  <span>Discounts Applied</span>
                  <Tag size={16} className="text-amber-500" />
                </div>
                <div className="font-serif text-2xl font-bold text-amber-600">
                  -{formatPrice(analytics.discountsTotal || 0)}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">Coupons & promotion cuts</p>
              </div>

              <div className="bg-white p-5 border border-stone-200 rounded shadow-sm">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                  <span>Refunds Processed</span>
                  <RotateCcw size={16} className="text-rose-500" />
                </div>
                <div className="font-serif text-2xl font-bold text-rose-600">
                  -{formatPrice(analytics.refundsTotal || 0)}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">Settled return refunds</p>
              </div>

              <div className="bg-stone-900 text-white p-5 rounded shadow-md border border-stone-800">
                <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                  <span>Net Verified Revenue</span>
                  <TrendingUp size={16} className="text-emerald-400" />
                </div>
                <div className="font-serif text-2xl font-bold text-emerald-400">
                  {formatPrice(analytics.netSales || (analytics.totalSales - (analytics.refundsTotal || 0)))}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">Verified settled funds</p>
              </div>
            </div>
          </div>

          {/* Operational KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 border border-stone-200 rounded">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Total Orders Placed
              </span>
              <span className="text-xl font-bold text-stone-900 mt-1 block">
                {analytics.totalOrders || 0}
              </span>
            </div>
            <div className="bg-white p-4 border border-stone-200 rounded">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Average Order Value (AOV)
              </span>
              <span className="text-xl font-bold text-stone-900 mt-1 block">
                {formatPrice(analytics.averageOrderValue || 0)}
              </span>
            </div>
            <div className="bg-white p-4 border border-stone-200 rounded">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Registered Customers
              </span>
              <span className="text-xl font-bold text-stone-900 mt-1 block">
                {analytics.totalCustomers || 0}
              </span>
            </div>
            <div className="bg-white p-4 border border-stone-200 rounded">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Active Catalog Categories
              </span>
              <span className="text-xl font-bold text-stone-900 mt-1 block">
                {analytics.categoriesCount || 0}
              </span>
            </div>
          </div>

          {/* Sales Over Time Chart */}
          <div className="bg-white p-6 border border-stone-200 rounded shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Revenue Trajectory</h3>
                <p className="text-xs text-stone-500">Day-by-day sales curve within selected filter</p>
              </div>
              <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2.5 py-1 rounded">
                Verified Orders
              </span>
            </div>

            {analytics.salesOverTime && analytics.salesOverTime.length > 0 ? (
              <div className="h-48 w-full flex items-end gap-2 pt-6 border-b border-stone-200 pb-2">
                {(() => {
                  const maxSale = Math.max(...analytics.salesOverTime.map((d: any) => d.sales || 0), 100);
                  return analytics.salesOverTime.map((item: any, idx: number) => {
                    const heightPercent = Math.max(8, Math.round(((item.sales || 0) / maxSale) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-stone-950 text-white text-[10px] px-2 py-1 rounded shadow whitespace-nowrap z-10">
                          {item.date}: {formatPrice(item.sales)} ({item.orders} orders)
                        </div>
                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[28px] bg-stone-800 hover:bg-amber-600 rounded-t transition-all duration-300"
                        />
                        <span className="text-[9px] text-stone-400 mt-2 truncate w-full text-center">
                          {item.date.slice(5)}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">
                No orders recorded in this date range.
              </div>
            )}
          </div>

          {/* Two-Column Grid: Order Status Pipeline & Best-Sellers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders By Status */}
            <div className="bg-white p-6 border border-stone-200 rounded shadow-sm">
              <h3 className="font-serif text-base font-bold text-stone-900 mb-4">
                Fulfillment &amp; Order Pipeline
              </h3>
              <div className="space-y-3">
                {analytics.ordersByStatus &&
                  Object.entries(analytics.ordersByStatus).map(([st, count]: any) => {
                    const total = analytics.totalOrders || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={st}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold uppercase tracking-wider text-stone-700">
                            {st.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono text-stone-500">
                            {count} orders ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full ${
                              st === 'delivered'
                                ? 'bg-emerald-500'
                                : st === 'cancelled'
                                ? 'bg-rose-500'
                                : st === 'shipped'
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Top-Selling Products */}
            <div className="bg-white p-6 border border-stone-200 rounded shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Best-Selling Fashion Creations
                </h3>
                <Link
                  href="/admin/products"
                  className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 font-medium"
                >
                  <span>Catalog</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {analytics.bestSellingProducts && analytics.bestSellingProducts.length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {analytics.bestSellingProducts.map((p: any) => (
                    <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative bg-stone-100 rounded overflow-hidden flex-shrink-0">
                          {p.image ? (
                            <Image src={p.image} alt={p.name} fill className="object-cover" />
                          ) : (
                            <Package className="w-full h-full p-2 text-stone-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">{p.name}</p>
                          <p className="text-[11px] text-stone-500">{p.brand || 'VORQUEN'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-stone-900">
                          {formatPrice(p.totalRevenue)}
                        </p>
                        <p className="text-[11px] text-stone-500">{p.quantitySold} units sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 py-6 text-center">No sales recorded yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
