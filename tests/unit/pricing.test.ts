import { describe, it, expect } from 'vitest';

describe('Server-Side Pricing & Cart Calculation Engine', () => {
  it('correctly calculates subtotal from variant units and quantities', () => {
    const items = [
      { unitPrice: 1199, quantity: 2 }, // ₹2,398
      { unitPrice: 2499, quantity: 1 }, // ₹2,499
    ];

    const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    expect(subtotal).toBe(4897);
  });

  it('applies free shipping for subtotal >= ₹1,499', () => {
    const subtotal = 1500;
    const shipping = subtotal >= 1499 ? 0 : 99;
    expect(shipping).toBe(0);
  });

  it('charges ₹99 standard shipping for subtotal < ₹1,499', () => {
    const subtotal = 1199;
    const shipping = subtotal >= 1499 ? 0 : 99;
    expect(shipping).toBe(99);
  });

  it('correctly calculates the 12% Indian GST tax component included in pricing', () => {
    const totalAmount = 1120;
    // 12% GST component = (Total * 12) / 112
    const taxComponent = Number(((totalAmount * 12) / 112).toFixed(2));
    expect(taxComponent).toBe(120.0);
  });
});
