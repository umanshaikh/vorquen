import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { categoryCreateSchema } from '@/lib/validation';

export async function GET() {
  try {
    await requireAdmin();
    const categories = await prisma.category.findMany({
      include: {
        parentCategory: { select: { id: true, name: true, slug: true } },
        subCategories: { select: { id: true, name: true, slug: true, isActive: true, displayOrder: true } },
        _count: { select: { products: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const validated = categoryCreateSchema.parse(body);

    const existing = await prisma.category.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description || null,
        imageUrl: validated.imageUrl || null,
        parentCategoryId: validated.parentCategoryId || null,
        isActive: validated.isActive,
        displayOrder: validated.displayOrder,
      },
      include: {
        parentCategory: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'CATEGORY_CREATED',
        entityType: 'category',
        entityId: category.id,
        safeMetadata: JSON.stringify({ name: category.name, slug: category.slug, createdBy: admin.email }),
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || 'Category creation failed' },
      { status: 400 }
    );
  }
}
