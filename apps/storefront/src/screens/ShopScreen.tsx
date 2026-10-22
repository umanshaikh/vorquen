import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface ShopScreenProps {
  onSelectProduct: (productId: string) => void;
}

export default function ShopScreen({ onSelectProduct }: ShopScreenProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [{ data: prodData }, { data: catData }] = await Promise.all([
        supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            base_price,
            sale_price,
            brand,
            category_id,
            category:categories(name)
          `)
          .eq('is_active', true)
          .order('base_price', { ascending: false }),
        supabase.from('categories').select('id, name').order('name'),
      ]);

      setProducts(prodData || []);
      setCategories(catData || []);
    } catch (err: any) {
      console.error('Error fetching catalog:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#c9a96e" />
        <Text style={styles.loadingText}>Curating VORQUEN Atelier Pieces...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Atelier Collection</Text>
        <Text style={styles.subtitle}>Handcrafted &bull; Pure Silks &bull; Sculptural Silhouettes</Text>
      </View>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search garments by name or fabric..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
      />

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
        <TouchableOpacity
          style={[styles.pill, selectedCategory === 'all' && styles.pillActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.pillText, selectedCategory === 'all' && styles.pillTextActive]}>
            ALL PIECES ({products.length})
          </Text>
        </TouchableOpacity>

        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.pill, selectedCategory === c.id && styles.pillActive]}
            onPress={() => setSelectedCategory(c.id)}
          >
            <Text style={[styles.pillText, selectedCategory === c.id && styles.pillTextActive]}>
              {c.name.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Grid */}
      <ScrollView style={styles.list}>
        <View style={styles.grid}>
          {filtered.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => onSelectProduct(p.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardPlaceholder}>
                <Text style={styles.cardBrand}>{p.brand}</Text>
                <Text style={styles.cardSilhouetteBadge}>ATELIER EDITION</Text>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardCategory}>
                  {p.category?.name ? p.category.name.toUpperCase() : 'HAUTE COUTURE'}
                </Text>
                <Text style={styles.cardName} numberOfLines={2}>
                  {p.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{p.base_price?.toLocaleString('en-IN')}</Text>
                  {p.sale_price ? (
                    <Text style={styles.salePrice}>₹{p.sale_price?.toLocaleString('en-IN')}</Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#c9a96e',
    marginTop: 2,
  },
  searchInput: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 4,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  pillsRow: {
    flexGrow: 0,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#c9a96e',
    borderColor: '#c9a96e',
  },
  pillText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pillTextActive: {
    color: '#0d0d0d',
  },
  list: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 30,
  },
  card: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardPlaceholder: {
    height: 180,
    backgroundColor: '#181818',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },
  cardBrand: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 4,
  },
  cardSilhouetteBadge: {
    color: '#c9a96e',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  cardInfo: {
    padding: 12,
  },
  cardCategory: {
    color: '#777',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    minHeight: 34,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    color: '#c9a96e',
    fontSize: 14,
    fontWeight: '800',
  },
  salePrice: {
    color: '#666',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
});
