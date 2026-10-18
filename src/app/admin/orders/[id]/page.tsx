'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Send,
  ExternalLink,
} from 'lucide-react';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [updatingNote, setUpdatingNote] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setAuditLogs(data.auditLogs || []);
        setSelectedStatus(data.order.orderStatus);
        setNewNote(data.order.internalNotes || '');
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleStatusChange = async (targetStatus: string) => {
    if (!targetStatus || targetStatus === order.orderStatus) return;
    setUpdatingStatus(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          newStatus: targetStatus,
          note: `Status updated to ${targetStatus} from order detail page`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Status update failed.' });
        return;
      }

      setFeedback({ type: 'success', message: `Order status updated to ${targetStatus}!` });
      fetchOrderDetail();
    } catch {
      setFeedback({ type: 'error', message: 'Network error updating order status.' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingNote(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: newNote }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to save internal note.' });
        return;
      }

      setFeedback({ type: 'success', message: 'Internal admin note recorded in audit ledger.' });
      fetchOrderDetail();
    } catch {
      setFeedback({ type: 'error', message: 'Network error saving note.' });
    } finally {
      setUpdatingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-stone-400 font-mono text-xs uppercase tracking-widest animate-pulse">
        Retrieving order ledger and tracking snapshots...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-4">
        <p className="text-sm font-semibold text-stone-800">Order record not found.</p>
        <Link href="/admin/orders" className="text-xs text-stone-900 underline font-medium">
          ← Back to Orders Console
        </Link>
      </div>
    );
  }

  // Parse shipping address snapshot safely
  let shippingAddress: any = null;
  try {
    shippingAddress = JSON.parse(order.shippingAddressSnapshot);
  } catch {
    shippingAddress = null;
  }

  const payments = order.payments || [];
  const shipments = order.shipments || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-lg shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-stone-500 font-bold">
                Order Detail Ledger
              </span>
              <span className="text-xs font-mono text-stone-400">
                • Placed {new Date(order.placedAt).toLocaleString('en-IN')}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-950 font-mono">
              #{order.orderNumber}
            </h1>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span
            className={`px-3 py-1 rounded-full uppercase font-bold text-[11px] ${
              order.paymentStatus === 'paid'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            Payment: {order.paymentStatus}
          </span>
          <span className="px-3 py-1 bg-stone-100 text-stone-800 border border-stone-200 rounded-full uppercase font-bold text-[11px]">
            Order: {order.orderStatus}
          </span>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full uppercase font-bold text-[11px]">
            Fulfillment: {order.fulfillmentStatus}
          </span>
        </div>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Items & Line Summary) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-950 flex items-center gap-2">
              <ShoppingBag size={18} className="text-stone-700" />
              <span>Purchased Fashion Pieces ({order.items?.length || 0})</span>
            </h3>

            <div className="divide-y divide-stone-100">
              {order.items?.map((item: any) => {
                const primaryImg = item.product?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000';

                return (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-16 bg-stone-100 rounded-lg overflow-hidden relative shrink-0 border border-stone-200">
                        <Image
                          src={primaryImg}
                          alt={item.productNameSnapshot}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-stone-900 text-xs sm:text-sm">
                          {item.productNameSnapshot}
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          Size: <strong className="text-stone-800">{item.selectedSize}</strong> • Colour: <strong className="text-stone-800">{item.selectedColour}</strong>
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          SKU: {item.skuSnapshot}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5 font-mono text-xs">
                      <p className="font-bold text-stone-900 text-sm">
                        ₹{item.lineTotal.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Totals Calculation Breakdown */}
            <div className="pt-4 border-t border-stone-100 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal (Items Total):</span>
                <span>₹{order.subtotalAmount.toLocaleString('en-IN')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discounts Applied ({order.couponCode || 'Promotional'}):</span>
                  <span>-₹{order.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Express Insured Shipping:</span>
                <span>{order.shippingAmount === 0 ? 'FREE' : `₹${order.shippingAmount}`}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>GST Tax (Included):</span>
                <span>₹{order.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-stone-950 pt-2 border-t border-stone-200 font-serif">
                <span>Total Net Charged:</span>
                <span className="font-mono">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment & Transaction History */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-950 flex items-center gap-2">
              <CreditCard size={18} className="text-stone-700" />
              <span>Verified Payment Records</span>
            </h3>

            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((p: any) => (
                  <div key={p.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-stone-900 uppercase">
                        {p.provider} • {p.paymentMethod}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          p.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-500">
                      <div>Amount: ₹{p.amount.toLocaleString('en-IN')}</div>
                      <div>Gateway Payment ID: {p.providerPaymentId || 'Pending'}</div>
                      <div>Gateway Order ID: {p.providerOrderId || 'N/A'}</div>
                      <div>Processed: {p.paidAt ? new Date(p.paidAt).toLocaleString('en-IN') : 'Pending'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No payment record attached to order.</p>
            )}
          </div>

          {/* Shipment & Tracking Milestones */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-950 flex items-center gap-2">
              <Truck size={18} className="text-stone-700" />
              <span>Logistics &amp; Courier Dispatch</span>
            </h3>

            {shipments.length > 0 ? (
              <div className="space-y-4">
                {shipments.map((s: any) => (
                  <div key={s.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-stone-900">{s.courierName}</span>
                        <p className="text-[11px] font-mono text-stone-500">AWB Tracking: {s.awbNumber}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-stone-200 text-stone-800 rounded font-mono uppercase text-[10px]">
                        {s.shipmentStatus}
                      </span>
                    </div>

                    {s.trackingUrl && (
                      <Link
                        href={s.trackingUrl}
                        target="_blank"
                        className="text-stone-900 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <span>Open Courier Portal Tracking</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}

                    {/* Milestones list */}
                    {s.trackingEvents?.length > 0 && (
                      <div className="pt-2 border-t border-stone-200 space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-stone-400 block">
                          Milestone Progression
                        </span>
                        <div className="space-y-1.5 pl-2 border-l-2 border-stone-300">
                          {s.trackingEvents.map((evt: any) => (
                            <div key={evt.id} className="text-[11px]">
                              <span className="font-semibold text-stone-800">{evt.status}</span> —{' '}
                              <span className="text-stone-500">{evt.description}</span>{' '}
                              <span className="text-[10px] text-stone-400 font-mono">
                                ({new Date(evt.eventTimestamp).toLocaleTimeString('en-IN')})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No shipment dispatched yet. Use Shipments console to assign courier.</p>
            )}
          </div>
        </div>

        {/* Right Column (Customer, Notes, Status Controls, Audit Log) */}
        <div className="space-y-6">
          {/* Order Status Controls */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-stone-950">Fulfillment Progression</h3>
            <p className="text-xs text-stone-500">Update order status state machine</p>

            <div className="space-y-2">
              {['confirmed', 'processing', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={updatingStatus || order.orderStatus === st}
                  onClick={() => handleStatusChange(st)}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-lg uppercase tracking-wider text-left transition flex items-center justify-between ${
                    order.orderStatus === st
                      ? 'bg-stone-950 text-white font-bold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span className="capitalize">{st}</span>
                  {order.orderStatus === st && <CheckCircle2 size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Customer & Shipping Address */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3 text-xs">
            <h3 className="font-serif text-base font-bold text-stone-950 flex items-center gap-1.5">
              <MapPin size={16} className="text-stone-600" />
              <span>Delivery Destination</span>
            </h3>

            {shippingAddress ? (
              <div className="space-y-1.5 text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                <p className="font-bold text-stone-950">{shippingAddress.recipientName}</p>
                <p>{shippingAddress.addressLine1}</p>
                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postalCode}
                </p>
                <p className="font-mono text-stone-500 pt-1">Phone: {shippingAddress.phoneNumber}</p>
              </div>
            ) : (
              <p className="text-stone-400 italic">No destination address snapshot found.</p>
            )}

            <div className="pt-2 border-t border-stone-100 space-y-1 text-[11px] text-stone-500">
              <p>Email: <strong className="text-stone-800">{order.customerEmail}</strong></p>
              {order.userId && (
                <Link
                  href={`/admin/customers/${order.userId}`}
                  className="text-stone-900 underline font-semibold block pt-1"
                >
                  View Full Client Profile →
                </Link>
              )}
            </div>
          </div>

          {/* Internal Order Notes */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-stone-950 flex items-center gap-1.5">
              <FileText size={16} className="text-stone-600" />
              <span>Internal Admin Notes</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Confidential notes for store operations. Visible only to the store owner.
            </p>

            <form onSubmit={handleSaveInternalNote} className="space-y-3">
              <textarea
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter internal inspection, packing, or special request notes..."
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <button
                type="submit"
                disabled={updatingNote}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
              >
                {updatingNote ? 'Saving Note...' : 'Save Internal Note'}
              </button>
            </form>
          </div>

          {/* Order Audit Trail */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-serif text-base font-bold text-stone-950 flex items-center gap-1.5">
              <Clock size={16} className="text-stone-600" />
              <span>Security Audit Trail</span>
            </h3>

            {auditLogs.length > 0 ? (
              <div className="space-y-2 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 space-y-0.5">
                    <span className="font-mono font-bold text-[10px] text-stone-800 uppercase block">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono block">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-stone-400 italic">No modifications logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
