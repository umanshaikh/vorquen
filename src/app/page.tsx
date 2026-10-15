import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Sparkles, Star } from 'lucide-react';
import prisma from '@/lib/db/prisma';
import ProductCard from '@/components/products/ProductCard';

export const revalidate = 60; // ISR cache revalidation every minute

export default async function HomePage() {
  const [categories, bestSellers, newArrivals, reviews] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isActive: true, isBestSeller: true },
      include: {
        images: true,
        variants: { where: { isActive: true } },
      },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isActive: true, isNewArrival: true },
      include: {
        images: true,
        variants: { where: { isActive: true } },
      },
      take: 4,
    }),
    prisma.productReview.findMany({
      where: { moderationStatus: 'approved' },
      include: {
        user: { select: { fullName: true } },
        product: { select: { name: true } },
      },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO CAMPAIGN SECTION */}
      <section className="relative h-[85vh] min-h-[550px] w-full overflow-hidden flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop"
          alt="FashionHub Atelier Campaign 2026"
          fill
          priority
          className="object-cover object-center brightness-[0.82]"
          unoptimized
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white space-y-6">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-100 border border-white/25">
            Summer/Spring 2026 Atelier Drop
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            Artisanal Grace. <br />
            <span className="font-light italic">Effortless Modernity.</span>
          </h1>
          <p className="text-sm sm:text-base text-stone-200 max-w-xl mx-auto font-light leading-relaxed">
            Crafted for the contemporary Indian lifestyle. 240 GSM organic combed cotton, French flax linen, and handcrafted Chanderi silk.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-stone-900 font-semibold text-xs uppercase tracking-widest hover:bg-stone-100 transition rounded-sm shadow-xl"
            >
              Shop The Drop
            </Link>
            <Link
              href="/shop?category=women"
              className="w-full sm:w-auto px-8 py-3.5 bg-black/40 backdrop-blur-md text-white border border-white/40 font-semibold text-xs uppercase tracking-widest hover:bg-black/60 transition rounded-sm"
            >
              Explore Women
            </Link>
          </div>
        </div>
      </section>

      {/* 2. VALUES / TRUST PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-stone-200 text-stone-800">
          <div className="flex items-center gap-3">
            <Truck size={24} className="text-stone-700 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Express Courier</h4>
              <p className="text-[11px] text-stone-500">Free delivery on orders over ₹1,499</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RefreshCw size={24} className="text-stone-700 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">7-Day Easy Returns</h4>
              <p className="text-[11px] text-stone-500">Seamless door-step reverse pickup</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-stone-700 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">100% Indian Atelier</h4>
              <p className="text-[11px] text-stone-500">Sourced ethically from Indian weavers</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-stone-700 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Prepaid & COD</h4>
              <p className="text-[11px] text-stone-500">UPI, Credit Cards, Netbanking & COD</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500">Curated Categories</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">Shop by Wardrobe Edit</h2>
          </div>
          <Link href="/shop" className="text-xs font-bold tracking-wider uppercase text-stone-800 hover:text-stone-950 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative aspect-[3/4] rounded-sm overflow-hidden bg-stone-200"
            >
              <Image
                src={cat.imageUrl || 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=800'}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105 brightness-[0.88]"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">{cat.name}</h3>
                <span className="text-[11px] uppercase tracking-wider text-stone-300 flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform">
                  <span>Explore Atelier</span>
                  <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500">Most Coveted</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">Iconic Best Sellers</h2>
          </div>
          <Link href="/shop?sort=bestseller" className="text-xs font-bold tracking-wider uppercase text-stone-800 hover:text-stone-950 flex items-center gap-1">
            <span>See More</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      </section>

      {/* 5. EDITORIAL HIGHLIGHT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-sm overflow-hidden bg-stone-900 text-white min-h-[420px] flex items-center">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1600&auto=format&fit=crop"
              alt="Editorial Banner"
              fill
              className="object-cover opacity-40"
              unoptimized
            />
          </div>
          <div className="relative z-10 max-w-xl p-8 sm:p-14 space-y-4">
            <span className="text-xs uppercase tracking-[0.25em] text-amber-300 font-bold">Textile Innovation</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
              French Flax Linen & Pure Chanderi Weaves
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
              Breathable, enduring, and crafted to drape with natural poise. Designed without compromise for Indian temperatures and formal-casual versatility.
            </p>
            <div className="pt-2">
              <Link
                href="/shop?category=men"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-900 text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-stone-100 transition shadow"
              >
                <span>Discover Linen</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500">Fresh Silhouettes</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">New Arrivals</h2>
          </div>
          <Link href="/shop?sort=newest" className="text-xs font-bold tracking-wider uppercase text-stone-800 hover:text-stone-950 flex items-center gap-1">
            <span>Explore All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      </section>

      {/* 7. VERIFIED CUSTOMER REVIEWS */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500">Client Voices</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">Client Commendations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 bg-white border border-stone-200/80 rounded-sm shadow-sm space-y-3">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400" />
                  ))}
                </div>
                <h4 className="text-sm font-semibold text-stone-900">&ldquo;{rev.reviewTitle}&rdquo;</h4>
                <p className="text-xs text-stone-600 leading-relaxed font-light">{rev.reviewText}</p>
                <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[11px] text-stone-500">
                  <span className="font-medium text-stone-800">{rev.user.fullName}</span>
                  <span className="text-stone-400">Verified Purchase</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
