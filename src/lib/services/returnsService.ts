import prisma from '../db/prisma';
import { ReturnStatus } from '../types';
import { restoreInventory } from './inventoryService';

export interface CreateReturnRequestParams {
  orderId: string;
  orderItemId: string;
  userId: string;
  requestType: 'refund' | 'return' | 'exchange';
  reason: string;
  customerComments?: string;
  quantity?: number;
}

export async function createCustomerReturnRequest(params: CreateReturnRequestParams) {
  const { orderId, orderItemId, userId, requestType, reason, customerComments, quantity = 1 } = params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.userId !== userId) {
    throw new Error('Order not found or access denied');
  }

  const orderItem = order.items.find((i) => i.id === orderItemId);
  if (!orderItem) throw new Error('Order item not found');

  if (quantity > orderItem.quantity) {
    throw new Error('Return quantity cannot exceed purchased quantity');
  }

  // Create return request and return item
  const returnReq = await prisma.returnRequest.create({
    data: {
      orderId,
      userId,
      requestType,
      reason,
      customerComments,
      status: 'requested',
      items: {
        create: [
          {
            orderItemId,
            quantity,
          },
        ],
      },
    },
    include: { items: true },
  });

  return returnReq;
}

export async function processReturnStatusUpdate(
  returnRequestId: string,
  newStatus: ReturnStatus,
  actionNotes?: string,
  actorUserId?: string
) {
  return prisma.$transaction(async (tx) => {
    const returnReq = await tx.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        items: { include: { orderItem: true } },
        order: { include: { payments: true } },
      },
    });

    if (!returnReq) throw new Error('Return request not found');

    const updateData: any = {
      status: newStatus,
      reviewedAt: returnReq.reviewedAt || new Date(),
    };

    if (newStatus === 'resolved') {
      updateData.resolvedAt = new Date();

      // If returning items to stock after physical inspection
      for (const it of returnReq.items) {
        await tx.productVariant.update({
          where: { id: it.orderItem.variantId },
          data: { stockQuantity: { increment: it.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            variantId: it.orderItem.variantId,
            movementType: 'return',
            quantityChange: it.quantity,
            referenceType: 'return_request',
            referenceId: returnReq.id,
            notes: actionNotes || 'Restocked accepted return item',
            createdBy: actorUserId,
          },
        });
      }

      // Record refund entry if payment was made
      const paidPayment = returnReq.order.payments.find((p) => p.status === 'paid');
      if (paidPayment) {
        const refundAmount = returnReq.items.reduce(
          (sum, it) => sum + it.orderItem.unitPrice * it.quantity,
          0
        );

        await tx.refund.create({
          data: {
            orderId: returnReq.orderId,
            paymentId: paidPayment.id,
            returnRequestId: returnReq.id,
            amount: refundAmount,
            status: 'processed',
            reason: `Return resolved: ${actionNotes || 'Customer refund approved'}`,
            processedAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: returnReq.orderId },
          data: { paymentStatus: 'refunded' },
        });

        // Send refund processed email
        import('./emailService').then(({ sendRefundProcessedEmail }) => {
          sendRefundProcessedEmail(
            { orderNumber: returnReq.order.orderNumber, customerEmail: returnReq.order.customerEmail },
            { amount: refundAmount, refundReference: `REF-${returnReq.id.slice(0, 8).toUpperCase()}` }
          ).catch((e) => console.error('[REFUND EMAIL ERROR]', e));
        });
      }
    }

    return tx.returnRequest.update({
      where: { id: returnRequestId },
      data: updateData,
    });
  });
}
