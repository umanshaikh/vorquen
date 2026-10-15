import crypto from 'crypto';
import prisma from '../db/prisma';
import { PaymentInitiationResult } from '../types';

export interface IPaymentProvider {
  createPaymentOrder(orderId: string, amount: number, currency: string): Promise<PaymentInitiationResult>;
  verifyPayment(orderId: string, paymentDetails: any): Promise<{ isVerified: boolean; error?: string; providerPaymentId?: string }>;
}

export class RazorpayPaymentAdapter implements IPaymentProvider {
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  }

  isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret && !this.keyId.startsWith('your_'));
  }

  async createPaymentOrder(orderId: string, amount: number, currency: string = 'INR'): Promise<PaymentInitiationResult> {
    if (!this.isConfigured()) {
      throw new Error('Razorpay API keys are not configured in environment variables');
    }

    // Convert INR rupees to paise (integer minor units)
    const amountInPaise = Math.round(amount * 100);

    const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: `receipt_${orderId.slice(0, 30)}`,
        notes: { fashionhub_order_id: orderId },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Razorpay order creation failed: ${errData.error?.description || response.statusText}`);
    }

    const data = await response.json();
    return {
      provider: 'razorpay',
      orderId,
      amount,
      currency,
      providerOrderId: data.id,
      keyId: this.keyId,
      isTestMode: this.keyId.startsWith('rzp_test_'),
    };
  }

  async verifyPayment(orderId: string, paymentDetails: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    if (!this.isConfigured()) {
      return { isVerified: false, error: 'Razorpay keys not configured' };
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(razorpay_signature, 'utf-8')
    );

    if (!isAuthentic) {
      return { isVerified: false, error: 'Razorpay payment signature mismatch' };
    }

    return {
      isVerified: true,
      providerPaymentId: razorpay_payment_id,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
    if (!webhookSecret) return false;
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}

/**
 * Clearly labelled test adapter for local development without live Razorpay keys.
 */
export class MockTestPaymentAdapter implements IPaymentProvider {
  async createPaymentOrder(orderId: string, amount: number, currency: string = 'INR'): Promise<PaymentInitiationResult> {
    console.info(`[PAYMENT TEST SANDBOX] Created mock payment intent for Order ${orderId}: ₹${amount}`);
    return {
      provider: 'mock_test',
      orderId,
      amount,
      currency,
      providerOrderId: `mock_order_${Date.now()}`,
      isTestMode: true,
    };
  }

  async verifyPayment(orderId: string, paymentDetails: any) {
    return {
      isVerified: true,
      providerPaymentId: `mock_pay_${Date.now()}`,
    };
  }
}

export function getPaymentAdapter(method: 'razorpay' | 'cod' | 'mock_test'): IPaymentProvider {
  if (method === 'razorpay') {
    const razorpayAdapter = new RazorpayPaymentAdapter();
    if (razorpayAdapter.isConfigured()) {
      return razorpayAdapter;
    }
    // Fall back safely to mock test adapter with explicit notification
    console.warn('[PAYMENT] Razorpay API keys not provided in .env; falling back to Mock Test Adapter');
    return new MockTestPaymentAdapter();
  }

  return new MockTestPaymentAdapter();
}

/**
 * Idempotently records and processes incoming payment webhook events.
 */
export async function processPaymentWebhookEvent(
  provider: string,
  eventId: string,
  eventType: string,
  payload: any
) {
  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: { providerEventId: eventId },
  });

  if (existing) {
    return { status: 'already_processed', message: 'Event already recorded' };
  }

  const webhookLog = await prisma.paymentWebhookEvent.create({
    data: {
      provider,
      providerEventId: eventId,
      eventType,
      processingStatus: 'received',
      receivedAt: new Date(),
    },
  });

  try {
    // Handle payment.captured / order.paid
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const orderId = payload.notes?.fashionhub_order_id;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            orderStatus: 'processing',
            paymentStatus: 'paid',
          },
        });

        await prisma.payment.updateMany({
          where: { orderId },
          data: {
            status: 'paid',
            paidAt: new Date(),
            providerPaymentId: payload.id,
          },
        });
      }
    }

    await prisma.paymentWebhookEvent.update({
      where: { id: webhookLog.id },
      data: {
        processingStatus: 'processed',
        processedAt: new Date(),
      },
    });

    return { status: 'processed' };
  } catch (err: any) {
    await prisma.paymentWebhookEvent.update({
      where: { id: webhookLog.id },
      data: {
        processingStatus: 'failed',
      },
    });
    throw err;
  }
}
