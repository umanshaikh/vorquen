import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import ShopScreen from './src/screens/ShopScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import TrackOrderScreen from './src/screens/TrackOrderScreen';

type Screen = 'home' | 'shop' | 'product' | 'cart' | 'checkout' | 'track';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedProductId, setSelectedProductId] = useState<string>('a1111111-1111-4000-8000-000000000001');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [checkoutTotals, setCheckoutTotals] = useState<any>(null);
  const [lastPlacedOrderNumber, setLastPlacedOrderNumber] = useState<string>('');

  const handleAddToCart = (item: any) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === item.productId && i.size === item.size && i.colour === item.colour
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += item.quantity;
        return copy;
      }
      return [...prev, item];
    });
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((_, idx) => idx !== index));
    } else {
      setCartItems((prev) => {
        const copy = [...prev];
        copy[index].quantity = newQty;
        return copy;
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalCartCount = cartItems.reduce((sum, it) => sum + it.quantity, 0);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onExploreShop={() => setCurrentScreen('shop')}
            onSelectFeatured={(id) => {
              setSelectedProductId(id);
              setCurrentScreen('product');
            }}
          />
        );
      case 'shop':
        return (
          <ShopScreen
            onSelectProduct={(id) => {
              setSelectedProductId(id);
              setCurrentScreen('product');
            }}
          />
        );
      case 'product':
        return (
          <ProductDetailScreen
            productId={selectedProductId}
            onBack={() => setCurrentScreen('shop')}
            onAddToCart={handleAddToCart}
          />
        );
      case 'cart':
        return (
          <CartScreen
            items={cartItems}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onProceedToCheckout={(totals) => {
              setCheckoutTotals(totals);
              setCurrentScreen('checkout');
            }}
            onContinueShopping={() => setCurrentScreen('shop')}
          />
        );
      case 'checkout':
        return (
          <CheckoutScreen
            items={cartItems}
            totals={checkoutTotals}
            onOrderSuccess={(orderNum) => {
              setCartItems([]);
              setLastPlacedOrderNumber(orderNum);
              setCurrentScreen('track');
            }}
            onBack={() => setCurrentScreen('cart')}
          />
        );
      case 'track':
        return (
          <TrackOrderScreen
            initialOrderNumber={lastPlacedOrderNumber}
            onContinueShopping={() => setCurrentScreen('shop')}
          />
        );
      default:
        return <HomeScreen onExploreShop={() => setCurrentScreen('shop')} onSelectFeatured={() => {}} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {/* Top Luxury Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.brandWordmark}>VORQUEN</Text>
        </TouchableOpacity>

        <View style={styles.navRight}>
          <TouchableOpacity
            style={[styles.navBtn, currentScreen === 'shop' && styles.navBtnActive]}
            onPress={() => setCurrentScreen('shop')}
          >
            <Text style={[styles.navBtnText, currentScreen === 'shop' && styles.navBtnTextActive]}>
              COLLECTION
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, currentScreen === 'track' && styles.navBtnActive]}
            onPress={() => setCurrentScreen('track')}
          >
            <Text style={[styles.navBtnText, currentScreen === 'track' && styles.navBtnTextActive]}>
              TRACK
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartPill}
            onPress={() => setCurrentScreen('cart')}
          >
            <Text style={styles.cartPillText}>BAG</Text>
            {totalCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen View */}
      <View style={styles.screenWrapper}>{renderScreen()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#111111',
    borderBottomColor: '#222222',
    borderBottomWidth: 1,
  },
  brandWordmark: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  navBtn: {
    paddingVertical: 4,
  },
  navBtnActive: {
    borderBottomColor: '#c9a96e',
    borderBottomWidth: 2,
  },
  navBtnText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  navBtnTextActive: {
    color: '#ffffff',
  },
  cartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    borderColor: '#333',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
  },
  cartPillText: {
    color: '#c9a96e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cartBadge: {
    backgroundColor: '#c9a96e',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  cartBadgeText: {
    color: '#0d0d0d',
    fontSize: 9,
    fontWeight: '900',
  },
  screenWrapper: {
    flex: 1,
  },
});
