import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Package, Truck, ArrowRight, Printer, ShieldCheck } from 'lucide-react';
import prisma from '@/lib/db/prisma';

interface Props {
  params: { orderNumber: string };
}

export default async function OrderConfirmationPage({ params }: Props) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
      payments: true,
      shipments: true,
    },
  });

  if (!order) {
    notFound();
  }

  const shippingAddress = JSON.parse(order.shippingAddressSnapshot);
  const payment = order.payments[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      {/* Success Hero */}
      <div className="text-center space-y-3 bg-white border border-stone-200/80 rounded-sm p-8 sm:p-10 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 size={36} />
        </div>
        <span className="text-xs uppercase tracking-widest text-emerald-800 font-bold">
          Order Confirmed
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Thank you for your order!
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
          We are preparing your artisanal pieces. Confirmation and courier tracking details have been dispatched to <strong>{order.customerEmail}</strong>.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="px-4 py-2 bg-sand-100 rounded text-xs font-mono text-stone-800">
            Order Ref: <strong>{order.orderNumber}</strong>
          </div>
          <div className="px-4 py-2 bg-sand-100 rounded text-xs text-stone-800">
            Payment: <strong className="capitalize">{payment?.provider} ({order.paymentStatus})</strong>
          </div>
        </div>
      </div>

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Purchased Items */}
        <div className="md:col-span-2 bg-white border border-stone-200/80 rounded-sm p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
            <Package size={16} />
            <span>Ordered Items ({order.items.length})</span>
          </h2>

          <div className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-semibold text-stone-900">{item.productNameSnapshot}</h4>
                  <p className="text-stone-500 text-[11px]">
                    Size: {item.selectedSize} | Colour: {item.selectedColour} | Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-bold text-stone-900">
                  ₹{item.lineTotal.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotalAmount.toLocaleString('en-IN')}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({order.couponCode})</span>
                <span>-₹{order.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{order.shippingAmount === 0 ? 'FREE' : `₹${order.shippingAmount}`}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-100">
              <span>Total Paid</span>
              <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Address Snapshot */}
        <div className="bg-white border border-stone-200/80 rounded-sm p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
            <Truck size={16} />
            <span>Delivery Destination</span>
          </h2>

          <div className="text-xs text-stone-700 space-y-1">
            <p className="font-bold text-stone-900">{shippingAddress.recipientName}</p>
            <p>{shippingAddress.addressLine1}</p>
            {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
            {shippingAddress.landmark && <p className="text-stone-500">Landmark: {shippingAddress.landmark}</p>}
            <p>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postalCode}</p>
            <p className="pt-2 text-stone-500">Phone: {shippingAddress.phoneNumber}</p>
          </div>

          <div className="pt-4 border-t border-stone-100 space-y-2">
            <Link
              href={`/track-order?q=${encodeURIComponent(order.orderNumber)}`}
              className="w-full py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 hover:bg-stone-800 transition"
            >
              <span>Track Live Delivery</span>
              <ArrowRight size={13} />
            </Link>

            <Link
              href="/shop"
              className="w-full py-2.5 bg-stone-100 text-stone-800 text-xs font-semibold uppercase tracking-wider rounded flex items-center justify-center hover:bg-stone-200 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
