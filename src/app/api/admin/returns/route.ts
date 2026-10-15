import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/session';
import { processReturnStatusUpdate } from '@/lib/services/returnsService';

export async function GET() {
  try {
    await requireRole(['admin', 'support']);
    const returns = await prisma.returnRequest.findMany({
      include: {
        order: { select: { orderNumber: true, totalAmount: true } },
        user: { select: { fullName: true, email: true } },
        items: {
          include: {
            orderItem: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });
    return NextResponse.json({ success: true, returns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireRole(['admin', 'support']);
    const body = await req.json();
    const { returnRequestId, newStatus, actionNotes } = body;

    const updated = await processReturnStatusUpdate(
      returnRequestId,
      newStatus,
      actionNotes,
      user.id
    );

    return NextResponse.json({ success: true, returnRequest: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
