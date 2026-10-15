import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/session';
import { updateOrderStatus } from '@/lib/services/orderService';
import { orderStatusTransitionSchema } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    await requireRole(['admin', 'support', 'inventory_manager']);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const search = searchParams.get('q');

    const where: any = {};
    if (status && status !== 'all') where.orderStatus = status;
    if (paymentMethod && paymentMethod !== 'all') {
      where.payments = { some: { provider: paymentMethod } };
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: true,
        shipments: {
          include: { trackingEvents: true },
        },
      },
      orderBy: { placedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireRole(['admin', 'support']);
    const body = await req.json();
    const { orderId, newStatus, note } = orderStatusTransitionSchema.parse(body);

    const updated = await updateOrderStatus(orderId, newStatus, user.id, note);
    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
