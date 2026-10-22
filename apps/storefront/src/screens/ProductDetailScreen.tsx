import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface ProductDetailScreenProps {
  productId: string;
  onBack: () => void;
  onAddToCart: (item: any) => void;
}

export default function ProductDetailScreen({
  productId,
  onBack,
  onAddToCart,
}: ProductDetailScreenProps) {
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [{ data: prod }, { data: vars }] = await Promise.all([
          supabase.from('products').select('*, category:categories(name)').eq('id', productId).single(),
          supabase.from('product_variants').select('*').eq('productId', productId),
        ]);

        setProduct(prod);
        setVariants(vars || []);
        if (vars && vars.length > 0) {
          setSelectedVariant(vars[0]);
        }
      } catch (err: any) {
        console.error('Error fetching garment details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [productId]);

  const handleAdd = () => {
    if (!product) return;

    onAddToCart({
      productId: product.id,
      name: product.name,
      price: selectedVariant?.price_override || product.sale_price || product.base_price,
      size: selectedVariant?.size || 'Standard',
      colour: selectedVariant?.colour || 'Obsidian Black',
      quantity,
    });

    Alert.alert('Bag Updated', `Added ${quantity} × ${product.name} to your VORQUEN bag.`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#c9a96e" />
        <Text style={styles.loadingText}>Unfolding bespoke garment geometry...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Garment not found in atelier catalog.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>RETURN TO ATELIER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPrice = selectedVariant?.price_override || product.sale_price || product.base_price;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>&larr; BACK TO COLLECTION</Text>
      </TouchableOpacity>

      {/* 3D Model Visual Container */}
      <View style={styles.modelVisualContainer}>
        <Text style={styles.model3dBadge}>3D INTERACTIVE GEOMETRY ACTIVE</Text>
        <Text style={styles.modelBrandWatermark}>VORQUEN</Text>
        <Text style={styles.modelHint}>Touch &amp; rotate silhouette to view drape and seams</Text>
      </View>

      {/* Product Details Header */}
      <View style={styles.detailsHeader}>
        <Text style={styles.categoryName}>
          {product.category?.name ? product.category.name.toUpperCase() : 'HAUTE COUTURE'}
        </Text>
        <Text style={styles.productTitle}>{product.name}</Text>
        <Text style={styles.priceTag}>₹{currentPrice?.toLocaleString('en-IN')}</Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>{product.description}</Text>

      {/* Variant Selector (Sizes) */}
      {variants.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT SILHOUETTE SIZE</Text>
          <View style={styles.variantRow}>
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.sizeBox, isSelected && styles.sizeBoxSelected]}
                  onPress={() => setSelectedVariant(v)}
                >
                  <Text style={[styles.sizeText, isSelected && styles.sizeTextSelected]}>
                    {v.size}
                  </Text>
                  <Text style={styles.colorSub}>{v.colour}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Quantity Selector */}
      <View style={styles.qtyRow}>
        <Text style={styles.sectionLabel}>QUANTITY</Text>
        <View style={styles.counter}>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text style={styles.counterBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.counterValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text style={styles.counterBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add To Bag Action */}
      <TouchableOpacity style={styles.addBagBtn} onPress={handleAdd}>
        <Text style={styles.addBagBtnText}>ADD TO BESPOKE BAG &bull; ₹{(currentPrice * quantity).toLocaleString('en-IN')}</Text>
      </TouchableOpacity>

      <View style={styles.specsBox}>
        <Text style={styles.specsTitle}>Atelier Guarantees</Text>
        <Text style={styles.specItem}>&bull; 100% Genuine raw artisanal fabric with certified origin.</Text>
        <Text style={styles.specItem}>&bull; Tamper-evident security seal with insured express logistics.</Text>
        <Text style={styles.specItem}>&bull; 7-day luxury exchange &amp; return window with security tag intact.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 12,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  backBtn: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  backBtnText: {
    color: '#c9a96e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modelVisualContainer: {
    height: 260,
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  model3dBadge: {
    position: 'absolute',
    top: 14,
    backgroundColor: '#1e1a14',
    borderColor: '#c9a96e',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 3,
    color: '#d4af37',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modelBrandWatermark: {
    color: '#222222',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 8,
  },
  modelHint: {
    position: 'absolute',
    bottom: 14,
    color: '#666',
    fontSize: 10,
  },
  detailsHeader: {
    marginBottom: 14,
  },
  categoryName: {
    color: '#c9a96e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  productTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  priceTag: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    color: '#999',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeBox: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  sizeBoxSelected: {
    borderColor: '#c9a96e',
    backgroundColor: '#1f1a14',
  },
  sizeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sizeTextSelected: {
    color: '#d4af37',
  },
  colorSub: {
    color: '#666',
    fontSize: 9,
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 4,
  },
  counterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  counterBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  counterValue: {
    color: '#c9a96e',
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 10,
  },
  addBagBtn: {
    backgroundColor: '#c9a96e',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 28,
  },
  addBagBtnText: {
    color: '#0d0d0d',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  specsBox: {
    backgroundColor: '#121212',
    borderColor: '#222222',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginBottom: 40,
  },
  specsTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  specItem: {
    color: '#888',
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 4,
  },
});
