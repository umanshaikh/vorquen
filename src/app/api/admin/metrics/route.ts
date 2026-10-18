import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminDashboardMetrics, ReportFilter } from '@/lib/services/reportingService';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const period = (searchParams.get('period') as ReportFilter['period']) || 'last_30_days';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const metrics = await getAdminDashboardMetrics({ period, startDate, endDate });

    return NextResponse.json({ success: true, metrics });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}
