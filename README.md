# FashionHub — Premium Fashion Ecommerce Platform (India D2C)

FashionHub is a production-oriented, full-stack direct-to-consumer (D2C) fashion ecommerce platform built for the Indian market. It features a minimalist aesthetic, a normalized PostgreSQL relational database architecture with Prisma ORM, real server-side transaction workflows, an admin operations suite, Razorpay payment processing (with COD support), and courier aggregator logistics (Shiprocket adapter and manual tracking).

---

## Architecture Overview

```mermaid
flowchart TD
    Client["Next.js Responsive Storefront & Admin (React + Tailwind CSS)"]
    ServiceLayer["Backend Business Service Layer (TypeScript + Zod)"]
    DB[("Relational Database: PostgreSQL / Supabase with Prisma ORM")]
    PaymentGW["Payment Provider Adapter (Razorpay HMAC-SHA256 & COD)"]
    ShippingGW["Shipping Provider Adapter (Shiprocket & Manual Dispatch)"]

    Client -->|API Routes & Server Actions| ServiceLayer
    ServiceLayer -->|Prisma Transactions & Row Locks| DB
    ServiceLayer -->|Signed Payment Orders & Webhooks| PaymentGW
    ServiceLayer -->|AWB Booking & Tracking Milestones| ShippingGW
```

---

## Database Architecture & Relationships

FashionHub includes **21 normalized database models** with referential integrity, foreign key cascades, and performance indexes.

```mermaid
erDiagram
    Profile ||--o{ UserRole : "has"
    Profile ||--o{ Address : "owns"
    Profile ||--o{ Order : "places"
    Profile ||--o{ Cart : "maintains"
    Profile ||--o{ Wishlist : "saves"
    Profile ||--o{ ReturnRequest : "submits"
    Profile ||--o{ ProductReview : "authors"

    Category ||--o{ Product : "contains"
    Category ||--o{ Category : "parent/sub"
    Product ||--o{ ProductVariant : "has variants"
    Product ||--o{ ProductImage : "displays"
    ProductVariant ||--o{ InventoryMovement : "records ledger"
    ProductVariant ||--o{ CartItem : "in cart"
    ProductVariant ||--o{ OrderItem : "in order"

    Cart ||--o{ CartItem : "contains"
    Order ||--o{ OrderItem : "contains"
    Order ||--o{ Payment : "transacts"
    Order ||--o{ Shipment : "dispatches"
    Order ||--o{ ReturnRequest : "subject of"
    Shipment ||--o{ ShipmentTrackingEvent : "logs milestones"
    ReturnRequest ||--o{ ReturnItem : "specifies"
    ReturnRequest ||--o{ Refund : "triggers"
    Coupon ||--o{ CouponRedemption : "redeemed in"
```

### Database Tables Created
1. `profiles`: User accounts, hashed credentials, and contact details.
2. `user_roles`: Role-based access control (`customer`, `support`, `inventory_manager`, `admin`).
3. `addresses`: Multiple delivery addresses per user with 6-digit Indian PIN codes.
4. `categories`: Hierarchical fashion collections (Men, Women, Unisex, Accessories) with unique slugs.
5. `products`: Catalog items with fabric details, care instructions, base/sale/cost prices, tax codes (GST_12).
6. `product_variants`: Size matrix (XS to XXL, FREE), colours, hex values, and live stock quantities.
7. `product_images`: Multi-angle product photography with primary tags and display ordering.
8. `inventory_movements`: Immutable stock ledger (`receipt`, `sale`, `return`, `adjustment`, `reservation_release`).
9. `carts` & `cart_items`: Persistent shopping bags with server-calculated totals.
10. `wishlists` & `wishlist_items`: Saved items per customer.
11. `coupons` & `coupon_redemptions`: Percentage and flat discounts with minimum order thresholds, maximum caps, and usage limits.
12. `orders`: Order master with snapshots of shipping/billing addresses, subtotal, discounts, shipping, GST taxes, and readable order numbers (`FH-2026-XXXXX`).
13. `order_items`: Purchased line items with immutable name, SKU, size, colour, and price snapshots.
14. `payments`: Payment records (`razorpay`, `cod`, `mock_test`), status tracking, and provider transaction IDs.
15. `payment_webhook_events`: Deduplicated webhook ledger preventing duplicate payment confirmations.
16. `shipments`: Courier assignments, AWB numbers, tracking URLs, and shipping costs.
17. `shipment_tracking_events`: Chronological milestones (`Manifested`, `Picked Up`, `In Transit`, `Out for Delivery`, `Delivered`).
18. `return_requests` & `return_items`: 7-day return workflow with inspection notes.
19. `refunds`: Authorized financial reversals linked to original orders and payment IDs.
20. `product_reviews`: Verified-purchase customer reviews with 1–5 star ratings.
21. `store_settings`: Global settings including COD toggle, support helpline, and free shipping limits.
22. `newsletter_subscribers`: Verified email subscription list with explicit consent.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+ / v22+
- **pnpm** or **npm**
- **Git**

### 2. Installation
```bash
# Clone the repository
git clone <your-team-repo-url>
cd fashionhub

# Install dependencies
pnpm install
# or: npm install
```

### 3. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```
By default, `.env` is configured for instant zero-configuration local development using SQLite (`file:./dev.db`).

### 4. Database Initialization & Seeding
```bash
# Push schema and generate Prisma client
pnpm db:push

# Seed database with realistic Indian fashion products, categories, reviews, and test accounts
pnpm db:seed
```

### 5. Start Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Credentials

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@fashionhub.in` | `Admin@123` | Full Storefront + Admin Dashboard (`/admin`) |
| **Customer** | `priya.sharma@example.com` | `Customer@123` | Storefront, Cart, Checkout, `/account` |
| **Support Staff** | `support@fashionhub.in` | `Staff@123` | Storefront + Orders / Returns / Logistics (`/admin`) |

---

## Automated Test Suite

Run the Vitest unit and integration test suite:
```bash
pnpm test
```
Verifies:
- Server-side price calculation and GST 12% tax deduction.
- Coupon eligibility, spend minimums, percentage limits, and maximum discount caps.
- Order lifecycle state machine valid transitions and cancellation inventory restocks.
- Razorpay HMAC-SHA256 payment signature verification and tamper detection.

---

## Payment & Shipping Configuration

### Razorpay Integration (India)
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Generate API Keys in **Settings → API Keys** (Test Mode or Live Mode).
3. Set the following in `.env`:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
   RAZORPAY_KEY_SECRET="your_razorpay_secret"
   RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
   ```
4. Webhook URL to configure in Razorpay Dashboard:
   `https://yourdomain.com/api/payments/webhook` (Subscribed events: `payment.captured`, `order.paid`).
5. *Note:* If Razorpay keys are omitted, FashionHub automatically falls back to the **Test Mode Sandbox Adapter**, allowing full order placements without payment failure.

### Shiprocket Courier Logistics
1. Sign up at [Shiprocket](https://app.shiprocket.in).
2. Add your credentials in `.env`:
   ```env
   SHIPROCKET_API_EMAIL="your_shiprocket_email"
   SHIPROCKET_API_PASSWORD="your_shiprocket_password"
   ```
3. *Note:* If credentials are not provided, FashionHub utilizes the **Manual Shipping Adapter**, allowing administrators to manually book shipments, assign AWBs, and publish milestone events.

---

## Switching to Supabase / Production PostgreSQL

1. Create a project on [Supabase](https://supabase.com).
2. In Project Settings → Database, copy the **Transaction Connection Pooler** string (port 6543) and **Direct Connection** string (port 5432).
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
   ```
4. Switch Prisma to PostgreSQL mode:
   ```bash
   node scripts/use-db.js postgres
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```
   Or apply the raw SQL migration in `prisma/migrations/20261015000000_init/migration.sql` directly into Supabase SQL Editor.

---

## Production Readiness Checklist

- [x] Server-side price recalculation (browser prices ignored).
- [x] Atomic stock reservation with transactional consistency.
- [x] Server-verified payment callbacks and HMAC-SHA256 signatures.
- [x] Address and line item snapshots on historical orders.
- [x] Role-Based Access Control (RBAC) protecting `/admin` and API routes.
- [x] Input sanitization and validation via Zod schemas.
- [x] Responsive mobile navigation with slide-out cart and public parcel tracking.
- [x] Legal drafts for Privacy Policy, Terms, Shipping Policy, and Return Policy.
- [ ] Connect production Razorpay Live API keys and complete KYC approval.
- [ ] Connect Shiprocket Live courier credentials with warehouse pickup address.
- [ ] Configure custom domain and SSL certificate (e.g. on Vercel).
- [ ] Replace placeholder contact details and policy drafts with final legal counsel approval.
