import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { CashfreePaymentAdapter } from '@/lib/services/paymentService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('order_id');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!orderId) {
    return NextResponse.redirect(`${appUrl}/checkout?error=MISSING_ORDER_ID`);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.redirect(`${appUrl}/checkout?error=ORDER_NOT_FOUND`);
  }

  // Already marked paid
  if (order.paymentStatus === 'paid') {
    return NextResponse.redirect(`${appUrl}/order-confirmation/${order.orderNumber}`);
  }

  const adapter = new CashfreePaymentAdapter();
  const verification = await adapter.verifyPayment(orderId);

  if (verification.isVerified) {
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
          providerPaymentId: verification.providerPaymentId,
          paidAt: new Date(),
        },
      });
    });

    // Send order confirmation email asynchronously
    import('@/lib/services/emailService').then(({ sendOrderConfirmationEmail }) => {
      sendOrderConfirmationEmail({
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        totalAmount: order.totalAmount,
        items: order.items,
        shippingAddressSnapshot: order.shippingAddressSnapshot,
      }).catch((e) => console.error('[CASHFREE EMAIL ERROR]', e));
    });

    return NextResponse.redirect(`${appUrl}/order-confirmation/${order.orderNumber}`);
  }

  // Payment not yet completed or failed
  return NextResponse.redirect(`${appUrl}/checkout?error=PAYMENT_NOT_COMPLETED&orderId=${orderId}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    const adapter = new CashfreePaymentAdapter();
    const verification = await adapter.verifyPayment(orderId);

    if (!verification.isVerified) {
      return NextResponse.json(
        { error: verification.error || 'Payment not verified on Cashfree' },
        { status: 400 }
      );
    }

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
          providerPaymentId: verification.providerPaymentId,
          paidAt: new Date(),
        },
      });
    });

    // Send confirmation email
    import('@/lib/services/emailService').then(({ sendOrderConfirmationEmail }) => {
      sendOrderConfirmationEmail({
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        totalAmount: order.totalAmount,
        items: order.items,
        shippingAddressSnapshot: order.shippingAddressSnapshot,
      }).catch((e) => console.error('[CASHFREE EMAIL ERROR]', e));
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
