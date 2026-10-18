import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminDashboardMetrics, ReportFilter } from '@/lib/services/reportingService';
import prisma from '@/lib/db/prisma';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const period = (searchParams.get('period') as ReportFilter['period']) || 'last_30_days';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const metrics = await getAdminDashboardMetrics({ period, startDate, endDate });

    // Additional deep analytics
    const [salesByAudience, topCategories] = await Promise.all([
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { lineTotal: true, quantity: true },
      }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      analytics: {
        ...metrics,
        categoriesCount: topCategories.length,
      },
    });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}
