'use client';

import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, History, PlusCircle, Check } from 'lucide-react';

export default function AdminInventoryPage() {
  const [view, setView] = useState<'variants' | 'movements'>('variants');
  const [variants, setVariants] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  // Adjustment modal
  const [adjustVariant, setAdjustVariant] = useState<any | null>(null);
  const [qtyChange, setQtyChange] = useState('');
  const [reason, setReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view === 'variants') {
        const url = filterLowStock ? '/api/admin/inventory?filter=low_stock' : '/api/admin/inventory';
        const res = await fetch(url);
        const data = await res.json();
        setVariants(filterLowStock ? data.items || [] : data.variants || []);
      } else {
        const res = await fetch('/api/admin/inventory?filter=movements');
        const data = await res.json();
        setMovements(data.movements || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [view, filterLowStock]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustVariant || !qtyChange || !reason) return;
    setAdjusting(true);

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: adjustVariant.id,
          quantityChange: Number(qtyChange),
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to adjust stock');

      await fetchData();
      setAdjustVariant(null);
      setQtyChange('');
      setReason('');
      alert('Inventory adjusted and movement logged!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Inventory Ledger &amp; Stock Control</h1>
          <p className="text-xs text-stone-500">Atomic inventory levels, threshold alerts, and audit trail</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView('variants')}
            className={`px-3.5 py-2 text-xs font-semibold rounded transition flex items-center gap-1.5 ${
              view === 'variants' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-700'
            }`}
          >
            <Boxes size={14} />
            <span>Variant Stock Matrix</span>
          </button>
          <button
            onClick={() => setView('movements')}
            className={`px-3.5 py-2 text-xs font-semibold rounded transition flex items-center gap-1.5 ${
              view === 'movements' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-700'
            }`}
          >
            <History size={14} />
            <span>Movement Audit Trail</span>
          </button>
        </div>
      </div>

      {view === 'variants' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer bg-white px-3 py-1.5 border border-stone-200 rounded">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
                className="rounded text-stone-900"
              />
              <span className="font-semibold text-amber-800">Show Only Low Stock (≤ 10 units)</span>
            </label>
          </div>

          <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-sand-50/70 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">SKU Reference</th>
                    <th className="p-3.5">Garment Name</th>
                    <th className="p-3.5">Size</th>
                    <th className="p-3.5">Colour</th>
                    <th className="p-3.5">Current Stock</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {variants.map((v) => (
                    <tr key={v.id} className="hover:bg-stone-50">
                      <td className="p-3.5 font-mono font-bold text-stone-900">{v.sku}</td>
                      <td className="p-3.5 font-semibold text-stone-800">{v.product?.name}</td>
                      <td className="p-3.5 font-bold uppercase">{v.size}</td>
                      <td className="p-3.5">{v.colour}</td>
                      <td className="p-3.5">
                        <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                          v.stockQuantity <= 5
                            ? 'bg-rose-100 text-rose-800'
                            : v.stockQuantity <= 10
                            ? 'bg-amber-100 text-amber-800'
                            : 'text-stone-900'
                        }`}>
                          {v.stockQuantity} units
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setAdjustVariant(v)}
                          className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold rounded inline-flex items-center gap-1"
                        >
                          <PlusCircle size={12} />
                          <span>Adjust Stock</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'movements' && (
        <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-sand-50/70 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Garment &amp; SKU</th>
                  <th className="p-3.5">Movement Type</th>
                  <th className="p-3.5">Change</th>
                  <th className="p-3.5">Reference &amp; Reason</th>
                  <th className="p-3.5">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50">
                    <td className="p-3.5 text-stone-500 font-mono">
                      {new Date(m.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-stone-900">{m.variant?.product?.name}</p>
                      <p className="text-[11px] text-stone-400 font-mono">{m.variant?.sku}</p>
                    </td>
                    <td className="p-3.5 uppercase text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                        {m.movementType}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold">
                      <span className={m.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold">{m.referenceType}: {m.referenceId || 'N/A'}</p>
                      <p className="text-[11px] text-stone-500">{m.notes}</p>
                    </td>
                    <td className="p-3.5 text-stone-400">{m.createdBy || 'System / Order'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full p-6 rounded-sm shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Manual Stock Adjustment
              </h3>
              <button onClick={() => setAdjustVariant(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded text-stone-800 space-y-1">
              <p><strong>SKU:</strong> {adjustVariant.sku}</p>
              <p><strong>Current Units:</strong> {adjustVariant.stockQuantity}</p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Quantity Change (+ to add, - to subtract) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 10 or -2"
                  value={qtyChange}
                  onChange={(e) => setQtyChange(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded font-bold text-center text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Mandatory Audit Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical inventory cycle count adjustment"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustVariant(null)}
                  className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800"
                >
                  {adjusting ? 'Recording...' : 'Commit Ledger Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
