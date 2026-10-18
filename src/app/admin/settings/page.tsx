'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Check,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  Truck,
  History,
  Lock,
  ExternalLink,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('VORQUEN');
  const [supportEmail, setSupportEmail] = useState('concierge@vorquen.com');
  const [supportPhone, setSupportPhone] = useState('+91 80 4567 8900');
  const [currency, setCurrency] = useState('INR');
  const [codEnabled, setCodEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultShippingPolicy, setDefaultShippingPolicy] = useState(
    'Free express shipping on prepaid orders over ₹1,499. ₹99 fee on smaller orders.'
  );
  const [returnPolicy, setReturnPolicy] = useState(
    'Hassle-free 7-day luxury return and exchange policy for unworn items with security tag intact.'
  );

  const [ownerInfo, setOwnerInfo] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok) {
        if (data.settings) {
          setStoreName(data.settings.storeName || 'VORQUEN');
          setSupportEmail(data.settings.supportEmail || 'concierge@vorquen.com');
          setSupportPhone(data.settings.supportPhone || '+91 80 4567 8900');
          setCurrency(data.settings.currency || 'INR');
          setCodEnabled(data.settings.codEnabled ?? true);
          setMaintenanceMode(data.settings.maintenanceMode ?? false);
          if (data.settings.defaultShippingPolicy) {
            setDefaultShippingPolicy(data.settings.defaultShippingPolicy);
          }
          if (data.settings.returnPolicy) {
            setReturnPolicy(data.settings.returnPolicy);
          }
        }
        setOwnerInfo(data.ownerInfo);
        setIntegrations(data.integrations);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          supportEmail,
          supportPhone,
          currency,
          codEnabled,
          maintenanceMode,
          defaultShippingPolicy,
          returnPolicy,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      await fetchSettings();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-stone-400">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading store configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">Store Settings &amp; Security</h1>
        <p className="text-xs text-stone-500">
          Configure storefront branding, owner access enforcement, logistics policies, and audit logs
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
          <Check size={16} />
          <span className="font-semibold">Storefront settings successfully updated and logged to audit trail!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="font-semibold">{saveError}</span>
        </div>
      )}

      {/* Owner Security Status Card */}
      <div className="bg-stone-950 text-stone-200 rounded-sm border border-stone-800 p-6 shadow-md">
        <div className="flex items-center gap-2.5 mb-4">
          <ShieldCheck className="text-amber-400" size={20} />
          <h2 className="font-serif text-base font-bold text-white tracking-wide">
            VORQUEN Owner Authentication &amp; RBAC Security
          </h2>
        </div>
        <p className="text-xs text-stone-400 leading-relaxed mb-4">
          The admin portal enforces multi-layer server-side access control. Every administrative request requires
          a verified session cookie (<code className="text-amber-300">vorquen_admin_session</code>) and a database-backed
          owner check (<code className="text-amber-300">isOwner: true</code> or <code className="text-amber-300">role: &quot;admin&quot;</code>).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-stone-900 p-4 rounded border border-stone-800">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 block">
              Active Owner Session
            </span>
            <span className="font-bold text-white mt-0.5 block truncate">
              {ownerInfo?.currentLoggedInEmail || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 block">
              Configured ENV Email (Optional Lock)
            </span>
            <span className="font-mono text-stone-300 mt-0.5 block truncate">
              {ownerInfo?.configuredOwnerEmail || 'None (Database RBAC Active)'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 block">
              Owner Setup Utility
            </span>
            <code className="text-[11px] text-amber-300 font-mono mt-0.5 block">
              pnpm run setup:owner --email ...
            </code>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
            General Storefront Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-stone-700">Brand Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded focus:border-stone-900 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-700">Currency Code</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded focus:border-stone-900 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-stone-700">Concierge Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded focus:border-stone-900 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-700">Concierge Support Hotline</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded focus:border-stone-900 focus:outline-none"
                required
              />
            </div>
          </div>

          <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 pt-4">
            Policies &amp; Customer Information
          </h3>

          <div>
            <label className="block font-semibold mb-1 text-stone-700">Default Shipping Policy</label>
            <textarea
              rows={2}
              value={defaultShippingPolicy}
              onChange={(e) => setDefaultShippingPolicy(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded focus:border-stone-900 focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-stone-700">Returns &amp; Exchange Policy</label>
            <textarea
              rows={2}
              value={returnPolicy}
              onChange={(e) => setReturnPolicy(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded focus:border-stone-900 focus:outline-none leading-relaxed"
            />
          </div>

          <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 pt-4">
            Checkout &amp; Storefront Controls
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="rounded text-stone-900 focus:ring-0"
              />
              <span className="font-semibold text-stone-800">
                Enable Cash on Delivery (COD) for eligible domestic orders
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="rounded text-stone-900 focus:ring-0"
              />
              <span className="font-semibold text-stone-800">
                Maintenance Mode (Only administrators can browse customer storefront)
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Payment & Logistics Diagnostics Card */}
      <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6">
        <h3 className="font-serif text-base font-bold text-stone-900 mb-4">
          Gateway &amp; Logistics Integrations Diagnostics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 border border-stone-200 rounded bg-stone-50/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <CreditCard size={16} className="text-stone-700" />
                <span>Razorpay Payment Gateway</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  integrations?.razorpay?.configured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {integrations?.razorpay?.configured ? 'Active' : 'Sandbox Ready'}
              </span>
            </div>
            <p className="text-stone-600">
              Operational Status:{' '}
              <span className="font-medium text-stone-900">{integrations?.razorpay?.mode}</span>
            </p>
          </div>

          <div className="p-4 border border-stone-200 rounded bg-stone-50/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <Truck size={16} className="text-stone-700" />
                <span>Shiprocket Logistics</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  integrations?.shiprocket?.configured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {integrations?.shiprocket?.configured ? 'Aggregator Connected' : 'Direct Courier Mode'}
              </span>
            </div>
            <p className="text-stone-600">
              Operational Status:{' '}
              <span className="font-medium text-stone-900">{integrations?.shiprocket?.mode}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Security Audit Trail */}
      <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History size={16} className="text-stone-600" />
            <h3 className="font-serif text-base font-bold text-stone-900">
              Administrative Security Audit Trail
            </h3>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">Recent 30 entries</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-sand-50/70 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700 font-mono text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-stone-400 font-sans">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="p-3 text-stone-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3 font-semibold text-stone-900">{log.action}</td>
                    <td className="p-3 text-stone-600 capitalize">{log.entityType}</td>
                    <td className="p-3 text-stone-500 truncate max-w-xs">{log.safeMetadata}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
