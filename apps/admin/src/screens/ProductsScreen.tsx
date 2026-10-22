import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New product form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [brand, setBrand] = useState('VORQUEN');
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          brand,
          base_price,
          sale_price,
          is_active,
          created_at,
          category:categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async () => {
    if (!name.trim() || !basePrice) {
      Alert.alert('Validation Error', 'Product name and regular price are required.');
      return;
    }

    setSaving(true);
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Get first category or fallback
      const { data: categories } = await supabase.from('categories').select('id').limit(1);
      const categoryId = categories?.[0]?.id || null;

      const { error } = await supabase.from('products').insert([
        {
          name: name.trim(),
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          description: description.trim() || 'Artisanal VORQUEN garment designed for sculptural drape.',
          brand: brand.trim() || 'VORQUEN',
          base_price: parseFloat(basePrice),
          sale_price: salePrice ? parseFloat(salePrice) : null,
          category_id: categoryId,
          is_active: true,
          status: 'active',
        },
      ]);

      if (error) throw error;

      setShowAddModal(false);
      setName('');
      setDescription('');
      setBasePrice('');
      setSalePrice('');
      fetchProducts();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#c9a96e" />
        <Text style={styles.loadingText}>Loading luxury garment catalog...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Fashion Catalog</Text>
          <Text style={styles.subtitle}>{products.length} Products in Production Database</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ ADD PRODUCT</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search garments by title or collection..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView style={styles.list}>
        {filteredProducts.map((p) => (
          <View key={p.id} style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{p.name}</Text>
                <Text style={styles.productSlug}>slug: {p.slug}</Text>
              </View>
              <View style={[styles.badge, p.is_active ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={styles.badgeText}>{p.is_active ? 'ACTIVE' : 'ARCHIVED'}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>REGULAR PRICE</Text>
                <Text style={styles.priceValue}>₹{p.base_price?.toLocaleString('en-IN')}</Text>
              </View>
              {p.sale_price ? (
                <View style={{ marginLeft: 20 }}>
                  <Text style={styles.priceLabel}>SALE PRICE</Text>
                  <Text style={[styles.priceValue, { color: '#c9a96e' }]}>
                    ₹{p.sale_price?.toLocaleString('en-IN')}
                  </Text>
                </View>
              ) : null}
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.priceLabel}>BRAND</Text>
                <Text style={styles.brandText}>{p.brand}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Product Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Garment to Atelier</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Garment Name (e.g. Sculpted Silk Coat)"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              placeholder="Artisanal Description..."
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Regular Price in INR (e.g. 14999)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={basePrice}
              onChangeText={setBasePrice}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Sale Price in INR (Optional)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={salePrice}
              onChangeText={setSalePrice}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                onPress={handleAddProduct}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#0d0d0d" />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE PRODUCT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  addBtn: {
    backgroundColor: '#c9a96e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addBtnText: {
    color: '#0d0d0d',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
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
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  productCard: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  productSlug: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeActive: {
    backgroundColor: '#133923',
  },
  badgeInactive: {
    backgroundColor: '#381a1a',
  },
  badgeText: {
    color: '#a3d9b4',
    fontSize: 9,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopColor: '#202020',
    borderTopWidth: 1,
  },
  priceLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  priceValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  brandText: {
    color: '#c9a96e',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#0a0a0a',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 4,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#888',
    fontWeight: '700',
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: '#c9a96e',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 4,
  },
  saveBtnText: {
    color: '#0d0d0d',
    fontWeight: '800',
    fontSize: 12,
  },
});
