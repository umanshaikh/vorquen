import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getOrCreateCart, addToCart, calculateCartTotals } from '@/lib/services/cartService';
import { addToCartSchema } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId') || undefined;
    const couponCode = searchParams.get('coupon') || undefined;

    const cart = await getOrCreateCart(user?.id, sessionId);
    if (!cart) throw new Error('Failed to retrieve cart');
    const totals = await calculateCartTotals(cart.id, couponCode, user?.id);

    return NextResponse.json({
      cart,
      totals,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { variantId, quantity } = addToCartSchema.parse(body);
    const sessionId = body.sessionId || undefined;

    const cart = await getOrCreateCart(user?.id, sessionId);
    if (!cart) throw new Error('Failed to retrieve cart');
    const item = await addToCart(cart.id, variantId, quantity);

    const totals = await calculateCartTotals(cart.id, undefined, user?.id);

    return NextResponse.json({
      success: true,
      item,
      cartId: cart.id,
      totals,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.errors?.[0]?.message || err.message }, { status: 400 });
  }
}
