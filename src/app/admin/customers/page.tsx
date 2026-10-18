'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ArrowRight,
  Shield,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Phone,
  Mail,
  UserCheck,
  Filter,
} from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-stone-500 font-bold">
            Private Clientèle Directory
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-950 mt-1">
            Customer Directory &amp; Lifetime Value
          </h1>
          <p className="text-xs text-stone-500">
            Confidential customer records • Verified lifetime spend &amp; order history
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg text-xs font-mono text-stone-600">
          <Shield size={14} className="text-stone-700" />
          <span>Privileged Owner Access Only</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search clientèle by full name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </form>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <span className="text-stone-500 font-mono text-[11px] shrink-0">Sort By:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none w-full sm:w-auto"
          >
            <option value="newest">Newest Registrations</option>
            <option value="highest_spend">Highest Lifetime Spend</option>
            <option value="most_orders">Most Orders Placed</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Verified Spend</th>
                <th className="py-3 px-4">Latest Order</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Querying secure customer directory...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold font-serif text-sm shrink-0">
                          {c.fullName ? c.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="font-semibold text-stone-900 block">{c.fullName}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            ID: {c.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <Mail size={12} className="text-stone-400" />
                        <span>{c.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-mono">
                        <Phone size={11} className="text-stone-400" />
                        <span>{c.phoneNumber}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-600">
                      {new Date(c.registrationDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-stone-800">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-stone-400" />
                        <span>{c.orderCount} order(s)</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-stone-950 text-sm">
                        ₹{c.totalSpend.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-stone-400">Paid purchases</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.mostRecentOrder ? (
                        <div className="space-y-0.5">
                          <span className="font-mono font-semibold text-stone-900 text-[11px] block">
                            {c.mostRecentOrder.orderNumber}
                          </span>
                          <span className="text-[10px] text-stone-400 block font-mono">
                            {new Date(c.mostRecentOrder.placedAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-stone-400 text-[11px] italic">No orders yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition"
                      >
                        <span>Profile</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No customer accounts found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
