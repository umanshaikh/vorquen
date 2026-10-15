'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Truck, Printer, Check, AlertCircle } from 'lucide-react';
import { OrderStatus } from '@/lib/types';
import { VALID_ORDER_TRANSITIONS } from '@/lib/services/orderService';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Shipment modal state
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [courierName, setCourierName] = useState('Blue Dart Express');
  const [awbNumber, setAwbNumber] = useState('');
  const [shippingCost, setShippingCost] = useState('85');
  const [shipmentCreating, setShipmentCreating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    setStatusUpdating(true);
    setStatusError('');

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          newStatus,
          note: `Transitioned by staff to ${newStatus}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');

      await fetchOrders();
      setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      setNewStatus('');
    } catch (err: any) {
      setStatusError(err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !awbNumber) return;
    setShipmentCreating(true);

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          provider: 'manual',
          courierName,
          awbNumber,
          shippingCost: Number(shippingCost || 0),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record shipment');

      await fetchOrders();
      setShipmentModalOpen(false);
      setAwbNumber('');
      alert('Shipment successfully created and order dispatched!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setShipmentCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Order Management</h1>
          <p className="text-xs text-stone-500">Track fulfillment, payments, shipments, and customer orders</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 p-4 rounded-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search Order Ref, customer email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-xs p-2.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded hover:bg-stone-800 transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-stone-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-stone-300 rounded bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-sand-50/70 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Order Ref</th>
                <th className="p-3.5">Placed On</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Order Status</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Fulfillment</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">No matching orders found</td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50 transition">
                    <td className="p-3.5 font-bold font-mono text-stone-900">{ord.orderNumber}</td>
                    <td className="p-3.5">{new Date(ord.placedAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-stone-900">{ord.customerEmail}</p>
                      <p className="text-[11px] text-stone-400">{ord.customerPhone}</p>
                    </td>
                    <td className="p-3.5 font-bold text-stone-900">₹{ord.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ord.orderStatus === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.orderStatus === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.orderStatus === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="p-3.5 capitalize font-medium">
                      {ord.paymentStatus} ({ord.payments?.[0]?.provider})
                    </td>
                    <td className="p-3.5 capitalize text-stone-600">{ord.fulfillmentStatus}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Order Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-sm shadow-xl space-y-6 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-start pb-4 border-b border-stone-200">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Order Detail</span>
                <h2 className="font-serif text-xl font-bold text-stone-900">{selectedOrder.orderNumber}</h2>
                <p className="text-stone-500 text-[11px]">Placed {new Date(selectedOrder.placedAt).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-700 text-lg">
                ✕
              </button>
            </div>

            {/* Status Transition Control */}
            <div className="p-4 bg-sand-100/70 border border-sand-200 rounded space-y-2">
              <span className="font-bold uppercase tracking-wider text-stone-900 block">
                Manage Order Lifecycle Status
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-stone-600">Current Status: <strong className="capitalize">{selectedOrder.orderStatus}</strong></span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="p-1.5 border border-stone-300 rounded bg-white text-xs font-semibold"
                >
                  <option value="">Select transition</option>
                  {(VALID_ORDER_TRANSITIONS[selectedOrder.orderStatus as OrderStatus] || []).map((st) => (
                    <option key={st} value={st}>Move to {st}</option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || statusUpdating}
                  className="px-3 py-1.5 bg-stone-900 text-white rounded font-bold hover:bg-stone-800 disabled:opacity-50"
                >
                  {statusUpdating ? 'Updating...' : 'Apply Transition'}
                </button>
              </div>
              {statusError && <p className="text-rose-600 text-[11px]">{statusError}</p>}
            </div>

            {/* Items Breakdown */}
            <div>
              <h3 className="font-bold uppercase tracking-wider text-stone-900 mb-2">Purchased Items</h3>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded">
                {selectedOrder.items?.map((it: any) => (
                  <div key={it.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-stone-900">{it.productNameSnapshot}</p>
                      <p className="text-stone-400 text-[11px]">SKU: {it.skuSnapshot} • Size: {it.selectedSize} • Colour: {it.selectedColour}</p>
                    </div>
                    <span className="font-bold">₹{it.lineTotal.toLocaleString('en-IN')} ({it.quantity} units)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address Snapshot */}
            <div>
              <h3 className="font-bold uppercase tracking-wider text-stone-900 mb-2">Shipping Destination</h3>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded text-stone-700">
                <pre className="font-sans whitespace-pre-wrap">{JSON.stringify(JSON.parse(selectedOrder.shippingAddressSnapshot), null, 2)}</pre>
              </div>
            </div>

            {/* Actions: Shipment Creation & Packing Slip */}
            <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
              <button
                onClick={() => setShipmentModalOpen(true)}
                className="px-4 py-2 bg-stone-900 text-white rounded font-semibold hover:bg-stone-800 flex items-center gap-1.5"
              >
                <Truck size={14} />
                <span>Dispatch / Book Courier</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded font-semibold hover:bg-stone-50 flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print Packing Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Shipment Modal */}
      {shipmentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full p-6 rounded-sm shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Create Shipment: {selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setShipmentModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Courier Service Partner *</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded bg-white"
                >
                  <option value="Blue Dart Express">Blue Dart Express (Air)</option>
                  <option value="Delhivery Surface">Delhivery Surface Standard</option>
                  <option value="Shadowfax Courier">Shadowfax E-Commerce</option>
                  <option value="DTDC Express">DTDC Premium Express</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Airway Bill (AWB) / Tracking No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLUEDART-99887766"
                  value={awbNumber}
                  onChange={(e) => setAwbNumber(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Shipping Cost (₹)</label>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShipmentModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shipmentCreating}
                  className="px-5 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800"
                >
                  {shipmentCreating ? 'Booking...' : 'Confirm Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
