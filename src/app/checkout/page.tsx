'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Truck, CreditCard, Banknote, Tag, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totals, applyCoupon, removeCoupon, refreshCart } = useCart();
  const { user } = useAuth();

  const [recipientName, setRecipientName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod' | 'mock_test'>('mock_test');
  const [customerNotes, setCustomerNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Your bag is empty</h2>
        <p className="text-xs text-stone-500">Please add items to your cart before proceeding to checkout.</p>
        <Link href="/shop" className="inline-block px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded uppercase">
          Explore Atelier
        </Link>
      </div>
    );
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponMsg(null);
    const res = await applyCoupon(couponCode.trim());
    if (res.success) {
      setCouponMsg({ type: 'success', text: res.message || 'Coupon Applied!' });
      setCouponCode('');
    } else {
      setCouponMsg({ type: 'error', text: res.message || 'Invalid coupon' });
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Client preliminary validation
    if (!recipientName || !phoneNumber || !customerEmail || !addressLine1 || !city || !state || !postalCode) {
      setErrorMsg('Please complete all required shipping address fields');
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(postalCode.trim())) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code (e.g. 560038)');
      return;
    }

    if (phoneNumber.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please provide a valid 10-digit phone number for courier delivery updates');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        cartId: cart.id,
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: phoneNumber.trim(),
        shippingAddress: {
          recipientName: recipientName.trim(),
          phoneNumber: phoneNumber.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || null,
          landmark: landmark.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          countryCode: 'IN',
          addressType: 'home',
          isDefault: false,
        },
        paymentMethod,
        couponCode: totals?.appliedCoupon?.code || null,
        customerNotes: customerNotes.trim() || null,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // If Razorpay online payment
      if (paymentMethod === 'razorpay' && data.paymentDetails?.keyId && !data.paymentDetails?.isTestMode) {
        // Live Razorpay Checkout SDK launch
        const options = {
          key: data.paymentDetails.keyId,
          amount: data.paymentDetails.amount * 100,
          currency: 'INR',
          name: 'FashionHub Atelier',
          description: `Order ${data.order.orderNumber}`,
          order_id: data.paymentDetails.providerOrderId,
          handler: async function (response: any) {
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (verifyRes.ok) {
              await refreshCart();
              router.push(`/order-confirmation/${data.order.orderNumber}`);
            } else {
              alert('Payment verification failed on the server. Please contact support.');
            }
          },
          prefill: {
            name: recipientName,
            email: customerEmail,
            contact: phoneNumber,
          },
          theme: { color: '#1c1917' },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      }

      // If sandbox mock test or COD
      if (paymentMethod === 'mock_test') {
        // Call verification with test mode flag
        await fetch('/api/payments/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.order.id,
            isMockTest: true,
          }),
        });
      }

      await refreshCart();
      router.push(`/order-confirmation/${data.order.orderNumber}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">Express Checkout</h1>
        <p className="text-xs text-stone-500 mt-1">Review your items and complete delivery details</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Shipping & Payment Fields */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Contact Info */}
          <div className="bg-white border border-stone-200/80 rounded-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Customer Contact</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="priya.sharma@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-xs p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Mobile Phone (for tracking updates) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full text-xs p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping Address */}
          <div className="bg-white border border-stone-200/80 rounded-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Delivery Address (India)</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Recipient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Priya Sharma"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Address Line 1 (House/Flat No., Building Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="Flat 402, Magnolia Residency"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full text-xs p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Address Line 2 (Street, Area)</label>
                  <input
                    type="text"
                    placeholder="12th Main Road, HAL 2nd Stage"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="w-full text-xs p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="Near Sony Signal"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full text-xs p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="Karnataka"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">PIN Code (6 digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="560038"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full text-xs p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Special Delivery Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please leave with security if unavailable"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
              </div>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white border border-stone-200/80 rounded-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">3</span>
              <span>Payment Option</span>
            </h2>

            <div className="space-y-3">
              {/* Option 1: Sandbox Instant Test */}
              <label
                className={`p-4 border rounded cursor-pointer flex items-center justify-between transition ${
                  paymentMethod === 'mock_test'
                    ? 'border-stone-900 bg-sand-100/60 ring-1 ring-stone-900'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'mock_test'}
                    onChange={() => setPaymentMethod('mock_test')}
                    className="text-stone-900 focus:ring-stone-800"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Instant Sandbox Demo (Test Mode)</span>
                    <span className="text-[11px] text-stone-500">
                      Simulates instantaneous verified prepaid order creation without requiring live bank credentials
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  Recommended for Dev
                </span>
              </label>

              {/* Option 2: Razorpay Live */}
              <label
                className={`p-4 border rounded cursor-pointer flex items-center justify-between transition ${
                  paymentMethod === 'razorpay'
                    ? 'border-stone-900 bg-sand-100/60 ring-1 ring-stone-900'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="text-stone-900 focus:ring-stone-800"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block flex items-center gap-2">
                      <CreditCard size={15} />
                      <span>Razorpay Online Payments</span>
                    </span>
                    <span className="text-[11px] text-stone-500">
                      UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Netbanking
                    </span>
                  </div>
                </div>
              </label>

              {/* Option 3: Cash on Delivery */}
              <label
                className={`p-4 border rounded cursor-pointer flex items-center justify-between transition ${
                  paymentMethod === 'cod'
                    ? 'border-stone-900 bg-sand-100/60 ring-1 ring-stone-900'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-stone-900 focus:ring-stone-800"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block flex items-center gap-2">
                      <Banknote size={15} />
                      <span>Cash on Delivery (COD)</span>
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Pay cash or UPI to courier executive upon doorstep delivery
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary & Place Order */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-stone-200/80 rounded-sm p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
              Bag Review ({items.length})
            </h3>

            {/* Compact items list */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1 text-xs divide-y divide-stone-100">
              {items.map((it: any) => {
                const p = it.variant?.product;
                const unitPrice = it.variant?.priceOverride ?? p?.salePrice ?? p?.basePrice ?? 0;
                return (
                  <div key={it.id} className="pt-2 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-stone-900 line-clamp-1">{p?.name}</p>
                      <p className="text-[11px] text-stone-500">
                        {it.variant?.size} / {it.variant?.colour} × {it.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-stone-900">
                      ₹{(unitPrice * it.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Coupon Application */}
            <div className="pt-3 border-t border-stone-100">
              {totals?.appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded text-xs">
                  <span>Coupon: <strong>{totals.appliedCoupon.code}</strong></span>
                  <button type="button" onClick={removeCoupon} className="font-bold text-emerald-950">
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon (e.g. WELCOME10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 text-xs p-2 border border-stone-300 rounded uppercase focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3 py-2 bg-stone-800 text-white text-xs font-semibold rounded hover:bg-stone-900"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponMsg && (
                <p className={`text-[11px] mt-1 ${couponMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{totals?.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              {totals?.discount ? (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount</span>
                  <span>-₹{totals.discount.toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Shipping Charge</span>
                <span>{totals?.shipping === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${totals?.shipping}`}</span>
              </div>
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Taxes Included (GST)</span>
                <span>₹{totals?.tax?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-lg font-bold text-stone-950">
              <span>Payable Total</span>
              <span>₹{totals?.total?.toLocaleString('en-IN')}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-xs font-bold uppercase tracking-widest text-white rounded transition shadow-md flex items-center justify-center gap-2 ${
                loading ? 'bg-stone-600 cursor-wait' : 'bg-stone-950 hover:bg-stone-800'
              }`}
            >
              <span>{loading ? 'Processing Order...' : 'Place Order & Pay'}</span>
              <ArrowRight size={14} />
            </button>

            <p className="text-[10px] text-stone-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>256-bit encrypted SSL checkout</span>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
