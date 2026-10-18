import prisma from '../db/prisma';

export interface ReportFilter {
  period?: 'today' | 'last_7_days' | 'last_30_days' | 'custom';
  startDate?: string;
  endDate?: string;
}

export async function getAdminDashboardMetrics(filters: ReportFilter = { period: 'last_30_days' }) {
  const now = new Date();
  let start = new Date();

  if (filters.period === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (filters.period === 'last_7_days') {
    start.setDate(now.getDate() - 7);
  } else if (filters.period === 'custom' && filters.startDate) {
    start = new Date(filters.startDate);
  } else {
    // Default 30 days
    start.setDate(now.getDate() - 30);
  }

  const end = filters.period === 'custom' && filters.endDate ? new Date(filters.endDate) : now;

  // Filtered date condition
  const dateRangeWhere = {
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  const [
    totalProducts,
    activeProducts,
    totalCustomers,
    periodCustomers,
    totalOrders,
    periodOrders,
    awaitingProcessingOrders,
    awaitingShipmentOrders,
    deliveredOrders,
    cancelledOrders,
    paidPayments,
    pendingPayments,
    processedRefunds,
    lowStockVariants,
    outOfStockVariants,
    recentOrders,
    recentCustomers,
    orderItemsAgg,
    allOrdersInPeriod,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true, status: 'active' } }),
    prisma.profile.count(),
    prisma.profile.count({ where: dateRangeWhere }),
    prisma.order.count(),
    prisma.order.count({ where: { placedAt: { gte: start, lte: end } } }),
    prisma.order.count({ where: { orderStatus: 'processing' } }),
    prisma.order.count({
      where: {
        orderStatus: { in: ['confirmed', 'processing'] },
        fulfillmentStatus: 'unfulfilled',
      },
    }),
    prisma.order.count({ where: { fulfillmentStatus: 'fulfilled' } }),
    prisma.order.count({ where: { orderStatus: 'cancelled' } }),
    prisma.payment.aggregate({
      where: {
        status: 'paid',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'pending',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.refund.aggregate({
      where: {
        status: 'processed',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.productVariant.findMany({
      where: { stockQuantity: { lte: 5, gt: 0 }, isActive: true },
      include: { product: { select: { id: true, name: true, slug: true } } },
      take: 10,
    }),
    prisma.productVariant.findMany({
      where: { stockQuantity: 0, isActive: true },
      include: { product: { select: { id: true, name: true, slug: true } } },
      take: 10,
    }),
    prisma.order.findMany({
      orderBy: { placedAt: 'desc' },
      take: 8,
      include: {
        user: { select: { fullName: true, email: true } },
        payments: true,
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    }),
    prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        _count: { select: { orders: true } },
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
    prisma.order.findMany({
      where: { placedAt: { gte: start, lte: end } },
      select: {
        id: true,
        placedAt: true,
        totalAmount: true,
        discountAmount: true,
        orderStatus: true,
        paymentStatus: true,
        userId: true,
      },
    }),
  ]);

  const grossSales = paidPayments._sum.amount || 0;
  const pendingSales = pendingPayments._sum.amount || 0;
  const totalRefunds = processedRefunds._sum.amount || 0;
  const netSales = Math.max(0, grossSales - totalRefunds);

  // Discounts applied in period
  const totalDiscounts = allOrdersInPeriod.reduce((acc, o) => acc + (o.discountAmount || 0), 0);

  // Average Order Value (AOV) based on paid orders
  const paidOrdersCount = allOrdersInPeriod.filter((o) => o.paymentStatus === 'paid').length;
  const averageOrderValue = paidOrdersCount > 0 ? grossSales / paidOrdersCount : 0;

  // Returning vs New Customers
  const customerOrderCounts: { [key: string]: number } = {};
  for (const o of allOrdersInPeriod) {
    if (o.userId) {
      customerOrderCounts[o.userId] = (customerOrderCounts[o.userId] || 0) + 1;
    }
  }
  const returningCustomersCount = Object.values(customerOrderCounts).filter((cnt) => cnt > 1).length;

  // Daily sales bucket aggregation for chart
  const dailyBuckets: { [dateStr: string]: { date: string; sales: number; orders: number } } = {};
  const current = new Date(start);
  while (current <= end) {
    const key = current.toISOString().slice(0, 10);
    dailyBuckets[key] = { date: key, sales: 0, orders: 0 };
    current.setDate(current.getDate() + 1);
  }

  for (const o of allOrdersInPeriod) {
    const day = o.placedAt.toISOString().slice(0, 10);
    if (dailyBuckets[day]) {
      dailyBuckets[day].orders += 1;
      if (o.paymentStatus === 'paid') {
        dailyBuckets[day].sales += o.totalAmount;
      }
    }
  }

  const salesOverTime = Object.values(dailyBuckets);

  return {
    summary: {
      totalProducts,
      activeProducts,
      totalCustomers,
      newCustomersInPeriod: periodCustomers,
      returningCustomersCount,
      totalOrders,
      ordersInPeriod: periodOrders,
      awaitingProcessingOrders,
      awaitingShipmentOrders,
      deliveredOrders,
      cancelledOrders,
      grossSales: Number(grossSales.toFixed(2)),
      pendingSales: Number(pendingSales.toFixed(2)),
      totalRefunds: Number(totalRefunds.toFixed(2)),
      netSales: Number(netSales.toFixed(2)),
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      lowStockCount: lowStockVariants.length,
      outOfStockCount: outOfStockVariants.length,
    },
    lowStockVariants: lowStockVariants.map((v) => ({
      variantId: v.id,
      productName: v.product.name,
      productSlug: v.product.slug,
      sku: v.sku,
      size: v.size,
      colour: v.colour,
      stockQuantity: v.stockQuantity,
    })),
    outOfStockVariants: outOfStockVariants.map((v) => ({
      variantId: v.id,
      productName: v.product.name,
      productSlug: v.product.slug,
      sku: v.sku,
      size: v.size,
      colour: v.colour,
      stockQuantity: v.stockQuantity,
    })),
    recentOrders,
    recentCustomers,
    bestSellingProducts: orderItemsAgg.map((item) => ({
      productId: item.productId,
      name: item.productNameSnapshot,
      unitsSold: item._sum.quantity || 0,
      totalRevenue: Number((item._sum.lineTotal || 0).toFixed(2)),
    })),
    salesOverTime,
    filters: {
      period: filters.period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
  };
}
