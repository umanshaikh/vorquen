import { NextResponse } from 'next/server';
import { CashfreePaymentAdapter, processPaymentWebhookEvent } from '@/lib/services/paymentService';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';

    const adapter = new CashfreePaymentAdapter();
    const isValid = adapter.verifyWebhookSignature(rawBody, signature, timestamp);

    if (!isValid && process.env.NODE_ENV === 'production') {
      console.warn('[CASHFREE WEBHOOK] Invalid webhook signature detected');
      return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type || payload.event || 'PAYMENT_SUCCESS_WEBHOOK';
    const eventId = payload.data?.order?.order_id || payload.order?.order_id || `cf_evt_${Date.now()}`;

    const result = await processPaymentWebhookEvent('cashfree', eventId, eventType, payload);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('[CASHFREE WEBHOOK ERROR]', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
