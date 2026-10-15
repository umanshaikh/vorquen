import prisma from '../db/prisma';

export interface ProductFilterParams {
  categorySlug?: string;
  audience?: string;
  size?: string;
  colour?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'bestseller';
  page?: number;
  pageSize?: number;
}

export async function getProducts(params: ProductFilterParams = {}) {
  const {
    categorySlug,
    audience,
    size,
    colour,
    minPrice,
    maxPrice,
    search,
    sortBy = 'newest',
    page = 1,
    pageSize = 12,
  } = params;

  const whereClause: any = {
    isActive: true,
  };

  if (categorySlug) {
    whereClause.category = { slug: categorySlug };
  }

  if (audience && audience !== 'all') {
    whereClause.audience = audience;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.basePrice = {};
    if (minPrice !== undefined) whereClause.basePrice.gte = minPrice;
    if (maxPrice !== undefined) whereClause.basePrice.lte = maxPrice;
  }

  if (search && search.trim() !== '') {
    whereClause.OR = [
      { name: { contains: search.trim() } },
      { description: { contains: search.trim() } },
      { brand: { contains: search.trim() } },
    ];
  }

  if (size || colour) {
    whereClause.variants = {
      some: {
        isActive: true,
        ...(size ? { size } : {}),
        ...(colour ? { colour: { contains: colour } } : {}),
      },
    };
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'price_asc') {
    orderBy = { basePrice: 'asc' };
  } else if (sortBy === 'price_desc') {
    orderBy = { basePrice: 'desc' };
  } else if (sortBy === 'bestseller') {
    orderBy = [{ isBestSeller: 'desc' }, { createdAt: 'desc' }];
  }

  const skip = (page - 1) * pageSize;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        variants: {
          where: { isActive: true },
        },
        reviews: {
          where: { moderationStatus: 'approved' },
          select: { rating: true },
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  const formattedProducts = products.map((p) => {
    const avgRating =
      p.reviews.length > 0
        ? p.reviews.reduce((acc, curr) => acc + curr.rating, 0) / p.reviews.length
        : 5.0;
    const totalStock = p.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

    return {
      ...p,
      avgRating: Number(avgRating.toFixed(1)),
      reviewCount: p.reviews.length,
      totalStock,
      inStock: totalStock > 0,
    };
  });

  return {
    products: formattedProducts,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { displayOrder: 'asc' },
      },
      variants: {
        where: { isActive: true },
        orderBy: [{ colour: 'asc' }, { size: 'asc' }],
      },
      reviews: {
        where: { moderationStatus: 'approved' },
        include: {
          user: {
            select: { fullName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product || !product.isActive) {
    return null;
  }

  // Fetch related products in same category
  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: true,
    },
    take: 4,
  });

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews.length
      : 5.0;

  return {
    ...product,
    avgRating: Number(avgRating.toFixed(1)),
    relatedProducts: related,
  };
}

export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });
}
