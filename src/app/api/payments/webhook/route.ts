import { NextResponse } from 'next/server';
import { processPaymentWebhookEvent, RazorpayPaymentAdapter } from '@/lib/services/paymentService';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const razorpay = new RazorpayPaymentAdapter();
    if (webhookSecret && signature) {
      const isValid = razorpay.verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.id || `event_${Date.now()}`;
    const eventType = payload.event || 'unknown';

    const result = await processPaymentWebhookEvent('razorpay', eventId, eventType, payload.payload?.payment?.entity || payload);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
