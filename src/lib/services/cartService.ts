import prisma from '../db/prisma';
import { CartCalculationResult } from '../types';
import { validateAndApplyCoupon } from './couponService';

export async function getOrCreateCart(userId?: string, sessionId?: string) {
  if (userId) {
    let cart: any = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { where: { isPrimary: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      images: { where: { isPrimary: true }, take: 1 },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  const effectiveSessionId = sessionId || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  let cart = await prisma.cart.findFirst({
    where: { sessionId: effectiveSessionId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId: effectiveSessionId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { where: { isPrimary: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number
) {
  if (quantity <= 0) throw new Error('Quantity must be greater than 0');

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant || !variant.isActive || !variant.product.isActive) {
    throw new Error('Selected product variant is no longer available');
  }

  if (variant.stockQuantity < quantity) {
    throw new Error(`Only ${variant.stockQuantity} units available in stock`);
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: { cartId, variantId },
    },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (variant.stockQuantity < newQty) {
      throw new Error(`Only ${variant.stockQuantity} units available in stock`);
    }

    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQty },
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId,
      variantId,
      quantity,
    },
  });
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) {
    return prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { variant: true },
  });

  if (!item) throw new Error('Cart item not found');

  if (item.variant.stockQuantity < quantity) {
    throw new Error(`Only ${item.variant.stockQuantity} units available in stock`);
  }

  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });
}

export async function removeCartItem(itemId: string) {
  return prisma.cartItem.delete({
    where: { id: itemId },
  });
}

/**
 * Recalculates cart totals strictly on the server using database product prices.
 */
export async function calculateCartTotals(
  cartId: string,
  couponCode?: string | null,
  userId?: string
): Promise<CartCalculationResult> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return {
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      couponCode: null,
      appliedCoupon: null,
    };
  }

  let subtotal = 0;
  for (const item of cart.items) {
    const effectiveUnitPrice =
      item.variant.priceOverride ??
      item.variant.product.salePrice ??
      item.variant.product.basePrice;

    subtotal += effectiveUnitPrice * item.quantity;
  }

  subtotal = Number(subtotal.toFixed(2));

  // Coupon application
  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const couponRes = await validateAndApplyCoupon(couponCode, subtotal, userId);
    if (couponRes.isValid && couponRes.coupon) {
      discount = couponRes.discountAmount;
      appliedCoupon = couponRes.coupon;
    }
  }

  // Shipping policy: Free above ₹1,499, else ₹99
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = discountedSubtotal >= 1499 || discountedSubtotal === 0 ? 0 : 99;

  // Indian GST included in pricing or calculated: standard 12% on apparel
  // Net Total
  const total = Number((discountedSubtotal + shipping).toFixed(2));
  const tax = Number(((total * 12) / 112).toFixed(2)); // GST component

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total,
    couponCode: appliedCoupon ? couponCode : null,
    appliedCoupon,
  };
}
