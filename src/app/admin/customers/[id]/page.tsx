'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  LifeBuoy,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'payments' | 'returns'>('orders');

  useEffect(() => {
    fetch(`/api/admin/customers/${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.customer) {
          setCustomer(data.customer);
        }
      })
      .catch((err) => console.error('Failed to load customer profile:', err))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-stone-400 font-mono text-xs uppercase tracking-widest animate-pulse">
        Retrieving private customer dossier...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-4">
        <p className="text-sm font-semibold text-stone-800">Customer record not found.</p>
        <Link href="/admin/customers" className="text-xs text-stone-900 underline font-medium">
          ← Back to Customer Directory
        </Link>
      </div>
    );
  }

  const orders = customer.orders || [];
  const addresses = customer.addresses || [];
  const returnRequests = customer.returnRequests || [];
  const supportTickets = customer.supportTickets || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-2 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-lg shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-stone-500 font-bold">
              Confidential Client Profile
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-950">
              {customer.fullName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-mono font-semibold">
            Lifetime Spend: ₹{customer.totalSpend.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Customer Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold font-serif text-lg">
              {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-stone-950">{customer.fullName}</h3>
              <p className="text-xs text-stone-500 font-mono">Customer ID: {customer.id.slice(0, 12)}</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-stone-100 text-xs">
            <div className="flex items-center gap-2 text-stone-700">
              <Mail size={14} className="text-stone-400 shrink-0" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-700">
              <Phone size={14} className="text-stone-400 shrink-0" />
              <span>{customer.phoneNumber || 'Phone not provided'}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-700 font-mono text-[11px]">
              <Calendar size={14} className="text-stone-400 shrink-0" />
              <span>Registered: {new Date(customer.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-stone-400">
            Fulfillment &amp; Purchases
          </span>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <span className="text-[10px] text-stone-500 font-mono uppercase block">Total Orders</span>
              <span className="text-2xl font-bold font-serif text-stone-900">{customer.orderCount}</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <span className="text-[10px] text-stone-500 font-mono uppercase block">Returns Filed</span>
              <span className="text-2xl font-bold font-serif text-stone-900">{returnRequests.length}</span>
            </div>
          </div>
          <p className="text-[11px] text-stone-400 font-mono">
            Verified accounts have completed authentication and billing verification.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-stone-400">
            Data Privacy &amp; Security Shield
          </span>
          <div className="p-3 bg-stone-900 text-stone-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
              <ShieldCheck size={14} />
              <span>Restricted Data View</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Customer credentials, tokens, and payment instruments are cryptographically shielded. Saved delivery addresses are revealed solely for lawful order fulfillment.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-b-2 border-stone-950 text-stone-950'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <ShoppingBag size={15} />
          <span>Order History ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === 'addresses'
              ? 'border-b-2 border-stone-950 text-stone-950'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <MapPin size={15} />
          <span>Delivery Addresses ({addresses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === 'returns'
              ? 'border-b-2 border-stone-950 text-stone-950'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <RotateCcw size={15} />
          <span>Returns &amp; Refunds ({returnRequests.length})</span>
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items Purchased</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.length > 0 ? (
                  orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">{o.orderNumber}</td>
                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        {new Date(o.placedAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        {o.items?.map((i: any) => i.productNameSnapshot).join(', ') || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        ₹{o.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            o.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-stone-600 font-medium">
                          {o.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium text-[11px]"
                        >
                          View Order →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      No order records found for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Saved Delivery Addresses */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {addresses.length > 0 ? (
            addresses.map((a: any) => (
              <div
                key={a.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[10px] font-mono uppercase font-bold">
                    {a.addressType} Address
                  </span>
                  {a.isDefault && (
                    <span className="text-[10px] text-emerald-700 font-semibold font-mono">
                      • Default Destination
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-stone-900 text-sm">{a.recipientName}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {a.addressLine1}
                  {a.addressLine2 && `, ${a.addressLine2}`}
                  <br />
                  {a.city}, {a.state} - {a.postalCode}
                  <br />
                  {a.countryCode}
                </p>
                <p className="text-xs text-stone-500 font-mono pt-1">Contact: {a.phoneNumber}</p>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-white border border-stone-200 rounded-2xl p-10 text-center text-stone-400 text-xs">
              No saved delivery addresses on file.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Returns & Refunds */}
      {activeTab === 'returns' && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-950">Return Requests</h3>
          {returnRequests.length > 0 ? (
            <div className="space-y-3">
              {returnRequests.map((r: any) => (
                <div
                  key={r.id}
                  className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-stone-900">
                      Order #{r.order?.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono uppercase text-[10px]">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-stone-700">Reason: {r.reason}</p>
                  {r.customerComments && (
                    <p className="text-stone-500 italic">&ldquo;{r.customerComments}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 py-6 text-center">
              No return requests filed by this client.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
