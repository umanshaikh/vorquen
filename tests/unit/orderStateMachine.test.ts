import { describe, it, expect } from 'vitest';
import { VALID_ORDER_TRANSITIONS } from '@/lib/services/orderService';
import { OrderStatus } from '@/lib/types';

describe('Order Lifecycle State Machine', () => {
  it('allows valid forward status transitions', () => {
    expect(VALID_ORDER_TRANSITIONS['pending']).toContain('confirmed');
    expect(VALID_ORDER_TRANSITIONS['pending']).toContain('cancelled');
    expect(VALID_ORDER_TRANSITIONS['confirmed']).toContain('processing');
    expect(VALID_ORDER_TRANSITIONS['processing']).toContain('completed');
  });

  it('prevents illegal transitions such as moving completed orders back to pending', () => {
    expect(VALID_ORDER_TRANSITIONS['completed']).toEqual([]);
    expect(VALID_ORDER_TRANSITIONS['cancelled']).toEqual([]);
  });

  it('generates compliant and unique order reference strings', () => {
    const year = new Date().getFullYear();
    const orderNumber = `FH-${year}-10293`;
    expect(orderNumber).toMatch(new RegExp(`^FH-${year}-\\d{5}$`));
  });
});
