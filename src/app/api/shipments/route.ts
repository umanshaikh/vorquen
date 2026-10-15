import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createShipmentSchema, addTrackingEventSchema } from '@/lib/validation';
import { createOrderShipment, addTrackingMilestone } from '@/lib/services/shippingService';

export async function POST(req: Request) {
  try {
    await requireRole(['admin', 'support', 'inventory_manager']);
    const body = await req.json();
    const validated = createShipmentSchema.parse(body);

    const shipment = await createOrderShipment(
      validated.orderId,
      validated.provider as any,
      validated.courierName,
      validated.awbNumber,
      validated.trackingUrl,
      validated.shippingCost
    );

    return NextResponse.json({ success: true, shipment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
