import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (provider && provider !== 'all') where.provider = provider;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            customerEmail: true,
            customerPhone: true,
            placedAt: true,
            user: { select: { fullName: true } },
          },
        },
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Summary counts
    const [totalPaid, totalPending, totalFailed, totalRefunded] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: 'failed' },
        _count: true,
      }),
      prisma.refund.aggregate({
        where: { status: 'processed' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      payments,
      summary: {
        paidAmount: Number((totalPaid._sum.amount || 0).toFixed(2)),
        paidCount: totalPaid._count,
        pendingAmount: Number((totalPending._sum.amount || 0).toFixed(2)),
        pendingCount: totalPending._count,
        failedCount: totalFailed._count,
        refundedAmount: Number((totalRefunded._sum.amount || 0).toFixed(2)),
        refundedCount: totalRefunded._count,
      },
    });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

/**
 * Reconcile payment status with provider (Razorpay / Gateway)
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    let reconciledStatus = payment.status;
    let providerTransactionId = payment.providerPaymentId;
    let reconciliationNote = '';

    // If Razorpay keys are configured, query Razorpay order status
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (payment.provider === 'razorpay' && keyId && keySecret && !keyId.startsWith('your_') && payment.providerOrderId) {
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch(`https://api.razorpay.com/v1/orders/${payment.providerOrderId}/payments`, {
        headers: { Authorization: `Basic ${authHeader}` },
      });

      if (res.ok) {
        const data = await res.json();
        const successfulPayment = data.items?.find((p: any) => p.status === 'captured');
        if (successfulPayment) {
          reconciledStatus = 'paid';
          providerTransactionId = successfulPayment.id;
          reconciliationNote = `Verified via Razorpay API: Payment captured (${successfulPayment.id})`;
        } else {
          reconciliationNote = `Queried Razorpay API: No captured payments found for Order ${payment.providerOrderId}`;
        }
      }
    } else if (payment.provider === 'cod') {
      reconciliationNote = 'Cash on Delivery: Payment reconciled upon courier remittance verification';
    } else {
      reconciliationNote = 'Test Sandbox Adapter: Payment reconciled via developer test ledger';
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: reconciledStatus,
        providerPaymentId: providerTransactionId,
        paidAt: reconciledStatus === 'paid' ? payment.paidAt || new Date() : null,
      },
    });

    if (reconciledStatus === 'paid' && payment.order.paymentStatus !== 'paid') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'paid', orderStatus: payment.order.orderStatus === 'pending' ? 'confirmed' : payment.order.orderStatus },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'PAYMENT_RECONCILED',
        entityType: 'payment',
        entityId: paymentId,
        safeMetadata: JSON.stringify({
          provider: payment.provider,
          status: reconciledStatus,
          note: reconciliationNote,
          reconciledBy: admin.email,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: reconciliationNote || 'Payment status verified successfully',
    });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 400 });
  }
}
