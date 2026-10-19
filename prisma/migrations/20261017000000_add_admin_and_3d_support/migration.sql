-- Migration: 20261017000000_add_admin_and_3d_support
-- Purpose: Add VORQUEN Private Owner Authorization, 3D Asset Support, Product Archiving, and Row Level Security (RLS) Policies

-- 1. Profiles Table: Add Owner and 2FA fields
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "is_owner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "two_factor_secret" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;

-- 2. Products Table: Add Brand, Weight, 3D Model, Lifecycle Status, and Soft Archival
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand" TEXT NOT NULL DEFAULT 'VORQUEN';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "model_3d_url" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3);

-- Create index for catalog status queries
CREATE INDEX IF NOT EXISTS "products_status_is_active_idx" ON "products"("status", "is_active");

-- 3. Orders Table: Internal Owner Fulfillment Notes
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;

-- 4. Password Reset Tokens Table: Secure Tokenized Recovery
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "password_reset_tokens_email_idx" ON "password_reset_tokens"("email");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- 5. Supabase Row Level Security (RLS) Policies
-- Ensure RLS is active across sensitive entities

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "return_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "return_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refunds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is store owner or administrator
CREATE OR REPLACE FUNCTION public.is_store_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "profiles" p
    LEFT JOIN "user_roles" ur ON p.id = ur.user_id
    WHERE p.id = auth.uid()
      AND (p.is_owner = true OR ur.role IN ('admin', 'owner'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile or owners view all" ON "profiles";
CREATE POLICY "Users can view own profile or owners view all"
  ON "profiles" FOR SELECT
  USING (auth.uid() = id OR public.is_store_owner());

DROP POLICY IF EXISTS "Users can update own profile" ON "profiles";
CREATE POLICY "Users can update own profile"
  ON "profiles" FOR UPDATE
  USING (auth.uid() = id OR public.is_store_owner());

-- Addresses Policies: Restricted to owning customer or store owner for fulfillment
DROP POLICY IF EXISTS "Addresses access restriction" ON "addresses";
CREATE POLICY "Addresses access restriction"
  ON "addresses" FOR ALL
  USING (auth.uid() = user_id OR public.is_store_owner());

-- Products Policies: Public read for published active products; Owner-only for mutation & drafts
DROP POLICY IF EXISTS "Public can view active products" ON "products";
CREATE POLICY "Public can view active products"
  ON "products" FOR SELECT
  USING ((is_active = true AND status = 'active' AND archived_at IS NULL) OR public.is_store_owner());

DROP POLICY IF EXISTS "Owners can manage products" ON "products";
CREATE POLICY "Owners can manage products"
  ON "products" FOR ALL
  USING (public.is_store_owner());

-- Orders Policies: Customers view their own orders; Owner views and updates all
DROP POLICY IF EXISTS "Customer order visibility" ON "orders";
CREATE POLICY "Customer order visibility"
  ON "orders" FOR SELECT
  USING (auth.uid() = user_id OR public.is_store_owner());

DROP POLICY IF EXISTS "Owner order management" ON "orders";
CREATE POLICY "Owner order management"
  ON "orders" FOR ALL
  USING (public.is_store_owner());

-- Audit Logs Policies: Owner only
DROP POLICY IF EXISTS "Owner only audit access" ON "audit_logs";
CREATE POLICY "Owner only audit access"
  ON "audit_logs" FOR SELECT
  USING (public.is_store_owner());
