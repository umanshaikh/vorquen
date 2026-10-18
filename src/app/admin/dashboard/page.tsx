'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Sparkles,
  Calendar,
  Filter,
  PlusCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<'today' | 'last_7_days' | 'last_30_days' | 'custom'>('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams();
      params.set('period', period);
      if (period === 'custom') {
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
      }

      const res = await fetch(`/api/admin/metrics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMetrics();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-stone-200 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-stone-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const summary = metrics?.summary || {};
  const lowStockVariants = metrics?.lowStockVariants || [];
  const recentOrders = metrics?.recentOrders || [];
  const recentCustomers = metrics?.recentCustomers || [];
  const bestSellingProducts = metrics?.bestSellingProducts || [];
  const salesOverTime = metrics?.salesOverTime || [];

  const maxDailySales = Math.max(...salesOverTime.map((d: any) => d.sales), 1000);

  return (
    <div className="space-y-8">
      {/* Top Header & Date Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
              Live Production Analytics
            </span>
            <span className="text-xs text-stone-400 font-mono">Real DB Queries</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-950 mt-1">
            VORQUEN Executive Console
          </h1>
          <p className="text-xs text-stone-500">
            Authenticated Store Owner Command Center • Real-time catalog &amp; financial ledger
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border border-stone-300 rounded-lg p-1 shadow-sm text-xs font-medium">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-md transition ${
                period === 'today'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('last_7_days')}
              className={`px-3 py-1.5 rounded-md transition ${
                period === 'last_7_days'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setPeriod('last_30_days')}
              className={`px-3 py-1.5 rounded-md transition ${
                period === 'last_30_days'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1.5 rounded-md transition ${
                period === 'custom'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Custom Range
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 bg-white border border-stone-300 rounded-lg text-stone-600 hover:text-stone-900 shadow-sm"
            title="Refresh Database Queries"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <Link
            href="/admin/products/add"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-950 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition shadow-sm"
          >
            <PlusCircle size={15} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Custom Date Filter Inputs */}
      {period === 'custom' && (
        <form
          onSubmit={handleCustomFilterSubmit}
          className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-stone-300 rounded-md focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-stone-300 rounded-md focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-stone-900 text-white rounded-md font-semibold hover:bg-stone-800"
          >
            Apply Range Filter
          </button>
        </form>
      )}

      {/* Primary Financial & Order KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Net Revenue */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Net Settled Sales
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <IndianRupee size={17} />
            </span>
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-stone-950">
              ₹{Number(summary.netSales || 0).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
              <span>Gross: ₹{Number(summary.grossSales || 0).toLocaleString('en-IN')}</span>
              <span>•</span>
              <span className="text-rose-600">Refunds: ₹{Number(summary.totalRefunds || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Total Orders
            </span>
            <span className="p-2 bg-stone-100 text-stone-800 rounded-xl border border-stone-200">
              <ShoppingBag size={17} />
            </span>
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-stone-950">
              {summary.totalOrders || 0}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              {summary.ordersInPeriod || 0} placed in selected period
            </p>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Customer Base
            </span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <Users size={17} />
            </span>
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-stone-950">
              {summary.totalCustomers || 0}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
              <span className="text-blue-600">+{summary.newCustomersInPeriod || 0} new</span>
              <span>•</span>
              <span>{summary.returningCustomersCount || 0} returning</span>
            </div>
          </div>
        </div>

        {/* Catalog Products */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              Product Catalog
            </span>
            <span className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
              <Package size={17} />
            </span>
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-stone-950">
              {summary.totalProducts || 0}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              {summary.activeProducts || 0} active live in VORQUEN atelier
            </p>
          </div>
        </div>
      </div>

      {/* Operational Fulfillment Sub-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold">
            <Clock size={13} />
            <span>Processing</span>
          </div>
          <p className="text-xl font-bold text-stone-900">{summary.awaitingProcessingOrders || 0}</p>
          <span className="text-[10px] text-stone-400">Awaiting dispatch</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-semibold">
            <Truck size={13} />
            <span>Unfulfilled</span>
          </div>
          <p className="text-xl font-bold text-stone-900">{summary.awaitingShipmentOrders || 0}</p>
          <span className="text-[10px] text-stone-400">Needs courier AWB</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 size={13} />
            <span>Delivered</span>
          </div>
          <p className="text-xl font-bold text-stone-900">{summary.deliveredOrders || 0}</p>
          <span className="text-[10px] text-stone-400">Completed shipments</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold">
            <XCircle size={13} />
            <span>Cancelled</span>
          </div>
          <p className="text-xl font-bold text-stone-900">{summary.cancelledOrders || 0}</p>
          <span className="text-[10px] text-stone-400">Voided orders</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold">
            <AlertTriangle size={13} />
            <span>Low Stock</span>
          </div>
          <p className="text-xl font-bold text-amber-800">{summary.lowStockCount || 0}</p>
          <span className="text-[10px] text-stone-400">Variants ≤ 5 units</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold">
            <RotateCcw size={13} />
            <span>Total Refunds</span>
          </div>
          <p className="text-xl font-bold text-rose-800">₹{summary.totalRefunds || 0}</p>
          <span className="text-[10px] text-stone-400">Processed reversals</span>
        </div>
      </div>

      {/* Sales Trend Chart & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Over Time Chart */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-950">Sales Trajectory</h3>
              <p className="text-xs text-stone-500">Verified paid revenue daily progression</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <TrendingUp size={14} />
              <span>AOV: ₹{Number(summary.averageOrderValue || 0).toFixed(0)}</span>
            </div>
          </div>

          {/* Minimalist Bar Visualization */}
          <div className="pt-4">
            {salesOverTime.length > 0 ? (
              <div className="space-y-2">
                <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-6">
                  {salesOverTime.slice(-14).map((d: any, idx: number) => {
                    const heightPercent = Math.max(6, Math.min(100, (d.sales / maxDailySales) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t transition-all duration-300 ${
                            d.sales > 0
                              ? 'bg-stone-900 group-hover:bg-amber-600'
                              : 'bg-stone-100'
                          }`}
                        />
                        {/* Tooltip */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-stone-950 text-white text-[10px] py-1 px-2 rounded font-mono whitespace-nowrap shadow-md z-20">
                          {d.date}: ₹{d.sales.toLocaleString('en-IN')} ({d.orders} orders)
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-stone-400 font-mono pt-2 border-t border-stone-100">
                  <span>{salesOverTime[0]?.date}</span>
                  <span>Daily Revenue Distribution</span>
                  <span>{salesOverTime[salesOverTime.length - 1]?.date}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 py-10 text-center">No sales recorded for this period.</p>
            )}
          </div>
        </div>

        {/* Best-Selling Products */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-stone-950">Best Sellers</h3>
            <Link
              href="/admin/products"
              className="text-xs text-stone-500 hover:text-stone-900 underline"
            >
              Catalog →
            </Link>
          </div>

          <div className="space-y-3">
            {bestSellingProducts.length > 0 ? (
              bestSellingProducts.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-stone-50/80 border border-stone-200/80 flex items-center justify-between"
                >
                  <div className="space-y-0.5 max-w-[180px]">
                    <p className="text-xs font-semibold text-stone-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-stone-500 font-mono">{p.unitsSold} units purchased</p>
                  </div>
                  <span className="text-xs font-bold font-mono text-stone-900">
                    ₹{p.totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-400 py-8 text-center">
                Best-sellers populate automatically as orders are placed.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Operational Feeds: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-950">Recent Transactions</h3>
              <p className="text-xs text-stone-500">Live order activity across customer storefront</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-stone-900 hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-mono uppercase text-[10px]">
                  <th className="py-2.5">Order #</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Payment</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentOrders.length > 0 ? (
                  recentOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 font-mono font-bold text-stone-900">{o.orderNumber}</td>
                      <td className="py-3 text-stone-700">
                        {o.user?.fullName || o.customerEmail}
                      </td>
                      <td className="py-3 font-mono font-semibold text-stone-900">
                        ₹{o.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            o.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="capitalize text-stone-600 font-medium">
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium text-[11px]"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-amber-900">Low-Stock Alerts</h3>
              <p className="text-xs text-stone-500">Variants requiring immediate restocking</p>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-amber-900 hover:underline"
            >
              Matrix →
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockVariants.length > 0 ? (
              lowStockVariants.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between"
                >
                  <div className="space-y-0.5 max-w-[170px]">
                    <p className="text-xs font-semibold text-stone-900 truncate">{item.productName}</p>
                    <p className="text-[10px] text-stone-500 font-mono">
                      SKU: {item.sku} • Size: {item.size} • {item.colour}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-950 font-mono text-xs font-bold rounded">
                      {item.stockQuantity} left
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center space-y-1">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                <p className="text-xs font-medium text-stone-700">Healthy Stock Levels</p>
                <p className="text-[11px] text-stone-400">All active variants are above alert thresholds.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
