import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q');
    const sort = searchParams.get('sort') || 'newest';

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phoneNumber: { contains: search } },
      ];
    }

    // Fetch customers (excluding sensitive credentials)
    const profiles = await prisma.profile.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        createdAt: true,
        roles: { select: { role: true } },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            orderStatus: true,
            paymentStatus: true,
            placedAt: true,
            payments: {
              select: {
                status: true,
                amount: true,
              },
            },
          },
          orderBy: { placedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Compute verified metrics for each customer
    const customers = profiles.map((p) => {
      const orderCount = p.orders.length;
      const verifiedPaidOrders = p.orders.filter((o) => o.paymentStatus === 'paid');
      const totalSpend = verifiedPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const mostRecentOrder = p.orders[0] || null;

      return {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        phoneNumber: p.phoneNumber || 'Not provided',
        registrationDate: p.createdAt,
        roles: p.roles.map((r) => r.role),
        orderCount,
        totalSpend: Number(totalSpend.toFixed(2)),
        mostRecentOrder: mostRecentOrder
          ? {
              orderNumber: mostRecentOrder.orderNumber,
              placedAt: mostRecentOrder.placedAt,
              totalAmount: mostRecentOrder.totalAmount,
              status: mostRecentOrder.orderStatus,
              paymentStatus: mostRecentOrder.paymentStatus,
            }
          : null,
      };
    });

    if (sort === 'highest_spend') {
      customers.sort((a, b) => b.totalSpend - a.totalSpend);
    } else if (sort === 'most_orders') {
      customers.sort((a, b) => b.orderCount - a.orderCount);
    }

    return NextResponse.json({ success: true, customers });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}
