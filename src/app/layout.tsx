import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'VORQUEN | Luxury Haute Couture & Contemporary Minimalist Atelier',
  description: 'VORQUEN 3D animated fashion atelier. Artisanal luxury, sculptural tailoring, and visionary haute couture.',
  keywords: ['VORQUEN', 'fashion', 'luxury', 'haute couture', '3d fashion', 'atelier', 'contemporary fashion'],
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
