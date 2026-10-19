import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { checkoutSchema } from '@/lib/validation';
import { createOrderFromCart } from '@/lib/services/orderService';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const { cartId, customerEmail, customerPhone, shippingAddress, billingAddress, paymentMethod, couponCode, customerNotes } = body;

    const validatedAddress = checkoutSchema.shape.shippingAddress.parse(shippingAddress);

    if (!cartId) {
      return NextResponse.json({ error: 'cartId is required' }, { status: 400 });
    }

    const email = user?.email || customerEmail;
    const phone = user?.phoneNumber || customerPhone || shippingAddress.phoneNumber;

    if (!email) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    const result = await createOrderFromCart({
      cartId,
      userId: user?.id,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: validatedAddress,
      billingAddress: billingAddress || null,
      paymentMethod,
      couponCode,
      customerNotes,
    });

    // If COD, trigger order confirmation email immediately
    if (paymentMethod === 'cod') {
      import('@/lib/services/emailService').then(({ sendOrderConfirmationEmail }) => {
        sendOrderConfirmationEmail({
          orderNumber: result.order.orderNumber,
          customerEmail: email,
          totalAmount: result.order.totalAmount,
          shippingAddressSnapshot: JSON.stringify(validatedAddress),
        }).catch((e) => console.error('[COD EMAIL ERROR]', e));
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        totalAmount: result.order.totalAmount,
        orderStatus: result.order.orderStatus,
        paymentStatus: result.order.paymentStatus,
      },
      paymentDetails: result.paymentDetails,
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 400 });
  }
}
