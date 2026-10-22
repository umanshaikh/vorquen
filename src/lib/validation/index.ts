import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().regex(/^[0-9+ -]{10,15}$/, 'Invalid phone number format').optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid administrator email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
});

export const adminForgotPasswordSchema = z.object({
  email: z.string().email('Invalid administrator email address'),
});

export const adminResetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid or expired password reset token'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const addressSchema = z.object({
  recipientName: z.string().min(2, 'Recipient name is required'),
  phoneNumber: z.string().min(10, 'Valid 10-digit phone number is required'),
  addressLine1: z.string().min(3, 'Address Line 1 is required'),
  addressLine2: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit Indian PIN code'),
  countryCode: z.string().default('IN'),
  addressType: z.enum(['home', 'work', 'other']).default('home'),
  isDefault: z.boolean().default(false),
});

export const addToCartSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Max 10 units per item'),
});

export const updateCartItemSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative').max(10, 'Max 10 units per item'),
});

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional().nullable(),
  paymentMethod: z.enum(['cashfree', 'razorpay', 'cod']),
  couponCode: z.string().optional().nullable(),
  customerNotes: z.string().max(500).optional().nullable(),
});

export const couponApplySchema = z.object({
  code: z.string().min(2, 'Coupon code is required').toUpperCase(),
});

export const couponCreateSchema = z.object({
  code: z.string().min(3, 'Coupon code must be at least 3 characters').toUpperCase(),
  description: z.string().min(5, 'Description is required'),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().positive('Discount value must be positive'),
  minimumOrderValue: z.number().min(0).default(0),
  maximumDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  usageLimitPerUser: z.number().int().positive().default(1),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const orderStatusTransitionSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.enum(['pending', 'confirmed', 'processing', 'completed', 'cancelled']),
  note: z.string().optional(),
});

export const createShipmentSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.enum(['shiprocket', 'manual', 'delhivery', 'bluedart']),
  courierName: z.string().min(2, 'Courier name is required'),
  awbNumber: z.string().min(3, 'AWB/Tracking number is required'),
  trackingUrl: z.string().url().optional().or(z.literal('')),
  shippingCost: z.number().min(0).default(0),
});

export const addTrackingEventSchema = z.object({
  shipmentId: z.string().uuid(),
  status: z.string().min(2),
  description: z.string().min(3),
  location: z.string().optional(),
});

export const stockAdjustmentSchema = z.object({
  variantId: z.string().uuid(),
  quantityChange: z.number().int().refine((val) => val !== 0, 'Change must not be zero'),
  reason: z.string().min(3, 'Adjustment reason is required'),
  notes: z.string().optional(),
});

export const productCreateSchema = z.object({
  name: z.string().min(3, 'Product name is required'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must be lower-case alphanumeric with dashes'),
  sku: z.string().min(3).optional().or(z.literal('')),
  description: z.string().min(10, 'Description is required'),
  shortDescription: z.string().optional().or(z.literal('')),
  brand: z.string().default('VORQUEN'),
  categoryId: z.string().uuid('Valid category required'),
  audience: z.enum(['men', 'women', 'unisex', 'accessories']),
  fabric: z.string().optional().or(z.literal('')),
  careInstructions: z.string().optional().or(z.literal('')),
  weight: z.number().positive().optional().nullable(),
  model3dUrl: z.string().optional().nullable(),
  basePrice: z.number().positive('Base price must be positive'),
  salePrice: z.number().positive().optional().nullable(),
  costPrice: z.number().min(0, 'Cost price must be zero or positive'),
  taxCode: z.string().default('GST_12'),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  seoTitle: z.string().optional().or(z.literal('')),
  seoDescription: z.string().optional().or(z.literal('')),
  images: z.array(
    z.object({
      imageUrl: z.string().url('Must be valid image URL'),
      altText: z.string().min(2),
      isPrimary: z.boolean().default(false),
      displayOrder: z.number().default(0),
    })
  ).min(1, 'At least one product image is required'),
  variants: z.array(
    z.object({
      id: z.string().optional(),
      sku: z.string().min(2),
      size: z.string().min(1),
      colour: z.string().min(2),
      colourHex: z.string().optional().or(z.literal('')),
      priceOverride: z.number().positive().optional().nullable(),
      stockQuantity: z.number().int().min(0),
    })
  ).min(1, 'At least one variant is required'),
});

export const productUpdateSchema = productCreateSchema.partial().extend({
  id: z.string().uuid('Product ID required'),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lower-case alphanumeric with dashes'),
  description: z.string().optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  parentCategoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  id: z.string().uuid('Category ID required'),
});

export const reviewModerationSchema = z.object({
  reviewId: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'pending']),
});

export const returnRequestSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  requestType: z.enum(['refund', 'return', 'exchange']),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  customerComments: z.string().optional().or(z.literal('')),
  quantity: z.number().int().min(1).default(1),
});
