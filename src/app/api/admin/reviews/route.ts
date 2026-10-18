import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { reviewModerationSchema } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'all') {
      where.moderationStatus = status;
    }

    const reviews = await prisma.productReview.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { reviewId, status } = reviewModerationSchema.parse(body);

    const updated = await prisma.productReview.update({
      where: { id: reviewId },
      data: { moderationStatus: status },
      include: { product: true },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'REVIEW_MODERATED',
        entityType: 'product_review',
        entityId: reviewId,
        safeMetadata: JSON.stringify({
          productName: updated.product.name,
          newStatus: status,
          moderatedBy: admin.email,
        }),
      },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || 'Review moderation failed' },
      { status: isAuth ? 401 : 400 }
    );
  }
}
