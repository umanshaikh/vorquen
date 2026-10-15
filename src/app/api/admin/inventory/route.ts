import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { adjustStock, getLowStockVariants, getInventoryMovements } from '@/lib/services/inventoryService';
import { stockAdjustmentSchema } from '@/lib/validation';
import prisma from '@/lib/db/prisma';

export async function GET(req: Request) {
  try {
    await requireRole(['admin', 'inventory_manager']);
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');

    if (filter === 'low_stock') {
      const lowStock = await getLowStockVariants(10);
      return NextResponse.json({ success: true, items: lowStock });
    }

    if (filter === 'movements') {
      const movements = await getInventoryMovements(undefined, 40);
      return NextResponse.json({ success: true, movements });
    }

    // Default: return all variants with product info
    const variants = await prisma.productVariant.findMany({
      include: {
        product: { select: { name: true, sku: true, brand: true } },
      },
      orderBy: [{ product: { name: 'asc' } }, { size: 'asc' }],
    });

    return NextResponse.json({ success: true, variants });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireRole(['admin', 'inventory_manager']);
    const body = await req.json();
    const validated = stockAdjustmentSchema.parse(body);

    const updated = await adjustStock({
      variantId: validated.variantId,
      quantityChange: validated.quantityChange,
      reason: validated.reason,
      createdBy: user.email,
    });

    return NextResponse.json({ success: true, variant: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
