import React from 'react';
import Link from 'next/link';

export default function ReturnsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Consumer Care</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">Returns, Exchanges & Refunds</h1>
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded mt-3">
          <strong>Draft Notice:</strong> Review this policy to align with your warehouse inspection and banking reversal processes.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed bg-white border border-stone-200/80 rounded-sm p-6 sm:p-8">
        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">1. 7-Day Doorstep Return Window</h3>
          <p>
            We offer a hassle-free 7-day return and exchange window from the recorded date of delivery for all unworn garments with original brand tags and packaging intact.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">2. Return Eligibility & Exclusions</h3>
          <p>
            Items must be in pristine condition without perfume, makeup stains, or laundering. Intimate wear and customized items are non-returnable for hygiene compliance.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">3. Reverse Pickup</h3>
          <p>
            Once a return request is submitted from your <Link href="/account" className="text-stone-900 underline font-semibold">Account Dashboard</Link>, our courier partner schedules a reverse pickup within 48–72 hours.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">4. Refund Settlement</h3>
          <p>
            Upon receipt and quality inspection at our facility, refunds for prepaid orders are credited back to the original source (UPI, Card, Netbanking) via Razorpay within 5–7 banking business days. For COD orders, refunds are settled via NEFT/UPI bank transfer.
          </p>
        </div>
      </div>
    </div>
  );
}
