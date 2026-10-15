'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Filter,
  Eye,
  Truck,
  Printer,
  Check,
  AlertCircle,
  User,
  Package,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  Calendar,
  CreditCard,
  MapPin,
  Users
} from 'lucide-react';
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

  // Active View Tab: 'orders' | 'customers'
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string | null>(null);

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

  // Group orders by Customer
  const customerGroups = useMemo(() => {
    const groups: Record<string, {
      customerEmail: string;
      customerName: string;
      customerPhone: string;
      orders: any[];
      totalSpent: number;
      totalItems: number;
    }> = {};

    orders.forEach((ord) => {
      const email = ord.customerEmail || 'Guest Customer';
      const name = ord.user?.fullName || ord.customerEmail.split('@')[0];
      const phone = ord.customerPhone || ord.user?.phoneNumber || 'N/A';

      if (!groups[email]) {
        groups[email] = {
          customerEmail: email,
          customerName: name,
          customerPhone: phone,
          orders: [],
          totalSpent: 0,
          totalItems: 0,
        };
      }

      groups[email].orders.push(ord);
      groups[email].totalSpent += ord.totalAmount || 0;
      groups[email].totalItems += ord.items?.reduce((s: number, it: any) => s + it.quantity, 0) || 0;
    });

    return Object.values(groups);
  }, [orders]);

  // Format parsed shipping address safely
  const formatAddress = (snapshot: string) => {
    try {
      const addr = JSON.parse(snapshot);
      return (
        <div className="space-y-0.5 text-stone-700">
          <p className="font-bold text-stone-900">{addr.recipientName || 'Valued Customer'}</p>
          <p>{addr.addressLine1}</p>
          {addr.addressLine2 && <p>{addr.addressLine2}</p>}
          {addr.landmark && <p className="text-stone-500 italic">Landmark: {addr.landmark}</p>}
          <p>{addr.city}, {addr.state} - <strong className="font-mono text-stone-900">{addr.postalCode}</strong></p>
          <p className="text-[11px] text-stone-500">Phone: {addr.phoneNumber}</p>
        </div>
      );
    } catch {
      return <p className="text-stone-500 italic">Address snapshot unavailable</p>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Order &amp; Customer Management</h1>
          <p className="text-xs text-stone-500">
            View ordered products by customer, track fulfillment, manage shipments, and update lifecycle statuses
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-stone-200 p-1 rounded-sm text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('orders');
              setSelectedCustomerFilter(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'orders' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Orders View ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
              activeTab === 'customers' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users size={14} />
            <span>Customer View ({customerGroups.length} Customers)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 p-4 rounded-sm flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Customer Name, Email, Phone, or Order ID (#)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
            <Search size={14} className="absolute left-2.5 top-3 text-stone-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded hover:bg-stone-800 transition"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setSelectedCustomerFilter(null);
                fetch('/api/admin/orders').then((r) => r.json()).then((d) => setOrders(d.orders || []));
              }}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded"
            >
              Reset
            </button>
          )}
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Filter size={14} />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-stone-300 rounded bg-white font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* TAB 1: ALL ORDERS VIEW */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-sand-50/70 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Order Ref</th>
                  <th className="p-3.5">Placed On</th>
                  <th className="p-3.5">Customer &amp; Contact</th>
                  <th className="p-3.5">Ordered Products</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Lifecycle</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5 text-right">Action</th>
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
                    <tr key={ord.id} className="hover:bg-sand-50/40 transition">
                      <td className="p-3.5">
                        <span className="font-bold font-mono text-stone-900 block">{ord.orderNumber}</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {ord.shipments?.[0]?.awbNumber ? `AWB: ${ord.shipments[0].awbNumber}` : 'Unshipped'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-stone-800 font-medium">
                          {new Date(ord.placedAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-stone-400 block font-mono">
                          {new Date(ord.placedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-[10px] uppercase flex-shrink-0">
                            {(ord.user?.fullName?.[0] || ord.customerEmail?.[0] || 'C')}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 leading-snug">
                              {ord.user?.fullName || ord.customerEmail.split('@')[0]}
                            </p>
                            <p className="text-[11px] text-stone-500">{ord.customerEmail}</p>
                            <p className="text-[10px] text-stone-400 font-mono">{ord.customerPhone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          {ord.items?.slice(0, 2).map((it: any) => {
                            const img = it.product?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=100';
                            return (
                              <div key={it.id} className="flex items-center gap-2">
                                <div className="w-6 h-7 relative rounded bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                                  <Image src={img} alt={it.productNameSnapshot} fill className="object-cover" sizes="24px" />
                                </div>
                                <span className="font-medium text-stone-900 line-clamp-1 max-w-[180px]">
                                  {it.productNameSnapshot}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  ({it.selectedSize} × {it.quantity})
                                </span>
                              </div>
                            );
                          })}
                          {ord.items?.length > 2 && (
                            <span className="text-[10px] text-stone-500 font-semibold block">
                              +{ord.items.length - 2} more item(s)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-stone-900">
                        ₹{ord.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ord.orderStatus === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.orderStatus === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.orderStatus === 'shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : ord.orderStatus === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="p-3.5 capitalize font-medium">
                        <span className="block">{ord.paymentStatus}</span>
                        <span className="text-[10px] text-stone-400 uppercase font-mono">
                          {ord.payments?.[0]?.provider || 'COD'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded text-[11px] inline-flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Eye size={12} />
                          <span>Inspect Order</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMERS & ORDERED PRODUCTS VIEW */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="p-4 bg-sand-50/70 border border-sand-200 rounded text-xs text-stone-700 flex justify-between items-center">
            <div>
              <p className="font-bold text-stone-900">Customer Purchase Ledger</p>
              <p className="text-[11px] text-stone-500">
                Browsing garments and accessories ordered by each customer across all orders
              </p>
            </div>
            <span className="px-3 py-1 bg-white border border-stone-300 rounded font-bold text-stone-800 text-xs">
              {customerGroups.length} Unique Customers
            </span>
          </div>

          <div className="space-y-6">
            {customerGroups.length === 0 ? (
              <div className="p-8 text-center bg-white border border-stone-200 rounded text-stone-400 text-xs">
                No customer orders found matching current criteria.
              </div>
            ) : (
              customerGroups.map((group) => (
                <div
                  key={group.customerEmail}
                  className="bg-white border border-stone-200/90 rounded-sm shadow-sm overflow-hidden"
                >
                  {/* Customer Banner Header */}
                  <div className="p-4 sm:p-5 bg-sand-50/40 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-900 text-white font-bold flex items-center justify-center text-sm uppercase flex-shrink-0">
                        {group.customerName[0] || 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base font-bold text-stone-900">{group.customerName}</h3>
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] font-bold rounded-full">
                            {group.orders.length} {group.orders.length === 1 ? 'Order' : 'Orders'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-mono">
                          {group.customerEmail} • {group.customerPhone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">Total Spent</span>
                        <span className="font-bold text-stone-900 text-sm">
                          ₹{group.totalSpent.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">Total Garments</span>
                        <span className="font-bold text-stone-900 text-sm">
                          {group.totalItems} Units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* List of Products Ordered by this Customer */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                      <Package size={13} className="text-stone-500" />
                      <span>Products Purchased by {group.customerName}</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {group.orders.flatMap((ord) =>
                        ord.items?.map((it: any) => {
                          const thumb = it.product?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200';

                          return (
                            <div
                              key={`${ord.id}-${it.id}`}
                              className="p-3 bg-stone-50/70 border border-stone-200/80 rounded flex gap-3 items-center hover:bg-stone-50 transition"
                            >
                              <div className="w-14 h-16 relative rounded bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                                <Image
                                  src={thumb}
                                  alt={it.productNameSnapshot}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-1">
                                  <Link
                                    href={it.product?.slug ? `/shop/${it.product.slug}` : '#'}
                                    target="_blank"
                                    className="font-bold text-stone-900 hover:underline line-clamp-1 flex items-center gap-1"
                                  >
                                    <span>{it.productNameSnapshot}</span>
                                    <ExternalLink size={10} className="text-stone-400" />
                                  </Link>
                                  <span className="font-bold text-stone-900 whitespace-nowrap">
                                    ₹{it.lineTotal?.toLocaleString('en-IN')}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                                  <span className="px-1.5 py-0.5 bg-stone-200/80 rounded font-semibold text-stone-800 text-[10px]">
                                    Size: {it.selectedSize}
                                  </span>
                                  <span>Colour: {it.selectedColour}</span>
                                  <span>• Qty: {it.quantity}</span>
                                </div>

                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-200/60 text-[10px]">
                                  <button
                                    onClick={() => setSelectedOrder(ord)}
                                    className="font-mono text-stone-600 hover:text-stone-900 font-semibold underline flex items-center gap-1"
                                  >
                                    Order #{ord.orderNumber}
                                  </button>
                                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                    ord.orderStatus === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : ord.orderStatus === 'processing'
                                      ? 'bg-blue-100 text-blue-800'
                                      : ord.orderStatus === 'shipped'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {ord.orderStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* INSPECT ORDER DRAWER / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-sm shadow-xl space-y-6 max-h-[90vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-stone-200">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Order Audit &amp; Fulfillment</span>
                <h2 className="font-serif text-xl font-bold text-stone-900">{selectedOrder.orderNumber}</h2>
                <p className="text-stone-500 text-[11px]">
                  Placed on {new Date(selectedOrder.placedAt).toLocaleString('en-IN', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Customer Details Box */}
            <div className="p-4 bg-sand-50/70 border border-sand-200 rounded space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <User size={14} className="text-stone-600" />
                  <span>Customer Profile</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch(selectedOrder.customerEmail);
                    setSelectedOrder(null);
                    setActiveTab('customers');
                  }}
                  className="text-[11px] font-bold text-stone-900 hover:underline"
                >
                  View Customer History →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Customer Name</span>
                  <p className="font-bold text-stone-900">{selectedOrder.user?.fullName || selectedOrder.customerEmail.split('@')[0]}</p>
                  <p className="text-stone-500">{selectedOrder.customerEmail}</p>
                  <p className="text-stone-500 font-mono">{selectedOrder.customerPhone}</p>
                </div>

                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Payment Breakdown</span>
                  <p className="font-semibold text-stone-900">
                    Payment Method: <span className="uppercase font-mono">{selectedOrder.payments?.[0]?.provider || 'COD'}</span>
                  </p>
                  <p className="capitalize text-stone-600">
                    Status: <strong className="text-stone-900">{selectedOrder.paymentStatus}</strong>
                  </p>
                  <p className="text-stone-500">
                    Total Settled: <strong>₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Lifecycle Status Transition Control */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded space-y-2">
              <span className="font-bold uppercase tracking-wider text-stone-900 block">
                Manage Order Lifecycle Status
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-stone-600">Current Status: <strong className="capitalize text-stone-900">{selectedOrder.orderStatus}</strong></span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="p-2 border border-stone-300 rounded bg-white text-xs font-semibold"
                >
                  <option value="">Select transition...</option>
                  {(VALID_ORDER_TRANSITIONS[selectedOrder.orderStatus as OrderStatus] || []).map((st) => (
                    <option key={st} value={st}>Move to {st}</option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || statusUpdating}
                  className="px-4 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800 disabled:opacity-50 transition"
                >
                  {statusUpdating ? 'Updating...' : 'Apply Transition'}
                </button>
              </div>
              {statusError && <p className="text-rose-600 text-[11px]">{statusError}</p>}
            </div>

            {/* Ordered Products Gallery / Breakdown */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <Package size={14} className="text-stone-600" />
                  <span>Ordered Products ({selectedOrder.items?.length || 0})</span>
                </h3>
                <span className="text-[10px] text-stone-500 font-mono">12% Indian GST Included</span>
              </div>

              <div className="divide-y divide-stone-100 border border-stone-200 rounded bg-white overflow-hidden">
                {selectedOrder.items?.map((it: any) => {
                  const thumb = it.product?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=150';

                  return (
                    <div key={it.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-stone-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 relative rounded bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                          <Image
                            src={thumb}
                            alt={it.productNameSnapshot}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <Link
                            href={it.product?.slug ? `/shop/${it.product.slug}` : '#'}
                            target="_blank"
                            className="font-bold text-stone-900 hover:underline flex items-center gap-1"
                          >
                            <span>{it.productNameSnapshot}</span>
                            <ExternalLink size={11} className="text-stone-400" />
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                            <span className="px-1.5 py-0.2 bg-stone-100 border border-stone-200 rounded font-semibold text-stone-800 text-[10px]">
                              Size: {it.selectedSize}
                            </span>
                            <span>Colour: {it.selectedColour}</span>
                            <span className="font-mono text-stone-400">SKU: {it.skuSnapshot}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-stone-900 text-sm">
                          ₹{it.lineTotal.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          ₹{it.unitPrice.toLocaleString('en-IN')} × {it.quantity} unit(s)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Financial Totals */}
              <div className="p-3 bg-stone-50 border-x border-b border-stone-200 rounded-b text-xs space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotalAmount?.toLocaleString('en-IN')}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({selectedOrder.couponCode || 'Promo'})</span>
                    <span>-₹{selectedOrder.discountAmount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Standard Shipping</span>
                  <span>{selectedOrder.shippingAmount === 0 ? 'FREE' : `₹${selectedOrder.shippingAmount}`}</span>
                </div>
                <div className="flex justify-between text-stone-900 font-bold pt-2 border-t border-stone-200 text-sm">
                  <span>Grand Total</span>
                  <span>₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Shipping Destination */}
            <div>
              <h3 className="font-bold uppercase tracking-wider text-stone-900 mb-2 flex items-center gap-1.5">
                <MapPin size={14} className="text-stone-600" />
                <span>Shipping Destination</span>
              </h3>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded">
                {formatAddress(selectedOrder.shippingAddressSnapshot)}
              </div>
            </div>

            {/* Actions: Shipment Creation & Packing Slip */}
            <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
              <button
                onClick={() => setShipmentModalOpen(true)}
                className="px-4 py-2.5 bg-stone-900 text-white rounded font-semibold hover:bg-stone-800 flex items-center gap-1.5 shadow"
              >
                <Truck size={14} />
                <span>Dispatch / Book Courier</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 border border-stone-300 text-stone-700 rounded font-semibold hover:bg-stone-50 flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print Packing Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SHIPMENT MODAL */}
      {shipmentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full p-6 rounded-sm shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Create Shipment: {selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setShipmentModalOpen(false)} className="text-stone-400 hover:text-stone-700 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Courier Service Partner *</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded bg-white font-medium"
                >
                  <option value="Blue Dart Express">Blue Dart Express (Air Priority)</option>
                  <option value="Delhivery Surface">Delhivery Surface Standard</option>
                  <option value="Shiprocket Direct">Shiprocket Courier Adapter</option>
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
                  className="w-full p-2 border border-stone-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Shipping Cost (₹)</label>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded font-mono"
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
                  className="px-5 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800 disabled:opacity-50"
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
