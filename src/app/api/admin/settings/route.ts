import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

export async function GET() {
  try {
    const admin = await requireAdmin();

    const [settings, auditLogs] = await Promise.all([
      prisma.storeSettings.findFirst(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const razorpayConfigured = Boolean(
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith('your_')
    );

    const shiprocketConfigured = Boolean(
      process.env.SHIPROCKET_API_EMAIL && process.env.SHIPROCKET_API_PASSWORD
    );

    return NextResponse.json({
      success: true,
      settings: settings || {
        storeName: 'VORQUEN',
        supportEmail: 'concierge@vorquen.com',
        supportPhone: '+91 80 4567 8900',
        currency: 'INR',
        codEnabled: true,
        maintenanceMode: false,
        defaultShippingPolicy: 'Free express shipping on prepaid orders over ₹1,499. ₹99 fee on smaller orders.',
        returnPolicy: 'Hassle-free 7-day luxury return and exchange policy for unworn items.',
      },
      ownerInfo: {
        currentLoggedInEmail: admin.email,
        configuredOwnerEmail: process.env.VORQUEN_OWNER_EMAIL || 'Not configured in .env',
        isStrictlyEnforced: Boolean(process.env.VORQUEN_OWNER_EMAIL),
      },
      integrations: {
        razorpay: {
          configured: razorpayConfigured,
          mode: razorpayConfigured ? (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_test_') ? 'Test Sandbox' : 'Live Production') : 'Unconfigured (Mock Sandbox Active)',
        },
        shiprocket: {
          configured: shiprocketConfigured,
          mode: shiprocketConfigured ? 'Live API Aggregator' : 'Direct Courier Mode Active',
        },
      },
      auditLogs,
    });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const existing = await prisma.storeSettings.findFirst();

    const updateData = {
      storeName: body.storeName || 'VORQUEN',
      supportEmail: body.supportEmail || 'concierge@vorquen.com',
      supportPhone: body.supportPhone || '+91 80 4567 8900',
      currency: body.currency || 'INR',
      defaultShippingPolicy: body.defaultShippingPolicy || 'Free shipping over ₹1,499.',
      returnPolicy: body.returnPolicy || '7-day luxury returns.',
      codEnabled: body.codEnabled ?? true,
      maintenanceMode: body.maintenanceMode ?? false,
    };

    let settings;
    if (existing) {
      settings = await prisma.storeSettings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      settings = await prisma.storeSettings.create({
        data: updateData,
      });
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'STORE_SETTINGS_UPDATED',
        entityType: 'store_settings',
        entityId: settings.id,
        safeMetadata: JSON.stringify({
          storeName: settings.storeName,
          maintenanceMode: settings.maintenanceMode,
          updatedBy: admin.email,
        }),
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 400 });
  }
}
