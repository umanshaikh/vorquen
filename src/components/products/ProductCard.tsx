'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    basePrice: number;
    salePrice?: number | null;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    avgRating?: number;
    reviewCount?: number;
    images: { imageUrl: string; altText: string }[];
    variants?: { id: string; size: string; colour: string; stockQuantity: number }[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const primaryImage = product.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600';
  const secondaryImage = product.images[1]?.imageUrl || primaryImage;

  const hasDiscount = Boolean(product.salePrice && product.salePrice < product.basePrice);
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)
    : 0;

  const firstAvailableVariant = product.variants?.find((v) => v.stockQuantity > 0);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (firstAvailableVariant) {
      await addToCart(firstAvailableVariant.id, 1);
    } else {
      window.location.href = `/shop/${product.slug}`;
    }
  };

  return (
    <div className="group relative flex flex-col bg-white border border-stone-200/70 rounded-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-stone-300">
      {/* Product Image Container */}
      <Link href={`/shop/${product.slug}`} className="relative aspect-[3/4] w-full overflow-hidden bg-sand-100">
        <Image
          src={primaryImage}
          alt={product.images[0]?.altText || product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          unoptimized
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {product.isBestSeller && (
            <span className="bg-stone-900 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">
              Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-amber-800 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">
              New Drop
            </span>
          )}
          {hasDiscount && (
            <span className="bg-rose-700 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Quick Add Button Overlay */}
        <div className="absolute inset-x-2 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleQuickAdd}
            className="w-full py-2 bg-white/95 backdrop-blur-sm text-stone-900 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-stone-900 hover:text-white transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <ShoppingBag size={13} />
            <span>{firstAvailableVariant ? 'Quick Add' : 'Select Size'}</span>
          </button>
        </div>
      </Link>

      {/* Info Container */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">
            {product.brand}
          </span>
          <Link href={`/shop/${product.slug}`}>
            <h3 className="text-xs sm:text-sm font-medium text-stone-900 hover:text-stone-700 line-clamp-1 mt-0.5 transition">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Ratings & Price */}
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            {hasDiscount ? (
              <>
                <span className="text-xs sm:text-sm font-bold text-stone-900">
                  ₹{product.salePrice?.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-stone-400 line-through">
                  ₹{product.basePrice.toLocaleString('en-IN')}
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-sm font-bold text-stone-900">
                ₹{product.basePrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 text-[11px] text-stone-500">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span>{product.avgRating || 5.0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
