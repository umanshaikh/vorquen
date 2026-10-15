'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle, Clock, MapPin } from 'lucide-react';

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Milestone event modal
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [milestoneStatus, setMilestoneStatus] = useState('In Transit');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneLocation, setMilestoneLocation] = useState('Bengaluru Sorting Facility');
  const [updating, setUpdating] = useState(false);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (res.ok) {
        // Collect all shipments from orders
        const allShipments = (data.orders || []).flatMap((o: any) =>
          (o.shipments || []).map((s: any) => ({ ...s, orderNumber: o.orderNumber }))
        );
        setShipments(allShipments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !milestoneStatus || !milestoneDesc) return;
    setUpdating(true);

    try {
      const res = await fetch(`/api/shipments/${selectedShipment.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: milestoneStatus,
          description: milestoneDesc,
          location: milestoneLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add milestone');

      await fetchShipments();
      setSelectedShipment(null);
      setMilestoneDesc('');
      alert('Logistics milestone added and synced with customer tracking!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">Shipments &amp; Courier Logistics</h1>
        <p className="text-xs text-stone-500">Live courier manifests, AWB tracking, and logistics milestones</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-sand-50/70 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">AWB Tracking</th>
                <th className="p-3.5">Order Ref</th>
                <th className="p-3.5">Courier</th>
                <th className="p-3.5">Shipment Status</th>
                <th className="p-3.5">Shipping Cost</th>
                <th className="p-3.5">Dispatched At</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">Loading courier shipments...</td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">No shipments created yet</td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50 transition">
                    <td className="p-3.5 font-bold font-mono text-stone-900">{s.awbNumber}</td>
                    <td className="p-3.5 font-mono">{s.orderNumber}</td>
                    <td className="p-3.5 font-semibold text-stone-800">{s.courierName}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        s.shipmentStatus === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.shipmentStatus === 'out_for_delivery'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.shipmentStatus}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold">₹{s.shippingCost}</td>
                    <td className="p-3.5 text-stone-500">
                      {s.shippedAt ? new Date(s.shippedAt).toLocaleDateString('en-IN') : 'Pending Pickup'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedShipment(s)}
                        className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold rounded"
                      >
                        + Add Milestone
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Milestone Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full p-6 rounded-sm shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Log Courier Milestone: {selectedShipment.awbNumber}
              </h3>
              <button onClick={() => setSelectedShipment(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">New Milestone Status *</label>
                <select
                  value={milestoneStatus}
                  onChange={(e) => setMilestoneStatus(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded bg-white"
                >
                  <option value="Picked Up">Picked Up by Courier</option>
                  <option value="In Transit">In Transit to Regional Hub</option>
                  <option value="Out for Delivery">Out for Delivery to Customer</option>
                  <option value="Delivered">Delivered Successfully</option>
                  <option value="Delayed">Shipment Delayed</option>
                  <option value="Returned to Origin">Returned to Origin (RTO)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Milestone Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Package arrived at Bengaluru Outer Ring Road sort facility"
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Facility / City Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru Hub"
                  value={milestoneLocation}
                  onChange={(e) => setMilestoneLocation(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedShipment(null)}
                  className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800"
                >
                  {updating ? 'Recording...' : 'Broadcast Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
