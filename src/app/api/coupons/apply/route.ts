import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { validateAndApplyCoupon } from '@/lib/services/couponService';
import { couponApplySchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { code } = couponApplySchema.parse(body);
    const subtotal = Number(body.subtotal || 0);

    const result = await validateAndApplyCoupon(code, subtotal, user?.id);

    if (!result.isValid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      discountAmount: result.discountAmount,
      coupon: result.coupon,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.errors?.[0]?.message || err.message }, { status: 400 });
  }
}
