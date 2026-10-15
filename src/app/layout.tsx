import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: 'FashionHub | Contemporary Indian Fashion & Minimalist Luxury',
  description: 'Premium direct-to-consumer fashion atelier in India. Handcrafted linen shirts, oversized heavyweight organic tees, pleated trousers, and artisanal silk ensembles.',
  keywords: ['fashion', 'india', 'menswear', 'womenswear', 'organic cotton', 'linen shirt', 'chanderi silk', 'minimalist aesthetic'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased bg-sand-50 text-stone-900 selection:bg-stone-900 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
