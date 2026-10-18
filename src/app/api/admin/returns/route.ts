import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { processReturnStatusUpdate } from '@/lib/services/returnsService';

export async function GET() {
  try {
    await requireAdmin();
    const returns = await prisma.returnRequest.findMany({
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            paymentStatus: true,
            payments: true,
          },
        },
        user: { select: { fullName: true, email: true, phoneNumber: true } },
        items: {
          include: {
            orderItem: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
        },
        refunds: true,
      },
      orderBy: { requestedAt: 'desc' },
    });
    return NextResponse.json({ success: true, returns });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { returnRequestId, newStatus, actionNotes } = body;

    const updated = await processReturnStatusUpdate(
      returnRequestId,
      newStatus,
      actionNotes,
      admin.id
    );

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'RETURN_STATUS_UPDATED',
        entityType: 'return_request',
        entityId: returnRequestId,
        safeMetadata: JSON.stringify({
          newStatus,
          notes: actionNotes,
          updatedBy: admin.email,
        }),
      },
    });

    return NextResponse.json({ success: true, returnRequest: updated });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 400 });
  }
}
