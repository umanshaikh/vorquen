export type Role = 'customer' | 'support' | 'inventory_manager' | 'admin';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  roles: Role[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'partially_refunded' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partially_fulfilled' | 'fulfilled';

export type ShipmentStatus =
  | 'created'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delayed'
  | 'failed_delivery'
  | 'returned_to_origin'
  | 'cancelled';

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'pickup_scheduled'
  | 'received'
  | 'inspected'
  | 'resolved'
  | 'cancelled';

export interface AddressSnapshot {
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  addressType?: string;
}

export interface CartCalculationResult {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  appliedCoupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    description: string;
  } | null;
}

export interface PaymentInitiationResult {
  provider: 'razorpay' | 'cod' | 'mock_test';
  orderId: string;
  amount: number;
  currency: string;
  providerOrderId?: string;
  keyId?: string;
  isTestMode?: boolean;
}

export interface ShipmentBookingParams {
  orderId: string;
  courierName?: string;
  weightKg?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  manualAwb?: string;
  manualTrackingUrl?: string;
}
