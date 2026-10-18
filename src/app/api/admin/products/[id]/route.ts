import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { productCreateSchema } from '@/lib/validation';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        variants: {
          include: {
            inventoryMovements: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        images: { orderBy: { displayOrder: 'asc' } },
        reviews: {
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const validated = productCreateSchema.parse(body);

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true, images: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update basic product info
      const prod = await tx.product.update({
        where: { id: params.id },
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
        },
      });

      // 2. Replace images
      await tx.productImage.deleteMany({ where: { productId: params.id } });
      await tx.productImage.createMany({
        data: validated.images.map((img, idx) => ({
          productId: params.id,
          imageUrl: img.imageUrl,
          altText: img.altText || validated.name,
          displayOrder: img.displayOrder ?? idx,
          isPrimary: img.isPrimary ?? idx === 0,
        })),
      });

      // 3. Update or create variants
      for (const v of validated.variants) {
        if (v.id) {
          const oldVar = existing.variants.find((ev) => ev.id === v.id);
          const stockDiff = v.stockQuantity - (oldVar?.stockQuantity || 0);

          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              sku: v.sku,
              size: v.size,
              colour: v.colour,
              colourHex: v.colourHex || null,
              priceOverride: v.priceOverride || null,
              stockQuantity: v.stockQuantity,
            },
          });

          if (stockDiff !== 0) {
            await tx.inventoryMovement.create({
              data: {
                variantId: v.id,
                movementType: stockDiff > 0 ? 'receipt' : 'adjustment',
                quantityChange: stockDiff,
                referenceType: 'catalog_edit',
                notes: `Stock updated during product edit by ${admin.email}`,
                createdBy: admin.email,
              },
            });
          }
        } else {
          // New variant added to product
          const newVar = await tx.productVariant.create({
            data: {
              productId: params.id,
              sku: v.sku,
              size: v.size,
              colour: v.colour,
              colourHex: v.colourHex || null,
              priceOverride: v.priceOverride || null,
              stockQuantity: v.stockQuantity,
              isActive: true,
            },
          });

          if (v.stockQuantity > 0) {
            await tx.inventoryMovement.create({
              data: {
                variantId: newVar.id,
                movementType: 'receipt',
                quantityChange: v.stockQuantity,
                referenceType: 'new_variant_added',
                notes: `Variant added during product edit by ${admin.email}`,
                createdBy: admin.email,
              },
            });
          }
        }
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'PRODUCT_UPDATED',
          entityType: 'product',
          entityId: prod.id,
          safeMetadata: JSON.stringify({ name: prod.name, updatedBy: admin.email }),
        },
      });

      return prod;
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || 'Product update failed' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // If product has historical orders, ARCHIVE it to preserve financial & order integrity
    if (product._count.orderItems > 0) {
      const archived = await prisma.product.update({
        where: { id: params.id },
        data: {
          isActive: false,
          status: 'archived',
          archivedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'PRODUCT_ARCHIVED',
          entityType: 'product',
          entityId: product.id,
          safeMetadata: JSON.stringify({
            name: product.name,
            reason: 'Preserved historical order records',
            orderCount: product._count.orderItems,
            archivedBy: admin.email,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: `Product is referenced in ${product._count.orderItems} order(s). It has been archived and hidden from the customer storefront rather than permanently deleted to preserve historical order records.`,
        product: archived,
      });
    }

    // No orders reference this product; safe to delete permanently
    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: params.id } });
      await tx.wishlistItem.deleteMany({ where: { productId: params.id } });
      await tx.productReview.deleteMany({ where: { productId: params.id } });
      await tx.productVariant.deleteMany({ where: { productId: params.id } });
      await tx.product.delete({ where: { id: params.id } });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'PRODUCT_PERMANENTLY_DELETED',
          entityType: 'product',
          entityId: params.id,
          safeMetadata: JSON.stringify({ name: product.name, deletedBy: admin.email }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      message: 'Product permanently deleted successfully.',
    });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 400 });
  }
}
