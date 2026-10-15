import { NextResponse } from 'next/server';
import { updateCartItemQuantity, removeCartItem } from '@/lib/services/cartService';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const quantity = Number(body.quantity);
    const item = await updateCartItemQuantity(params.id, quantity);
    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await removeCartItem(params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
