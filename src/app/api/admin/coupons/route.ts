import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/session';

export async function GET() {
  try {
    await requireRole(['admin']);
    const coupons = await prisma.coupon.findMany({
      include: {
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, coupons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(['admin']);
    const body = await req.json();

    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.trim().toUpperCase(),
        description: body.description,
        discountType: body.discountType,
        discountValue: Number(body.discountValue),
        minimumOrderValue: Number(body.minimumOrderValue || 0),
        maximumDiscount: body.maximumDiscount ? Number(body.maximumDiscount) : null,
        usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
        usageLimitPerUser: Number(body.usageLimitPerUser || 1),
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
