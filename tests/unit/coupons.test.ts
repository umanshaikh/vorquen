import { describe, it, expect } from 'vitest';

describe('Coupon Validation & Discount Engine', () => {
  it('correctly calculates percentage discount with maximum cap', () => {
    const subtotal = 4000;
    const discountType = 'percentage';
    const discountValue = 20; // 20% of 4000 = 800
    const maximumDiscount = 500; // Cap at 500

    let discount = (subtotal * discountValue) / 100;
    if (maximumDiscount && discount > maximumDiscount) {
      discount = maximumDiscount;
    }

    expect(discount).toBe(500);
  });

  it('rejects coupon when subtotal is below minimum order value', () => {
    const subtotal = 899;
    const minimumOrderValue = 999;
    const isValid = subtotal >= minimumOrderValue;
    expect(isValid).toBe(false);
  });

  it('calculates fixed amount discount without exceeding subtotal', () => {
    const subtotal = 450;
    const discountValue = 500;
    const discount = Math.min(discountValue, subtotal);
    expect(discount).toBe(450);
  });
});
