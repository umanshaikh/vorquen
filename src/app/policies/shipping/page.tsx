import React from 'react';
import Link from 'next/link';

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Store Guidelines</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">Shipping & Delivery Policy</h1>
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded mt-3">
          <strong>Draft Notice:</strong> This policy is configured for FashionHub India. Store owners must review and update SLA timelines before full commercial deployment.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed bg-white border border-stone-200/80 rounded-sm p-6 sm:p-8">
        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">1. Delivery Coverage & Courier Partners</h3>
          <p>
            FashionHub delivers across all serviceable Indian postal codes through primary courier aggregators including Blue Dart, Delhivery, Shadowfax, and DTDC via our integrated shipping API (Shiprocket).
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">2. Shipping Charges</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Prepaid Orders &gt; ₹1,499:</strong> Free Standard Express Shipping.</li>
            <li><strong>Prepaid Orders ≤ ₹1,499:</strong> Flat nominal shipping fee of ₹99.</li>
            <li><strong>Cash on Delivery (COD):</strong> Convenience fee of ₹50 applies on COD shipments to cover handling and collection costs.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">3. Dispatch & Transit Timelines</h3>
          <p>
            Standard orders are dispatched within 24–48 working hours from our Bengaluru fulfillment center. Metro city deliveries typically take 2–4 business days, while non-metro locations take 4–7 business days.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">4. Live Tracking</h3>
          <p>
            Upon manifest generation, customers receive an automated notification with an AWB tracking number. Tracking is accessible anytime on our public <Link href="/track-order" className="text-stone-900 underline font-semibold">Track Order</Link> page.
          </p>
        </div>
      </div>
    </div>
  );
}
