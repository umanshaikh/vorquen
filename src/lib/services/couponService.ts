import prisma from '../db/prisma';

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  discountAmount: number;
  coupon?: {
    id: string;
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
  };
}

export async function validateAndApplyCoupon(
  code: string,
  subtotal: number,
  userId?: string
): Promise<CouponValidationResult> {
  const normalizedCode = code.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
    include: {
      redemptions: true,
    },
  });

  if (!coupon || !coupon.isActive) {
    return { isValid: false, error: 'Invalid or expired coupon code', discountAmount: 0 };
  }

  const now = new Date();
  if (coupon.startsAt > now) {
    return { isValid: false, error: 'Coupon is not yet active', discountAmount: 0 };
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { isValid: false, error: 'Coupon has expired', discountAmount: 0 };
  }

  if (subtotal < coupon.minimumOrderValue) {
    return {
      isValid: false,
      error: `Minimum order value of ₹${coupon.minimumOrderValue} required for this coupon`,
      discountAmount: 0,
    };
  }

  // Check global usage limit
  if (coupon.usageLimit && coupon.redemptions.length >= coupon.usageLimit) {
    return { isValid: false, error: 'Coupon usage limit has been reached', discountAmount: 0 };
  }

  // Check per-user usage limit
  if (userId) {
    const userRedemptions = coupon.redemptions.filter((r) => r.userId === userId);
    if (userRedemptions.length >= coupon.usageLimitPerUser) {
      return {
        isValid: false,
        error: `You have already redeemed this coupon the maximum allowed times`,
        discountAmount: 0,
      };
    }
  }

  // Calculate discount
  let calculatedDiscount = 0;
  if (coupon.discountType === 'percentage') {
    calculatedDiscount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maximumDiscount && calculatedDiscount > coupon.maximumDiscount) {
      calculatedDiscount = coupon.maximumDiscount;
    }
  } else if (coupon.discountType === 'fixed_amount') {
    calculatedDiscount = Math.min(coupon.discountValue, subtotal);
  }

  calculatedDiscount = Number(calculatedDiscount.toFixed(2));

  return {
    isValid: true,
    discountAmount: calculatedDiscount,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  };
}
