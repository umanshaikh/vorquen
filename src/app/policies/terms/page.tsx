import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Legal Agreement</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">Terms & Conditions of Service</h1>
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded mt-3">
          <strong>Draft Notice:</strong> Review with legal counsel prior to formal commercial operations in India.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed bg-white border border-stone-200/80 rounded-sm p-6 sm:p-8">
        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">1. Acceptance of Terms</h3>
          <p>
            By accessing FashionHub and placing an order, you agree to be bound by these Terms of Service in compliance with the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">2. Pricing, Invoicing & Indian Taxes</h3>
          <p>
            All listed product prices are denominated in Indian Rupees (₹/INR) and are inclusive of Goods and Services Tax (GST) at applicable rates (typically 12% on apparel under the GST Act).
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">3. Payment & Order Acceptance</h3>
          <p>
            Online transactions are securely processed through Razorpay. We reserve the right to decline or cancel orders in cases of pricing inaccuracies, stock discrepancies, or suspected fraudulent activity.
          </p>
        </div>
      </div>
    </div>
  );
}
