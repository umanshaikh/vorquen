import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    grossSales: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchMetrics = async () => {
    try {
      const [
        { count: productCount },
        { count: orderCount },
        { count: customerCount },
        { data: lowStockData },
        { data: ordersData },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('product_variants').select('id, stock_quantity').lte('stock_quantity', 5),
        supabase
          .from('orders')
          .select('id, order_number, total_amount, order_status, payment_status, placed_at')
          .order('placed_at', { ascending: false })
          .limit(5),
      ]);

      const totalRevenue = (ordersData || [])
        .filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setMetrics({
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        totalCustomers: customerCount || 0,
        lowStockCount: lowStockData?.length || 0,
        grossSales: totalRevenue,
      });

      setRecentOrders(ordersData || []);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#c9a96e" />
        <Text style={styles.loadingText}>Syncing live database metrics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c9a96e" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Executive Atelier Overview</Text>
          <Text style={styles.headerSubtitle}>Real-time Supabase Database Intelligence</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshBtnText}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      {/* Metric Cards Grid */}
      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOTAL PRODUCTS</Text>
          <Text style={styles.metricValue}>{metrics.totalProducts}</Text>
          <Text style={styles.metricSub}>Active luxury fashion SKUs</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOTAL ORDERS</Text>
          <Text style={styles.metricValue}>{metrics.totalOrders}</Text>
          <Text style={styles.metricSub}>All-time atelier orders</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>REGISTERED CLIENTS</Text>
          <Text style={styles.metricValue}>{metrics.totalCustomers}</Text>
          <Text style={styles.metricSub}>Direct customer accounts</Text>
        </View>

        <View style={[styles.metricCard, metrics.lowStockCount > 0 && styles.alertCard]}>
          <Text style={[styles.metricLabel, metrics.lowStockCount > 0 && styles.alertLabel]}>
            LOW STOCK ALERTS
          </Text>
          <Text style={[styles.metricValue, metrics.lowStockCount > 0 && styles.alertValue]}>
            {metrics.lowStockCount}
          </Text>
          <Text style={styles.metricSub}>Variants with &le; 5 units</Text>
        </View>
      </View>

      {/* Recent Orders Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Atelier Requisitions</Text>
        {recentOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No customer orders recorded in database yet.</Text>
            <Text style={styles.emptySubtext}>Orders placed on the storefront will appear here live.</Text>
          </View>
        ) : (
          recentOrders.map((order) => (
            <View key={order.id} style={styles.orderRow}>
              <View>
                <Text style={styles.orderNumber}>{order.order_number}</Text>
                <Text style={styles.orderDate}>{new Date(order.placed_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.orderStatusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    order.payment_status === 'paid' ? styles.paidBadge : styles.pendingBadge,
                  ]}
                >
                  <Text style={styles.statusText}>{order.payment_status.toUpperCase()}</Text>
                </View>
                <Text style={styles.orderAmount}>₹{order.total_amount?.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          ))
        )}
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
  },
  loadingText: {
    color: '#888888',
    marginTop: 12,
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#c9a96e',
    marginTop: 2,
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a1a1a',
    borderColor: '#333333',
    borderWidth: 1,
    borderRadius: 4,
  },
  refreshBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
  },
  metricLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  metricSub: {
    color: '#555555',
    fontSize: 10,
  },
  alertCard: {
    borderColor: '#823b18',
    backgroundColor: '#1c120c',
  },
  alertLabel: {
    color: '#e07a3c',
  },
  alertValue: {
    color: '#ff8a4c',
  },
  section: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    padding: 18,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888888',
    fontSize: 13,
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#555555',
    fontSize: 11,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#1e1e1e',
    borderBottomWidth: 1,
  },
  orderNumber: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  orderDate: {
    color: '#666666',
    fontSize: 10,
    marginTop: 2,
  },
  orderStatusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginBottom: 4,
  },
  paidBadge: {
    backgroundColor: '#143823',
  },
  pendingBadge: {
    backgroundColor: '#382f14',
  },
  statusText: {
    color: '#d4af37',
    fontSize: 9,
    fontWeight: '700',
  },
  orderAmount: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
