'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Box,
  Eye,
} from 'lucide-react';

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('VORQUEN');
  const [categoryId, setCategoryId] = useState('');
  const [audience, setAudience] = useState<'men' | 'women' | 'unisex' | 'accessories'>('unisex');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fabric, setFabric] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [weight, setWeight] = useState<string>('');
  const [model3dUrl, setModel3dUrl] = useState('');

  // Pricing
  const [basePrice, setBasePrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [taxCode, setTaxCode] = useState('GST_12');

  // Status & Display
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Images List
  const [images, setImages] = useState<
    { imageUrl: string; altText: string; isPrimary: boolean; displayOrder: number }[]
  >([]);

  // Variants List
  const [variants, setVariants] = useState<
    { id?: string; size: string; colour: string; colourHex: string; sku: string; stockQuantity: number; priceOverride?: number }[]
  >([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then((r) => r.json()),
      fetch(`/api/admin/products/${productId}`).then((r) => r.json()),
    ])
      .then(([catData, prodData]) => {
        if (catData.categories) setCategories(catData.categories);
        if (prodData.product) {
          const p = prodData.product;
          setName(p.name);
          setSlug(p.slug);
          setSku(p.sku || '');
          setBrand(p.brand || 'VORQUEN');
          setCategoryId(p.categoryId);
          setAudience(p.audience || 'unisex');
          setDescription(p.description);
          setShortDescription(p.shortDescription || '');
          setFabric(p.fabric || '');
          setCareInstructions(p.careInstructions || '');
          setWeight(p.weight ? String(p.weight) : '');
          setModel3dUrl(p.model3dUrl || '');
          setBasePrice(String(p.basePrice));
          setSalePrice(p.salePrice ? String(p.salePrice) : '');
          setCostPrice(String(p.costPrice || 0));
          setTaxCode(p.taxCode || 'GST_12');
          setStatus(p.status || (p.isActive ? 'active' : 'draft'));
          setIsFeatured(p.isFeatured);
          setIsNewArrival(p.isNewArrival);
          setIsBestSeller(p.isBestSeller);
          setImages(
            p.images?.map((img: any, idx: number) => ({
              imageUrl: img.imageUrl,
              altText: img.altText || p.name,
              isPrimary: img.isPrimary,
              displayOrder: img.displayOrder ?? idx,
            })) || []
          );
          setVariants(
            p.variants?.map((v: any) => ({
              id: v.id,
              size: v.size,
              colour: v.colour,
              colourHex: v.colourHex || '#000000',
              sku: v.sku,
              stockQuantity: v.stockQuantity,
              priceOverride: v.priceOverride || undefined,
            })) || []
          );
        }
      })
      .catch((err) => {
        setFeedback({ type: 'error', message: 'Failed to load product details.' });
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Upload failed' });
        return;
      }

      setImages((prev) => [
        ...prev,
        {
          imageUrl: data.url,
          altText: name || 'VORQUEN photo',
          isPrimary: prev.length === 0,
          displayOrder: prev.length,
        },
      ]);
    } catch {
      setFeedback({ type: 'error', message: 'Network error uploading image' });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingModel(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'model3d');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || '3D Model upload failed' });
        return;
      }

      setModel3dUrl(data.url);
      setFeedback({ type: 'success', message: '3D model file uploaded successfully (.glb/.gltf)' });
    } catch {
      setFeedback({ type: 'error', message: 'Network error uploading 3D model' });
    } finally {
      setUploadingModel(false);
      e.target.value = '';
    }
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
        displayOrder: i === index ? 0 : i + 1,
      }))
    );
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        size: 'M',
        colour: 'Obsidian Black',
        colourHex: '#171717',
        sku: `${slug.toUpperCase()}-NEW-${Date.now().toString().slice(-4)}`,
        stockQuantity: 10,
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    if (variants.length <= 1) {
      alert('Product requires at least one variant.');
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, val: any) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: val } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const formattedVariants = variants.map((v) => ({
      id: v.id,
      size: v.size.trim().toUpperCase(),
      colour: v.colour.trim(),
      colourHex: v.colourHex.trim() || null,
      sku: v.sku.trim(),
      stockQuantity: Number(v.stockQuantity) || 0,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    }));

    const payload = {
      name,
      slug,
      sku: sku.trim() || null,
      brand: brand || 'VORQUEN',
      categoryId,
      audience,
      description,
      shortDescription: shortDescription || null,
      fabric: fabric || null,
      careInstructions: careInstructions || null,
      weight: weight ? Number(weight) : null,
      model3dUrl: model3dUrl.trim() || null,
      basePrice: Number(basePrice),
      salePrice: salePrice ? Number(salePrice) : null,
      costPrice: Number(costPrice || 0),
      taxCode,
      status,
      isActive: status === 'active',
      isFeatured,
      isNewArrival,
      isBestSeller,
      images: images.map((img, idx) => ({
        imageUrl: img.imageUrl,
        altText: img.altText || name,
        isPrimary: img.isPrimary,
        displayOrder: idx,
      })),
      variants: formattedVariants,
    };

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to update product.' });
        setSaving(false);
        return;
      }

      setFeedback({
        type: 'success',
        message: 'Product changes saved and reflected on customer storefront!',
      });
      setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    } catch {
      setFeedback({ type: 'error', message: 'Network error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-stone-400 font-mono text-xs uppercase tracking-widest animate-pulse">
        Loading VORQUEN product details...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-lg shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-stone-500 font-bold">
              Catalog Editor
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-950">
              Edit Product: {name}
            </h1>
          </div>
        </div>

        <Link
          href={`/shop/${slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50"
        >
          <Eye size={14} />
          <span>Live Storefront Preview</span>
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-700">
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Details */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-serif text-lg font-bold text-stone-950 border-b border-stone-100 pb-3">
            Core Identity &amp; Categorization
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-stone-800">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Master SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Audience Collection *</label>
              <select
                value={audience}
                onChange={(e: any) => setAudience(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none capitalize"
              >
                <option value="men">Men&apos;s Collection</option>
                <option value="women">Women&apos;s Collection</option>
                <option value="unisex">Unisex Atelier</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-stone-800">Detailed Description *</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-stone-800">Short Summary</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Specs & 3D Model */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-serif text-lg font-bold text-stone-950 border-b border-stone-100 pb-3 flex items-center justify-between">
            <span>Fabric, Care &amp; 3D Model</span>
            <span className="text-[10px] font-mono uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              3D Interactive Asset
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Fabric &amp; Composition</label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Care Instructions</label>
              <input
                type="text"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-2 sm:col-span-3 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-stone-800 flex items-center gap-1.5">
                  <Box size={15} className="text-indigo-600" />
                  <span>3D Digital Model URL (.glb, .gltf, .usdz)</span>
                </label>
                <label className="cursor-pointer text-indigo-700 hover:text-indigo-900 font-semibold text-[11px] flex items-center gap-1">
                  <UploadCloud size={14} />
                  <span>{uploadingModel ? 'Uploading...' : 'Upload 3D Asset'}</span>
                  <input
                    type="file"
                    accept=".glb,.gltf,.usdz,.obj"
                    className="hidden"
                    onChange={handleModelUpload}
                    disabled={uploadingModel}
                  />
                </label>
              </div>
              <input
                type="text"
                value={model3dUrl}
                onChange={(e) => setModel3dUrl(e.target.value)}
                placeholder="https://.../model.glb"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-serif text-lg font-bold text-stone-950 border-b border-stone-100 pb-3">
            Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Regular Base Price (₹) *</label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Sale Price (₹, optional)</label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Cost Price (₹)</label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Tax Code</label>
              <select
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none font-mono"
              >
                <option value="GST_12">GST 12%</option>
                <option value="GST_5">GST 5%</option>
                <option value="GST_18">GST 18%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-950">Garment Gallery</h2>
              <p className="text-xs text-stone-500">Reorder or set primary thumbnail</p>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition">
              <UploadCloud size={14} />
              <span>{uploadingImage ? 'Uploading...' : 'Add Images'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingImage}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 bg-stone-100 group ${
                  img.isPrimary ? 'border-amber-500 ring-2 ring-amber-200' : 'border-stone-200'
                }`}
              >
                <Image
                  src={img.imageUrl}
                  alt={img.altText}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {img.isPrimary && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-mono font-bold uppercase rounded shadow">
                    Primary
                  </span>
                )}
                <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(idx)}
                      className="px-2 py-1 bg-white text-stone-900 text-[10px] font-bold rounded shadow"
                    >
                      Make Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1.5 bg-rose-600 text-white rounded shadow hover:bg-rose-700"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Variants Matrix */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-950">Variants &amp; Stock</h2>
              <p className="text-xs text-stone-500">Stock updates reflect immediately on storefront</p>
            </div>
            <button
              type="button"
              onClick={addVariantRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg"
            >
              <Plus size={14} />
              <span>Add Variant</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-mono uppercase text-[10px]">
                  <th className="py-2 px-2">Size</th>
                  <th className="py-2 px-2">Colour</th>
                  <th className="py-2 px-2">Hex</th>
                  <th className="py-2 px-2">Stock Units</th>
                  <th className="py-2 px-2">SKU</th>
                  <th className="py-2 px-2 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {variants.map((v, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-2">
                      <select
                        value={v.size}
                        onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                        className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded font-bold font-mono focus:outline-none"
                      >
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                        <option value="FREE">FREE</option>
                      </select>
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={v.colour}
                        onChange={(e) => updateVariant(idx, 'colour', e.target.value)}
                        className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded focus:outline-none w-36"
                      />
                    </td>

                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={v.colourHex || '#000000'}
                          onChange={(e) => updateVariant(idx, 'colourHex', e.target.value)}
                          className="w-7 h-7 rounded border border-stone-300 cursor-pointer"
                        />
                        <span className="font-mono text-[10px] text-stone-500">{v.colourHex}</span>
                      </div>
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        value={v.stockQuantity}
                        onChange={(e) => updateVariant(idx, 'stockQuantity', e.target.value)}
                        className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded font-mono font-bold w-24 focus:outline-none"
                      />
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => updateVariant(idx, 'sku', e.target.value.toUpperCase())}
                        className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded font-mono text-[11px] w-36 focus:outline-none"
                      />
                    </td>

                    <td className="py-2 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeVariantRow(idx)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Publication Status */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-stone-950 border-b border-stone-100 pb-3">
            Publishing Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800">Status *</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
              >
                <option value="active">Active (Published on storefront)</option>
                <option value="draft">Draft (Hidden in staging)</option>
                <option value="archived">Archived (Unpublished)</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-stone-900 w-4 h-4"
                />
                <span className="font-semibold text-stone-800">Featured Runway</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="rounded text-stone-900 w-4 h-4"
                />
                <span className="font-semibold text-stone-800">New Arrival</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="rounded text-stone-900 w-4 h-4"
                />
                <span className="font-semibold text-stone-800">Best Seller</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {saving ? 'Saving Updates...' : 'Save Product Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
