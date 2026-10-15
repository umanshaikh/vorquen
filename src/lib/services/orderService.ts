import prisma from '../db/prisma';
import { AddressSnapshot, OrderStatus } from '../types';
import { calculateCartTotals } from './cartService';
import { deductInventoryInTransaction, restoreInventory } from './inventoryService';
import { getPaymentAdapter } from './paymentService';

export interface CheckoutParams {
  cartId: string;
  userId?: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: AddressSnapshot;
  billingAddress?: AddressSnapshot | null;
  paymentMethod: 'razorpay' | 'cod' | 'mock_test';
  couponCode?: string | null;
  customerNotes?: string | null;
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `FH-${year}-${randomSuffix}`;
}

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Executes complete transactional checkout:
 * 1. Recalculates cart totals on the server
 * 2. Validates coupon and inventory
 * 3. Creates order with snapshots
 * 4. Deducts variant stock atomically
 * 5. Clears cart items
 * 6. Prepares payment order
 */
export async function createOrderFromCart(params: CheckoutParams) {
  const {
    cartId,
    userId,
    customerEmail,
    customerPhone,
    shippingAddress,
    billingAddress,
    paymentMethod,
    couponCode,
    customerNotes,
  } = params;

  // 1. Fetch current cart with items and live product details
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error('Your shopping cart is empty');
  }

  // 2. Server-side price calculation
  const totals = await calculateCartTotals(cartId, couponCode, userId);

  const orderNumber = generateOrderNumber();

  // 3. Database transaction
  const createdOrder = await prisma.$transaction(async (tx) => {
    // Deduct stock atomically
    await deductInventoryInTransaction(
      tx,
      cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      orderNumber
    );

    // Initial status
    const isCOD = paymentMethod === 'cod';
    const initialOrderStatus: OrderStatus = isCOD ? 'confirmed' : 'pending';
    const initialPaymentStatus = 'pending';

    // Create Order
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        customerEmail,
        customerPhone,
        orderStatus: initialOrderStatus,
        paymentStatus: initialPaymentStatus,
        fulfillmentStatus: 'unfulfilled',
        currency: 'INR',
        subtotalAmount: totals.subtotal,
        discountAmount: totals.discount,
        shippingAmount: totals.shipping,
        taxAmount: totals.tax,
        totalAmount: totals.total,
        couponCode: totals.couponCode || null,
        shippingAddressSnapshot: JSON.stringify(shippingAddress),
        billingAddressSnapshot: billingAddress ? JSON.stringify(billingAddress) : null,
        customerNotes: customerNotes || null,
        items: {
          create: cart.items.map((item) => {
            const unitPrice =
              item.variant.priceOverride ??
              item.variant.product.salePrice ??
              item.variant.product.basePrice;
            const lineTotal = Number((unitPrice * item.quantity).toFixed(2));

            return {
              productId: item.variant.productId,
              variantId: item.variant.id,
              productNameSnapshot: item.variant.product.name,
              skuSnapshot: item.variant.sku,
              selectedSize: item.variant.size,
              selectedColour: item.variant.colour,
              unitPrice,
              quantity: item.quantity,
              lineTotal,
            };
          }),
        },
        payments: {
          create: [
            {
              provider: paymentMethod,
              paymentMethod: isCOD ? 'cod' : 'upi',
              amount: totals.total,
              currency: 'INR',
              status: 'pending',
            },
          ],
        },
      },
    });

    // Record coupon redemption if coupon applied
    if (totals.appliedCoupon) {
      const couponRecord = await tx.coupon.findUnique({
        where: { code: totals.appliedCoupon.code },
      });
      if (couponRecord) {
        await tx.couponRedemption.create({
          data: {
            couponId: couponRecord.id,
            userId: userId || null,
            orderId: order.id,
            discountAmount: totals.discount,
          },
        });
      }
    }

    // Clear cart items
    await tx.cartItem.deleteMany({
      where: { cartId },
    });

    return order;
  });

  // 4. Initiate payment provider order
  const paymentProvider = getPaymentAdapter(paymentMethod);
  const paymentDetails = await paymentProvider.createPaymentOrder(
    createdOrder.id,
    createdOrder.totalAmount,
    'INR'
  );

  return {
    order: createdOrder,
    paymentDetails,
  };
}

/**
 * Validates and executes order status transitions with audit logging.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actorUserId?: string,
  note?: string
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error('Order not found');

    const currentStatus = order.orderStatus as OrderStatus;
    const allowed = VALID_ORDER_TRANSITIONS[currentStatus];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from "${currentStatus}" to "${newStatus}"`);
    }

    // If transitioning to cancelled, restore variant inventory
    if (newStatus === 'cancelled') {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            movementType: 'return',
            quantityChange: item.quantity,
            referenceType: 'order_cancellation',
            referenceId: order.orderNumber,
            notes: note || 'Restocked due to order cancellation',
            createdBy: actorUserId,
          },
        });
      }
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { orderStatus: newStatus },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        action: 'ORDER_STATUS_CHANGED',
        entityType: 'order',
        entityId: orderId,
        safeMetadata: JSON.stringify({
          fromStatus: currentStatus,
          toStatus: newStatus,
          note,
        }),
      },
    });

    return updated;
  });
}

export async function getOrderDetails(orderNumberOrId: string) {
  return prisma.order.findFirst({
    where: {
      OR: [{ orderNumber: orderNumberOrId }, { id: orderNumberOrId }],
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
      payments: true,
      shipments: {
        include: {
          trackingEvents: {
            orderBy: { eventTimestamp: 'desc' },
          },
        },
      },
      returnRequests: {
        include: { items: true },
      },
    },
  });
}
