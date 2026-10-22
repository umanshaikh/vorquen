'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedProvider !== 'all') params.set('provider', selectedProvider);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [selectedStatus, selectedProvider]);

  const handleReconcile = async (paymentId: string) => {
    setReconcilingId(paymentId);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Reconciliation failed' });
        return;
      }

      setFeedback({ type: 'success', message: data.message || 'Payment reconciled successfully' });
      fetchPayments();
    } catch {
      setFeedback({ type: 'error', message: 'Network error during reconciliation.' });
    } finally {
      setReconcilingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-stone-500 font-bold">
            Financial Settlement &amp; Verification
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-950 mt-1">
            Payment Processing &amp; Reconciliation
          </h1>
          <p className="text-xs text-stone-500">
            Audit payment attempts, verified gateway captures, COD remittance, and refunds
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50 shadow-sm transition"
        >
          <RefreshCw size={14} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-700">
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold uppercase font-mono">Paid &amp; Settled</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <IndianRupee size={15} />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-stone-950">
            ₹{Number(summary.paidAmount || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-stone-400 font-mono">{summary.paidCount || 0} successful transaction(s)</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold uppercase font-mono">Pending Verification</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <CreditCard size={15} />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-stone-950">
            ₹{Number(summary.pendingAmount || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-stone-400 font-mono">{summary.pendingCount || 0} pending capture/remittance</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold uppercase font-mono">Processed Refunds</span>
            <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
              <RotateCcw size={15} />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-stone-950">
            ₹{Number(summary.refundedAmount || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-stone-400 font-mono">{summary.refundedCount || 0} reversal transaction(s)</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold uppercase font-mono">Failed Attempts</span>
            <span className="p-1.5 bg-stone-100 text-stone-700 rounded-lg">
              <AlertCircle size={15} />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-stone-950">
            {summary.failedCount || 0}
          </p>
          <p className="text-[10px] text-stone-400 font-mono">Declined by issuer/gateway</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <span className="text-stone-500 font-mono text-[11px] font-semibold">Filter Ledger:</span>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md focus:outline-none"
        >
          <option value="all">All Payment Statuses</option>
          <option value="paid">Paid (Captured)</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md focus:outline-none uppercase font-mono"
        >
          <option value="all">All Providers</option>
          <option value="cashfree">Cashfree Gateway</option>
          <option value="razorpay">Razorpay Gateway</option>
          <option value="cod">Cash on Delivery</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Provider / Method</th>
                <th className="py-3 px-4">Gateway Transaction ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Reconciliation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    Loading transactions ledger...
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      <Link href={`/admin/orders/${p.order?.id}`} className="hover:underline">
                        {p.order?.orderNumber || 'N/A'}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-stone-700">
                      <span className="block font-medium">{p.order?.user?.fullName || 'Guest'}</span>
                      <span className="text-[10px] text-stone-400 block font-mono">{p.order?.customerEmail}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-stone-950">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-semibold text-stone-800 uppercase block">{p.provider}</span>
                      <span className="text-[10px] text-stone-400 uppercase block">{p.paymentMethod}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-600">
                      {p.providerPaymentId || (
                        <span className="text-stone-400 italic">Order: {p.providerOrderId?.slice(0, 16)}...</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          p.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : p.status === 'failed'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-500 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleReconcile(p.id)}
                        disabled={reconcilingId === p.id}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold text-[11px] disabled:opacity-50 transition"
                      >
                        {reconcilingId === p.id ? 'Verifying...' : 'Reconcile'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No payment records match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
