# VORQUEN Production Deployment Guide

This guide details how to deploy the **VORQUEN Luxury 3D Fashion Platform** to production with independent domains for the **Customer Storefront** and the **Store Owner Admin Portal**.

---

## 1. System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               GitHub Repository              │
                    │        https://github.com/umanshaikh/vorquen │
                    └──────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    │                                              │
                    ▼                                              ▼
       ┌────────────────────────┐                    ┌────────────────────────┐
       │   apps/storefront      │                    │      apps/admin        │
       │  React Native / Expo   │                    │  React Native / Expo   │
       │   Universal Web App    │                    │   Universal Web App    │
       └───────────┬────────────┘                    └───────────┬────────────┘
                   │                                             │
                   ▼                                             ▼
        [ Vercel Project 1 ]                          [ Vercel Project 2 ]
    vorquen-storefront.vercel.app                  vorquen-admin.vercel.app
     (or custom: vorquen.com)                    (or custom: vorquen-admin.com)
                   │                                             │
                   └──────────────────────┬──────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    Shared Live Supabase Database      │
                      │    chpxdjqvrpjbsfoffcur.supabase.co   │
                      │   (Products, Orders, Shipments, Auth) │
                      └───────────────────────────────────────┘
```

---

## 2. Deploying VORQUEN Storefront to Vercel

1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import the GitHub repository: **`umanshaikh/vorquen`**.
4. Configure Project Settings:
   - **Project Name**: `vorquen-storefront`
   - **Framework Preset**: `Other`
   - **Root Directory**: Click *Edit* and select **`apps/storefront`**.
   - **Build Command**: `expo export --platform web` (default from package.json)
   - **Output Directory**: `dist`
5. Add **Environment Variables**:
   | Variable | Value |
   | :--- | :--- |
   | `EXPO_PUBLIC_SUPABASE_URL` | `https://chpxdjqvrpjbsfoffcur.supabase.co` |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocHhkanF2cnBqYnNmb2ZmY3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzODg3NzQsImV4cCI6MjEwNzk2NDc3NH0.3cvqM7dX-a3Am946-U8qIg1BFeFymjugqI7K28eFH2E` |
6. Click **Deploy**.
   - Vercel will build the bundle and provide your live URL: `https://vorquen-storefront.vercel.app`.

---

## 3. Deploying VORQUEN Admin Portal to Vercel

1. In the [Vercel Dashboard](https://vercel.com), click **Add New...** > **Project** again.
2. Select the **same** GitHub repository: **`umanshaikh/vorquen`**.
3. Configure Project Settings:
   - **Project Name**: `vorquen-admin`
   - **Framework Preset**: `Other`
   - **Root Directory**: Click *Edit* and select **`apps/admin`**.
   - **Build Command**: `expo export --platform web`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   | Variable | Value |
   | :--- | :--- |
   | `EXPO_PUBLIC_SUPABASE_URL` | `https://chpxdjqvrpjbsfoffcur.supabase.co` |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocHhkanF2cnBqYnNmb2ZmY3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzODg3NzQsImV4cCI6MjEwNzk2NDc3NH0.3cvqM7dX-a3Am946-U8qIg1BFeFymjugqI7K28eFH2E` |
5. Click **Deploy**.
   - Vercel will provide your private admin portal URL: `https://vorquen-admin.vercel.app`.
   - Admin Login: `owner@vorquen.com` (configured in Supabase Auth & profiles table).

---

## 4. Connecting Custom Domains Later (No Subdomains)

Whenever you purchase custom domains (e.g. from GoDaddy, Hostinger, Namecheap, or Cloudflare):

### For Storefront (`vorquen.com`):
1. In Vercel, go to the `vorquen-storefront` project > **Settings** > **Domains**.
2. Enter `vorquen.com` (and `www.vorquen.com`).
3. Add the DNS records shown by Vercel to your domain registrar DNS management:
   - **A Record**: `@` pointing to `76.76.21.21`
   - **CNAME Record**: `www` pointing to `cname.vercel-dns.com`

### For Admin Portal (`vorquen-admin.com`):
1. In Vercel, go to the `vorquen-admin` project > **Settings** > **Domains**.
2. Enter `vorquen-admin.com` (completely independent domain, NO subdomain).
3. Add the DNS records shown by Vercel to your domain registrar DNS management:
   - **A Record**: `@` pointing to `76.76.21.21`
   - **CNAME Record**: `www` pointing to `cname.vercel-dns.com`

---

## 5. Active Integrations Status

| Service | Environment / Status | Mode |
| :--- | :--- | :--- |
| **Supabase Database** | `chpxdjqvrpjbsfoffcur` | Live Real PostgreSQL |
| **Cashfree Payments** | Sandbox / Testing | Simulated Instant UPI, Cards, Netbanking |
| **Shiprocket Logistics** | Sandbox / Testing | Test AWB Booking, Live Status Tracker |
| **Email Concierge** | Resend / Custom SMTP | Mock fallback / Test endpoint active |

### Switching to Live Payments & Shipping Later:
To transition from Testing Condition to Live Production:
1. In `apps/storefront` and backend environment variables:
   - Set `CASHFREE_APP_ID="<your_live_cashfree_app_id>"`
   - Set `CASHFREE_SECRET_KEY="<your_live_cashfree_secret_key>"`
   - Set `CASHFREE_ENVIRONMENT="PROD"`
   - Set `CASHFREE_TEST_MODE="false"`
2. Set Shiprocket live credentials:
   - Set `SHIPROCKET_API_EMAIL="<your_shiprocket_email>"`
   - Set `SHIPROCKET_API_PASSWORD="<your_shiprocket_password>"`
   - Set `SHIPROCKET_TEST_MODE="false"`
