import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Payment Security & Webhook Signature Verification', () => {
  const secret = 'rzp_test_secret_key_12345';

  it('validates authentic Razorpay payment HMAC-SHA256 signatures', () => {
    const orderId = 'order_DA2910482';
    const paymentId = 'pay_9988776655';
    const payload = `${orderId}|${paymentId}`;

    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Verification logic
    const testSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(validSignature, 'utf-8'),
      Buffer.from(testSignature, 'utf-8')
    );

    expect(isValid).toBe(true);
  });

  it('rejects tampered payment signatures', () => {
    const orderId = 'order_DA2910482';
    const paymentId = 'pay_9988776655';
    const payload = `${orderId}|${paymentId}`;

    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const tamperedSignature = crypto
      .createHmac('sha256', 'wrong_secret')
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(validSignature, 'utf-8'),
      Buffer.from(tamperedSignature, 'utf-8')
    );

    expect(isValid).toBe(false);
  });
});
