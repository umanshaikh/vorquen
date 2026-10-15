import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">The FashionHub Atelier</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900">
          Mindful Indian Fashion.
        </h1>
        <p className="text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
          Crafting modern silhouettes through Indian handloom mastery, durable pure organic cottons, and French flax linen.
        </p>
      </div>

      <div className="relative aspect-[16/9] w-full rounded-sm overflow-hidden bg-stone-200">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1400&auto=format&fit=crop"
          alt="FashionHub Atelier Workshop"
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed bg-white border border-stone-200/80 rounded-sm p-6 sm:p-10">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">Our Craft Philosophy</h2>
        <p>
          FashionHub was founded on a simple principle: Indian wardrobes deserve garments engineered with uncompromising fabric integrity, tailored with refined contemporary proportions, and priced transparently without inflated legacy markups.
        </p>
        <p>
          From sourcing 240 GSM organic combed cotton to partnering with Chanderi and Maheshwari handloom clusters, each collection is tailored in small batches to preserve textile artistry and minimize waste.
        </p>
        <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
          <div>
            <p className="font-serif font-bold text-base text-stone-900">FashionHub Design Collective</p>
            <p className="text-xs text-stone-500">Bengaluru • Mumbai • New Delhi</p>
          </div>
          <Link
            href="/shop"
            className="px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded"
          >
            Explore Collections
          </Link>
        </div>
      </div>
    </div>
  );
}
