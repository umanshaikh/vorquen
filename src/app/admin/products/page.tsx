'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Archive,
  CheckCircle2,
  AlertCircle,
  Box,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAudience, setSelectedAudience] = useState('all');

  // Deletion/Archiving Modal State
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedAudience !== 'all') params.set('audience', selectedAudience);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedStatus, selectedAudience]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/products/${itemToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: 'success',
          message: data.message || 'Product removed successfully.',
        });
        setItemToDelete(null);
        fetchProducts();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to remove product.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error occurred.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-stone-500 font-bold">
            Haute Couture &amp; RTW Catalog
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-950 mt-1">
            Fashion Catalog Management
          </h1>
          <p className="text-xs text-stone-500">
            Add, update, curate, and archive VORQUEN garments and accessories
          </p>
        </div>

        <Link
          href="/admin/products/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <PlusCircle size={16} />
          <span>Add New Fashion Piece</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800"
          >
            Search Catalog
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-1.5 text-stone-500 font-mono text-[11px]">
            <Filter size={13} />
            <span>Filters:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md text-xs focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md text-xs focus:outline-none"
          >
            <option value="all">All Audiences</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
            <option value="accessories">Accessories</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md text-xs focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Published)</option>
            <option value="draft">Draft (Unpublished)</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">SKU / Brand</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Variants &amp; Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Loading VORQUEN catalog records...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const primaryImg = p.images?.find((img: any) => img.isPrimary) || p.images?.[0];
                  const totalStock = p.variants?.reduce((sum: number, v: any) => sum + v.stockQuantity, 0) || 0;
                  const has3dModel = Boolean(p.model3dUrl);

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition">
                      {/* Image & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 bg-stone-100 rounded-md overflow-hidden relative shrink-0 border border-stone-200">
                            {primaryImg ? (
                              <Image
                                src={primaryImg.imageUrl}
                                alt={primaryImg.altText || p.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300">
                                <Package size={18} />
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-stone-900 block">{p.name}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
                              <span>/{p.slug}</span>
                              {has3dModel && (
                                <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold">
                                  3D Model
                                </span>
                              )}
                              {p.isFeatured && (
                                <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Audience */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-stone-800">{p.category?.name || 'Unassigned'}</span>
                        <span className="block text-[10px] text-stone-400 uppercase font-mono capitalize">
                          {p.audience}
                        </span>
                      </td>

                      {/* SKU & Brand */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-medium text-stone-800">{p.sku || 'Auto-generated'}</span>
                        <span className="block text-[10px] text-stone-400">{p.brand}</span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-4 font-mono">
                        {p.salePrice ? (
                          <div>
                            <span className="font-bold text-stone-950">₹{p.salePrice.toLocaleString('en-IN')}</span>
                            <span className="block text-[10px] line-through text-stone-400">
                              ₹{p.basePrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-stone-950">₹{p.basePrice.toLocaleString('en-IN')}</span>
                        )}
                      </td>

                      {/* Variants & Stock */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                totalStock === 0
                                  ? 'bg-rose-500'
                                  : totalStock <= 10
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <span className="font-mono font-semibold text-stone-900">
                              {totalStock} units
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 block font-mono">
                            {p.variants?.length || 0} variant(s)
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                            p.status === 'active' && p.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : p.status === 'archived'
                              ? 'bg-stone-100 text-stone-600 border border-stone-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {p.status || (p.isActive ? 'active' : 'draft')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/shop/${p.slug}`}
                            target="_blank"
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
                            title="View on Customer Storefront"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
                            title="Edit Product"
                          >
                            <Edit size={15} />
                          </Link>
                          <button
                            onClick={() => setItemToDelete(p)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="Delete or Archive Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No products matched the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete / Archive Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <AlertCircle size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-stone-950">
                  Remove &quot;{itemToDelete.name}&quot;?
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {itemToDelete._count?.orderItems > 0 ? (
                    <span className="text-amber-800 font-medium block">
                      ⚠️ This product is referenced by {itemToDelete._count.orderItems} past customer order(s). To preserve accounting records and customer order history, this product will be safely ARCHIVED and unpublished rather than permanently deleted.
                    </span>
                  ) : (
                    'This product has no historical orders and will be permanently removed from the catalog database.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteLoading
                  ? 'Processing...'
                  : itemToDelete._count?.orderItems > 0
                  ? 'Archive Product'
                  : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
