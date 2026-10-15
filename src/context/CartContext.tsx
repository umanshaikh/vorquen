'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartCalculationResult } from '@/lib/types';

interface CartContextType {
  cart: any;
  totals: CartCalculationResult | null;
  isOpen: boolean;
  itemCount: number;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cart: null,
  totals: null,
  isOpen: false,
  itemCount: 0,
  openCart: () => {},
  closeCart: () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  applyCoupon: async () => ({ success: false }),
  removeCoupon: async () => {},
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any>(null);
  const [totals, setTotals] = useState<CartCalculationResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');

  useEffect(() => {
    // Generate or retrieve persistent guest session ID in localStorage
    let storedSessionId = localStorage.getItem('fashionhub_guest_session');
    if (!storedSessionId) {
      storedSessionId = 'guest_' + Math.random().toString(36).substring(2) + Date.now();
      localStorage.setItem('fashionhub_guest_session', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  const refreshCart = async () => {
    if (!sessionId) return;
    try {
      const url = appliedCouponCode
        ? `/api/cart?sessionId=${sessionId}&coupon=${encodeURIComponent(appliedCouponCode)}`
        : `/api/cart?sessionId=${sessionId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
        setTotals(data.totals);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  };

  useEffect(() => {
    if (sessionId) {
      refreshCart();
    }
  }, [sessionId, appliedCouponCode]);

  const addToCart = async (variantId: string, quantity = 1) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add item to cart');
      await refreshCart();
      setIsOpen(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update quantity');
      }
      await refreshCart();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove item');
      await refreshCart();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const applyCoupon = async (code: string) => {
    if (!totals) return { success: false, message: 'Cart is empty' };
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: totals.subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error };
      }
      setAppliedCouponCode(code);
      return { success: true, message: `Coupon applied: ₹${data.discountAmount} saved!` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const removeCoupon = async () => {
    setAppliedCouponCode('');
  };

  const itemCount =
    cart?.items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        totals,
        isOpen,
        itemCount,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addToCart,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
