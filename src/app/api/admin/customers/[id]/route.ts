import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        isOwner: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { role: true } },
        addresses: {
          select: {
            id: true,
            recipientName: true,
            phoneNumber: true,
            addressLine1: true,
            addressLine2: true,
            landmark: true,
            city: true,
            state: true,
            postalCode: true,
            countryCode: true,
            addressType: true,
            isDefault: true,
            createdAt: true,
          },
        },
        orders: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
              },
            },
            payments: true,
            shipments: {
              include: {
                trackingEvents: { orderBy: { eventTimestamp: 'desc' } },
              },
            },
            returnRequests: {
              include: {
                items: true,
                refunds: true,
              },
            },
          },
          orderBy: { placedAt: 'desc' },
        },
        returnRequests: {
          include: {
            items: true,
            refunds: true,
            order: { select: { orderNumber: true } },
          },
          orderBy: { requestedAt: 'desc' },
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Compute customer aggregate stats
    const verifiedPaidOrders = profile.orders.filter((o) => o.paymentStatus === 'paid');
    const totalSpend = verifiedPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return NextResponse.json({
      success: true,
      customer: {
        ...profile,
        roles: profile.roles.map((r) => r.role),
        totalSpend: Number(totalSpend.toFixed(2)),
        orderCount: profile.orders.length,
      },
    });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}
