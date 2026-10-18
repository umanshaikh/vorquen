import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { adjustStock, getLowStockVariants, getInventoryMovements } from '@/lib/services/inventoryService';
import { stockAdjustmentSchema } from '@/lib/validation';
import prisma from '@/lib/db/prisma';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');

    if (filter === 'low_stock') {
      const lowStock = await getLowStockVariants(10);
      return NextResponse.json({ success: true, items: lowStock });
    }

    if (filter === 'movements') {
      const movements = await getInventoryMovements(undefined, 50);
      return NextResponse.json({ success: true, movements });
    }

    // Default: return all variants with product info and recent movements
    const variants = await prisma.productVariant.findMany({
      include: {
        product: { select: { id: true, name: true, sku: true, brand: true, slug: true } },
        inventoryMovements: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: [{ product: { name: 'asc' } }, { size: 'asc' }],
    });

    return NextResponse.json({ success: true, variants });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const validated = stockAdjustmentSchema.parse(body);

    const updated = await adjustStock({
      variantId: validated.variantId,
      quantityChange: validated.quantityChange,
      reason: validated.reason,
      createdBy: admin.email,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'INVENTORY_ADJUSTED_MANUALLY',
        entityType: 'product_variant',
        entityId: validated.variantId,
        safeMetadata: JSON.stringify({
          quantityChange: validated.quantityChange,
          reason: validated.reason,
          newStock: updated.stockQuantity,
          adjustedBy: admin.email,
        }),
      },
    });

    return NextResponse.json({ success: true, variant: updated });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || 'Stock adjustment failed' },
      { status: isAuth ? 401 : 400 }
    );
  }
}
