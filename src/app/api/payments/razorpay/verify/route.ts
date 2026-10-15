import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { RazorpayPaymentAdapter } from '@/lib/services/paymentService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, isMockTest } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If sandbox / test mock mode
    if (isMockTest) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            orderStatus: 'confirmed',
            paymentStatus: 'paid',
          },
        });

        await tx.payment.updateMany({
          where: { orderId },
          data: {
            status: 'paid',
            providerPaymentId: `mock_pay_${Date.now()}`,
            paidAt: new Date(),
          },
        });
      });

      return NextResponse.json({ success: true, isTestMode: true });
    }

    // Live Razorpay signature check
    const razorpayAdapter = new RazorpayPaymentAdapter();
    const verification = await razorpayAdapter.verifyPayment(orderId, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!verification.isVerified) {
      await prisma.payment.updateMany({
        where: { orderId },
        data: {
          status: 'failed',
          failureReason: verification.error || 'Signature verification failed',
        },
      });

      return NextResponse.json({ error: verification.error || 'Payment verification failed' }, { status: 400 });
    }

    // Mark paid in transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'confirmed',
          paymentStatus: 'paid',
        },
      });

      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: 'paid',
          providerPaymentId: razorpay_payment_id,
          paidAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
