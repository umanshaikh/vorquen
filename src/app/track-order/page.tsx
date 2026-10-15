'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Truck, CheckCircle2, Clock, MapPin, Package, AlertCircle } from 'lucide-react';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTracking = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch(`/api/track-order?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tracking details not found');
      }
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to locate tracking information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchTracking(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(query);
  };

  const steps = [
    { key: 'created', label: 'Order Manifested' },
    { key: 'picked_up', label: 'Courier Picked Up' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const currentStatus = result?.shipment?.shipmentStatus || 'created';
  const currentStepIndex = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Live Logistics</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">Track Your Shipment</h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
          Enter your unique FashionHub Order ID (e.g. <strong>FH-2026-00101</strong>) or Courier AWB Number
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex gap-2">
        <input
          type="text"
          required
          placeholder="e.g. FH-2026-00101 or BLUEDART-882910471"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 text-xs bg-white border border-stone-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-stone-800 transition flex items-center gap-1.5 shadow-sm"
        >
          <Search size={14} />
          <span>{loading ? 'Searching...' : 'Track'}</span>
        </button>
      </form>

      {errorMsg && (
        <div className="max-w-xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tracking Results Card */}
      {result && (
        <div className="bg-white border border-stone-200/80 rounded-sm shadow-sm p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-stone-100 gap-4">
            <div>
              <span className="text-xs text-stone-400">Order Reference</span>
              <h2 className="text-lg font-bold text-stone-900">{result.order?.orderNumber}</h2>
              <p className="text-xs text-stone-500">Placed on {new Date(result.order?.placedAt).toLocaleDateString('en-IN')}</p>
            </div>
            {result.shipment && (
              <div className="text-left sm:text-right">
                <span className="text-xs text-stone-400">Courier Partner</span>
                <p className="text-sm font-semibold text-stone-900">{result.shipment.courierName}</p>
                <p className="text-xs text-stone-500 font-mono">AWB: {result.shipment.awbNumber}</p>
              </div>
            )}
          </div>

          {/* Stepper Progress Bar */}
          {result.shipment ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">Shipment Milestone</h3>
              <div className="grid grid-cols-5 gap-2">
                {steps.map((step, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                          isCompleted
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-400 border border-stone-200'
                        } ${isCurrent ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}
                      >
                        {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <span className={`text-[10px] sm:text-xs ${isCompleted ? 'font-bold text-stone-900' : 'text-stone-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-sand-100/70 border border-sand-200 rounded text-xs text-stone-700">
              {result.message}
            </div>
          )}

          {/* Detailed Timeline Events */}
          {result.shipment?.trackingEvents && result.shipment.trackingEvents.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Clock size={14} />
                <span>Logistics Event History</span>
              </h3>

              <div className="space-y-4 pl-4 border-l-2 border-stone-200 ml-2">
                {result.shipment.trackingEvents.map((evt: any, i: number) => (
                  <div key={i} className="relative pl-4 space-y-1">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-stone-900" />
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-stone-900">{evt.status}</span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {new Date(evt.eventTimestamp).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">{evt.description}</p>
                    {evt.location && (
                      <p className="text-[11px] text-stone-400 flex items-center gap-1">
                        <MapPin size={11} />
                        <span>{evt.location}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-stone-500">
          Loading shipment tracker...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}

