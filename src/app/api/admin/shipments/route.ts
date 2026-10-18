import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { createShipmentSchema, addTrackingEventSchema } from '@/lib/validation';

export async function GET() {
  try {
    await requireAdmin();

    const shipments = await prisma.shipment.findMany({
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerEmail: true,
            customerPhone: true,
            shippingAddressSnapshot: true,
            fulfillmentStatus: true,
            user: { select: { fullName: true } },
          },
        },
        trackingEvents: {
          orderBy: { eventTimestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, shipments });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    // Check if this is an "add tracking event" request
    if (body.action === 'add_event') {
      const validated = addTrackingEventSchema.parse(body);

      const event = await prisma.shipmentTrackingEvent.create({
        data: {
          shipmentId: validated.shipmentId,
          status: validated.status,
          description: validated.description,
          location: validated.location || null,
          eventTimestamp: new Date(),
        },
      });

      // Update shipment status if event represents a delivery or transit update
      const statusMap: { [key: string]: string } = {
        'Delivered': 'delivered',
        'Out for Delivery': 'out_for_delivery',
        'In Transit': 'in_transit',
        'Picked Up': 'picked_up',
      };

      if (statusMap[validated.status]) {
        await prisma.shipment.update({
          where: { id: validated.shipmentId },
          data: {
            shipmentStatus: statusMap[validated.status],
            ...(validated.status === 'Delivered' && { deliveredAt: new Date() }),
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'SHIPMENT_TRACKING_EVENT_ADDED',
          entityType: 'shipment',
          entityId: validated.shipmentId,
          safeMetadata: JSON.stringify({ status: validated.status, addedBy: admin.email }),
        },
      });

      return NextResponse.json({ success: true, event });
    }

    // Otherwise, create new shipment
    const validated = createShipmentSchema.parse(body);

    const existingAwb = await prisma.shipment.findUnique({
      where: { awbNumber: validated.awbNumber },
    });

    if (existingAwb) {
      return NextResponse.json({ error: 'A shipment with this AWB tracking number already exists' }, { status: 400 });
    }

    const shipment = await prisma.$transaction(async (tx) => {
      const s = await tx.shipment.create({
        data: {
          orderId: validated.orderId,
          provider: validated.provider,
          courierName: validated.courierName,
          awbNumber: validated.awbNumber,
          trackingUrl: validated.trackingUrl || null,
          shippingCost: validated.shippingCost,
          shipmentStatus: 'created',
          trackingEvents: {
            create: {
              status: 'Manifested',
              description: `Shipment booked with ${validated.courierName} (AWB: ${validated.awbNumber})`,
            },
          },
        },
        include: { trackingEvents: true },
      });

      // Update order fulfillment status to fulfilled
      await tx.order.update({
        where: { id: validated.orderId },
        data: {
          fulfillmentStatus: 'fulfilled',
          orderStatus: 'processing',
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'SHIPMENT_CREATED',
          entityType: 'shipment',
          entityId: s.id,
          safeMetadata: JSON.stringify({
            orderId: validated.orderId,
            courier: validated.courierName,
            awb: validated.awbNumber,
            createdBy: admin.email,
          }),
        },
      });

      return s;
    });

    return NextResponse.json({ success: true, shipment });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || 'Shipment operation failed' },
      { status: isAuth ? 401 : 400 }
    );
  }
}
