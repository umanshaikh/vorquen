import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/services/productService';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Product Not Found | FashionHub' };

  return {
    title: product.seoTitle || `${product.name} | FashionHub`,
    description: product.seoDescription || product.shortDescription || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images[0]?.imageUrl ? [{ url: product.images[0].imageUrl }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
