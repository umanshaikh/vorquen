import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({ error: 'Order number or AWB is required' }, { status: 400 });
    }

    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { awbNumber: query },
          { order: { orderNumber: query } },
        ],
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            orderStatus: true,
            placedAt: true,
            items: {
              select: {
                productNameSnapshot: true,
                selectedSize: true,
                selectedColour: true,
                quantity: true,
              },
            },
          },
        },
        trackingEvents: {
          orderBy: { eventTimestamp: 'desc' },
        },
      },
    });

    if (!shipment) {
      // Check if order exists without shipment yet
      const order = await prisma.order.findUnique({
        where: { orderNumber: query },
        select: {
          orderNumber: true,
          orderStatus: true,
          placedAt: true,
          fulfillmentStatus: true,
        },
      });

      if (order) {
        return NextResponse.json({
          found: true,
          order,
          shipment: null,
          message: 'Order confirmed and being prepared at our fulfillment facility.',
        });
      }

      return NextResponse.json({ error: 'No order or shipment found for this reference' }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      order: shipment.order,
      shipment: {
        awbNumber: shipment.awbNumber,
        courierName: shipment.courierName,
        trackingUrl: shipment.trackingUrl,
        shipmentStatus: shipment.shipmentStatus,
        shippedAt: shipment.shippedAt,
        deliveredAt: shipment.deliveredAt,
        trackingEvents: shipment.trackingEvents,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
