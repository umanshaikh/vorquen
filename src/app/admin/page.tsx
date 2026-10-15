import React from 'react';
import Link from 'next/link';
import { IndianRupee, ShoppingBag, Clock, AlertTriangle, ArrowUpRight, CheckCircle2, RotateCcw, Truck } from 'lucide-react';
import { getAdminDashboardMetrics } from '@/lib/services/reportingService';

export const revalidate = 0; // Live dynamic metrics

export default async function AdminDashboardPage() {
  const metrics = await getAdminDashboardMetrics();

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <span className="text-xs uppercase tracking-widest text-stone-500 font-bold">Operational Overview</span>
        <h1 className="font-serif text-3xl font-bold text-stone-900 mt-0.5">FashionHub Dashboard</h1>
        <p className="text-xs text-stone-500">Live metrics calculated directly from database records</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-stone-200 p-5 rounded-sm shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-stone-500">
            <span className="font-bold uppercase tracking-wider">Settled Revenue</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-800 rounded">
              <IndianRupee size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-stone-900">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-stone-400">Total verified online &amp; settled payments</p>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-sm shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-stone-500">
            <span className="font-bold uppercase tracking-wider">Total Orders</span>
            <span className="p-1.5 bg-stone-100 text-stone-800 rounded">
              <ShoppingBag size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{metrics.totalOrders}</p>
          <div className="flex gap-2 text-[11px] text-stone-500">
            <span className="text-amber-700 font-medium">{metrics.processingOrders} processing</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">{metrics.completedOrders} completed</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-sm shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-stone-500">
            <span className="font-bold uppercase tracking-wider">Low Stock SKUs</span>
            <span className="p-1.5 bg-amber-50 text-amber-800 rounded">
              <AlertTriangle size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{metrics.lowStockCount}</p>
          <Link href="/admin/inventory?filter=low_stock" className="text-[11px] text-amber-800 font-semibold hover:underline block">
            Inspect inventory alerts →
          </Link>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-sm shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-stone-500">
            <span className="font-bold uppercase tracking-wider">Pending COD</span>
            <span className="p-1.5 bg-blue-50 text-blue-800 rounded">
              <Truck size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-stone-900">₹{metrics.pendingCodRemittance.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-stone-400">Awaiting courier cash collection &amp; remittance</p>
        </div>
      </div>

      {/* Grid: Recent Orders & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-sm shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-stone-100">
            <h3 className="font-serif text-lg font-bold text-stone-900">Recent Customer Orders</h3>
            <Link href="/admin/orders" className="text-xs font-semibold text-stone-800 hover:text-stone-950 flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Order</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Order Status</th>
                  <th className="py-2.5">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {metrics.recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-stone-50">
                    <td className="py-3 font-bold font-mono text-stone-900">{ord.orderNumber}</td>
                    <td className="py-3">{ord.customerEmail}</td>
                    <td className="py-3 font-semibold text-stone-900">₹{ord.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ord.orderStatus === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.orderStatus === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 capitalize text-stone-600">
                      {ord.paymentStatus} ({ord.payments?.[0]?.provider || 'online'})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
            Top Performing Garments
          </h3>

          <div className="space-y-4">
            {metrics.topSellingProducts.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-stone-100 last:border-0">
                <div className="space-y-0.5">
                  <p className="font-semibold text-stone-900 line-clamp-1">{p.name}</p>
                  <p className="text-[11px] text-stone-400">{p.unitsSold} units fulfilled</p>
                </div>
                <span className="font-bold text-stone-900">₹{p.totalRevenue.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
