'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Package, MapPin, User, LogOut, ArrowRight, RotateCcw, AlertCircle, Plus, Check } from 'lucide-react';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'returns'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Return modal state
  const [returnModalOrder, setReturnModalOrder] = useState<any | null>(null);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnComments, setReturnComments] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders'); // Uses authenticated user session
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder || !selectedOrderItemId || !returnReason) return;
    setReturnSubmitting(true);

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: returnModalOrder.id,
          orderItemId: selectedOrderItemId,
          requestType: 'return',
          reason: returnReason,
          customerComments: returnComments,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit return request');

      setReturnSuccessMsg('Your return request has been registered and is under review.');
      setTimeout(() => {
        setReturnModalOrder(null);
        setReturnSuccessMsg('');
      }, 2500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReturnSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Sign in to your Account</h2>
        <p className="text-xs text-stone-500">View your order history, manage addresses, and request returns.</p>
        <Link
          href="/login"
          className="inline-block px-8 py-3 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-stone-200 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-bold">Client Portal</span>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Welcome, {user.fullName}</h1>
          <p className="text-xs text-stone-500 mt-0.5">{user.email} • {user.phoneNumber || '+91'}</p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded flex items-center gap-1.5 hover:bg-rose-100 transition"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-stone-200 mt-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-2 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'orders' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Package size={15} />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 px-2 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'addresses' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <MapPin size={15} />
          <span>Saved Addresses</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="py-8">
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded p-12 text-center space-y-3">
                <Package size={40} className="mx-auto text-stone-300" />
                <h3 className="font-serif text-lg font-bold text-stone-800">No Orders Placed Yet</h3>
                <p className="text-xs text-stone-500">Your fashion haul will appear here as soon as you place an order.</p>
                <Link href="/shop" className="inline-block px-6 py-2 bg-stone-900 text-white text-xs font-semibold rounded uppercase">
                  Shop Now
                </Link>
              </div>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="bg-white border border-stone-200/80 rounded-sm shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 bg-sand-100/60 border-b border-stone-200/80 flex flex-wrap justify-between items-center gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 text-[11px]">Order Reference</span>
                      <p className="font-bold text-stone-900">{ord.orderNumber}</p>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px]">Date Placed</span>
                      <p className="font-medium text-stone-800">{new Date(ord.placedAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px]">Total Amount</span>
                      <p className="font-bold text-stone-900">₹{ord.totalAmount?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px]">Status</span>
                      <p className="font-bold capitalize text-stone-900">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                          ord.orderStatus === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        {ord.orderStatus}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/track-order?q=${encodeURIComponent(ord.orderNumber)}`}
                        className="px-3 py-1.5 bg-stone-900 text-white text-[11px] font-semibold rounded hover:bg-stone-800 transition"
                      >
                        Track Courier
                      </Link>
                      <button
                        onClick={() => {
                          setReturnModalOrder(ord);
                          setSelectedOrderItemId(ord.items[0]?.id || '');
                        }}
                        className="px-3 py-1.5 bg-white border border-stone-300 text-stone-800 text-[11px] font-semibold rounded hover:bg-stone-50 transition"
                      >
                        Return / Exchange
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 divide-y divide-stone-100">
                    {ord.items?.map((item: any) => (
                      <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-stone-900">{item.productNameSnapshot}</p>
                          <p className="text-[11px] text-stone-500">
                            Size: {item.selectedSize} | Colour: {item.selectedColour} | Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="font-bold text-stone-900">
                          ₹{item.lineTotal?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200/80 rounded-sm p-6 space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-100 text-stone-700 rounded uppercase">Default Delivery</span>
              <h3 className="font-bold text-xs text-stone-900">{user.fullName}</h3>
              <p className="text-xs text-stone-600">Flat 402, Magnolia Residency, 12th Main Road, HAL 2nd Stage, Indiranagar</p>
              <p className="text-xs text-stone-600">Bengaluru, Karnataka - 560038, India</p>
              <p className="text-xs text-stone-500 pt-1">Phone: {user.phoneNumber || '+91 98765 43210'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Return Request Modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full p-6 rounded-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Initiate Return: Order #{returnModalOrder.orderNumber}
              </h3>
              <button onClick={() => setReturnModalOrder(null)} className="text-stone-400 hover:text-stone-700">
                ✕
              </button>
            </div>

            {returnSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded flex items-center gap-2">
                <Check size={16} />
                <span>{returnSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Select Item to Return *</label>
                  <select
                    value={selectedOrderItemId}
                    onChange={(e) => setSelectedOrderItemId(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded bg-white"
                  >
                    {returnModalOrder.items?.map((it: any) => (
                      <option key={it.id} value={it.id}>
                        {it.productNameSnapshot} ({it.selectedSize} / {it.selectedColour})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Reason for Return *</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    required
                    className="w-full p-2 border border-stone-300 rounded bg-white"
                  >
                    <option value="">Select a reason</option>
                    <option value="Size too small">Size too small</option>
                    <option value="Size too large">Size too large</option>
                    <option value="Fabric / Quality expectation mismatch">Fabric / Quality expectation mismatch</option>
                    <option value="Colour differed slightly from screen">Colour differed slightly from screen</option>
                    <option value="Defective or damaged in transit">Defective or damaged in transit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Additional Comments (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Describe any specifics to assist our inspection team..."
                    value={returnComments}
                    onChange={(e) => setReturnComments(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setReturnModalOrder(null)}
                    className="px-4 py-2 border border-stone-300 text-stone-700 rounded font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={returnSubmitting}
                    className="px-5 py-2 bg-stone-900 text-white rounded font-semibold"
                  >
                    {returnSubmitting ? 'Submitting...' : 'Confirm Return Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
