'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const pathname = usePathname();
  const { cart, totals, isOpen, closeCart, updateQuantity, removeItem, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [applying, setApplying] = useState(false);

  if (!isOpen || pathname?.startsWith('/admin')) return null;

  const items = cart?.items || [];
  const subtotal = totals?.subtotal || 0;
  const freeShippingThreshold = 1499;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplying(true);
    setCouponFeedback(null);
    const res = await applyCoupon(couponInput.trim());
    setApplying(false);
    if (res.success) {
      setCouponFeedback({ type: 'success', message: res.message || 'Coupon applied' });
      setCouponInput('');
    } else {
      setCouponFeedback({ type: 'error', message: res.message || 'Invalid coupon' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-stone-800" />
              <h2 className="font-serif text-lg font-bold text-stone-900">Your Shopping Bag</h2>
              <span className="text-xs text-stone-500">({items.length} items)</span>
            </div>
            <button
              onClick={closeCart}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Free Shipping Milestone Indicator */}
          <div className="bg-sand-100 p-3.5 border-b border-sand-200">
            {amountNeededForFreeShipping === 0 ? (
              <p className="text-xs font-semibold text-emerald-800 text-center">
                🎉 Congratulations! You have unlocked Free Standard Shipping across India!
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-stone-700 text-center">
                  Add <strong className="text-stone-900">₹{amountNeededForFreeShipping.toFixed(0)}</strong> more to enjoy <strong>Free Shipping</strong>
                </p>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-stone-800 h-1.5 transition-all duration-300"
                    style={{ width: `${freeShippingPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <ShoppingBag size={48} className="text-stone-300 mb-3" />
                <h3 className="text-base font-semibold text-stone-800">Your bag is currently empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mt-1 mb-6">
                  Explore our curated seasonal drop and artisanal essentials.
                </p>
                <button
                  onClick={closeCart}
                  className="px-6 py-2.5 text-xs font-semibold tracking-wider uppercase bg-stone-900 text-white rounded hover:bg-stone-800 transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item: any) => {
                const product = item.variant?.product;
                const image = product?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300';
                const unitPrice = item.variant?.priceOverride ?? product?.salePrice ?? product?.basePrice ?? 0;

                return (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-stone-100">
                    <div className="w-20 h-24 bg-stone-100 rounded overflow-hidden relative flex-shrink-0">
                      <Image
                        src={image}
                        alt={product?.name || 'Product'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-semibold text-stone-900 line-clamp-1">
                            {product?.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-stone-400 hover:text-rose-600 transition p-0.5"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Size: {item.variant?.size} | Colour: {item.variant?.colour}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-stone-200 rounded">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-stone-600 hover:bg-stone-50"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2 text-xs font-medium text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-stone-600 hover:bg-stone-50"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-xs font-bold text-stone-900">
                          ₹{(unitPrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Section */}
          {items.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-sand-50 space-y-3">
              {/* Coupon Form */}
              {totals?.appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <Tag size={14} />
                    <span>Coupon <strong>{totals.appliedCoupon.code}</strong> applied (-₹{totals.discount})</span>
                  </div>
                  <button onClick={removeCoupon} className="text-emerald-700 hover:text-emerald-950 font-bold">
                    ×
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 bg-white border border-stone-300 rounded px-3 py-1.5 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-stone-800"
                  />
                  <button
                    type="submit"
                    disabled={applying}
                    className="px-3 py-1.5 bg-stone-800 text-white text-xs font-semibold rounded hover:bg-stone-900 transition"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponFeedback && (
                <p className={`text-[11px] ${couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {couponFeedback.message}
                </p>
              )}

              {/* Subtotal & Breakdown */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>₹{totals?.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                {totals?.discount ? (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-₹{totals.discount.toLocaleString('en-IN')}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-stone-600">
                  <span>Estimated Shipping</span>
                  <span>{totals?.shipping === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${totals?.shipping}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Payable Total</span>
                  <span>₹{totals?.total?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full py-3 bg-stone-950 hover:bg-stone-800 text-white font-medium text-xs uppercase tracking-widest rounded flex items-center justify-center gap-2 transition"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
