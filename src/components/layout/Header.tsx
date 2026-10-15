'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, Search, Menu, X, Shield, Truck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { user } = useAuth();
  const { itemCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { label: 'Shop All', href: '/shop' },
    { label: 'Men', href: '/shop?category=men' },
    { label: 'Women', href: '/shop?category=women' },
    { label: 'Unisex', href: '/shop?category=unisex' },
    { label: 'Accessories', href: '/shop?category=accessories' },
    { label: 'New Arrivals', href: '/shop?sort=newest' },
    { label: 'Track Order', href: '/track-order' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const hasAdminRole = user?.roles.some((r) =>
    ['admin', 'inventory_manager', 'support'].includes(r)
  );

  return (
    <header className="sticky top-0 z-40 bg-sand-50/95 backdrop-blur-md border-b border-sand-200">
      {/* Announcement Bar */}
      <div className="bg-stone-900 text-stone-100 text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span>✨ Free express shipping on all prepaid orders over ₹1,499 across India</span>
        <span className="hidden md:inline">|</span>
        <span className="hidden md:inline text-stone-300">Use code <strong>WELCOME10</strong> for 10% off</span>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-stone-700 hover:text-stone-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="group">
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 group-hover:text-stone-700 transition">
                FASHION<span className="font-light italic text-stone-500">HUB</span>
              </span>
              <span className="block text-[9px] tracking-[0.25em] uppercase text-stone-500 -mt-1 font-mono">
                Atelier India
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-semibold uppercase tracking-wider text-stone-700 hover:text-stone-950 transition hover:underline underline-offset-8"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions: Search, Account, Cart */}
          <div className="flex items-center space-x-4 sm:space-x-5">
            {/* Search Input (Desktop) */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="Search linen, kurta, tees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-xs bg-stone-100/80 border border-stone-300 rounded-full focus:outline-none focus:ring-1 focus:ring-stone-800 w-44 lg:w-56 transition"
              />
              <button type="submit" className="absolute right-2.5 text-stone-500 hover:text-stone-900">
                <Search size={14} />
              </button>
            </form>

            {/* Admin Dashboard shortcut if authorized */}
            {hasAdminRole && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-stone-900 text-stone-100 rounded-full hover:bg-stone-800 transition"
                title="Admin Control Center"
              >
                <Shield size={13} />
                <span>Admin</span>
              </Link>
            )}

            {/* Account Link */}
            {user ? (
              <Link
                href="/account"
                className="p-1.5 text-stone-700 hover:text-stone-950 flex items-center gap-1.5 text-xs font-medium"
              >
                <User size={20} />
                <span className="hidden sm:inline">{user.fullName.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="p-1.5 text-stone-700 hover:text-stone-950 flex items-center gap-1 text-xs font-medium"
              >
                <User size={20} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Cart Trigger */}
            <button
              onClick={openCart}
              className="relative p-2 text-stone-900 hover:text-stone-700 transition"
              aria-label="Open cart"
            >
              <ShoppingBag size={22} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-stone-900 rounded-full">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-sand-200 bg-sand-50 px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-stone-500">
              <Search size={18} />
            </button>
          </form>

          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-stone-800 hover:text-stone-950 py-1"
            >
              {link.label}
            </Link>
          ))}

          {hasAdminRole && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-amber-900 pt-2 border-t border-sand-200"
            >
              🛡️ Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
