import React from 'react';
import Link from 'next/link';
import { getProducts, getCategories } from '@/lib/services/productService';
import ProductCard from '@/components/products/ProductCard';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export const revalidate = 0; // Dynamic server component

interface ShopPageProps {
  searchParams: {
    category?: string;
    audience?: string;
    size?: string;
    colour?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'bestseller';
    page?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const currentCategory = searchParams.category;
  const currentAudience = searchParams.audience;
  const currentSize = searchParams.size;
  const currentColour = searchParams.colour;
  const currentSort = searchParams.sort || 'newest';
  const currentPage = Number(searchParams.page || 1);
  const search = searchParams.search;

  const [categories, result] = await Promise.all([
    getCategories(),
    getProducts({
      categorySlug: currentCategory,
      audience: currentAudience,
      size: currentSize,
      colour: currentColour,
      search,
      sortBy: currentSort,
      page: currentPage,
      pageSize: 12,
    }),
  ]);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREE'];
  const audiences = [
    { label: 'All', value: '' },
    { label: 'Men', value: 'men' },
    { label: 'Women', value: 'women' },
    { label: 'Unisex', value: 'unisex' },
    { label: 'Accessories', value: 'accessories' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
          <Link href="/" className="hover:text-stone-900">Home</Link>
          <span>/</span>
          <span className="text-stone-900 font-medium">Catalog</span>
          {currentCategory && (
            <>
              <span>/</span>
              <span className="capitalize text-stone-900">{currentCategory}</span>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              {currentCategory ? `${currentCategory.toUpperCase()} COLLECTION` : 'ALL COLLECTIONS'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Showing {result.products.length} of {result.totalCount} artisanal items
              {search && <span> for &ldquo;{search}&rdquo;</span>}
            </p>
          </div>

          {/* Quick Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Link
              href="/shop"
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition ${
                !currentCategory && !currentAudience ? 'bg-stone-900 text-white' : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'
              }`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className={`px-3 py-1.5 text-xs rounded-full font-medium whitespace-nowrap transition ${
                  currentCategory === c.slug ? 'bg-stone-900 text-white' : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'
                }`}
              >
                {c.name} ({c._count.products})
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 border border-stone-200/80 rounded-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <SlidersHorizontal size={14} />
                <span>Filters</span>
              </span>
              <Link href="/shop" className="text-[11px] text-stone-500 hover:text-stone-900 underline">
                Clear All
              </Link>
            </div>

            {/* Audience / Gender Filter */}
            <div>
              <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-2.5">Audience</h4>
              <div className="flex flex-wrap gap-1.5">
                {audiences.map((aud) => (
                  <Link
                    key={aud.label}
                    href={`/shop?${new URLSearchParams({
                      ...(currentCategory ? { category: currentCategory } : {}),
                      ...(aud.value ? { audience: aud.value } : {}),
                      ...(currentSize ? { size: currentSize } : {}),
                      sort: currentSort,
                    }).toString()}`}
                    className={`px-3 py-1 text-xs rounded border transition ${
                      (currentAudience || '') === aud.value
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {aud.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-2.5">Size</h4>
              <div className="grid grid-cols-4 gap-1.5">
                {sizes.map((sz) => (
                  <Link
                    key={sz}
                    href={`/shop?${new URLSearchParams({
                      ...(currentCategory ? { category: currentCategory } : {}),
                      ...(currentAudience ? { audience: currentAudience } : {}),
                      size: sz,
                      sort: currentSort,
                    }).toString()}`}
                    className={`py-1 text-xs text-center rounded border transition ${
                      currentSize === sz
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {sz}
                  </Link>
                ))}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div>
              <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-2.5">Sort by</h4>
              <div className="space-y-1.5 text-xs text-stone-700">
                {[
                  { label: 'Newest Additions', value: 'newest' },
                  { label: 'Best Sellers', value: 'bestseller' },
                  { label: 'Price: Low to High', value: 'price_asc' },
                  { label: 'Price: High to Low', value: 'price_desc' },
                ].map((s) => (
                  <Link
                    key={s.value}
                    href={`/shop?${new URLSearchParams({
                      ...(currentCategory ? { category: currentCategory } : {}),
                      ...(currentAudience ? { audience: currentAudience } : {}),
                      ...(currentSize ? { size: currentSize } : {}),
                      sort: s.value,
                    }).toString()}`}
                    className={`block py-1 px-2 rounded transition ${
                      currentSort === s.value ? 'bg-stone-100 font-bold text-stone-950' : 'hover:bg-stone-50'
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-8">
          {result.products.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded p-12 text-center space-y-4">
              <h3 className="font-serif text-xl font-bold text-stone-800">No items match your criteria</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try loosening your filter filters or browsing our all-inclusive catalogue.
              </p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded"
              >
                Reset Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {result.products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-stone-200">
              {Array.from({ length: result.totalPages }).map((_, idx) => {
                const pageNumber = idx + 1;
                return (
                  <Link
                    key={pageNumber}
                    href={`/shop?${new URLSearchParams({
                      ...(currentCategory ? { category: currentCategory } : {}),
                      ...(currentAudience ? { audience: currentAudience } : {}),
                      ...(currentSize ? { size: currentSize } : {}),
                      sort: currentSort,
                      page: String(pageNumber),
                    }).toString()}`}
                    className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded border transition ${
                      currentPage === pageNumber
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {pageNumber}
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
