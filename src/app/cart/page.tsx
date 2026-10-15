'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { cart, totals, updateQuantity, removeItem } = useCart();
  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag size={56} className="mx-auto text-stone-300" />
        <h1 className="font-serif text-3xl font-bold text-stone-900">Your Bag is Empty</h1>
        <p className="text-sm text-stone-500 max-w-sm mx-auto">
          Explore our seasonal drops, linen tailoring, and minimalist essentials.
        </p>
        <Link
          href="/shop"
          className="inline-block px-8 py-3 bg-stone-900 text-white text-xs font-semibold uppercase tracking-widest rounded hover:bg-stone-800 transition"
        >
          Explore Atelier
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-stone-200/80 rounded-sm divide-y divide-stone-100">
            {items.map((item: any) => {
              const product = item.variant?.product;
              const image = product?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400';
              const unitPrice = item.variant?.priceOverride ?? product?.salePrice ?? product?.basePrice ?? 0;

              return (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="relative w-20 h-24 bg-stone-100 rounded overflow-hidden flex-shrink-0">
                    <Image src={image} alt={product?.name} fill className="object-cover" unoptimized />
                  </div>

                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">{product?.brand}</span>
                    <h3 className="text-sm font-semibold text-stone-900">{product?.name}</h3>
                    <p className="text-xs text-stone-500">
                      Size: <span className="font-medium text-stone-700">{item.variant?.size}</span> | Colour: <span className="font-medium text-stone-700">{item.variant?.colour}</span>
                    </p>
                    <p className="text-xs font-bold text-stone-900 pt-1">₹{unitPrice.toLocaleString('en-IN')}</p>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center border border-stone-200 rounded">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-stone-50 text-stone-600"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-stone-50 text-stone-600"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-stone-900 sm:w-20 text-right">
                      ₹{(unitPrice * item.quantity).toLocaleString('en-IN')}
                    </span>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-stone-400 hover:text-rose-600 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-xs text-stone-600 py-4">
            <div className="flex items-center justify-center gap-2 p-3 bg-white border border-stone-200 rounded">
              <Truck size={16} className="text-stone-700" />
              <span>Fast Pan-India Shipping</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 bg-white border border-stone-200 rounded">
              <RefreshCw size={16} className="text-stone-700" />
              <span>7-Day Return Window</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 bg-white border border-stone-200 rounded">
              <ShieldCheck size={16} className="text-stone-700" />
              <span>100% Genuine Quality</span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-stone-200/80 rounded-sm p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
              Order Summary
            </h2>

            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₹{totals?.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              {totals?.discount ? (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Savings</span>
                  <span>-₹{totals.discount.toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{totals?.shipping === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${totals?.shipping}`}</span>
              </div>
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Estimated GST component (12%)</span>
                <span>₹{totals?.tax?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline text-base font-bold text-stone-950">
              <span>Estimated Total</span>
              <span>₹{totals?.total?.toLocaleString('en-IN')}</span>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3.5 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 transition shadow-md"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
