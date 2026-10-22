import crypto from 'crypto';
import prisma from '../db/prisma';
import { PaymentInitiationResult } from '../types';

export interface PaymentOrderMetadata {
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  orderNumber?: string;
}

export interface IPaymentProvider {
  createPaymentOrder(
    orderId: string,
    amount: number,
    currency: string,
    metadata?: PaymentOrderMetadata
  ): Promise<PaymentInitiationResult>;
  verifyPayment(
    orderId: string,
    paymentDetails: any
  ): Promise<{ isVerified: boolean; error?: string; providerPaymentId?: string }>;
}

/**
 * 1. Razorpay Payment Gateway Adapter (India)
 */
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

  async createPaymentOrder(
    orderId: string,
    amount: number,
    currency: string = 'INR',
    metadata?: PaymentOrderMetadata
  ): Promise<PaymentInitiationResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'Razorpay API credentials (NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured.'
      );
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
        receipt: `rcpt_${orderId.slice(0, 30)}`,
        notes: {
          vorquen_order_id: orderId,
          order_number: metadata?.orderNumber || orderId,
        },
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

  async verifyPayment(
    orderId: string,
    paymentDetails: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ) {
    if (!this.isConfigured()) {
      return { isVerified: false, error: 'Razorpay credentials not configured' };
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
 * 2. Cashfree Payment Gateway Adapter (India)
 */
export class CashfreePaymentAdapter implements IPaymentProvider {
  private appId: string;
  private secretKey: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor() {
    this.appId = process.env.CASHFREE_APP_ID || '';
    this.secretKey = process.env.CASHFREE_SECRET_KEY || '';
    this.apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';
    const env = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'SANDBOX').toUpperCase();
    this.baseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
  }

  isConfigured(): boolean {
    return Boolean(this.appId && this.secretKey && !this.appId.startsWith('your_'));
  }

  async createPaymentOrder(
    orderId: string,
    amount: number,
    currency: string = 'INR',
    metadata?: PaymentOrderMetadata
  ): Promise<PaymentInitiationResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'Cashfree API credentials (CASHFREE_APP_ID / CASHFREE_SECRET_KEY) are not configured in environment variables.'
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const customerPhone = metadata?.customerPhone?.replace(/\D/g, '').slice(-10) || '9999999999';

    const orderPayload = {
      order_id: orderId,
      order_amount: Number(amount.toFixed(2)),
      order_currency: currency,
      customer_details: {
        customer_id: `cust_${orderId.slice(0, 20)}`,
        customer_email: metadata?.customerEmail || 'client@vorquen.com',
        customer_phone: customerPhone.length === 10 ? customerPhone : '9999999999',
        customer_name: metadata?.customerName || 'VORQUEN Client',
      },
      order_meta: {
        return_url: `${appUrl}/api/payments/cashfree/verify?order_id={order_id}`,
        notify_url: `${appUrl}/api/payments/cashfree/webhook`,
      },
      order_note: `VORQUEN Order ${metadata?.orderNumber || orderId}`,
    };

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': this.apiVersion,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Cashfree order creation failed: ${data.message || response.statusText}`);
    }

    return {
      provider: 'cashfree',
      orderId,
      amount,
      currency,
      providerOrderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      keyId: this.appId,
      isTestMode: this.baseUrl.includes('sandbox'),
    };
  }

  async verifyPayment(orderId: string) {
    if (!this.isConfigured()) {
      return { isVerified: false, error: 'Cashfree credentials not configured' };
    }

    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': this.apiVersion,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { isVerified: false, error: err.message || 'Failed to query Cashfree order' };
    }

    const data = await response.json();
    const isPaid = data.order_status === 'PAID';

    return {
      isVerified: isPaid,
      providerPaymentId: data.cf_order_id ? String(data.cf_order_id) : undefined,
      error: isPaid ? undefined : `Order is in ${data.order_status} state`,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string, timestamp: string): boolean {
    if (!signature || !timestamp || !this.secretKey) return false;
    const bodyToSign = timestamp + rawBody;
    const expected = crypto.createHmac('sha256', this.secretKey).update(bodyToSign).digest('base64');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}

/**
 * 3. Cash on Delivery (COD) Adapter
 */
export class CodPaymentAdapter implements IPaymentProvider {
  async createPaymentOrder(
    orderId: string,
    amount: number,
    currency: string = 'INR'
  ): Promise<PaymentInitiationResult> {
    return {
      provider: 'cod',
      orderId,
      amount,
      currency,
      providerOrderId: `COD_${orderId.slice(0, 16)}`,
    };
  }

  async verifyPayment(orderId: string) {
    return {
      isVerified: true,
      providerPaymentId: `COD_PENDING_${Date.now()}`,
    };
  }
}

/**
 * Factory for payment providers
 */
export function getPaymentAdapter(method: 'cashfree' | 'razorpay' | 'cod'): IPaymentProvider {
  if (method === 'cashfree') {
    const adapter = new CashfreePaymentAdapter();
    if (adapter.isConfigured()) return adapter;
    throw new Error('Cashfree payment gateway is selected, but CASHFREE_APP_ID / CASHFREE_SECRET_KEY are not configured.');
  }

  if (method === 'razorpay') {
    const adapter = new RazorpayPaymentAdapter();
    if (adapter.isConfigured()) return adapter;
    throw new Error('Razorpay payment gateway is selected, but NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured.');
  }

  if (method === 'cod') {
    return new CodPaymentAdapter();
  }

  throw new Error(`Unsupported payment method: ${method}`);
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
    // Handle payment.captured / order.paid / PAYMENT_SUCCESS_WEBHOOK
    const isPaymentCaptured =
      eventType === 'payment.captured' ||
      eventType === 'order.paid' ||
      eventType === 'PAYMENT_SUCCESS_WEBHOOK';

    if (isPaymentCaptured) {
      const orderId =
        payload.notes?.vorquen_order_id ||
        payload.order?.order_id ||
        payload.data?.order?.order_id;

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            orderStatus: 'confirmed',
            paymentStatus: 'paid',
          },
        });

        await prisma.payment.updateMany({
          where: { orderId },
          data: {
            status: 'paid',
            paidAt: new Date(),
            providerPaymentId: String(payload.id || payload.payment?.cf_payment_id || eventId),
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
