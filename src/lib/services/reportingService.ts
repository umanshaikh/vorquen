import prisma from '../db/prisma';

export async function getAdminDashboardMetrics() {
  const [
    totalOrders,
    completedOrders,
    pendingOrders,
    processingOrders,
    cancelledOrders,
    paidPayments,
    codOrders,
    lowStockCount,
    returnRequestsCount,
    recentOrders,
    orderItems,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: 'completed' } }),
    prisma.order.count({ where: { orderStatus: 'pending' } }),
    prisma.order.count({ where: { orderStatus: 'processing' } }),
    prisma.order.count({ where: { orderStatus: 'cancelled' } }),
    prisma.payment.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true },
    }),
    prisma.order.findMany({
      where: {
        payments: {
          some: { provider: 'cod', status: 'pending' },
        },
        orderStatus: { not: 'cancelled' },
      },
      select: { totalAmount: true },
    }),
    prisma.productVariant.count({
      where: { stockQuantity: { lte: 10 }, isActive: true },
    }),
    prisma.returnRequest.count({
      where: { status: 'requested' },
    }),
    prisma.order.findMany({
      orderBy: { placedAt: 'desc' },
      take: 6,
      include: {
        items: true,
        payments: true,
      },
    }),
    prisma.orderItem.groupBy({
      by: ['productId', 'productNameSnapshot'],
      _sum: { quantity: true, lineTotal: true },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: 5,
    }),
  ]);

  const totalRevenue = paidPayments._sum.amount || 0;
  const pendingCodRemittance = codOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    cancelledOrders,
    pendingCodRemittance: Number(pendingCodRemittance.toFixed(2)),
    lowStockCount,
    pendingReturnsCount: returnRequestsCount,
    recentOrders,
    topSellingProducts: orderItems.map((item) => ({
      name: item.productNameSnapshot,
      unitsSold: item._sum.quantity || 0,
      totalRevenue: Number((item._sum.lineTotal || 0).toFixed(2)),
    })),
  };
}
