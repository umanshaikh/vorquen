'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, XCircle, AlertCircle, ExternalLink, Filter } from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' ? '/api/admin/reviews' : `/api/admin/reviews?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleModerate = async (reviewId: string, status: 'approved' | 'rejected') => {
    setActionInProgress(reviewId);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to moderate review');

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, moderationStatus: status } : r))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={13}
            className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}
          />
        ))}
        <span className="ml-1 text-xs font-semibold text-stone-700">{rating}.0</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Product Reviews Moderation</h1>
          <p className="text-xs text-stone-500">
            Audit customer product ratings, verify authenticity, and approve public display
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded p-1 text-xs">
          <Filter size={14} className="text-stone-400 ml-2" />
          <span className="text-stone-400 mr-1 text-[11px] font-semibold">Filter:</span>
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded capitalize font-medium transition ${
                statusFilter === st
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-sand-50/70 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Rating & Review</th>
                <th className="p-3.5">Date Submitted</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    Loading customer reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    No customer reviews found matching filter &quot;{statusFilter}&quot;.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50 transition">
                    <td className="p-3.5">
                      <div className="font-semibold text-stone-900">
                        {r.product?.name || 'Unknown Product'}
                      </div>
                      {r.product?.slug && (
                        <Link
                          href={`/products/${r.product.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 mt-0.5"
                        >
                          <span>Storefront Page</span>
                          <ExternalLink size={10} />
                        </Link>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-stone-900">
                        {r.user?.fullName || 'Anonymous Shopper'}
                      </div>
                      <div className="text-[11px] text-stone-400">{r.user?.email || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 max-w-md">
                      {renderStars(r.rating)}
                      {r.title && (
                        <div className="font-semibold text-stone-900 mt-1 text-xs">
                          {r.title}
                        </div>
                      )}
                      <p className="text-stone-600 mt-1 line-clamp-3 text-xs leading-relaxed">
                        {r.body}
                      </p>
                    </td>
                    <td className="p-3.5 text-stone-500 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                          r.moderationStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.moderationStatus === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.moderationStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.moderationStatus !== 'approved' && (
                          <button
                            onClick={() => handleModerate(r.id, 'approved')}
                            disabled={actionInProgress === r.id}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition inline-flex items-center gap-1 shadow-sm disabled:opacity-50"
                          >
                            <CheckCircle2 size={12} />
                            <span>Approve</span>
                          </button>
                        )}
                        {r.moderationStatus !== 'rejected' && (
                          <button
                            onClick={() => handleModerate(r.id, 'rejected')}
                            disabled={actionInProgress === r.id}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 border border-stone-200 rounded text-[11px] font-medium transition inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
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
