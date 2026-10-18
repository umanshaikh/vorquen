import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { updateOrderStatus } from '@/lib/services/orderService';
import { orderStatusTransitionSchema } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const fulfillmentStatus = searchParams.get('fulfillmentStatus');
    const paymentMethod = searchParams.get('paymentMethod');
    const search = searchParams.get('q');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (status && status !== 'all') where.orderStatus = status;
    if (paymentStatus && paymentStatus !== 'all') where.paymentStatus = paymentStatus;
    if (fulfillmentStatus && fulfillmentStatus !== 'all') where.fulfillmentStatus = fulfillmentStatus;

    if (paymentMethod && paymentMethod !== 'all') {
      where.payments = { some: { provider: paymentMethod } };
    }

    if (startDate || endDate) {
      where.placedAt = {};
      if (startDate) where.placedAt.gte = new Date(startDate);
      if (endDate) where.placedAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } },
        { user: { fullName: { contains: search } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: true,
          },
        },
        payments: true,
        shipments: {
          include: { trackingEvents: { orderBy: { eventTimestamp: 'desc' } } },
        },
        returnRequests: true,
        refunds: true,
      },
      orderBy: { placedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { orderId, newStatus, note } = orderStatusTransitionSchema.parse(body);

    const updated = await updateOrderStatus(orderId, newStatus, admin.id, note);
    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 400 });
  }
}
