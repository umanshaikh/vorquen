import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/session';
import { productCreateSchema } from '@/lib/validation';

export async function GET() {
  try {
    await requireRole(['admin', 'inventory_manager']);

    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ success: true, products, categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(['admin', 'inventory_manager']);
    const body = await req.json();
    const validated = productCreateSchema.parse(body);

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: validated.name,
          slug: validated.slug,
          sku: validated.sku || null,
          description: validated.description,
          shortDescription: validated.shortDescription || null,
          brand: validated.brand,
          categoryId: validated.categoryId,
          audience: validated.audience,
          fabric: validated.fabric || null,
          careInstructions: validated.careInstructions || null,
          basePrice: validated.basePrice,
          salePrice: validated.salePrice || null,
          costPrice: validated.costPrice,
          taxCode: validated.taxCode,
          isActive: validated.isActive,
          isFeatured: validated.isFeatured,
          isNewArrival: validated.isNewArrival,
          isBestSeller: validated.isBestSeller,
          seoTitle: validated.seoTitle || null,
          seoDescription: validated.seoDescription || null,
          images: {
            create: validated.images.map((img) => ({
              imageUrl: img.imageUrl,
              altText: img.altText,
              displayOrder: img.displayOrder,
              isPrimary: img.isPrimary,
            })),
          },
          variants: {
            create: validated.variants.map((v) => ({
              sku: v.sku,
              size: v.size,
              colour: v.colour,
              colourHex: v.colourHex || null,
              priceOverride: v.priceOverride || null,
              stockQuantity: v.stockQuantity,
              isActive: true,
            })),
          },
        },
        include: {
          variants: true,
          images: true,
        },
      });

      // Record inventory receipt for initial stock
      for (const v of product.variants) {
        if (v.stockQuantity > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: v.id,
              movementType: 'receipt',
              quantityChange: v.stockQuantity,
              referenceType: 'initial_catalog_creation',
              notes: 'Initial variant creation batch',
            },
          });
        }
      }

      return product;
    });

    return NextResponse.json({ success: true, product: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
