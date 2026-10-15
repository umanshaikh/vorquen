import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { addTrackingEventSchema } from '@/lib/validation';
import { addTrackingMilestone } from '@/lib/services/shippingService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'support', 'inventory_manager']);
    const body = await req.json();
    const validated = addTrackingEventSchema.parse({ ...body, shipmentId: params.id });

    const event = await addTrackingMilestone(
      validated.shipmentId,
      validated.status,
      validated.description,
      validated.location
    );

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
