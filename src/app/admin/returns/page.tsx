'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, X, ShieldAlert } from 'lucide-react';

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/returns');
      const data = await res.json();
      if (res.ok) {
        setReturns(data.returns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleUpdateStatus = async (returnRequestId: string, newStatus: string) => {
    setUpdatingId(returnRequestId);
    try {
      const res = await fetch('/api/admin/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnRequestId,
          newStatus,
          actionNotes: `Status changed to ${newStatus} by admin review`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update return status');

      await fetchReturns();
      alert(`Return request status updated to ${newStatus}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">Returns &amp; Refund Management</h1>
        <p className="text-xs text-stone-500">Authorize return requests, schedule reverse pickups, and process customer refunds</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-sand-50/70 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Order Ref</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Items to Return</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">Loading return requests...</td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">No active return requests</td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50 transition">
                    <td className="p-3.5 font-mono font-bold text-stone-900">{r.order?.orderNumber}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-stone-900">{r.user?.fullName}</p>
                      <p className="text-[11px] text-stone-400">{r.user?.email}</p>
                    </td>
                    <td className="p-3.5">
                      {r.items?.map((it: any) => (
                        <p key={it.id} className="font-medium text-stone-800">
                          {it.orderItem?.productNameSnapshot} ({it.orderItem?.selectedSize}) × {it.quantity}
                        </p>
                      ))}
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-stone-900">{r.reason}</p>
                      {r.customerComments && (
                        <p className="text-[11px] text-stone-500 italic">&ldquo;{r.customerComments}&rdquo;</p>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        r.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : r.status === 'approved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {r.status === 'requested' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'approved')}
                            disabled={updatingId === r.id}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'rejected')}
                            disabled={updatingId === r.id}
                            className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded text-[11px] font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'pickup_scheduled')}
                          disabled={updatingId === r.id}
                          className="px-2.5 py-1 bg-stone-900 text-white rounded text-[11px] font-semibold"
                        >
                          Schedule Reverse Pickup
                        </button>
                      )}
                      {r.status === 'pickup_scheduled' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'received')}
                          disabled={updatingId === r.id}
                          className="px-2.5 py-1 bg-blue-700 text-white rounded text-[11px] font-semibold"
                        >
                          Mark Received at Hub
                        </button>
                      )}
                      {r.status === 'received' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'resolved')}
                          disabled={updatingId === r.id}
                          className="px-2.5 py-1 bg-emerald-800 text-white rounded text-[11px] font-bold"
                        >
                          Approve Refund &amp; Restock
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
