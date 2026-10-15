import prisma from '../db/prisma';

export interface StockAdjustmentParams {
  variantId: string;
  quantityChange: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  createdBy?: string;
}

/**
 * Atomically verifies stock and deducts inventory inside an active database transaction.
 * Guarantees that stock never drops below zero and two concurrent customers cannot purchase the last unit.
 */
export async function deductInventoryInTransaction(
  tx: any,
  items: { variantId: string; quantity: number }[],
  orderNumber: string
) {
  for (const item of items) {
    // Atomic update with conditional stock check
    const variant = await tx.productVariant.findUnique({
      where: { id: item.variantId },
    });

    if (!variant || !variant.isActive) {
      throw new Error(`Variant ${item.variantId} is inactive or not found`);
    }

    if (variant.stockQuantity < item.quantity) {
      throw new Error(
        `Insufficient stock for SKU ${variant.sku}. Available: ${variant.stockQuantity}, Requested: ${item.quantity}`
      );
    }

    // Atomic decrement
    const updated = await tx.productVariant.update({
      where: { id: item.variantId },
      data: {
        stockQuantity: {
          decrement: item.quantity,
        },
      },
    });

    if (updated.stockQuantity < 0) {
      throw new Error(`Inventory conflict: negative stock prevented for SKU ${variant.sku}`);
    }

    // Record ledger entry
    await tx.inventoryMovement.create({
      data: {
        variantId: item.variantId,
        movementType: 'sale',
        quantityChange: -item.quantity,
        referenceType: 'order',
        referenceId: orderNumber,
        notes: `Sold via Order #${orderNumber}`,
      },
    });
  }
}

/**
 * Restores inventory when an order is cancelled or a returned item is accepted.
 */
export async function restoreInventory(
  variantId: string,
  quantity: number,
  referenceType: string,
  referenceId: string,
  notes: string,
  createdBy?: string
) {
  return prisma.$transaction(async (tx) => {
    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        stockQuantity: {
          increment: quantity,
        },
      },
    });

    await tx.inventoryMovement.create({
      data: {
        variantId,
        movementType: 'return',
        quantityChange: quantity,
        referenceType,
        referenceId,
        notes,
        createdBy,
      },
    });
  });
}

/**
 * Admin manual stock adjustment with reason notes and ledger recording.
 */
export async function adjustStock(params: StockAdjustmentParams) {
  const { variantId, quantityChange, reason, referenceType = 'manual_adjustment', referenceId, createdBy } = params;

  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) throw new Error('Product variant not found');

    const newStock = variant.stockQuantity + quantityChange;
    if (newStock < 0) {
      throw new Error(`Cannot decrease stock below zero. Current stock: ${variant.stockQuantity}`);
    }

    const updatedVariant = await tx.productVariant.update({
      where: { id: variantId },
      data: { stockQuantity: newStock },
    });

    await tx.inventoryMovement.create({
      data: {
        variantId,
        movementType: quantityChange > 0 ? 'receipt' : 'adjustment',
        quantityChange,
        referenceType,
        referenceId,
        notes: reason,
        createdBy,
      },
    });

    return updatedVariant;
  });
}

export async function getLowStockVariants(threshold = 10) {
  return prisma.productVariant.findMany({
    where: {
      stockQuantity: { lte: threshold },
      isActive: true,
    },
    include: {
      product: {
        select: { id: true, name: true, slug: true, brand: true },
      },
    },
    orderBy: { stockQuantity: 'asc' },
  });
}

export async function getInventoryMovements(variantId?: string, limit = 50) {
  return prisma.inventoryMovement.findMany({
    where: variantId ? { variantId } : undefined,
    include: {
      variant: {
        include: {
          product: {
            select: { name: true, slug: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
