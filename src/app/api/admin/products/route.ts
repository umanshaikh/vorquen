import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { productCreateSchema } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const audience = searchParams.get('audience');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.categoryId = category;
    }

    if (audience && audience !== 'all') {
      where.audience = audience;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { brand: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: true,
          images: { orderBy: { displayOrder: 'asc' } },
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    return NextResponse.json({ success: true, products, categories });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const validated = productCreateSchema.parse(body);

    // Verify slug uniqueness
    const existing = await prisma.product.findUnique({
      where: { slug: validated.slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A product with this URL slug already exists. Please choose a unique slug.' },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: validated.name,
          slug: validated.slug,
          sku: validated.sku || null,
          description: validated.description,
          shortDescription: validated.shortDescription || null,
          brand: validated.brand || 'VORQUEN',
          categoryId: validated.categoryId,
          audience: validated.audience,
          fabric: validated.fabric || null,
          careInstructions: validated.careInstructions || null,
          weight: validated.weight || null,
          model3dUrl: validated.model3dUrl || null,
          basePrice: validated.basePrice,
          salePrice: validated.salePrice || null,
          costPrice: validated.costPrice,
          taxCode: validated.taxCode,
          status: validated.status || 'active',
          isActive: validated.isActive,
          isFeatured: validated.isFeatured,
          isNewArrival: validated.isNewArrival,
          isBestSeller: validated.isBestSeller,
          seoTitle: validated.seoTitle || null,
          seoDescription: validated.seoDescription || null,
          images: {
            create: validated.images.map((img, idx) => ({
              imageUrl: img.imageUrl,
              altText: img.altText || validated.name,
              displayOrder: img.displayOrder ?? idx,
              isPrimary: img.isPrimary ?? idx === 0,
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
          category: true,
        },
      });

      // Record initial inventory movements
      for (const v of product.variants) {
        if (v.stockQuantity > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: v.id,
              movementType: 'receipt',
              quantityChange: v.stockQuantity,
              referenceType: 'initial_catalog_creation',
              referenceId: product.id,
              notes: 'Initial variant creation batch by store owner',
              createdBy: admin.email,
            },
          });
        }
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'PRODUCT_CREATED',
          entityType: 'product',
          entityId: product.id,
          safeMetadata: JSON.stringify({
            name: product.name,
            sku: product.sku,
            variantsCount: product.variants.length,
            createdBy: admin.email,
          }),
        },
      });

      return product;
    });

    return NextResponse.json({ success: true, product: created });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || 'Product creation failed' },
      { status: 400 }
    );
  }
}
