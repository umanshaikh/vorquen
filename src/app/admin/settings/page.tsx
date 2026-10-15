'use client';

import React, { useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('FashionHub Atelier');
  const [supportEmail, setSupportEmail] = useState('support@fashionhub.in');
  const [supportPhone, setSupportPhone] = useState('+91 80 4567 8900');
  const [currency, setCurrency] = useState('INR (₹)');
  const [codEnabled, setCodEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('1499');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">Store Settings &amp; Policies</h1>
        <p className="text-xs text-stone-500">Configure global storefront preferences, payment methods, and contact info</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Brand Storefront Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Currency Standard</label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full p-2.5 border border-stone-200 bg-stone-50 text-stone-500 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Public Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Public Support Helpline</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded"
              />
            </div>
          </div>

          <div className="p-4 bg-sand-100/70 border border-sand-200 rounded space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-stone-900">Payment &amp; Logistics Rules</h3>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="rounded text-stone-900"
              />
              <span className="font-semibold text-stone-800">
                Enable Cash on Delivery (COD) Option Across Storefront
              </span>
            </label>

            <div>
              <label className="block font-semibold mb-1">Free Shipping Threshold Amount (₹)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="w-48 p-2 border border-stone-300 rounded bg-white"
              />
              <p className="text-[11px] text-stone-500 mt-0.5">Orders equal to or exceeding this subtotal qualify for free shipping.</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-sand-200">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="rounded text-rose-600"
              />
              <span className="font-semibold text-rose-800">
                Store Maintenance Mode (Temporarily disables new order checkouts)
              </span>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {saved ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check size={14} />
                <span>Store configuration saved successfully!</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-6 py-2.5 bg-stone-900 text-white font-bold uppercase tracking-wider rounded hover:bg-stone-800 transition flex items-center gap-1.5 shadow"
            >
              <Save size={14} />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
