'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, Plus, Check, AlertCircle, Edit2, Trash2, ExternalLink, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [brand, setBrand] = useState('FashionHub Studio');
  const [categoryId, setCategoryId] = useState('');
  const [audience, setAudience] = useState<'men' | 'women' | 'unisex' | 'accessories'>('unisex');
  const [fabric, setFabric] = useState('100% Combed Cotton');
  const [careInstructions, setCareInstructions] = useState('Machine wash cold. Line dry in shade.');
  const [basePrice, setBasePrice] = useState('1499');
  const [salePrice, setSalePrice] = useState('1199');
  const [costPrice, setCostPrice] = useState('450');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);

  // Variants matrix
  const [variants, setVariants] = useState([
    { size: 'S', colour: 'Black', stockQuantity: 20 },
    { size: 'M', colour: 'Black', stockQuantity: 30 },
    { size: 'L', colour: 'Black', stockQuantity: 25 },
    { size: 'XL', colour: 'Black', stockQuantity: 15 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          if (!categoryId) {
            setCategoryId(data.categories[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setSlug(generatedSlug);
  };

  const handleAddVariantRow = () => {
    const lastColour = variants[variants.length - 1]?.colour || 'Black';
    setVariants([...variants, { size: 'XXL', colour: lastColour, stockQuantity: 10 }]);
  };

  const handleGenerateStandardSizes = (colour: string) => {
    setVariants([
      { size: 'S', colour, stockQuantity: 20 },
      { size: 'M', colour, stockQuantity: 35 },
      { size: 'L', colour, stockQuantity: 30 },
      { size: 'XL', colour, stockQuantity: 20 },
      { size: 'XXL', colour, stockQuantity: 15 },
    ]);
  };

  const handleGenerateFreeSize = (colour: string) => {
    setVariants([
      { size: 'Free Size', colour, stockQuantity: 50 },
    ]);
  };

  const imagePresets = [
    { label: 'Oversized Tee', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000' },
    { label: 'Chikankari Kurta', url: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?q=80&w=1000' },
    { label: 'Linen Shirt', url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000' },
    { label: 'Nehru Jacket', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000' },
    { label: 'Denim Jeans', url: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1000' },
    { label: 'Anarkali Dress', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000' },
    { label: 'Silk Scarf', url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1000' },
  ];

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (!categoryId) {
        throw new Error('Please select a valid category');
      }

      const generatedSku = sku.trim() || `FH-${slug.toUpperCase().slice(0, 8)}-${Date.now().toString().slice(-4)}`;

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        sku: generatedSku,
        description: description.trim(),
        shortDescription: shortDescription.trim() || description.trim().slice(0, 140),
        brand: brand.trim(),
        categoryId,
        audience,
        fabric: fabric.trim() || undefined,
        careInstructions: careInstructions.trim() || undefined,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : null,
        costPrice: Number(costPrice),
        taxCode: 'GST_12',
        isActive: true,
        isFeatured,
        isNewArrival,
        images: [
          {
            imageUrl: imageUrl.trim(),
            altText: `${name} primary view`,
            isPrimary: true,
            displayOrder: 1,
          },
        ],
        variants: variants.map((v, i) => ({
          sku: `${generatedSku}-${v.colour.slice(0, 3).toUpperCase()}-${v.size.replace(/\s+/g, '')}-${i + 1}`,
          size: v.size,
          colour: v.colour,
          stockQuantity: Number(v.stockQuantity) || 0,
        })),
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      await fetchProducts();
      setModalOpen(false);
      setSuccessBanner(`Product "${payload.name}" successfully created with ${variants.length} sellable variant SKUs and initial inventory ledger entries!`);
      
      // Reset form
      setName('');
      setSlug('');
      setSku('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Product Management</h1>
          <p className="text-xs text-stone-500">
            Add new garments, manage size & colour variants, audit costs, and inspect live inventory
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-stone-800 transition flex items-center gap-2 shadow"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-600 hover:text-emerald-900 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border border-stone-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Styles</span>
          <span className="text-2xl font-bold text-stone-900">{products.length}</span>
        </div>
        <div className="bg-white p-4 rounded border border-stone-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Variant SKUs</span>
          <span className="text-2xl font-bold text-stone-900">
            {products.reduce((acc, p) => acc + (p.variants?.length || 0), 0)}
          </span>
        </div>
        <div className="bg-white p-4 rounded border border-stone-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Inventory Units</span>
          <span className="text-2xl font-bold text-stone-900">
            {products.reduce((acc, p) => acc + (p.variants?.reduce((s: number, v: any) => s + v.stockQuantity, 0) || 0), 0)}
          </span>
        </div>
        <div className="bg-white p-4 rounded border border-stone-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Categories Active</span>
          <span className="text-2xl font-bold text-stone-900">{categories.length || 4}</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-sand-50/50 flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">
            Garment Catalogue ({products.length} Products)
          </h2>
          <span className="text-[11px] text-stone-500">Click &quot;View on Store&quot; to test live customer experience</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Audience</th>
                <th className="p-3.5">Retail Price</th>
                <th className="p-3.5">Cost Price</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Variants</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400">Loading catalogue...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400">No products found. Click &quot;Add New Product&quot; above to create one.</td>
                </tr>
              ) : (
                products.map((p) => {
                  const totalStock = p.variants?.reduce((sum: number, v: any) => sum + v.stockQuantity, 0) || 0;
                  const thumb = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200';

                  return (
                    <tr key={p.id} className="hover:bg-sand-50/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 relative rounded bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                            <Image
                              src={thumb}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">{p.name}</p>
                            <p className="text-[11px] text-stone-400 font-mono">
                              SKU: {p.sku || p.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium">{p.category?.name || 'Unassigned'}</td>
                      <td className="p-3.5 capitalize">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700 font-semibold">
                          {p.audience}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-stone-900">
                        ₹{(p.salePrice ?? p.basePrice).toLocaleString('en-IN')}
                        {p.salePrice && (
                          <span className="text-[10px] text-stone-400 line-through block font-normal">
                            ₹{p.basePrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-stone-500 font-mono">₹{p.costPrice?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-bold">
                        <span className={totalStock <= 15 ? 'text-amber-700' : 'text-stone-900'}>
                          {totalStock} units
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[11px] text-stone-600 font-mono">
                          {p.variants?.length || 0} SKUs ({p.variants?.map((v: any) => v.size).join(', ')})
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {p.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/shop/${p.slug}`}
                          target="_blank"
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <span>Storefront</span>
                          <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-3xl w-full p-6 sm:p-8 rounded-sm shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Atelier Catalogue</span>
                <h2 className="font-serif text-xl font-bold text-stone-900">Add New Garment to Collection</h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Silk Bandhgala Kurta"
                    value={name}
                    onChange={handleNameChange}
                    className="w-full p-2.5 border border-stone-300 rounded focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">URL Slug (Auto-generated) *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded font-mono bg-stone-50"
                  />
                </div>
              </div>

              {/* Category, Brand, Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded bg-white font-medium"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Target Audience *</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full p-2.5 border border-stone-300 rounded bg-white font-medium"
                  >
                    <option value="unisex">Unisex</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed description of tailoring, fabric texture, drape, silhouette, and styling recommendation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded"
                />
              </div>

              {/* Fabric & Care */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Fabric & Material</label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Organic Linen, Mulberry Silk"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Care Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Dry clean recommended. Iron on low."
                    value={careInstructions}
                    onChange={(e) => setCareInstructions(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded"
                  />
                </div>
              </div>

              {/* Image URL & Live Preview */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-stone-700">Product Primary Image URL *</label>
                  <span className="text-[10px] text-stone-500">Pick a preset or paste any image URL</span>
                </div>

                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 p-2 border border-stone-300 rounded bg-white font-mono text-[11px]"
                  />
                  {imageUrl && (
                    <div className="w-12 h-14 relative rounded border border-stone-300 overflow-hidden flex-shrink-0 bg-stone-200">
                      <Image
                        src={imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} /> Quick Styles:
                  </span>
                  {imagePresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className="px-2 py-0.5 bg-white border border-stone-200 hover:border-stone-900 rounded text-[10px] text-stone-700 font-medium transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-stone-50 border border-stone-200 rounded">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Base Price (MRP ₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Sale Price (Selling ₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Cost Price (Admin Only ₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded bg-white font-semibold"
                  />
                </div>
              </div>

              {/* Variant Matrix Table */}
              <div className="space-y-3 p-3 bg-stone-50 border border-stone-200 rounded">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-stone-900 block">
                      Variant Matrix &amp; Initial Stock
                    </label>
                    <span className="text-[10px] text-stone-500">Each entry generates a unique sellable SKU</span>
                  </div>

                  {/* Size Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleGenerateStandardSizes(variants[0]?.colour || 'Black')}
                      className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded text-[10px] font-bold"
                    >
                      Preset S - XXL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateFreeSize(variants[0]?.colour || 'Gold')}
                      className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded text-[10px] font-bold"
                    >
                      Free Size
                    </button>
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>Add Row</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border border-stone-200">
                      <div className="w-24">
                        <label className="text-[9px] uppercase font-bold text-stone-400 block">Size</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. M"
                          value={v.size}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].size = e.target.value;
                            setVariants(updated);
                          }}
                          className="w-full p-1 border border-stone-300 rounded font-bold text-center text-xs"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[9px] uppercase font-bold text-stone-400 block">Colour</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Midnight Black"
                          value={v.colour}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].colour = e.target.value;
                            setVariants(updated);
                          }}
                          className="w-full p-1 border border-stone-300 rounded text-xs"
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-[9px] uppercase font-bold text-stone-400 block">Stock Qty</label>
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Stock"
                          value={v.stockQuantity}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].stockQuantity = Number(e.target.value) || 0;
                            setVariants(updated);
                          }}
                          className="w-full p-1 border border-stone-300 rounded text-center font-mono font-bold text-xs"
                        />
                      </div>

                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                          className="text-stone-400 hover:text-rose-600 p-1 mt-3"
                          title="Remove variant"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Controls */}
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-300 rounded font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-stone-900 text-white rounded font-bold hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2 shadow"
                >
                  {submitting ? (
                    <span>Publishing Product...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save &amp; Publish Garment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
