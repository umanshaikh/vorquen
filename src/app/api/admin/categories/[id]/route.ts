import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.parentCategoryId !== undefined && { parentCategoryId: body.parentCategoryId }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.displayOrder !== undefined && { displayOrder: Number(body.displayOrder) }),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'CATEGORY_UPDATED',
        entityType: 'category',
        entityId: updated.id,
        safeMetadata: JSON.stringify({ name: updated.name, updatedBy: admin.email }),
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();

    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { products: true, subCategories: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category: ${category._count.products} products currently belong to this category. Please reassign or hide the category instead.`,
        },
        { status: 400 }
      );
    }

    if (category._count.subCategories > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category: ${category._count.subCategories} subcategories belong to this category.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'CATEGORY_DELETED',
        entityType: 'category',
        entityId: params.id,
        safeMetadata: JSON.stringify({ name: category.name, deletedBy: admin.email }),
      },
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 400 });
  }
}
