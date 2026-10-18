import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { couponCreateSchema } from '@/lib/validation';

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({
      include: {
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, coupons });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const validated = couponCreateSchema.parse(body);

    const existing = await prisma.coupon.findUnique({
      where: { code: validated.code },
    });

    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: validated.code,
        description: validated.description,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        minimumOrderValue: validated.minimumOrderValue,
        maximumDiscount: validated.maximumDiscount || null,
        usageLimit: validated.usageLimit || null,
        usageLimitPerUser: validated.usageLimitPerUser,
        startsAt: validated.startsAt ? new Date(validated.startsAt) : new Date(),
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        isActive: validated.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'COUPON_CREATED',
        entityType: 'coupon',
        entityId: coupon.id,
        safeMetadata: JSON.stringify({ code: coupon.code, discount: coupon.discountValue, createdBy: admin.email }),
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || 'Coupon creation failed' },
      { status: isAuth ? 401 : 400 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, isActive, description, discountValue, minimumOrderValue } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(description !== undefined && { description }),
        ...(discountValue !== undefined && { discountValue: Number(discountValue) }),
        ...(minimumOrderValue !== undefined && { minimumOrderValue: Number(minimumOrderValue) }),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'COUPON_UPDATED',
        entityType: 'coupon',
        entityId: updated.id,
        safeMetadata: JSON.stringify({ code: updated.code, isActive: updated.isActive, updatedBy: admin.email }),
      },
    });

    return NextResponse.json({ success: true, coupon: updated });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { redemptions: true } } },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    if (coupon._count.redemptions > 0) {
      // Deactivate instead of deleting if previously used
      await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: 'Coupon has historical redemptions and was deactivated instead of deleted.',
      });
    }

    await prisma.coupon.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'COUPON_DELETED',
        entityType: 'coupon',
        entityId: id,
        safeMetadata: JSON.stringify({ code: coupon.code, deletedBy: admin.email }),
      },
    });

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 400 });
  }
}
