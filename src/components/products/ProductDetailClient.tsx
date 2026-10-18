'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, Shield, Truck, RefreshCw, Ruler, Check, AlertCircle, Box, Sparkles, ExternalLink } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/products/ProductCard';

interface ProductDetailProps {
  product: any;
}

export default function ProductDetailClient({ product }: ProductDetailProps) {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColour, setSelectedColour] = useState(product.variants[0]?.colour || '');
  const [selectedSize, setSelectedSize] = useState(product.variants[0]?.size || '');
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [show3dMode, setShow3dMode] = useState(false);

  useEffect(() => {
    if (product.model3dUrl && typeof window !== 'undefined') {
      const scriptId = 'google-model-viewer-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'module';
        script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
        document.head.appendChild(script);
      }
    }
  }, [product.model3dUrl]);

  // Available colours
  const availableColours = Array.from(new Set(product.variants.map((v: any) => v.colour))) as string[];

  // Sizes available for the selected colour
  const variantsForColour = product.variants.filter((v: any) => v.colour === selectedColour);
  const availableSizes = Array.from(new Set(variantsForColour.map((v: any) => v.size))) as string[];

  // Selected variant
  const selectedVariant = product.variants.find(
    (v: any) => v.colour === selectedColour && v.size === selectedSize
  );

  const stock = selectedVariant?.stockQuantity || 0;
  const isAvailable = stock > 0;

  const currentPrice = selectedVariant?.priceOverride ?? product.salePrice ?? product.basePrice;
  const hasDiscount = Boolean(product.salePrice && product.salePrice < product.basePrice);

  const handleAddToCart = async () => {
    if (!selectedVariant || !isAvailable) return;
    setIsAdding(true);
    await addToCart(selectedVariant.id, quantity);
    setIsAdding(false);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  };

  const images = product.images.length > 0 ? product.images : [
    { imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000', altText: product.name }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      {/* Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Gallery Column */}
        <div className="flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          {(images.length > 1 || product.model3dUrl) && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
              {images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setShow3dMode(false);
                    setSelectedImageIndex(idx);
                  }}
                  className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded border overflow-hidden flex-shrink-0 transition ${
                    !show3dMode && selectedImageIndex === idx
                      ? 'border-stone-900 ring-1 ring-stone-900'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img.imageUrl} alt={img.altText} fill className="object-cover" unoptimized />
                </button>
              ))}

              {product.model3dUrl && (
                <button
                  type="button"
                  onClick={() => setShow3dMode(true)}
                  className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded border overflow-hidden flex-shrink-0 transition flex flex-col items-center justify-center bg-stone-950 text-white ${
                    show3dMode
                      ? 'border-amber-400 ring-2 ring-amber-400'
                      : 'border-stone-800 opacity-85 hover:opacity-100'
                  }`}
                >
                  <Box size={22} className="text-amber-400 mb-1 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">3D View</span>
                </button>
              )}
            </div>
          )}

          {/* Main Display: 3D Model or Large Image */}
          {show3dMode && product.model3dUrl ? (
            <div className="relative aspect-[3/4] flex-1 bg-stone-950 rounded-sm overflow-hidden border border-stone-800 flex flex-col items-center justify-center text-white shadow-inner">
              <div className="w-full h-full relative">
                {/* @ts-ignore */}
                <model-viewer
                  src={product.model3dUrl}
                  alt={`3D Model of ${product.name}`}
                  auto-rotate
                  camera-controls
                  shadow-intensity="1"
                  environment-image="neutral"
                  interaction-prompt="auto"
                  style={{ width: '100%', height: '100%', backgroundColor: '#0c0a09' }}
                >
                  <div slot="poster" className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-stone-400">
                    <Box size={32} className="text-amber-400 animate-pulse mb-2" />
                    <p className="text-xs font-mono uppercase tracking-wider">Loading 3D Fashion Creation...</p>
                  </div>
                </model-viewer>
                <div className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-sm border border-stone-700 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1.5 pointer-events-none shadow-sm">
                  <Sparkles size={11} />
                  <span>Interactive 3D Atelier</span>
                </div>
                <div className="absolute bottom-3 inset-x-3 flex justify-between items-center text-[10px] text-stone-400 pointer-events-none">
                  <span className="bg-stone-900/80 px-2 py-0.5 rounded backdrop-blur-sm">
                    Drag to rotate • Scroll to zoom
                  </span>
                  <a
                    href={product.model3dUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-stone-900/80 hover:bg-stone-800 text-stone-300 px-2 py-0.5 rounded backdrop-blur-sm pointer-events-auto flex items-center gap-1"
                  >
                    <span>Asset Link</span>
                    <ExternalLink size={9} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative aspect-[3/4] flex-1 bg-stone-100 rounded-sm overflow-hidden border border-stone-200">
              <Image
                src={images[selectedImageIndex]?.imageUrl || images[0].imageUrl}
                alt={images[selectedImageIndex]?.altText || product.name}
                fill
                priority
                className="object-cover object-center"
                unoptimized
              />
              {product.model3dUrl && (
                <button
                  type="button"
                  onClick={() => setShow3dMode(true)}
                  className="absolute bottom-3 right-3 bg-stone-950/90 hover:bg-stone-900 text-white border border-stone-700 text-xs font-semibold px-3 py-1.5 rounded-sm flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition"
                >
                  <Box size={14} className="text-amber-400" />
                  <span>Inspect in 3D</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div className="space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">
              {product.brand} • {product.audience?.toUpperCase()}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 mt-1">
              {product.name}
            </h1>

            {/* Ratings & SKU */}
            <div className="flex items-center gap-3 mt-2 text-xs text-stone-600">
              <div className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star size={14} className="fill-amber-400" />
                <span>{product.avgRating || 5.0}</span>
              </div>
              <span>•</span>
              <span className="text-stone-500">SKU: {selectedVariant?.sku || product.sku}</span>
              <span>•</span>
              <span className="text-stone-500">{product.reviews?.length || 0} Reviews</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 p-4 bg-sand-100/70 border border-sand-200 rounded-sm">
            <span className="text-2xl sm:text-3xl font-bold text-stone-950">
              ₹{currentPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-stone-400 line-through">
                  ₹{product.basePrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Save ₹{(product.basePrice - currentPrice).toLocaleString('en-IN')}
                </span>
              </>
            )}
            <span className="text-[11px] text-stone-500 ml-auto">Inclusive of all Indian taxes</span>
          </div>

          {/* Colour Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-stone-900">
                Colour: <span className="font-normal text-stone-600">{selectedColour}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableColours.map((col) => {
                const sampleVariant = product.variants.find((v: any) => v.colour === col);
                const isSelected = selectedColour === col;
                return (
                  <button
                    key={col}
                    onClick={() => {
                      setSelectedColour(col);
                      const firstSizeForCol = product.variants.find((v: any) => v.colour === col)?.size;
                      if (firstSizeForCol) setSelectedSize(firstSizeForCol);
                    }}
                    className={`px-3.5 py-1.5 text-xs rounded border transition flex items-center gap-2 ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white font-medium'
                        : 'border-stone-300 bg-white text-stone-800 hover:border-stone-500'
                    }`}
                  >
                    {sampleVariant?.colourHex && (
                      <span
                        className="w-3 h-3 rounded-full border border-stone-300"
                        style={{ backgroundColor: sampleVariant.colourHex }}
                      />
                    )}
                    <span>{col}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-stone-900">
                Size: <span className="font-normal text-stone-600">{selectedSize}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSizeGuide(true)}
                className="text-[11px] text-stone-700 hover:text-stone-950 underline flex items-center gap-1 font-medium"
              >
                <Ruler size={13} />
                <span>Size Guide</span>
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {availableSizes.map((sz) => {
                const variant = product.variants.find(
                  (v: any) => v.colour === selectedColour && v.size === sz
                );
                const hasStock = (variant?.stockQuantity || 0) > 0;
                const isSelected = selectedSize === sz;

                return (
                  <button
                    key={sz}
                    disabled={!hasStock}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2 text-xs font-semibold rounded border transition ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                        : hasStock
                        ? 'border-stone-200 bg-white text-stone-800 hover:border-stone-500'
                        : 'border-stone-100 bg-stone-100 text-stone-400 cursor-not-allowed line-through'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Availability Status */}
          <div className="text-xs flex items-center gap-2">
            {isAvailable ? (
              stock <= 5 ? (
                <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <AlertCircle size={14} />
                  <span>Hurry! Only {stock} unit{stock > 1 ? 's' : ''} left in stock</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <Check size={14} />
                  <span>Ready to dispatch (In Stock at Bengaluru Warehouse)</span>
                </span>
              )
            ) : (
              <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                <AlertCircle size={14} />
                <span>Currently out of stock in this size</span>
              </span>
            )}
          </div>

          {/* Add To Cart Button */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={!isAvailable || isAdding}
              className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase rounded transition flex items-center justify-center gap-2 ${
                isAvailable
                  ? 'bg-stone-950 text-white hover:bg-stone-800 shadow-md'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              {isAdding ? 'Adding...' : addedSuccess ? 'Added to Bag! ✓' : isAvailable ? 'Add to Bag' : 'Sold Out'}
            </button>
          </div>

          {/* Assurance Grid */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-200 text-center text-[11px] text-stone-600">
            <div className="p-2.5 bg-sand-100/60 rounded">
              <Truck size={18} className="mx-auto mb-1 text-stone-700" />
              <span>Free Delivery &gt; ₹1,499</span>
            </div>
            <div className="p-2.5 bg-sand-100/60 rounded">
              <RefreshCw size={18} className="mx-auto mb-1 text-stone-700" />
              <span>7-Day Doorstep Returns</span>
            </div>
            <div className="p-2.5 bg-sand-100/60 rounded">
              <Shield size={18} className="mx-auto mb-1 text-stone-700" />
              <span>Authentic Handcrafted</span>
            </div>
          </div>

          {/* Product Description, Fabric & Care */}
          <div className="space-y-4 pt-4 border-t border-stone-200 text-xs leading-relaxed text-stone-700">
            <div>
              <h4 className="font-bold uppercase tracking-wider text-stone-900 mb-1">Description</h4>
              <p>{product.description}</p>
            </div>
            {product.fabric && (
              <div>
                <h4 className="font-bold uppercase tracking-wider text-stone-900 mb-1">Fabric & Material</h4>
                <p>{product.fabric}</p>
              </div>
            )}
            {product.careInstructions && (
              <div>
                <h4 className="font-bold uppercase tracking-wider text-stone-900 mb-1">Care Guide</h4>
                <p>{product.careInstructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="pt-10 border-t border-stone-200">
        <h3 className="font-serif text-2xl font-bold text-stone-900 mb-6">
          Verified Reviews ({product.reviews?.length || 0})
        </h3>
        {product.reviews && product.reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.reviews.map((r: any) => (
              <div key={r.id} className="p-5 bg-white border border-stone-200 rounded-sm space-y-2">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={13} className="fill-amber-400" />
                  ))}
                </div>
                <h5 className="font-bold text-xs text-stone-900">{r.reviewTitle}</h5>
                <p className="text-xs text-stone-600 font-light leading-relaxed">{r.reviewText}</p>
                <div className="text-[11px] text-stone-400 pt-1">
                  By {r.user?.fullName || 'Verified Customer'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-500">No reviews yet for this product. Be the first to review!</p>
        )}
      </div>

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="pt-10 border-t border-stone-200">
          <h3 className="font-serif text-2xl font-bold text-stone-900 mb-6">Complete The Ensemble</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {product.relatedProducts.map((rel: any) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full p-6 rounded-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <h4 className="font-serif text-lg font-bold text-stone-900">Standard Size Guide (Inches)</h4>
              <button onClick={() => setShowSizeGuide(false)} className="text-stone-400 hover:text-stone-700">
                ✕
              </button>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold">
                    <th className="py-2">Size</th>
                    <th className="py-2">Chest / Bust</th>
                    <th className="py-2">Waist</th>
                    <th className="py-2">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  <tr><td className="py-2 font-bold">S</td><td>38&quot;</td><td>30&quot;</td><td>28&quot;</td></tr>
                  <tr><td className="py-2 font-bold">M</td><td>40&quot;</td><td>32&quot;</td><td>29&quot;</td></tr>
                  <tr><td className="py-2 font-bold">L</td><td>42&quot;</td><td>34&quot;</td><td>30&quot;</td></tr>
                  <tr><td className="py-2 font-bold">XL</td><td>44&quot;</td><td>36&quot;</td><td>31&quot;</td></tr>
                  <tr><td className="py-2 font-bold">XXL</td><td>46&quot;</td><td>38&quot;</td><td>32&quot;</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-stone-500">
              Garments are tailored for a relaxed, modern silhouette. If you prefer a tailored fit, we recommend choosing your regular size.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
