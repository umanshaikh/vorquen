-- PostgreSQL Initial Migration for FashionHub
-- Complete DDL for Supabase / PostgreSQL with UUIDs, Indexes, and Constraints

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_roles
CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role")
);

-- Table: addresses
CREATE TABLE IF NOT EXISTS "addresses" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "recipient_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT 'IN',
    "address_type" TEXT NOT NULL DEFAULT 'home',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: categories
CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "image_url" TEXT,
    "parent_category_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: products
CREATE TABLE IF NOT EXISTS "products" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "sku" TEXT UNIQUE,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "brand" TEXT NOT NULL DEFAULT 'FashionHub',
    "category_id" UUID NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
    "audience" TEXT NOT NULL,
    "fabric" TEXT,
    "care_instructions" TEXT,
    "base_price" DOUBLE PRECISION NOT NULL,
    "sale_price" DOUBLE PRECISION,
    "cost_price" DOUBLE PRECISION NOT NULL,
    "tax_code" TEXT DEFAULT 'GST_12',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_new_arrival" BOOLEAN NOT NULL DEFAULT false,
    "is_best_seller" BOOLEAN NOT NULL DEFAULT false,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: product_variants
CREATE TABLE IF NOT EXISTS "product_variants" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "sku" TEXT NOT NULL UNIQUE,
    "size" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "colour_hex" TEXT,
    "price_override" DOUBLE PRECISION,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
    "barcode" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: product_images
CREATE TABLE IF NOT EXISTS "product_images" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "variant_id" UUID REFERENCES "product_variants"("id") ON DELETE SET NULL,
    "image_url" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: inventory_movements
CREATE TABLE IF NOT EXISTS "inventory_movements" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "variant_id" UUID NOT NULL REFERENCES "product_variants"("id") ON DELETE CASCADE,
    "movement_type" TEXT NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: carts
CREATE TABLE IF NOT EXISTS "carts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID REFERENCES "profiles"("id") ON DELETE CASCADE,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: cart_items
CREATE TABLE IF NOT EXISTS "cart_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "cart_id" UUID NOT NULL REFERENCES "carts"("id") ON DELETE CASCADE,
    "variant_id" UUID NOT NULL REFERENCES "product_variants"("id") ON DELETE CASCADE,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cart_items_cart_id_variant_id_key" UNIQUE ("cart_id", "variant_id")
);

-- Table: wishlists
CREATE TABLE IF NOT EXISTS "wishlists" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: wishlist_items
CREATE TABLE IF NOT EXISTS "wishlist_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "wishlist_id" UUID NOT NULL REFERENCES "wishlists"("id") ON DELETE CASCADE,
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wishlist_items_wishlist_id_product_id_key" UNIQUE ("wishlist_id", "product_id")
);

-- Table: coupons
CREATE TABLE IF NOT EXISTS "coupons" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL UNIQUE,
    "description" TEXT NOT NULL,
    "discount_type" TEXT NOT NULL,
    "discount_value" DOUBLE PRECISION NOT NULL,
    "minimum_order_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maximum_discount" DOUBLE PRECISION,
    "usage_limit" INTEGER,
    "usage_limit_per_user" INTEGER NOT NULL DEFAULT 1,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: orders
CREATE TABLE IF NOT EXISTS "orders" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_number" TEXT NOT NULL UNIQUE,
    "user_id" UUID REFERENCES "profiles"("id") ON DELETE SET NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "order_status" TEXT NOT NULL DEFAULT 'pending',
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "fulfillment_status" TEXT NOT NULL DEFAULT 'unfulfilled',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal_amount" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipping_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "coupon_code" TEXT,
    "shipping_address_snapshot" TEXT NOT NULL,
    "billing_address_snapshot" TEXT,
    "customer_notes" TEXT,
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: order_items
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "product_id" UUID NOT NULL REFERENCES "products"("id"),
    "variant_id" UUID NOT NULL REFERENCES "product_variants"("id"),
    "product_name_snapshot" TEXT NOT NULL,
    "sku_snapshot" TEXT NOT NULL,
    "selected_size" TEXT NOT NULL,
    "selected_colour" TEXT NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "line_total" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: coupon_redemptions
CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "coupon_id" UUID NOT NULL REFERENCES "coupons"("id"),
    "user_id" UUID REFERENCES "profiles"("id"),
    "order_id" UUID NOT NULL REFERENCES "orders"("id"),
    "discount_amount" DOUBLE PRECISION NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: payments
CREATE TABLE IF NOT EXISTS "payments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "provider" TEXT NOT NULL,
    "provider_order_id" TEXT,
    "provider_payment_id" TEXT,
    "payment_method" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: payment_webhook_events
CREATE TABLE IF NOT EXISTS "payment_webhook_events" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL UNIQUE,
    "event_type" TEXT NOT NULL,
    "processing_status" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3)
);

-- Table: shipments
CREATE TABLE IF NOT EXISTS "shipments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "provider" TEXT NOT NULL,
    "provider_shipment_id" TEXT,
    "awb_number" TEXT NOT NULL UNIQUE,
    "courier_name" TEXT NOT NULL,
    "tracking_url" TEXT,
    "shipment_status" TEXT NOT NULL DEFAULT 'created',
    "shipping_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "label_url" TEXT,
    "pickup_scheduled_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: shipment_tracking_events
CREATE TABLE IF NOT EXISTS "shipment_tracking_events" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "shipment_id" UUID NOT NULL REFERENCES "shipments"("id") ON DELETE CASCADE,
    "provider_event_id" TEXT,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "event_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: return_requests
CREATE TABLE IF NOT EXISTS "return_requests" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id"),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
    "request_type" TEXT NOT NULL DEFAULT 'return',
    "reason" TEXT NOT NULL,
    "customer_comments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3)
);

-- Table: return_items
CREATE TABLE IF NOT EXISTS "return_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "return_request_id" UUID NOT NULL REFERENCES "return_requests"("id") ON DELETE CASCADE,
    "order_item_id" UUID NOT NULL REFERENCES "order_items"("id"),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "requested_variant_id" UUID,
    "condition_notes" TEXT
);

-- Table: refunds
CREATE TABLE IF NOT EXISTS "refunds" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id"),
    "payment_id" UUID REFERENCES "payments"("id"),
    "return_request_id" UUID REFERENCES "return_requests"("id"),
    "amount" DOUBLE PRECISION NOT NULL,
    "provider_refund_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: product_reviews
CREATE TABLE IF NOT EXISTS "product_reviews" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "profiles"("id"),
    "order_item_id" UUID,
    "rating" INTEGER NOT NULL,
    "review_title" TEXT NOT NULL,
    "review_text" TEXT NOT NULL,
    "moderation_status" TEXT NOT NULL DEFAULT 'approved',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "order_id" UUID,
    "notification_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sent_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: support_tickets
CREATE TABLE IF NOT EXISTS "support_tickets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID REFERENCES "profiles"("id"),
    "order_id" UUID,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "safe_metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: store_settings
CREATE TABLE IF NOT EXISTS "store_settings" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "store_name" TEXT NOT NULL DEFAULT 'FashionHub',
    "logo_url" TEXT,
    "support_email" TEXT NOT NULL DEFAULT 'support@fashionhub.in',
    "support_phone" TEXT NOT NULL DEFAULT '+91 98765 43210',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "default_shipping_policy" TEXT NOT NULL,
    "return_policy" TEXT NOT NULL,
    "cod_enabled" BOOLEAN NOT NULL DEFAULT true,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: newsletter_subscribers
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL UNIQUE,
    "consent_status" BOOLEAN NOT NULL DEFAULT true,
    "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMP(3)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products"("category_id");
CREATE INDEX IF NOT EXISTS "idx_products_audience" ON "products"("audience");
CREATE INDEX IF NOT EXISTS "idx_products_active" ON "products"("is_active");
CREATE INDEX IF NOT EXISTS "idx_variants_product" ON "product_variants"("product_id");
CREATE INDEX IF NOT EXISTS "idx_variants_sku" ON "product_variants"("sku");
CREATE INDEX IF NOT EXISTS "idx_orders_user" ON "orders"("user_id");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders"("order_status");
CREATE INDEX IF NOT EXISTS "idx_shipments_order" ON "shipments"("order_id");
CREATE INDEX IF NOT EXISTS "idx_shipments_awb" ON "shipments"("awb_number");
