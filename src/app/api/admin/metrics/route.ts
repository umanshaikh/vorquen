import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { getAdminDashboardMetrics } from '@/lib/services/reportingService';

export async function GET() {
  try {
    await requireRole(['admin', 'support', 'inventory_manager']);
    const metrics = await getAdminDashboardMetrics();
    return NextResponse.json({ success: true, metrics });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message === 'UNAUTHORIZED' ? 401 : 403 });
  }
}
