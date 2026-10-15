'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Package, Plus, Check, AlertCircle, Edit2, Trash2 } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('FashionHub Studio');
  const [audience, setAudience] = useState<'men' | 'women' | 'unisex' | 'accessories'>('unisex');
  const [fabric, setFabric] = useState('100% Combed Cotton');
  const [careInstructions, setCareInstructions] = useState('Machine wash cold. Line dry in shade.');
  const [basePrice, setBasePrice] = useState('1499');
  const [salePrice, setSalePrice] = useState('1199');
  const [costPrice, setCostPrice] = useState('450');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');

  // Variants matrix
  const [variants, setVariants] = useState([
    { size: 'S', colour: 'Black', stockQuantity: 20 },
    { size: 'M', colour: 'Black', stockQuantity: 30 },
    { size: 'L', colour: 'Black', stockQuantity: 25 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Fetch categories
    fetch('/api/cart') // any call or categories
      .then(() => {
        // Fallback or load categories
        setCategories([
          { id: 'cat-men', name: 'Men', slug: 'men' },
          { id: 'cat-women', name: 'Women', slug: 'women' },
          { id: 'cat-unisex', name: 'Unisex', slug: 'unisex' },
          { id: 'cat-accessories', name: 'Accessories', slug: 'accessories' },
        ]);
      });
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleAddVariantRow = () => {
    setVariants([...variants, { size: 'XL', colour: 'Black', stockQuantity: 15 }]);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim() || undefined,
        description: description.trim(),
        brand: brand.trim(),
        categoryId: products[0]?.categoryId || 'c8369651-787f-4318-8f83-8a3d53b9487c', // fallback or real category ID from seed
        audience,
        fabric: fabric.trim() || undefined,
        careInstructions: careInstructions.trim() || undefined,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : null,
        costPrice: Number(costPrice),
        taxCode: 'GST_12',
        isActive: true,
        images: [
          {
            imageUrl: imageUrl.trim(),
            altText: `${name} primary view`,
            isPrimary: true,
            displayOrder: 1,
          },
        ],
        variants: variants.map((v, i) => ({
          sku: `${slug.toUpperCase().slice(0, 8)}-${v.colour.slice(0, 3).toUpperCase()}-${v.size}-${i}`,
          size: v.size,
          colour: v.colour,
          stockQuantity: Number(v.stockQuantity),
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
      alert('Product created with inventory ledger entries!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Product Management</h1>
          <p className="text-xs text-stone-500">Add, edit, and audit garments, variants, and pricing</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-stone-800 transition flex items-center gap-1.5 shadow"
        >
          <Plus size={15} />
          <span>Add New Garment</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-sand-50/70 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Audience</th>
                <th className="p-3.5">Retail Price</th>
                <th className="p-3.5">Cost Price</th>
                <th className="p-3.5">Total Stock</th>
                <th className="p-3.5">Variants</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">Loading catalogue...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">No products found</td>
                </tr>
              ) : (
                products.map((p) => {
                  const totalStock = p.variants?.reduce((sum: number, v: any) => sum + v.stockQuantity, 0) || 0;
                  const thumb = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200';

                  return (
                    <tr key={p.id} className="hover:bg-stone-50 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-12 rounded bg-stone-100 overflow-hidden flex-shrink-0">
                            <Image src={thumb} alt={p.name} fill className="object-cover" unoptimized />
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 line-clamp-1">{p.name}</p>
                            <p className="text-[11px] text-stone-400 font-mono">SKU: {p.sku || p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">{p.category?.name || 'Unisex'}</td>
                      <td className="p-3.5 uppercase text-[11px] font-semibold text-stone-600">{p.audience}</td>
                      <td className="p-3.5 font-bold text-stone-900">
                        ₹{p.salePrice ? p.salePrice.toLocaleString('en-IN') : p.basePrice.toLocaleString('en-IN')}
                        {p.salePrice && (
                          <span className="text-[10px] text-stone-400 line-through block">
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
                      <td className="p-3.5">{p.variants?.length || 0} SKUs</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          Active
                        </span>
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
          <div className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-sm shadow-xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <h2 className="font-serif text-xl font-bold text-stone-900">Add New Garment to Atelier</h2>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700 text-lg">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Classic Linen Shirt"
                    value={name}
                    onChange={handleNameChange}
                    className="w-full p-2 border border-stone-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Artisanal description of fabric drape, cut, and fit..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Target Audience *</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full p-2 border border-stone-300 rounded bg-white"
                  >
                    <option value="unisex">Unisex</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Fabric Details</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Image URL *</label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-stone-50 border border-stone-200 rounded">
                <div>
                  <label className="block font-semibold mb-1">Base Price (MRP ₹) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Sale Price (Selling ₹)</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cost Price (Admin only ₹) *</label>
                  <input
                    type="number"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded bg-white"
                  />
                </div>
              </div>

              {/* Variant Matrix Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold uppercase tracking-wider text-stone-900 block">
                    Variant Stock Matrix
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-stone-800 hover:underline font-semibold"
                  >
                    + Add Size / Colour
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Size (e.g. M)"
                        value={v.size}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].size = e.target.value;
                          setVariants(updated);
                        }}
                        className="w-20 p-2 border border-stone-300 rounded uppercase font-semibold text-center"
                      />
                      <input
                        type="text"
                        placeholder="Colour (e.g. Navy)"
                        value={v.colour}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].colour = e.target.value;
                          setVariants(updated);
                        }}
                        className="flex-1 p-2 border border-stone-300 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={v.stockQuantity}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].stockQuantity = Number(e.target.value);
                          setVariants(updated);
                        }}
                        className="w-24 p-2 border border-stone-300 rounded text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800"
                >
                  {submitting ? 'Creating...' : 'Save & Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
