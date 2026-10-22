import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

type Tab = 'dashboard' | 'products' | 'orders' | 'inventory' | 'customers' | 'settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <LoginScreen onLoginSuccess={setCurrentUser} />
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'products':
        return <ProductsScreen />;
      case 'orders':
        return <OrdersScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'customers':
        return <CustomersScreen />;
      case 'settings':
        return <SettingsScreen onLogout={() => setCurrentUser(null)} />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {/* Top Brand Bar */}
      <View style={styles.topNav}>
        <View style={styles.navBrand}>
          <Text style={styles.brandTitle}>VORQUEN</Text>
          <Text style={styles.brandBadge}>STORE OWNER PORTAL</Text>
        </View>
        <View style={styles.navUser}>
          <Text style={styles.userEmail}>{currentUser.email}</Text>
          <TouchableOpacity onPress={() => setCurrentUser(null)} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>EXIT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body */}
      <View style={styles.mainContainer}>
        {/* Navigation Tabs (Responsive for Mobile and Desktop Web) */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
            onPress={() => setActiveTab('dashboard')}
          >
            <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>
              OVERVIEW
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'products' && styles.tabItemActive]}
            onPress={() => setActiveTab('products')}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
              PRODUCTS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              ORDERS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'inventory' && styles.tabItemActive]}
            onPress={() => setActiveTab('inventory')}
          >
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
              INVENTORY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'customers' && styles.tabItemActive]}
            onPress={() => setActiveTab('customers')}
          >
            <Text style={[styles.tabText, activeTab === 'customers' && styles.tabTextActive]}>
              CLIENTS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
              SETTINGS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Screen */}
        <View style={styles.screenWrapper}>{renderContent()}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#111111',
    borderBottomColor: '#222222',
    borderBottomWidth: 1,
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  brandBadge: {
    color: '#c9a96e',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    backgroundColor: '#1c1813',
    borderColor: '#3a2e1d',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  navUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userEmail: {
    color: '#888',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  signOutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#261214',
    borderRadius: 3,
  },
  signOutText: {
    color: '#ff6b72',
    fontSize: 9,
    fontWeight: '700',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderBottomColor: '#222',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    overflow: 'scroll',
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#c9a96e',
  },
  tabText: {
    color: '#777',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  screenWrapper: {
    flex: 1,
  },
});
