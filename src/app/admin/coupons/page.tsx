'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Check } from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('15');
  const [minimumOrderValue, setMinimumOrderValue] = useState('1499');
  const [maximumDiscount, setMaximumDiscount] = useState('500');
  const [usageLimit, setUsageLimit] = useState('200');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (res.ok) setCoupons(data.coupons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          description,
          discountType,
          discountValue: Number(discountValue),
          minimumOrderValue: Number(minimumOrderValue),
          maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon');

      await fetchCoupons();
      setModalOpen(false);
      setCode('');
      setDescription('');
      alert('Coupon created and activated!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Discount Campaigns &amp; Coupons</h1>
          <p className="text-xs text-stone-500">Configure promotional discount codes, spend caps, and redemptions</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded hover:bg-stone-800 transition flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>New Coupon</span>
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-sand-50/70 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Coupon Code</th>
                <th className="p-3.5">Benefit</th>
                <th className="p-3.5">Min Order</th>
                <th className="p-3.5">Max Cap</th>
                <th className="p-3.5">Redemptions</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="p-3.5 font-bold font-mono text-stone-900">{c.code}</td>
                  <td className="p-3.5">
                    {c.discountType === 'percentage' ? `${c.discountValue}% Off` : `₹${c.discountValue} Flat Off`}
                    <p className="text-[11px] text-stone-400">{c.description}</p>
                  </td>
                  <td className="p-3.5">₹{c.minimumOrderValue.toLocaleString('en-IN')}</td>
                  <td className="p-3.5">{c.maximumDiscount ? `₹${c.maximumDiscount}` : 'None'}</td>
                  <td className="p-3.5 font-semibold text-stone-900">
                    {c._count?.redemptions || 0} {c.usageLimit ? `/ ${c.usageLimit}` : 'times'}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full p-6 rounded-sm shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-stone-900">Create Promotion Coupon</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-stone-300 rounded font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="15% discount on summer shirts above ₹1,499"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2 border border-stone-300 rounded bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={minimumOrderValue}
                    onChange={(e) => setMinimumOrderValue(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={maximumDiscount}
                    onChange={(e) => setMaximumDiscount(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
