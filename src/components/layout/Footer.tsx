'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, CheckCircle, ArrowRight } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Never render storefront footer on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribed(true);
      } else {
        setErrorMsg(data.error || 'Failed to subscribe');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <span className="font-serif text-2xl font-bold tracking-tight text-white block">
              VORQUEN
            </span>
            <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
              Contemporary high-fashion atelier dedicated to sculptural tailoring, artisanal textiles, and cinematic elegance. Designed for the discerning wardrobe.
            </p>
            <div className="space-y-2 pt-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-stone-300" />
                <span>concierge@vorquen.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-stone-300" />
                <span>+91 80 4567 8900 (Mon - Sat, 10 AM - 7 PM IST)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-stone-300" />
                <span>Bengaluru Design Atelier, Karnataka, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">Collections</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/shop?category=men" className="hover:text-white transition">Men&apos;s Atelier</Link></li>
              <li><Link href="/shop?category=women" className="hover:text-white transition">Women&apos;s Collection</Link></li>
              <li><Link href="/shop?category=unisex" className="hover:text-white transition">Unisex Essentials</Link></li>
              <li><Link href="/shop?category=accessories" className="hover:text-white transition">Artisanal Accessories</Link></li>
              <li><Link href="/shop?sort=bestseller" className="hover:text-white transition">Best Sellers</Link></li>
              <li><Link href="/shop?sort=newest" className="hover:text-white transition">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/track-order" className="hover:text-white transition">Track Your Order</Link></li>
              <li><Link href="/account" className="hover:text-white transition">My Account & Orders</Link></li>
              <li><Link href="/policies/shipping" className="hover:text-white transition">Shipping Policy</Link></li>
              <li><Link href="/policies/returns" className="hover:text-white transition">Returns & Exchanges</Link></li>
              <li><Link href="/policies/cancellation" className="hover:text-white transition">Cancellation Policy</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact & Concierge</Link></li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">VORQUEN Club</h4>
            <p className="text-xs text-stone-400 mb-3">
              Subscribe to receive curated edition drops, private showings, and 10% off your initial purchase.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs py-2 bg-stone-800/60 px-3 rounded">
                <CheckCircle size={16} />
                <span>You are subscribed to VORQUEN Privé!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-800 text-white text-xs px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-stone-400 pr-9 border border-stone-700"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-2 text-stone-400 hover:text-white"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
                {errorMsg && <p className="text-[11px] text-rose-400">{errorMsg}</p>}
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800 text-xs text-stone-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} VORQUEN Atelier Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link href="/policies/privacy" className="hover:text-stone-300 transition">Privacy Policy</Link>
            <Link href="/policies/terms" className="hover:text-stone-300 transition">Terms & Conditions</Link>
            <Link href="/about" className="hover:text-stone-300 transition">About VORQUEN</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
