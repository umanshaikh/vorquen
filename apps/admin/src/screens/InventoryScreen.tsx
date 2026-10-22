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

export default function InventoryScreen() {
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          size,
          colour,
          stock_quantity,
          is_active,
          product:products(name)
        `)
        .order('stock_quantity', { ascending: true });

      if (error) throw error;
      setVariants(data || []);
    } catch (err: any) {
      console.error('Error fetching inventory:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustStock = async (variantId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);

    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock_quantity: newStock })
        .eq('id', variantId);

      if (error) throw error;
      fetchInventory();
    } catch (err: any) {
      Alert.alert('Stock Adjustment Failed', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#c9a96e" />
        <Text style={styles.loadingText}>Fetching variant stock levels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory &amp; Stock Levels</Text>
        <Text style={styles.subtitle}>{variants.length} Garment Variant SKUs Monitored</Text>
      </View>

      <ScrollView style={styles.list}>
        {variants.map((v) => {
          const isLow = v.stock_quantity <= 5;
          const isOut = v.stock_quantity === 0;

          return (
            <View key={v.id} style={styles.card}>
              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{v.product?.name || 'Garment SKU'}</Text>
                  <Text style={styles.skuText}>SKU: {v.sku}</Text>
                </View>
                <View style={styles.variantTags}>
                  <Text style={styles.tag}>Size: {v.size}</Text>
                  <Text style={styles.tag}>Color: {v.colour}</Text>
                </View>
              </View>

              <View style={styles.rowBottom}>
                <View style={styles.stockStatus}>
                  <Text
                    style={[
                      styles.stockCount,
                      isOut ? styles.outStock : isLow ? styles.lowStock : styles.normalStock,
                    ]}
                  >
                    {v.stock_quantity}
                  </Text>
                  <Text style={styles.stockLabel}>
                    {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'AVAILABLE'}
                  </Text>
                </View>

                {/* Quick Stock Adjustment Buttons */}
                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => handleAdjustStock(v.id, v.stock_quantity, -1)}
                  >
                    <Text style={styles.adjustBtnText}>-1</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.adjustBtn, styles.incrementBtn]}
                    onPress={() => handleAdjustStock(v.id, v.stock_quantity, +5)}
                  >
                    <Text style={[styles.adjustBtnText, styles.incrementText]}>+5</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
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
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#c9a96e',
    marginTop: 2,
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  skuText: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  variantTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#202020',
    color: '#aaa',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopColor: '#202020',
    borderTopWidth: 1,
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockCount: {
    fontSize: 18,
    fontWeight: '800',
  },
  normalStock: {
    color: '#4ade80',
  },
  lowStock: {
    color: '#fbbf24',
  },
  outStock: {
    color: '#f87171',
  },
  stockLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustBtn: {
    backgroundColor: '#202020',
    borderColor: '#333',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  adjustBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  incrementBtn: {
    backgroundColor: '#3a2d1d',
    borderColor: '#c9a96e',
  },
  incrementText: {
    color: '#d4af37',
  },
});
