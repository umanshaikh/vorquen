import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Data Governance</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">Privacy & Data Protection</h1>
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded mt-3">
          <strong>Draft Notice:</strong> Compliant with the Digital Personal Data Protection Act (DPDP), 2023.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed bg-white border border-stone-200/80 rounded-sm p-6 sm:p-8">
        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">1. Information We Collect</h3>
          <p>
            We collect personal information necessary to fulfill your orders, including your name, delivery address, phone number, and email. Payment credentials (card numbers, UPI PINs, CVVs) are processed directly by RBI-authorized payment aggregators (Razorpay) and are never stored on our servers.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">2. Purpose of Processing</h3>
          <p>
            Your information is used solely for order processing, courier fulfillment through Shiprocket/courier partners, customer support communication, and optional newsletter dispatches with your explicit consent.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm text-stone-900 mb-1">3. Data Security</h3>
          <p>
            We implement 256-bit TLS encryption in transit, strict database access controls, hashed authentication tokens, and server-side session management.
          </p>
        </div>
      </div>
    </div>
  );
}
