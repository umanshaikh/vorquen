import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
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
        refunds: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch related audit logs for this order
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'order',
        entityId: params.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, order, auditLogs });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: any = {};

    // Internal Notes Update
    if (body.internalNotes !== undefined) {
      updateData.internalNotes = body.internalNotes;
      await prisma.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'ORDER_NOTE_UPDATED',
          entityType: 'order',
          entityId: order.id,
          safeMetadata: JSON.stringify({
            note: body.internalNotes,
            updatedBy: admin.email,
          }),
        },
      });
    }

    // Fulfillment Status Update
    if (body.fulfillmentStatus && ['unfulfilled', 'partially_fulfilled', 'fulfilled'].includes(body.fulfillmentStatus)) {
      updateData.fulfillmentStatus = body.fulfillmentStatus;
      await prisma.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'ORDER_FULFILLMENT_STATUS_CHANGED',
          entityType: 'order',
          entityId: order.id,
          safeMetadata: JSON.stringify({
            previousStatus: order.fulfillmentStatus,
            newStatus: body.fulfillmentStatus,
            updatedBy: admin.email,
          }),
        },
      });
    }

    // Protection rule: Do not allow manually marking as paid without verified reconciliation
    if (body.paymentStatus === 'paid' && order.paymentStatus !== 'paid') {
      const hasVerifiedPayment = order.payments.some((p) => p.status === 'paid');
      if (!hasVerifiedPayment && !body.reconciliationAuthorized) {
        return NextResponse.json(
          {
            error:
              'Security Policy: Administrators cannot manually mark an order as paid without a verified payment-provider result or a documented, secure reconciliation process with audit approval.',
          },
          { status: 400 }
        );
      }
      updateData.paymentStatus = 'paid';
      await prisma.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'ORDER_PAYMENT_RECONCILED_MANUALLY',
          entityType: 'order',
          entityId: order.id,
          safeMetadata: JSON.stringify({
            previousStatus: order.paymentStatus,
            newStatus: 'paid',
            reason: body.reconciliationReason || 'Manual reconciliation approved by store owner',
            updatedBy: admin.email,
          }),
        },
      });
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 400 });
  }
}
