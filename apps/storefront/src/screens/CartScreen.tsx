import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

interface CartScreenProps {
  items: any[];
  onUpdateQty: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedToCheckout: (totals: any) => void;
  onContinueShopping: () => void;
}

export default function CartScreen({
  items,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
  onContinueShopping,
}: CartScreenProps) {
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCode, setAppliedCode] = useState('');

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'VORQUEN10' || code === 'ATELIER10') {
      setDiscountPercent(10);
      setAppliedCode(code);
      Alert.alert('Privilege Applied', '10% atelier inaugural discount applied.');
    } else if (code === 'VIP20') {
      setDiscountPercent(20);
      setAppliedCode(code);
      Alert.alert('VIP Privilege', '20% VIP collector discount applied.');
    } else {
      Alert.alert('Invalid Code', 'The entered privilege code is invalid or expired.');
    }
    setCouponCode('');
  };

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const shippingAmount = subtotal > 1499 || subtotal === 0 ? 0 : 99;
  const taxAmount = Math.round((subtotal - discountAmount) * 0.12); // 12% GST
  const grandTotal = subtotal - discountAmount + shippingAmount + taxAmount;

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your Bag is Empty</Text>
        <Text style={styles.emptyDesc}>Explore our current atelier collection and select your silhouettes.</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={onContinueShopping}>
          <Text style={styles.exploreBtnText}>EXPLORE ATELIER PIECES</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Atelier Requisition Bag</Text>
        <Text style={styles.subtitle}>{items.length} Selected Haute Couture Garments</Text>
      </View>

      {/* Bag Items */}
      <View style={styles.itemsList}>
        {items.map((it, idx) => (
          <View key={`${it.productId}-${idx}`} style={styles.itemCard}>
            <View style={styles.itemTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemSpecs}>
                  Size: {it.size} &bull; Color: {it.colour}
                </Text>
              </View>
              <Text style={styles.itemPrice}>₹{(it.price * it.quantity).toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.itemBottom}>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => onUpdateQty(idx, it.quantity - 1)}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{it.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => onUpdateQty(idx, it.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => onRemoveItem(idx)}>
                <Text style={styles.removeText}>REMOVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Coupon Application */}
      <View style={styles.couponCard}>
        <Text style={styles.couponTitle}>Atelier Privilege Code</Text>
        <View style={styles.couponRow}>
          <TextInput
            style={styles.couponInput}
            placeholder="Try VORQUEN10"
            placeholderTextColor="#666"
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
            <Text style={styles.applyBtnText}>APPLY</Text>
          </TouchableOpacity>
        </View>
        {appliedCode ? (
          <Text style={styles.appliedCodeNotice}>
            ✓ Code {appliedCode} applied ({discountPercent}% Discount)
          </Text>
        ) : null}
      </View>

      {/* Summary Box */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Requisition Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Garment Subtotal</Text>
          <Text style={styles.summaryValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
        </View>

        {discountAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#c9a96e' }]}>Privilege Discount ({discountPercent}%)</Text>
            <Text style={[styles.summaryValue, { color: '#c9a96e' }]}>-₹{discountAmount.toLocaleString('en-IN')}</Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Insured Express Shipping</Text>
          <Text style={styles.summaryValue}>
            {shippingAmount === 0 ? 'COMPLIMENTARY' : `₹${shippingAmount}`}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>GST (12% Apparel Duty)</Text>
          <Text style={styles.summaryValue}>₹{taxAmount.toLocaleString('en-IN')}</Text>
        </View>

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>TOTAL DUE</Text>
          <Text style={styles.totalValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() =>
            onProceedToCheckout({
              subtotal,
              discountAmount,
              shippingAmount,
              taxAmount,
              grandTotal,
              appliedCode,
            })
          }
        >
          <Text style={styles.checkoutBtnText}>PROCEED TO SECURE CHECKOUT</Text>
        </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyDesc: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#c9a96e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
  },
  exploreBtnText: {
    color: '#0d0d0d',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#c9a96e',
    marginTop: 2,
  },
  itemsList: {
    marginBottom: 20,
  },
  itemCard: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginBottom: 10,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  itemSpecs: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    color: '#c9a96e',
    fontSize: 15,
    fontWeight: '800',
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopColor: '#202020',
    borderTopWidth: 1,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 3,
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  qtyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  removeText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  couponCard: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
  },
  couponTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 4,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  applyBtn: {
    backgroundColor: '#1f1a14',
    borderColor: '#c9a96e',
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 4,
  },
  applyBtnText: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  appliedCodeNotice: {
    color: '#4ade80',
    fontSize: 11,
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    padding: 18,
    marginBottom: 40,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomColor: '#202020',
    borderBottomWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#888',
    fontSize: 12,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 12,
    borderTopColor: '#262626',
    borderTopWidth: 1,
    marginBottom: 18,
  },
  totalLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  totalValue: {
    color: '#c9a96e',
    fontSize: 18,
    fontWeight: '900',
  },
  checkoutBtn: {
    backgroundColor: '#c9a96e',
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#0d0d0d',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.5,
  },
});
