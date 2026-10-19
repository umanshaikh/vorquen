import prisma from '../db/prisma';
import { ShipmentBookingParams } from '../types';

export interface IShippingProvider {
  bookShipment(params: ShipmentBookingParams): Promise<{
    awbNumber: string;
    courierName: string;
    trackingUrl: string;
    shippingCost: number;
    providerShipmentId?: string;
    labelUrl?: string;
  }>;
  trackShipment(awbNumber: string): Promise<any>;
}

export class ShiprocketShippingAdapter implements IShippingProvider {
  private email: string;
  private password: string;
  private token: string | null = null;

  constructor() {
    this.email = process.env.SHIPROCKET_API_EMAIL || '';
    this.password = process.env.SHIPROCKET_API_PASSWORD || '';
  }

  isConfigured(): boolean {
    return Boolean(this.email && this.password && !this.email.startsWith('your_'));
  }

  private async getAuthToken(): Promise<string> {
    if (this.token) return this.token;
    if (!this.isConfigured()) throw new Error('Shiprocket credentials not configured');

    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    if (!res.ok) {
      throw new Error(`Shiprocket authentication failed: ${res.statusText}`);
    }

    const data = await res.json();
    this.token = data.token;
    return this.token!;
  }

  async checkServiceability(pickupPincode: string, deliveryPincode: string, weightKg: number = 0.5) {
    const token = await this.getAuthToken();
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weightKg}&cod=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) return { serviceable: false };
    return res.json();
  }

  async bookShipment(params: ShipmentBookingParams) {
    const token = await this.getAuthToken();
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: { items: true },
    });

    if (!order) throw new Error('Order not found');

    const address = JSON.parse(order.shippingAddressSnapshot);

    const payload = {
      order_id: order.orderNumber,
      order_date: new Date(order.placedAt).toISOString().split('T')[0],
      pickup_location: 'Primary_Bengaluru_Warehouse',
      billing_customer_name: address.recipientName,
      billing_last_name: '',
      billing_address: address.addressLine1,
      billing_city: address.city,
      billing_pincode: address.postalCode,
      billing_state: address.state,
      billing_country: 'India',
      billing_email: order.customerEmail,
      billing_phone: address.phoneNumber,
      shipping_is_billing: true,
      order_items: order.items.map((it) => ({
        name: it.productNameSnapshot,
        sku: it.skuSnapshot,
        units: it.quantity,
        selling_price: it.unitPrice,
      })),
      payment_method: order.paymentStatus === 'paid' ? 'Prepaid' : 'COD',
      sub_total: order.totalAmount,
      length: params.dimensionsCm?.length || 25,
      breadth: params.dimensionsCm?.width || 20,
      height: params.dimensionsCm?.height || 5,
      weight: params.weightKg || 0.5,
    };

    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Shiprocket booking error: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      awbNumber: data.awb_code || `SR-AWB-${data.shipment_id || Date.now()}`,
      courierName: data.courier_name || params.courierName || 'Shiprocket Standard Surface',
      trackingUrl: `https://track.shiprocket.in/${data.awb_code}`,
      shippingCost: 85.0,
      providerShipmentId: String(data.shipment_id),
      labelUrl: data.label_url,
    };
  }

  async trackShipment(awbNumber: string) {
    const token = await this.getAuthToken();
    const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbNumber}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }
}

export class ManualShippingAdapter implements IShippingProvider {
  async bookShipment(params: ShipmentBookingParams) {
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const courier = params.courierName || 'Blue Dart Express';
    const awb = params.manualAwb || `${courier.slice(0, 3).toUpperCase()}-${randomSuffix}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const trackingUrl = params.manualTrackingUrl || `${appUrl}/track-order?awb=${awb}`;

    return {
      awbNumber: awb,
      courierName: courier,
      trackingUrl,
      shippingCost: 75.0,
      providerShipmentId: `MANUAL_${Date.now()}`,
    };
  }

  async trackShipment(awbNumber: string) {
    return { awb: awbNumber, status: 'In Transit' };
  }
}

export function getShippingAdapter(provider: 'shiprocket' | 'manual' | string): IShippingProvider {
  if (provider === 'shiprocket') {
    const shiprocket = new ShiprocketShippingAdapter();
    if (shiprocket.isConfigured()) {
      return shiprocket;
    }
    console.warn('[SHIPPING] Shiprocket credentials not found; using Manual Shipment Adapter');
    return new ManualShippingAdapter();
  }
  return new ManualShippingAdapter();
}

/**
 * Creates and records a shipment for an order.
 */
export async function createOrderShipment(
  orderId: string,
  providerName: 'shiprocket' | 'manual',
  courierName: string,
  awbNumber: string,
  trackingUrl?: string,
  shippingCost: number = 0
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    const shipment = await tx.shipment.create({
      data: {
        orderId,
        provider: providerName,
        courierName,
        awbNumber,
        trackingUrl,
        shippingCost,
        shipmentStatus: 'created',
        pickupScheduledAt: new Date(),
        trackingEvents: {
          create: [
            {
              status: 'Shipment Created',
              description: `Shipment booked with ${courierName}. AWB: ${awbNumber}`,
              location: 'Warehouse Hub',
              eventTimestamp: new Date(),
            },
          ],
        },
      },
    });

    // Update order fulfillment status
    await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'processing',
        fulfillmentStatus: 'fulfilled',
      },
    });

    return shipment;
  });
}

/**
 * Appends a tracking event to an existing shipment and synchronizes shipment status.
 */
export async function addTrackingMilestone(
  shipmentId: string,
  status: string,
  description: string,
  location?: string
) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status,
        description,
        location,
        eventTimestamp: new Date(),
      },
    });

    // Determine normalized shipment status
    let normalizedStatus: any = 'in_transit';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('delivered')) {
      normalizedStatus = 'delivered';
    } else if (lowerStatus.includes('out for delivery')) {
      normalizedStatus = 'out_for_delivery';
    } else if (lowerStatus.includes('picked up') || lowerStatus.includes('pickup')) {
      normalizedStatus = 'picked_up';
    } else if (lowerStatus.includes('cancelled')) {
      normalizedStatus = 'cancelled';
    }

    const shipment = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        shipmentStatus: normalizedStatus,
        ...(normalizedStatus === 'delivered' ? { deliveredAt: new Date() } : {}),
      },
    });

    // If delivered, mark order completed
    if (normalizedStatus === 'delivered') {
      await tx.order.update({
        where: { id: shipment.orderId },
        data: { orderStatus: 'completed' },
      });
    }

    return event;
  });
}
